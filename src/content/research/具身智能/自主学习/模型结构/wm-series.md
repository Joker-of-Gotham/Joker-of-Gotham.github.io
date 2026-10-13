---
title: WM：World Model
slug: wm-series
date: 2026-10-12
kind: reflection
cover: /assets/img/covers/GBC-仁菜.webp
order: 10
summary: 这部分以 WM 为主线，整理，按照世界状态表示与动力学预测方式选择 RL 。
tags: [研究札记, WM, 强化学习]
papers:
  - title: "Mastering diverse control tasks through world models"
    url: "https://www.nature.com/articles/s41586-025-08744-2"
    year: 2025
    venue: "Nature"
    abstract: "DreamerV3 通过潜在世界模型生成想象轨迹，并联合学习 Actor 与 Critic；此处引用 Nature 正式发表版本。"
    abstract_kind: "summary"
  - title: "Training Agents Inside of Scalable World Models"
    url: "https://arxiv.org/abs/2509.24527"
    year: 2025
    venue: "arXiv"
    abstract: "Dreamer 4 利用可扩展视频世界模型，在想象交互中训练智能体。"
    abstract_kind: "summary"
  - title: "DINO-WM: World Models on Pre-trained Visual Features enable Zero-shot Planning"
    url: "https://proceedings.mlr.press/v267/zhou25t.html"
    year: 2025
    venue: "ICML"
    abstract: "在冻结的 DINOv2 空间特征上学习动力学，并在测试时优化动作序列进行目标导向规划。"
    abstract_kind: "summary"
  - title: "DreamDojo: A Generalist Robot World Model from Large-Scale Human Videos"
    url: "https://proceedings.mlr.press/v306/gao26q.html"
    year: 2026
    venue: "ICML"
    abstract: "以连续潜在动作利用大规模人类视频预训练，再适配机器人动作条件，用于预测、评估与规划。"
    abstract_kind: "summary"
  - title: "WALL-SS: Scaling Long-horizon World Models via Next-Scale Autoregression"
    url: "https://arxiv.org/abs/2608.26239"
    year: 2026
    venue: "arXiv"
    abstract: "通过下一尺度自回归、动作条件和有界时间尺度记忆，支持长时程机器人世界模拟。"
    abstract_kind: "summary"
---

# 潜在状态动力学模型 (Ex. Mastering diverse control tasks through world models)

本系统（DreamerV3 世界模型架构）旨在通过无模式（Model-free）环境交互构建显式世界模型（World Model），在离线重放（Replay）及潜在空间“想象”（Imagination）轨迹上，统一解决跨领域的鲁棒控制、长程规划与价值学习问题。

整个系统由**世界模型学习 (World Model Learning)**、**评论员学习 (Critic Learning)**、**演员学习 (Actor Learning)** 及 **鲁棒预测/数值平滑技术 (Robust Predictions)** 四大部分组成。

## 世界模型学习 (World Model Learning & RSSM)

世界模型基于循环状态空间模型（Recurrent State-Space Model, RSSM）构建。通过编码器将多模态传感器输入映射至随机潜在表示，并在潜在空间中预测未来状态、奖励与 Episode 终止标志。

### 状态转移与预测结构 (RSSM Formulation)

定义时刻 $t$ 的模型状态（Model State）为确定性循环隐状态 $h_t$ 与随机潜在变量 $z_t$ 的拼接 $s_t \doteq \{h_t, z_t\}$：

$$
\begin{aligned}
\text{序列模型 (Sequence Model):} & \quad h_t = f_\phi(h_{t-1}, z_{t-1}, a_{t-1}) \\
\text{编码器 (Posterior Encoder):} & \quad z_t \sim q_\phi(z_t \mid h_t, x_t) \\
\text{先验动力学预测器 (Dynamics Predictor):} & \quad \hat{z}_t \sim p_\phi(\hat{z}_t \mid h_t) \\
\text{奖励预测器 (Reward Predictor):} & \quad \hat{r}_t \sim p_\phi(\hat{r}_t \mid s_t) \\
\text{继续预测器 (Continue Predictor):} & \quad \hat{c}_t \sim p_\phi(\hat{c}_t \mid s_t), \quad \hat{c}_t \in \{0, 1\} \\
\text{解码器 (Decoder):} & \quad \hat{x}_t \sim p_\phi(\hat{x}_t \mid s_t)
\end{aligned}
$$

* $x_t$：$t$ 时刻的环境传感器输入（图像向量由 CNN 处理，连续状态向量由 MLP 处理并施加 $\text{symlog}$ 变换）。
* $a_{t-1}$：前一时刻执行的动作向量。
* $h_t \in \mathbb{R}^{d_h}$：确定性循环隐状态（由 GRU/RNN 网络更新）。
* $z_t \in \mathbb{R}^{d_z}$：随机潜在表示，采样自离散类别分布（Vector of Categorical/Softmax Distributions，通过 Straight-Through 梯度估计器传导梯度）。
* $\hat{c}_t$：Episode 延续标志（0 代表 Episode 终止，1 代表继续）。
* **类别分布正则化**：为了防止深度 VAE 训练中的 KL 爆炸/坍缩，将编码器 $q_\phi$ 与动力学预测器 $p_\phi$ 的 Categorical 分布参数化为 $99\%$ 神经网络输出与 $1\%$ 均匀分布的混合分布。

> **RSSM 的 6 个核心组件通俗拆解**  
> - **序列模型 (Sequence Model: $h_t$)**：作为“大脑的记忆长河（连续记忆）”，像日志本一样，把过去发生了什么、做了什么动作（$a_{t-1}$）以及当时的状况，用一个长长的向量 $h_t$ 滚轮式地记录下来。它是整个世界模型中唯一负责提供“时间上连续连贯性”的记忆中枢。  
> - **编码器 (Posterior Encoder: $z_t$)**：“当下眼睛看到的真实画面抽象（后验理解）”，当机器人真的睁开眼睛看到了一张真实图片 $x_t$，编码器负责把这张复杂的图片“提炼/压缩”成一个精简的抽象状态 $z_t$。因为它是看到真实画面后总结出来的，所以叫“后验”。  
> - **先验动力学预测器 (Dynamics Predictor: $\hat{z}_t$)**：“凭空想象/闭眼预测（先验直觉）”，如果机器人闭上眼睛（没有外界图片 $x_t$），只凭脑子里的记忆 $h_t$，去猜“我刚才做了这个动作后，下一秒周围环境会变成什么样”。这个预测出来的 $\hat{z}_t$ 就是脑海里的“直觉想象”。训练世界模型时，就是让“闭眼猜的 $\hat{z}_t$”去不断逼近“睁眼看到的真实 $z_t$”。猜得越准，说明机器人越理解这个物理世界的运动规律！  
> - **奖励预测器 (Reward Predictor: $\hat{r}_t$)**：“脑海里的评分员（爽感预测）”，根据当前的脑海状态 $s_t = \{h_t, z_t\}$，去预测“我现在这个姿势和状态，能拿到多少奖励（分值）”。比如打羽毛球时，球刚扣杀出去，还没落地，大脑就已经预判出“这球有了，能得分！”  
> - **继续预测器 (Continue Predictor: $\hat{c}_t$)**：“裁判的哨声（游戏是否结束）”，预测当前 Episode 是否还应该继续进行下去（$\hat{c}_t = 1$），还是说机器人已经摔倒、任务失败或已经通关了（$\hat{c}_t = 0$）。它决定了“想象演练”什么时候该打断终止。  
> - **解码器 (Decoder: $\hat{x}_t$)**：“脑海图像还原器（画梦境）”，把脑海里高度抽象的状态 $s_t = \{h_t, z_t\}$，重新还原/画出一张完整的 RGB 画面 $\hat{x}_t$。它的存在是为了监督抽象状态 $z_t$ 不要丢失重要的画面细节（如果你能把画面画出来，说明你确实记住并理解了环境的样子）。  
{: .prompt-info }

### 优化损失函数与自由位约束 (Loss Formulation & Free Bits)

给定轨迹序列批次 $\{x_{1:T}, a_{1:T}, r_{1:T}, c_{1:T}\} \sim \mathcal{D}$，世界模型参数 $\phi$ 结合**预测损失 $\mathcal{L}_{\text{pred}}$**、**动力学损失 $\mathcal{L}_{\text{dyn}}$** 与 **表征损失 $\mathcal{L}_{\text{rep}}$** 进行端到端优化：

$$
\min_\phi \mathcal{L}(\phi) \doteq \mathbb{E}_{q_\phi} \left[ \sum_{t=1}^T \left( \beta_{\text{pred}} \mathcal{L}_{\text{pred}}(\phi) + \beta_{\text{dyn}} \mathcal{L}_{\text{dyn}}(\phi) + \beta_{\text{rep}} \mathcal{L}_{\text{rep}}(\phi) \right) \right]
$$

权重设置为 $\beta_{\text{pred}} = 1, \beta_{\text{dyn}} = 1, \beta_{\text{rep}} = 0.1$。具体子损失定义如下：

$$
\begin{aligned}
\mathcal{L}_{\text{pred}}(\phi) &\doteq -\ln p_\phi(x_t \mid s_t) - \ln p_\phi(r_t \mid s_t) - \ln p_\phi(c_t \mid s_t) \\
\mathcal{L}_{\text{dyn}}(\phi) &\doteq \max \left( 1.0, \, \text{KL}\left[ \text{sg}\left( q_\phi(z_t \mid h_t, x_t) \right) \parallel p_\phi(z_t \mid h_t) \right] \right) \\
\mathcal{L}_{\text{rep}}(\phi) &\doteq \max \left( 1.0, \, \text{KL}\left[ q_\phi(z_t \mid h_t, x_t) \parallel \text{sg}\left( p_\phi(z_t \mid h_t) \right) \right] \right)
\end{aligned}
$$

* $\text{sg}(\cdot)$：Stop-gradient 算子，阻断梯度的回传。
* $\mathcal{L}_{\text{dyn}}$：训练动力学预测器 $p_\phi$ 逼近编码后验 $q_\phi$。
* $\mathcal{L}_{\text{rep}}$：训练表征编码器 $q_\phi$ 使其更易被动力学模型预测，便于想象训练时快速采样。
* **自由位机制 (Free Bits)**：通过 $\max(1.0, \cdot)$ 将 KL 散度裁剪在 1 nat（$\approx 1.44$ bits）下限，当散度足够小（低于 1 nat）时自动截断梯度，避免动力学学习退化并聚焦优化预测损失 $\mathcal{L}_{\text{pred}}$。

## 评论员学习 (Critic Learning)

演员（Actor）与评论员（Critic）纯粹基于世界模型“想象”出的抽象潜在轨迹进行行为学习。

从重放缓存（Replay Buffer）采样的真实状态作为起点，由演员网络 $\pi_\theta(a_t \mid s_t)$ 与动力学模型预测生成长为 $T=16$ 的想象轨迹序列 $\{s_{1:T}, a_{1:T}, r_{1:T}, c_{1:T}\}$。

### 累积回报估计 ($\lambda$-Return Computation)

评论员预测状态 $s_t$ 下的回报分布 $v_\psi(R_t \mid s_t)$，标量期望读出值为 $v_t \doteq \mathbb{E}[v_\psi(\cdot \mid s_t)]$。

为了考虑超越想象预测视角 $T$ 之外的远期回报，通过自举（Bootstrapping）计算 $\lambda$-回报目标 $R_\lambda^t$：

$$
R_\lambda^t \doteq r_t + \gamma c_t \left( (1 - \lambda) v_t + \lambda R_\lambda^{t+1} \right), \quad R_\lambda^T \doteq v_T
$$

* $\gamma = 0.997$：折现因子。
* $\lambda = 0.95$：$\lambda$-回报平滑衰减系数。

### 评论员目标函数与重放增强 (Critic Loss & Replay Loss)

评论员网络采用极大似然估计，并在想象轨迹（损失权重 $\beta_{\text{val}} = 1$）与重放缓存轨迹（损失权重 $\beta_{\text{repval}} = 0.3$）上共同训练：

$$
\min_\psi \mathcal{L}(\psi) \doteq -\sum_{t=1}^T \ln p_\psi\left( R_\lambda^t \;\middle|\; s_t \right)
$$

* **目标网络（Target Network）**：为了稳定自回归目标，计算 $R_\lambda^t$ 时使用当前 Critic 参数，但 Loss 正则化目标拉近至指数移动平均（EMA）评论员网络。
* **参数初始化**：奖励预测器与 Critic 网络的输出权重矩阵初始化为 0，防止训练初期大奖励预测导致收敛延迟。

## 演员学习 (Actor Learning)

演员网络 $\pi_\theta(a_t \mid s_t)$ 的目标是最大化预估回报，同时通过熵正则化保持探索。

### 跨领域回报归一化 (Return Normalization)

为使用固定的熵正则化系数 $\eta = 3 \times 10^{-4}$，通过跨 Batch 估计回报范围对回报目标进行非线性缩放，归一化至近闭区间 $[0, 1]$：

$$
\begin{aligned}
S &\doteq \text{EMA}\left( \text{Per}(R_\lambda^t, 95) - \text{Per}(R_\lambda^t, 5), \; 0.99 \right) \\
\tilde{R}_\lambda^t &\doteq \frac{R_\lambda^t - v_\psi(s_t)}{\max(1, S)}
\end{aligned}
$$

* $\text{Per}(R_\lambda^t, p)$：在当前 Batch 样本中计算 $\lambda$-回报的第 $p$ 个百分位数，对离群点（Outliers）具备鲁棒性。
* $S$：百分位分位数差值的指数移动平均平滑估计（EMA 衰减率为 $0.99$）。
* **分母下限限制 $\max(1, S)$**：仅对大幅度回报进行缩小，对低于阈值 $L=1$ 的稀疏微小奖励不予放大，防止放大函数逼近噪声。

### 演员优化目标 (Reinforce Surrogate Loss)

无论对于连续动作还是离散动作空间，统一采用 Reinforce 梯度估计器与 Surrogate 损失函数：

$$
\min_\theta \mathcal{L}(\theta) \doteq -\sum_{t=1}^T \text{sg}\left( \tilde{R}_\lambda^t \right) \ln \pi_\theta(a_t \mid s_t) - \eta \, \mathcal{H}\left[ \pi_\theta(a_t \mid s_t) \right]
$$

* $\mathcal{H}\left[ \pi_\theta(a_t \mid s_t) \right]$：动作策略的熵（Entropy），用于维持策略探索能力。

## 鲁棒预测与数值平滑技术 (Robust Predictions)

为了处理跨领域下量级差异巨大的连续状态与非平稳标量（奖励/回报），系统引入了 **Symlog 变换** 与 **Symexp Twohot 损失**。

### Symlog 变换与 Symexp 逆变换

针对可正可负且跨越多个数量级的输入/目标标量或向量 $x$，定义双对称对数变换函数 $\text{symlog}(x)$ 及其逆变换 $\text{symexp}(x)$：

$$
\begin{aligned}
\text{symlog}(x) &\doteq \text{sign}(x) \ln(|x| + 1) \\
\text{symexp}(x) &\doteq \text{sign}(x) \left( \exp(|x|) - 1 \right)
\end{aligned}
$$

* **性质**：原点附近逼近恒等映射（$\approx x$），保留小数值梯度；在大数值区间呈对数压缩，防止大标量引发梯度爆炸。

#### Symlog 均方误差损失 (Symlog Squared Loss)
神经网络 $f(x, \theta)$ 拟合目标 $y$ 的 $\text{symlog}$ 变换值，最终读取预测值 $\hat{y}$：

$$
\mathcal{L}(\theta) \doteq \frac{1}{2} \left( f(x, \theta) - \text{symlog}(y) \right)^2, \quad \hat{y} \doteq \text{symexp}\left( f(x, \theta) \right)
$$

### Symexp Twohot 概率分布损失 (Symexp Twohot Loss)

针对奖励预测器与评论员（Critic）这类高度随机的目标，取消单一高斯假设，将其建模为指数间隔桶（Exponentially Spaced Bins）上的 Softmax 离散分布。

桶集合 $B \in \mathbb{R}^{|B|}$ 定义为：

$$
B \doteq \text{symexp}\left( [-20, \dots, +20] \right)
$$

#### 连续标量的 Twohot 编码
连续标量 $y$ 被编码为概率向量 $\text{twohot}(y) \in \mathbb{R}^{|B|}$，仅在最邻近 $y$ 的两个桶索引 $k$ 与 $k+1$ 处填入非零权重（权重与距离成反比，且两项之和为 1），其余位置为 0。

#### 预测读出与交叉熵损失
模型网络输出 Softmax Logits，连续期望读出值 $\hat{y}$ 与优化交叉熵损失如下：

$$
\begin{aligned}
\hat{y} &\doteq \text{softmax}(f(x, \theta))^\top B \\
\mathcal{L}(\theta) &\doteq - \text{twohot}(y)^\top \ln \text{softmax}(f(x, \theta))
\end{aligned}
$$

* **解耦优势**：损失函数仅取决于分配给离散桶的概率分布，与目标 $y$ 的绝对数值大小完全解耦，从根本上消除了梯度爆炸风险。

# 大规模交互式潜在/视频模型 (Training Agents Inside of Scalable World Models)

Dreamer 4 是一个基于 Transformer 架构的大规模交互式世界模型，旨在通过因果分词与 Shortcut Forcing 扩散流匹配机制，在极少数推理步数（如 4 步）下实现高保真度、长时域一致的视频与动作交互预测，并完全在潜在空间“想象”轨迹中完成强化学习策略的端到端优化。

## 基础数学：Shortcut Models 与 x-Space Flow Matching

Dreamer 4 摒弃了传统扩散模型需要数十步迭代的去噪逻辑，基于流匹配（Flow Matching）与 Shortcut 自蒸馏架构，直接在原始数据空间（x-Space）建模连续分布。

### 概率路径与 x-Space 参数化

定义信号采样级别 $\tau \in [0, 1]$（$\tau = 0$ 为纯高斯噪声，$\tau = 1$ 为干净数据）。数据点 $x_1$ 与标准高斯噪声 $x_0 \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$ 构成的线性插值路径为：

$$x_\tau = (1 - \tau) x_0 + \tau x_1$$

为了避免自回归迭代预测时高频频域噪点累积导致长时域漂移，网络 $f_\theta$ 被直接参数化为预测干净数据 $\hat{x}_1 = f_\theta(x_\tau, \tau, d)$（即 x-prediction），而非速度矢量 $v$（v-prediction）。

### Shortcut 自蒸馏 (Shortcut Bootstrapping)

为了使网络支持任意给定的去噪步长 $d = 1/K$（如 $K=4$），网络输入显式包含步长条件 $d$。训练时在两个时间尺度上联合优化：

* **最小步长 $d_{\text{min}} = 1/K_{\text{max}}$**：采用标准流匹配重构损失。
* **大步长 $d > d_{\text{min}}$**：将网络在半步长 $d/2$ 下的两次连续预测结果 $b'$ 与 $b''$ 融合为单步更新目标，进行自蒸馏自监督：

$$b' = \frac{f_\theta\left(x_\tau, \tau, \frac{d}{2}\right) - x_\tau}{1 - \tau}, \quad x' = x_\tau + b' \cdot \frac{d}{2}$$

$$b'' = \frac{f_\theta\left(x', \tau + \frac{d}{2}, \frac{d}{2}\right) - x'}{1 - \left(\tau + \frac{d}{2}\right)}$$

$$\mathcal{L}_{\text{flow}}(\theta) = \begin{cases} \left\| \hat{x}_1 - x_1 \right\|_2^2, & d = d_{\text{min}} \\ (1 - \tau)^2 \left\| \frac{\hat{x}_1 - x_\tau}{1 - \tau} - \text{sg}\left( \frac{b' + b''}{2} \right) \right\|_2^2, & d > d_{\text{min}} \end{cases}$$

* $\text{sg}(\cdot)$：Stop-gradient 算子，阻断蒸馏目标梯度的回传。

## 模块一：因果视觉分词器 (Causal Tokenizer)

分词器负责将原始连续视频帧压缩为低维连续潜在表征 $z_t$，用于动力学模型的高效建模与逐帧实时解码。

### 结构与全模态因果掩蔽

在时间步 $t$，输入包含当前视频帧的图像切片 Token（Image Patch Tokens）及可学习潜藏 Token（Learned Latent Tokens）。

* **编码器 (Encoder)**：潜藏 Token 可双向关注当前帧所有图像切片，各视觉模态内部仅进行单模态关注。
* **低维瓶颈投影 (Bottleneck)**：编码后的潜在向量经线性投影降维并施加 $\tanh$ 激活函数归一化，生成极低维度的连续表征：

$$z_t = \tanh\left( \mathbf{W}_{\text{down}} h_{\text{latent}, t} \right) \in \mathbb{R}^{d_{\text{latent}}}$$

* **解码器 (Decoder)**：将 $z_t$ 投影重构回模型维度 $\mathbf{W}_{\text{up}} z_t$，结合位置 Token 解码输出原始图像切片。
* **时间轴因果约束**：编解码网络沿时间维度严格执行因果掩蔽（Causal Masking），支持单帧实时解算。

### 掩蔽自编码 (MAE) 训练

训练时以概率 $p \sim \mathcal{U}(0, 0.9)$ 随机将图像切片替换为可学习 Embedding，联合 MSE 与感知特征损失进行端到端优化：

$$\mathcal{L}_{\text{Tokenizer}}(\theta) = \mathcal{L}_{\text{MSE}}(\theta) + 0.2 \cdot \mathcal{L}_{\text{LPIPS}}(\theta)$$

## 模块二：交互式动力学模型 (Interactive Dynamics)

动力学模型在由分词器输出的表征 $z_t$ 与机器人动作 $a_t$ 交错构成的 Token 序列上运行，基于 Shortcut Forcing 机制学习世界时域演化规律。

### 序列交错编排与 Token 映射

在时间步 $t$，输入由以下 Token 序列交错拼接而成：

1. **表征 Token**：分词器输出的连续表征 $z_t$ 线性投影为 $S_z$ 个空间 Token，并拼接 $S_r$ 个可学习寄存器 Token (Register Tokens)。
2. **条件 Token**：离散信号级别 $\tau_t$ 与步长 $d_t$ 通过查表嵌入 (Embedding Lookup) 拼接为单个标量条件 Token。
3. **动作 Token**：多组件动作（如离散按键、连续关节角）分别经投影或查表嵌入映射为 $S_a$ 个 Token 并相加叠加。

### Shortcut Forcing 目标与倾斜加权 (Ramp Weighting)

给定噪声表征序列 $\tilde{z} = \{\tilde{z}_t\}$（其中 $\tilde{z}_t = (1 - \tau_t) z_{0, t} + \tau_t z_{1, t}$）、动作序列 $a = \{a_t\}$、信号级别 $\boldsymbol{\tau} = \{\tau_t\}$ 与步长 $\mathbf{d} = \{d_t\}$，动力学网络预测无噪表征 $\hat{z}_1 = f_\theta(\tilde{z}, \boldsymbol{\tau}, \mathbf{d}, a)$。

为了对齐不同信号级别下的学习信号强度，引入倾斜损失权重 (Ramp Loss Weight) $w(\tau_t)$ 并计算序列总损失：

$$w(\tau_t) = 0.9 \tau_t + 0.1$$

$$\mathcal{L}_{\text{Dynamics}}(\theta) = \sum_{t=1}^T w(\tau_t) \cdot \mathcal{L}_{\text{flow}, t}(\theta)$$

## 三阶段训练与闭环控制全流程

Dreamer 4 的完整训练与部署演化逻辑如下：

### 阶段一：世界模型无监督预训练 (Pretraining)

1. 在大规模视频及动作数据集上，训练 Causal Tokenizer 达到低重构误差。
2. 冻结 Tokenizer，将视频序列转换为潜在表征 $z$，使用 Shortcut Forcing 目标独立训练 Interactive Dynamics 骨干网络。

### 阶段二：Agent 多任务微调 (Agent Finetuning)

将任务指令 $q_t$ 作为 Agent Token 插入 Transformer 序列中。Agent Token 采用单向注意力掩蔽（允许 Agent Token 感知图像与动作，但禁止反向感知，避免因果混淆）。

在任务输出隐状态 $h_t$ 上使用长度为 $L=8$ 的多标记预测 (Multi-Token Prediction, MTP)，同时微调行为克隆策略头与奖励预测头：

$$\mathcal{L}_{\text{Agent}}(\theta) = - \sum_{n=0}^L \ln p_\theta(a_{t+n} \mid h_t) - \sum_{n=0}^L \ln p_\theta(r_{t+n} \mid h_t)$$

* 奖励预测头采用 $\text{symexp}$ twohot 离散概率分布，以适应跨越多个数量级的标量奖励。

### 阶段三：潜在空间闭环“想象”训练 (Imagination Training)

冻结 Transformer 主干，仅更新策略头 $\pi_\theta(a_t \mid s_t)$ 与价值头 $v_\phi(s_t)$。从离线数据集采样初始上下文，策略与世界模型在潜在空间中自交错展开（Rollout）生成虚拟轨迹：

1. **价值头优化 (TD-$\lambda$ Return)**：
   计算自举 $\lambda$-回报目标 $R_\lambda^t$，并使用均方误差/twohot 交叉熵损失优化价值头：
   
   $$R_\lambda^t = r_t + \gamma c_t \left( (1 - \lambda) v_\phi(s_{t+1}) + \lambda R_\lambda^{t+1} \right), \quad R_\lambda^T = v_\phi(s_T)$$
   
   $$\mathcal{L}_{\text{Value}}(\phi) = - \sum_{t=1}^T \ln p_\phi\left( R_\lambda^t \;\middle|\; s_t \right)$$

2. **极性优势策略优化 (PMPO Policy Optimization)**：
   计算优势函数 $A_t = R_\lambda^t - v_\phi(s_t)$。PMPO 仅使用 $A_t$ 的符号 (Sign) 而截断其绝对数值，将想象状态集划分正优势集 $\mathcal{D}^+ = \{s_i \mid A_i \ge 0\}$ 与负优势集 $\mathcal{D}^- = \{s_i \mid A_i < 0\}$：
   
   $$\mathcal{L}_{\text{Policy}}(\theta) = \frac{1 - \alpha}{|\mathcal{D}^-| \!+\! \epsilon} \sum_{i \in \mathcal{D}^-} \ln \pi_\theta(a_i \mid s_i) - \frac{\alpha}{|\mathcal{D}^+| \!+\! \epsilon} \sum_{i \in \mathcal{D}^+} \ln \pi_\theta(a_i \mid s_i) + \frac{\beta}{N} \sum_{i=1}^N \text{KL}\left[ \pi_\theta(a_i \mid s_i) \parallel \pi_{\text{prior}}(a_i \mid s_i) \right]$$
   
   * $\alpha = 0.5$：平衡正负反馈梯度权重；$\pi_{\text{prior}}$ 为冻结的行为克隆先验策略，避免策略崩塌。

## 高效 Transformer 架构细节

为了兼顾长时域上下文容量与实时推理速度，Dreamer 4 的 Transformer 骨干网络应用了以下工程优化：

1. **轴向注意力分解 (Axial Attention)**：将全局密集 2D 注意力分解为独立的纯空间注意力 (Space-only) 与纯时间注意力 (Time-only)。
2. **稀疏时间注意力 (Sparse Temporal Layers)**：每 4 个空间注意力层仅挂载 1 个时间注意力层，极大降低 KV Cache 显存占用与计算开销。
3. **分组查询注意力 (GQA)**：全网采用 GQA 结构，多 Query 共享 Key/Value 头部。
4. **训练稳定性机制**：引入 Pre-RMSNorm、RoPE 位置编码、SwiGLU 激活，并在注意力层施加 QKNorm 与 Attention Logit Soft-Capping。

# 视觉特征动力学模型 (DINO-WM: World Models on Pre-trained Visual Features enable Zero-shot Planning)

DINO-WM 是一种任务无关（Task-Agnostic）的视觉世界模型，专门设计用于从无标记的离线轨迹数据中学习物理环境演化规律，并在测试期通过隐空间目标规划（Visual Planning）完成控制任务。

与需要在线 RL 试错、重构像素图像（如 Dreamer）或预测标量奖励的模型不同，DINO-WM 完全在**冻结的离线 DINOv2 隐特征空间**中进行帧级自回归预测，消除了图像解码带来的计算开销与感知坍缩风险。

## 系统组件与隐状态表征 (System Components)

系统由三个解耦的模块组成，整体前向逻辑在隐空间（Latent Space）中运行：

$$
\begin{aligned}
\text{观察模型 (Observation Model):} & \quad \mathbf{z}_t = \text{enc}_{\text{DINO}}(\mathbf{o}_t) \in \mathbb{R}^{N \times E} \\
\text{转移模型 (Transition Model):} & \quad \hat{\mathbf{z}}_{t+1} = p_\theta\left(\mathbf{z}_{t-H:t}, \, \mathbf{a}_{t-H:t}\right) \in \mathbb{R}^{N \times E} \\
\text{解码模型 (Optional Decoder):} & \quad \hat{\mathbf{o}}_t = q_\phi(\mathbf{z}_t) \in \mathbb{R}^{C \times H_i \times W_i} \quad (\text{仅用于可视化，不参与控制})
\end{aligned}
$$

### 组件功能与变量定义

* $\mathbf{o}_t \in \mathbb{R}^{C \times H_i \times W_i}$：时间步 $t$ 的 RGB 图像观察。
* $\mathbf{z}_t \in \mathbb{R}^{N \times E}$：时间步 $t$ 的隐状态表征，包含 $N$ 个 Patch 向量，每个 Patch 的特征维度为 $E$。
* $\mathbf{a}_t \in \mathbb{R}^K$：时间步 $t$ 的 $K$ 维动作向量（控制指令）。
* $H$：转移模型处理的历史上下文长度（Context Length）。
* **观察模型 $\text{enc}_{\text{DINO}}$**：直接采用预训练的 **DINOv2** 模型。它具有极强的不依赖特定任务的空间语义理解能力，**在训练和测试过程中全程冻结参数**，将 $\mathbf{o}_t$ 映射为 Patch 嵌入矩阵 $\mathbf{z}_t$。
* **转移模型 $p_\theta$**：基于无 Tokenizer 层的 Decoder-Only ViT 架构。对包含 $N$ 个 Patch 向量的整个图像帧实施**帧级因果掩蔽（Frame-Level Causal Attention）**，并行融合动作条件。
* **解码模型 $q_\phi$**：由转置卷积层构成的独立像素解码器，仅用于把隐状态 $\mathbf{z}_t$ 还原为 RGB 图像 $\hat{\mathbf{o}}_t$ 以供人类可视化，**完全不参与世界模型的推理与规划**。

## 帧级因果转移网络与条件融合 (Transition Architecture & Conditioning)

转移模型 $p_\theta$ 旨在建模环境演化条件分布 $p(\mathbf{z}_{t+1} \mid \mathbf{z}_{t-H:t}, \mathbf{a}_{t-H:t})$。

### 动作与本体觉条件融合 (Conditioning Mechanism)

为了使转移模型能够预测动作对环境的影响，通过 MLP 动作编码器 $\phi(\cdot)$ 将动作 $\mathbf{a}_t$ 映射至特征空间，并直接拼接（Concatenate）到当前帧的每一个 Patch 向量上：

$$\mathbf{z}_{t, i}^{\text{cond}} = \left[ \mathbf{z}_{t, i} \,\|\, \phi(\mathbf{a}_t) \,\|\, \mathbf{q}_t^{\text{proprio}} \right], \quad \forall i \in \{1, \dots, N\}$$

* $\mathbf{z}_{t, i}$：时间步 $t$ 的第 $i$ 个 Patch 向量（$1 \le i \le N$）。
* $\phi(\mathbf{a}_t)$：经 MLP 映射后的动作条件特征。
* $\mathbf{q}_t^{\text{proprio}}$：（可选）拼接的机器人本体感知状态向量。

### 帧级因果注意力掩蔽 (Frame-Level Causal Attention)

转移模型将完整一帧的 $N$ 个 Patch 向量视为一个整体进行自回归预测，而非像传统方法（如 IRIS）那样在 Token 级别逐个预测 Patch。

定义注意力掩蔽规则：在预测时间步 $t$ 的任意 Patch 向量 $\mathbf{z}_{t, i}$ 时，限制其**只能注意力感知历史时间步的所有 Patch 向量** $\{ \mathbf{z}_{t', j} \mid t' < t, \, 1 \le j \le N \}$，但在同一帧内部的 $N$ 个 Patch 之间保持完全双向可见。这保留了单帧图像的全局空间结构，提升了时域泛化性。

## 端到端训练流程 (Training Pipeline)

DINO-WM 的训练完全离线运行，无需与环境互动，分为**转移模型隐空间训练**与**独立解码器训练**两个互不干扰的环节。

### 转移模型隐一致性损失 (Latent Consistency Loss)

输入从离线数据集切分出的片段轨迹 $(\mathbf{o}_{t-H:t+1}, \mathbf{a}_{t-H:t})$。通过冻结的 $\text{enc}_{\text{DINO}}$ 将观察转换为隐特征序列 $\mathbf{z}_{t-H:t+1}$，采用 Teacher Forcing 模式优化转移模型参数 $\theta$：

$$\mathcal{L}_{\text{pred}}(\theta) = \sum_{\tau = t-H}^t \left\| p_\theta\left( \mathbf{z}_{t-H:\tau}, \, \phi(\mathbf{a}_{t-H:\tau}) \right) - \mathbf{z}_{\tau+1} \right\|_2^2$$

* 训练完全在隐空间中计算 MSE 均方误差，不通过梯度更新 $\text{enc}_{\text{DINO}}$，也不进行图像解码重构。

### 可视化解码器独立训练 (Decoder Training)

独立优化解耦的转置卷积解码器参数 $\phi$，仅拉近预测隐表征的解码结果与原始图像的像素距离：

$$\mathcal{L}_{\text{rec}}(\phi) = \left\| q_\phi(\mathbf{z}_t) - \mathbf{o}_t \right\|_2^2, \quad \text{where } \mathbf{z}_t = \text{enc}_{\text{DINO}}(\mathbf{o}_t)$$

* **解耦优势**：解码器的梯度**严禁回传**至转移模型 $p_\theta$ 或观察编码器，避免了像素级重建细节对隐空间物理语义表征的干扰。

## 测试期隐空间视觉规划与部署 (Test-Time Visual Planning & Deployment)

在部署执行时，系统不需要预先训练策略网络（Policy Head），也不使用文本或奖励信号。部署逻辑仅接收**当前观察图像 $\mathbf{o}_0$** 和 **目标观察图像 $\mathbf{o}_g$**，通过隐空间轨迹优化直接搜索最优动作序列。

### 隐空间目标代价函数 (Latent Planning Cost)

通过冻结编码器将起点与终点映射为隐状态：$\mathbf{z}_0 = \text{enc}_{\text{DINO}}(\mathbf{o}_0)$，$\mathbf{z}_g = \text{enc}_{\text{DINO}}(\mathbf{o}_g)$。

给定待优化的候选动作序列 $\mathbf{a}_{0:T-1} = (\mathbf{a}_0, \mathbf{a}_1, \dots, \mathbf{a}_{T-1})$，世界模型在隐空间自回归推演生成未来隐状态序列 $\hat{\mathbf{z}}_{1:T}$，计算 $T$ 步后的预测隐状态与目标隐状态的 MSE 代价：

$$\mathcal{C}(\mathbf{a}_{0:T-1}) = \left\| \hat{\mathbf{z}}_T - \mathbf{z}_g \right\|_2^2, \quad \text{where } \hat{\mathbf{z}}_t = p_\theta(\hat{\mathbf{z}}_{t-1}, \mathbf{a}_{t-1}), \quad \hat{\mathbf{z}}_0 = \mathbf{z}_0$$

### 模型预测控制 (MPC) 与交叉熵方法 (CEM) 搜索

测试期部署采用基于 **CEM（Cross-Entropy Method）** 的 MPC 控制框架迭代优化动作序列：

1. **初始化分布**：设置动作序列分布的均值与方差 $\mathcal{N}(\boldsymbol{\mu}, \boldsymbol{\Sigma})$。
2. **采样轨迹**：从当前动作分布中采样 $M$ 组候选动作序列 $\{\mathbf{a}_{0:T-1}^{(m)}\}_{m=1}^M$。
3. **隐空间并行推演**：利用转移模型 $p_\theta$ 在隐空间推算每组动作序列对应的终点隐状态 $\hat{\mathbf{z}}_T^{(m)}$，并计算规划代价 $\mathcal{C}_m = \|\hat{\mathbf{z}}_T^{(m)} - \mathbf{z}_g\|_2^2$。
4. **精英保留与分布更新**：选取代价最小的前 $K$ 组精英动作序列（Elite Sequences），更新动作分布的 $\boldsymbol{\mu}$ 与 $\boldsymbol{\Sigma}$。
5. **闭环下发执行**：经过多次 CEM 迭代收敛后，提取最优动作序列的第一步动作 $\mathbf{a}_0^\star$ 下发给底层控制器执行，随后接收新的环境观察 $\mathbf{o}_1$，进入下一个 MPC 规划循环。

# 动作条件视频生成 WM

## DreamDojo: A Generalist Robot World Model from Large-Scale Human Videos

DreamDojo 试图解决当前机器人世界模型受限于特定数据分布、缺乏对新场景与复杂物理交互（如非抓取操纵、移动操纵等）泛化能力的问题。

系统以预训练视频扩散模型 Cosmos-Predict2.5 为基础，通过自监督**连续潜在动作 (Continuous Latent Actions)** 将超过 44,000 小时的高质量人眼视角（Egocentric Human）视频统一标注为自监督动作，并在三阶段（人类视频预训练 $\to$ 目标机器人后训练 $\to$ 实时因果蒸馏）流程中完成通用物理世界演化与实时连续控制的建模。

## 基础模型与数据模态标记化 (Foundation Model & Input Representation)

### Cosmos-Predict2.5 & WAN2.2 Tokenizer

世界模型在 WAN2.2 变分自编码器（VAE）提取的连续潜在空间（Latent Space）中运行，其时域压缩比为 4（即 4 帧 RGB 图像映射为 1 个 Latent 帧）。

定义原始视频帧序列为 $\mathbf{F} = [f_1, f_2, \dots, f_4, \dots, f_{4K}] \in \mathbb{R}^{4K \times C \times H \times W}$，压缩后的潜在视频表征为：

$$\mathbf{X} = [\mathbf{x}_1, \mathbf{x}_2, \dots, \mathbf{x}_K] \in \mathbb{R}^{K \times c \times h \times w}$$

* $\mathbf{x}_i$：第 $i$ 个 Latent 帧，对应像素空间中的连续 4 帧图像 $f_{4i-3:4i}$。
* 骨干网：底层生成模型基于扩散 Transformer（DiT），利用流匹配（Flow Matching）去噪目标进行训练。

### 相对动作分块条件 (Relative Action Chunking)

为确保机械臂姿态控制的物理因果性并增强跨轨迹组合泛化能力，系统对动作施加了**相对化**与**块化**处理：

1. **相对动作重基准化 (Rebaselining)**：放弃绝对关节角/位姿，将每个 Latent 帧所对应的 4 步底层动作转换为相对于该 Latent 帧起始时刻位姿的相对变化量。
2. **块因果动作注入 (Action Chunk Conditioning)**：拒绝将整条动作轨迹作为全局条件注入（防止违反因果律与引入将来噪点）。将对应 4 个物理时间步的连续相对动作拼接为一个 Chunk $\mathbf{a}_{t:t+4}$，专门注入到对应的第 $i$ 个 Latent 帧 $\mathbf{x}_i$ 中。

## 核心组件：自监督连续潜在动作模型 (Latent Action VAE)

为了利用海量未标注的人类日常活动视频（DreamDojo-HV 44,711 小时数据集），系统构建了一个时空 Transformer VAE，自监督地从像素变化中解耦出跨具身的“潜在动作” $\hat{\mathbf{a}}_t$。

### 隐动作提取与信息瓶颈 (Latent Action Bottleneck)

潜在动作 VAE 的编码器接收连续两帧 RGB 图像 $f_t, f_{t+1}$，通过极小特征维度的 Bottleneck 提取全局运动表征；解码器根据上一帧 $f_t$ 与解耦的潜在动作 $\hat{\mathbf{a}}_t$ 重构下一帧 $f_{t+1}$：

$$\hat{\mathbf{a}}_t \sim q_\phi(\hat{\mathbf{a}} \mid f_t, f_{t+1})$$

$$\hat{f}_{t+1} = p_\theta(f_{t+1} \mid f_t, \hat{\mathbf{a}}_t)$$

变分训练目标结合图像重构误差与 KL 散度约束：

$$\mathcal{L}_{\text{LatentAction}}(\theta, \phi) = \mathbb{E}_{q_\phi(\hat{\mathbf{a}} \mid f_{t:t+1})} \left[ \log p_\theta(f_{t+1} \mid f_t, \hat{\mathbf{a}}) \right] - \beta D_{\text{KL}}\left( q_\phi(\hat{\mathbf{a}} \mid f_{t:t+1}) \parallel p(\hat{\mathbf{a}}) \right)$$

* 提取出的低维连续向量 $\hat{\mathbf{a}}_t$ 具备高度的跨具身独立性，消除了手部/手臂形态差异，充当大规模无标注视频的统一动作伪标签（Proxy Action Labels）。

## 三阶段训练流程 (Three-Phase Training Recipe)

DreamDojo 的训练分为三个递进阶段：

### 阶段一：人类视频大规模预训练 (Pretraining with Latent Actions)

使用轻量级 MLP 将连续潜在动作 Chunk $\mathbf{a}_{\text{chunk}}$ 映射至与 DiT 时间步嵌入相同的维度，相加后输入至各个 DiT Block 的 Adaptive Layer Normalization (AdaLN) 中。MLP 最后一层初始权重设为 0。

为了强化物体动态连贯性与动作跟随的物理因果性，训练损失在标准流匹配损失 $\mathcal{L}_{\text{flow}}$ 的基础上，引入了**时域一致性损失 (Temporal Consistency Loss)**：

$$\mathbf{z}_t = \mathbf{u}(\mathbf{x}_t, t, \mathbf{c}, \theta) \quad (\text{模型预测的速度向量序列 } [\mathbf{z}_1, \dots, \mathbf{z}_K])$$

$$\mathcal{L}_{\text{temporal}}(\theta) = \mathbb{E} \left[ \sum_{i=1}^{K-1} \left\| (\mathbf{z}_{i+1} - \mathbf{z}_i) - (\mathbf{v}_{i+1} - \mathbf{v}_i) \right\|_2^2 \right]$$

$$\mathcal{L}_{\text{Stage1}}(\theta) = \mathcal{L}_{\text{flow}}(\theta) + \lambda \mathcal{L}_{\text{temporal}}(\theta) \quad (\lambda = 0.1)$$

* $\mathbf{v}_i$：加噪前向路径中的真实速度基准（Ground-truth Velocity）。

### 阶段二：目标具身跨空间微调 (Post-Training on Target Robots)

当部署至具体机器人硬件（如双臂灵巧手、GR-1 人形机器人）时：
1. 取出目标机器人的真实连续控制动作（如 20Hz 关节角度/末端位姿）。
2. 重置 Action MLP 的第一层参数，使用少量真实机器人采集的轨迹数据，对 Action MLP 及 DiT 骨干网进行全参数微调，将预训练的通用物理表达快速对齐至物理机器人的控制动作空间。

### 阶段三：长时域自蒸馏与少步自回归解算 (Distillation for Real-Time Rollout)

双向注意力与多步去噪（如 50 步）导致扩散模型难以实时自回归推演。蒸馏阶段将 Teacher 模型 $G_{\text{teacher}}$ 压缩为具有**因果注意力（Causal Attention）**且仅需少步去噪（如 4 步）的自回归 Student 模型 $G_{\text{student}}$。

#### 预热阶段 (Warmup Stage)
通过 Teacher 模型的 ODE 解轨迹指导 Student 进行 Teacher Forcing 回归训练：

$$\mathcal{L}_{\text{warmup}}(G_{\text{student}}) = \mathbb{E}_{\mathbf{x}, t} \left\| G_{\text{student}}(\mathbf{x}_t, t) - \mathbf{x}_0^{\text{teacher}} \right\|_2^2$$

#### 自蒸馏阶段 (Distillation & Distribution Matching)
将 Student 的上下文替换为其**自身上一轮历史生成**的 Latent 帧（Student Forcing），以消除 Train-Test 联合分布漂移。优化目标基于真实分布与预测分布间的 KL 散度（分布匹配损失）：

$$\nabla_\theta \mathcal{L}_{\text{distill}} = - \mathbb{E}_{\mathbf{z}, t} \left[ \left( s_{\text{real}}(\mathbf{x}_t, t) - s_{\text{fake}}(\mathbf{x}_t, t) \right) \frac{d G_{\text{student}}}{d \theta} \right]$$

* $s_{\text{real}}$：由 Teacher 模型估计的分数（Score Estimate）；$s_{\text{fake}}$：由在 Student 预测样本上训练的判别模型估计的分数。
* **长时域超出采样 (Long-Horizon Simulation)**：训练时让 Student 强制自回归推演生成 $N' > N$ 帧（超出 Teacher 训练视界 $N$），并在 $N'$ 中随机截取长为 $N$ 的滑窗计算 $\mathcal{L}_{\text{distill}}$，极大地抑制了长时间自回归推理时的复合误差（Compounding Errors）。

## 测试期部署与多场景应用 (Deployment Applications)

蒸馏后的 DreamDojo 模型支持 4 步自回归实时生成，可在以下场景中闭环部署：

### 零样本离线策略评估 (Offline Policy Evaluation)
将候选策略模型 $\pi(a \mid o)$ 与 DreamDojo 世界模型闭环连接。策略模型基于当前帧生成动作 Chunk $\mathbf{a}_{t:t+4}$，世界模型实时推演下一 Latent 帧 $\mathbf{x}_{t+1}$，实现大规模真实环境无风险的大模型策略评估。

### 实时遥操作与在线模型规划 (Live Teleoperation & Model-Based Planning)
支持人类操作员（或采样规划算法，如 CEM）实时下发连续控制指令，世界模型实时渲染未来物理演化视觉反馈，用于复杂场景下的在线视界规划与远程操控。

# 长时程自回归视频 WM (WALL-SS: Scaling Long-horizon World Models via Next-Scale Autoregression)

WALL-SS 是一种面向具身智能（Embodied AI）的多视角、动作条件控制的下一个 Scale 自回归（Next-Scale Autoregressive）世界模型。系统以预训练的 InfinityStar 为视觉生成基座，通过确定的动作轨迹投影接口、尺度对齐因果掩蔽（Scale-Aligned Causal Conditioning）、界限时间-尺度流式记忆（Bounded Time-Scale Memory）以及 Visual-Policy 层面上的 On-Policy 对齐机制，实现了多视角一致性、物理动作跟随和极长时域的闭环自回归展开（Rollout）。

整个系统由**基础表达与动作条件注入**、**时间-尺度流式记忆**、**协同动作专家 (World Action Policy)**、**视觉生成器 On-Policy 对齐**以及**数据管线与离线预处理**五大部分构成。

## 基础表达与动作条件注入 (Action-Grounded Next-Scale Dynamics)

与逐 Token 或逐帧自回归模型不同，WALL-SS 在空间/细粒度上采用**下一个 Scale（Next-Scale）残差构建**，在时间上采用**块级（Clip-Level）流式因果预测**。

### Next-Scale 视觉表征与多视角解耦

设第 $c$ 个时间块（Clip）、第 $\ell$ 个视觉尺度（Visual Scale）、第 $r$ 次残差重复下的隐码张量为 $\mathbf{Z}_{c, \ell, r}$。多视角相机（如头部主视、左右手腕相机）通过残差跨视角适配器（Residual Cross-View Adapter）交换当前尺度下同步的因果隐状态，无需建立相机间的自回归顺序。

### 动作-视频时间对齐与投影 (Action-Video Grounding)

物理动作无法直接作为高维图像的全局 Prompt。WALL-SS 利用确定性渲染器 $\mathcal{R}^{(v)}$，将规划侧末端执行器姿态与夹爪轨迹（来自外部位姿或动作专家）直接投影至视角 $v$ 的主视平面上，绘制带有三轴坐标系与色采编码的动作轨迹图像。

连续动作特征流经共享的因果编码器后，按 Clip 时间区间 $\mathcal{J}_c$ 切片，并在保留的动作尺度集 $\mathcal{S}_A$ 上投影，形成同步动作条件矩阵 $\mathbf{X}_{c, j}^A$。对于视觉尺度 $\ell$，选取满足 $\kappa(\ell) \le \ell$ 的最细化动作尺度 $\kappa(\ell)$。

### 尺度对齐因果掩蔽与自回归目标

动作 Token 作为条件前缀（Condition Prefix）融入 Transformer 序列。查询节点 $(c, \ell, r, v)$ 仅能感知文本指令 $T_g$ 以及块对角动作图中的 $(c, \kappa(\ell), v)$，其余视角、邻近 Clip 及未来动作均被严格因果掩蔽。

动作条件下的负对数似然自回归损失函数定义为：

$$\mathcal{L}_{\text{AR}} = - \mathbb{E}_{\mathcal{D}} \, \mathbb{E}_{(c, \ell, r) \sim \text{Bal}} \left[ \frac{1}{N_{c, \ell, r}} \log p_\theta\left( \mathbf{Z}_{c, \ell, r} \;\middle|\; \mathbf{Z}_{c, \prec(\ell, r)}, \, \mathcal{M}_c, \, \mathbf{X}_{c, \kappa(\ell)}^A, \, T_g \right) \right]$$

* $\mathcal{M}_c$：第 $c$ 个 Clip 预测前装载的流式记忆库。
* $\mathbf{Z}_{c, \prec(\ell, r)}$：按推理因果链排列的前序视觉隐码。
* $N_{c, \ell, r}$：当前块和尺度下有效的视觉 Token 决策总数。
* $\text{Bal}$：对 Clip、Scale 及残差重复进行均匀采样的平衡期望算子。对于缺乏精准几何标定的数据，设置动作条件 $\mathbf{X}^A = \emptyset$。

## 时间-尺度流式记忆 (Bounded Time-Scale Memory for Long-Horizon Rollout)

为了支持极长时域自回归演化，WALL-SS 避免保留所有历史 Token，而是反向复用 Next-Scale 结构，构建**有界时间-尺度记忆库（Bounded Time-Scale Memory Bank）**。

### 记忆单元与近精远粗衰减机制

在预预测边界 $s \in \mathcal{S}_M$，保存目标被观测前同步的因果隐状态 $\mathbf{H}_{u, s}^{\text{pre}}$，并与其相对应的动作库 $\mathbb{A}_u = \{ \mathbf{X}_{u, j}^A \}_{j \in \mathcal{S}_A}$ 绑定组成记忆块：

$$\mathbf{B}_{u, s} = \left( \mathbf{H}_{u, s}^{\text{pre}}, \, \mathbb{A}_u \right), \quad s \in \mathcal{S}_M$$

对于第 $c$ 个 Clip，上下文记忆库 $\mathcal{M}_c$ 由持久身份锚点 $\mathbf{H}_{\text{anc}}$（仅提取自初始帧 $\mathbf{O}_0$，保持环境全局几何与身份不变）与滑动窗口集构成：

$$\mathcal{M}_c = \{ \mathbf{H}_{\text{anc}} \} \cup \left\{ \mathbf{B}_{c-\delta, \, s(\delta)} \;\middle|\; \delta \in \mathcal{D}_c \right\}, \quad \mathcal{D}_c = \{1, \dots, \min(W_M, c-1)\}$$

* $\delta$：Clip 的相对年龄（Age）。
* $W_M$：固定的最大保留视界。
* 单调调配规则：$\delta_1 < \delta_2 \implies s(\delta_1) \ge s(\delta_2)$，即**近期 Clip 保留较精细的 Scale 状态，远期 Clip 保留较粗糙的 Scale 状态**。KV Cache 总容量受限于常量上限 $B_{\text{KV}}$。

### 尺度级 Dream Forcing 曝光补偿训练

为了消除长时域自回归 Rollout 过程中复合误差（Compounding Errors）导致的分布漂移，模型结合了记忆腐蚀与延迟流模型生成的自生成后缀：

$$\hat{\mathbf{Z}}_{c:c+d-1} \sim p_{\bar{\theta}}^{\text{stream}}\left( \cdot \;\middle|\; \mathcal{M}_c, \, \mathbf{X}_{c:c+d-1}^A, \, T_g \right)$$

$$\mathcal{L}_{\text{self}} = - \log p_\theta\left( \mathbf{Z}_{c+d}^{\text{gt}} \;\middle|\; \text{sg}\left[ \mathcal{U}^{(d)}(\mathcal{M}_c, \, \hat{\mathbf{Z}}_{c:c+d-1}, \, \mathbf{X}_{c:c+d-1}^A) \right], \, \mathbf{X}_{c+d}^A, \, T_g \right)$$

结合由年龄加权腐蚀记忆 $\tilde{\mathcal{M}}_c \sim \mathcal{C}_{\text{age}}(\mathcal{M}_c)$ 计算的损失 $\mathcal{L}_{\text{cor}}$，长时域训练总目标为：

$$\mathcal{L}_{\text{long}} = \mathcal{L}_{\text{AR}} + \lambda_{\text{cor}} \mathcal{L}_{\text{cor}} + \lambda_{\text{self}} \mathcal{L}_{\text{self}}$$

## 协同动作专家 (World Action Policy)

除了预测“动作导致的世界变化”之外，WALL-SS 内部挂载了一个协同训练的动作专家（Action Expert），用于从已提交的世界状态中反向预测可执行的控制指令 $\mathbf{A}_c$。

### 隐状态读取与交叉注意力

在 Chunk $c$ 生成前，动作专家通过流匹配（Flow Matching）去噪头读取当前本体感觉状态 $s_c$ 与记忆库中已提交的视觉状态：

$$H_c^A = \mathcal{F}_{\omega}^A\left( \text{Read}_V(\mathcal{M}_c), \, E_s(s_c), \, T_g \right)$$

带噪动作槽位对 $H_c^A$ 进行 Cross-Attention 运算预测控制块 $\hat{\mathbf{A}}_c$。掩蔽机制严格禁止动作专家感知当前未生成的视觉目标及未来记忆。

预测出的动作 $\hat{\mathbf{A}}_c$ 通过与外部位姿相同的投影映射 $\hat{\mathbf{X}}_{c, j}^A = \Gamma_j(\hat{\mathbf{A}}_c, s_c)$ 输入给视觉生成器。

### 协同训练目标

在配对的 Teacher-Forcing 轨迹上，视觉模型与动作专家共享相同的预动作记忆 $\mathcal{M}_c$：

$$\mathcal{L}_{\text{cotrain}} = \mathcal{L}_{\text{long}} + \lambda_A \mathcal{L}_{\text{act}}$$

* $\mathcal{L}_{\text{act}}$：动作专家的流匹配 MSE 去噪损失。

## 视觉生成器 On-Policy 强化学习对齐 (On-Policy Alignment of Visual Dynamics)

为了纠正自回归视觉生成中的幻觉（如“磁铁吸附式”假抓取、越界运动），WALL-SS 将**视觉生成器本身视为 Policy**，在固定动作条件的前提下对视觉生成分布进行 On-Policy 强化学习对齐（不优化机器人控制器）。

### 动态忠实度奖励函数 (Fidelity Scorers)

定义两个冻结的评估器，针对解码后的 Rollout 视频进行打分：

1. **动作跟随奖励 $R_{\text{act}}$**：评估预测视觉演化与给定制式动作 $\mathbf{A}_c$ 之间的物理一致性。
2. **长时域一致性奖励 $R_{\text{long}}$**：评估跨视角同步性、状态平滑度与边界连续性。

对于第 $i$ 个采样的 Rollout 轨迹，第 $c$ 个 Clip 的组合奖励为（$W$ 为滑窗大小）：

$$r_{i, c} = \lambda_{\text{act}} R_{\text{act}}(\hat{\mathbf{V}}_{c-1:c}^i, \mathbf{A}_c) + \lambda_{\text{long}} R_{\text{long}}(\mathbf{O}_0, \hat{\mathbf{V}}_{b_c-1:c}^i, \mathbf{A}_{b_c:c})$$

### 组相对策略优化 (Group-Relative Policy Optimization, GRPO)

冻结行为模型对相同的初始观察与动作序列采样 $K \ge 2$ 条视觉 Rollout 轨迹。计算折扣累积回报 $G_{i, c} = \sum_{u=c}^C \gamma^{u-c} r_{i, u}$，并在 $K$ 条轨迹组内进行标准化得到优势函数：

$$\hat{A}_{i, c} = \text{sg}\left[ \frac{G_{i, c} - \mu_c}{\sigma_c + \epsilon} \right]$$

概率比率 $\rho_{i, n}(\theta) = \frac{\pi_\theta^V(z_{i, n} \mid \xi_{i, n})}{\pi_{\theta_{\text{old}}}^V(z_{i, n} \mid \xi_{i, n})}$，截断 PPO Surrogate 策略损失为：

$$\mathcal{L}_{\text{PG}} = - \mathbb{E}_{\text{bal}} \left[ \min\left( \rho_{i, n}(\theta) \hat{A}_{i, c}, \, \text{clip}(\rho_{i, n}(\theta), \, 1-\varepsilon, \, 1+\epsilon) \hat{A}_{i, c} \right) \right]$$

### 保留先验正则化 (Prior-Preserving Regularization)

引入冻结参考模型 $\pi_{\text{ref}}^V$ 的 KL 散度与真实轨迹自回归重放损失 $\mathcal{L}_{\text{AR}}^{\text{real}}$，防止视觉先验坍缩：

$$\mathcal{L}_{\text{align}} = \mathcal{L}_{\text{PG}} + \beta \mathbb{E}_{\xi \sim \mathcal{D}_{\text{roll}}^{\text{bal}}} \left[ D_{\text{KL}}\left( \pi_\theta^V(\cdot \mid \xi) \parallel \pi_{\text{ref}}^V(\cdot \mid \xi) \right) \right] + \lambda_{\text{AR}} \mathcal{L}_{\text{AR}}^{\text{real}}$$

## 数据处理与物理干预修复管线 (Data Pipeline & Interventions)

WALL-SS 构建了包含公共机器人数据（AgiBotWorld-Beta、ManipArena）、私有 X2-Robot 双臂数据、非具身 UMI 数据以及**策略干预与失败修复轨迹 (Intervention & Recovery Data)** 的综合数据集。

### 干预与修复轨迹的物理建模意义

常规专家演示数据高度包含“成功偏置”（Success Bias），容易导致世界模型学习到“只要夹爪闭合，物体就会自动粘连”的非物理快捷路径（Shortcut）。WALL-SS 引入了两种干预数据模式：

1. **即时干预 (Immediate Intervention)**：当策略出现误差趋向时，接管员立即人工接管并从当前状态继续完成任务。
2. **回滚重放干预 (Rollback-and-Replay Intervention)**：保留失败的策略轨迹，将系统状态回滚至失败前的节点，由人工接管重新执行正确动作。此模式构成了极强的高上下文对比，强制模型学习毫米级微小运动对物理碰撞与接触状态产生的不同后果。

### 标定感知数据路由与投影

数据处理管线通过几何与同步标定检查标记 $m_i^{\text{cal}} \in \{0, 1\}$，将数据集分流路由：

$$\mathcal{D}_{\text{ac}} = \{ (\mathbf{v}_i, \mathbf{a}_i, \mathbf{l}_i) \mid m_i^{\text{cal}} = 1 \}, \quad \mathcal{D}_{\text{vid}} = \{ (\mathbf{v}_i, \mathbf{l}_i) \mid m_i^{\text{cal}} = 0 \}$$

* $\mathcal{D}_{\text{ac}}$（动作条件池）：贡献投影动作轨迹图像，用于动作条件预测。
* $\mathcal{D}_{\text{vid}}$（纯视频池）：缺乏精准相机标定或外姿矩阵的数据，仅贡献视觉重构损失，避免错误标注破坏物理空间对齐。

末端执行器 3D 空间坐标 $\mathbf{x}_e$ 投影至主视头相机平面坐标 $\mathbf{u} = (u, v)$ 的透视变换关系为：

$$\tilde{\mathbf{u}} = \mathbf{K}_h \mathbf{T}_{h \leftarrow e} \tilde{\mathbf{x}}_e, \quad \mathbf{u} = \left( \frac{\tilde{u}}{\tilde{w}}, \, \frac{\tilde{v}}{\tilde{w}} \right)$$

* $\mathbf{K}_h$：调整尺寸后的头部相机内参矩阵。
* $\mathbf{T}_{h \leftarrow e}$：从末端执行器坐标系到头部相机坐标系的复合外参变换矩阵。
