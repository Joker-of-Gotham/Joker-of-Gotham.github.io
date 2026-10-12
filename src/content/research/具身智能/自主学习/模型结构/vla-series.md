---
title: VLA：Vision-Language-Action Model
slug: vla-series
date: 2026-10-12
kind: reflection
cover: /assets/img/covers/孤独摇滚-山田凉2.webp
order: 5
summary: 这部分以 VLA 为主线，整理，按照 Action Decoder 的结构整理 RL 方法。
tags: [研究札记, VLA, 强化学习]
papers:
  - title: "OpenVLA: An Open-Source Vision-Language-Action Model"
    url: https://arxiv.org/html/2406.09246v3
    year: 2024
  - title: "FAST: Efficient Action Tokenization for Vision-Language-Action Models"
    url: https://arxiv.org/html/2501.09747v1
    year: 2025
  - title: "RDT2: Exploring the Scaling Limit of UMI Data Towards Zero-Shot Cross-Embodiment Generalization"
    url: https://arxiv.org/html/2602.03310v1
    year: 2026
---

# 离散自回归动作 Token

## OpenVLA： 一种开源的视觉-语言-动作模型

OpenVLA 模型是一个 7B 参数的视觉-语言-动作模型 (VLA)，基于来自 Open X-Embodiment 数据集的 97 万个机器人演示进行训练。

<img src="/assets/images/具身智能/自主学习/模型结构/openvla_model.png" alt="OpenVLA 模型架构" width="900" height="400">

OpenVLA 的核心思想是**将机器人动作预测完全统一为视觉-语言任务**。它接受一张机器人当前看到的图片和一句文本指令，最终由大型语言模型（LLM）逐字输出机器人的动作指令。

### 第一步：视觉与文本输入的嵌入（Embedding）

模型首先接收一张当前摄像头拍摄的原始图像 $I$ 和一段自然语言任务指令 $L$（如 `"Pick up the yellow mustard bottle"`）。

为了兼顾“高层语义”与“低层精准几何定位”，模型使用双流视觉编码器提取图像特征：

$$\begin{aligned} & \text{Input: } I \in \mathbb{R}^{H \times W \times C}, \quad L = (w_1, w_2, \dots, w_M) \\ & E_{\text{SigLIP}}(I) \in \mathbb{R}^{N_v \times D_1}, \quad E_{\text{DinoV2}}(I) \in \mathbb{R}^{N_v \times D_2} \\ & Z_v = \left[ E_{\text{SigLIP}}(I) \,\Vert{}\, E_{\text{DinoV2}}(I) \right] \in \mathbb{R}^{N_v \times (D_1 + D_2)} \\ & X_v = f_{\text{MLP}}(Z_v) \in \mathbb{R}^{N_v \times D_{\text{LLM}}} \\ & X_l = \text{Embed}_{\text{LLM}}(L) \in \mathbb{R}^{M \times D_{\text{LLM}}} \\ & X = [X_v \,\Vert{}\, X_l] \in \mathbb{R}^{(N_v + M) \times D_{\text{LLM}}} \end{aligned}$$

* $I \in \mathbb{R}^{224 \times 224 \times 3}$：输入图像，设定分辨率为 $224 \times 224$（相比 $384 \times 384$，控制性能无损失但训练速度提升 3 倍）。
* $L = (w_1, \dots, w_M)$：长度为 $M$ 的自然语言任务指令词元序列。
* $E_{\text{SigLIP}}, E_{\text{DinoV2}}$：预训练双流视觉编码器。SigLIP 提取高层语义，DinoV2 提取细粒度空间几何特征，两者按通道拼接成特征 $Z_v$。
* $N_v$：图像划分切片（Image Patches）导出的视觉标记（Visual Tokens）数量。
* $f_{\text{MLP}}$：2 层多层感知机投影器，将融合后的视觉特征维度映射并对齐至 LLM 的隐空间维度 $D_{\text{LLM}}$。
* $X \in \mathbb{R}^{(N_v + M) \times D_{\text{LLM}}}$：将投影后的视觉标记序列 $X_v$ 与文本标记序列 $X_l$ 沿时间轴直接拼接，构成送入 7B Llama 2 骨干网的统一多模态上下文序列。

### 第二步：连续动作的离散化与词表映射（Action Discretization & Tokenization）

为了让只能输出文本词元（Text Tokens）的 LLM 能够输出机器人物理动作，需要将连续的物理动作向量转译为 LLM 能理解的离散 Token。

假设机器人当前需要执行的末端执行器动作向量为：

$$\mathbf{a} = [a_1, a_2, \dots, a_N]^\top \in \mathbb{R}^N$$

例如在 7 自由度机械臂控制中，$N=7$，前 6 维分别代表机械臂末端在 3D 空间中的平移变化量（$\Delta x, \Delta y, \Delta z$）和旋转变化量（$\Delta \text{roll}, \Delta \text{pitch}, \Delta \text{yaw}$），第 7 维代表夹爪的开合程度。

量化与 Token 映射公式如下：

$$\begin{aligned} & q_1^{(i)} = \text{Percentile}(\mathcal{D}, a_i, 1), \quad q_{99}^{(i)} = \text{Percentile}(\mathcal{D}, a_i, 99) \\ & \tilde{a}_i = \text{Clip} \left( \left\lfloor 255 \times \frac{a_i - q_1^{(i)}}{q_{99}^{(i)} - q_1^{(i)}} \right\rfloor, \, 0, \, 255 \right) \in \{0, 1, \dots, 255\} \\ & y_{a_i} = V_{\text{LLM}}[\vert{}V_{\text{LLM}}\vert{} - 256 + \tilde{a}_i] \end{aligned}$$

* $q_1^{(i)}, q_{99}^{(i)}$：训练集 $\mathcal{D}$ 中第 $i$ 维动作对应的第 1 和第 99 分位数截断边界。
* $\tilde{a}_i \in \{0, 1, \dots, 255\}$：将第 $i$ 维连续动作归一化到 $[q_1^{(i)}, q_{99}^{(i)}]$ 范围内，再均匀离散化得到的整数索引（区间档位）。
* $V_{\text{LLM}}$：Llama 2 分词器的词表。为了避免扩充词表导致权重重随机化，直接覆盖词表末尾使用频率最低的 256 个保留 Token，将档位索引 $\tilde{a}_i$ 映射为对应的动作 Token $y_{a_i}$。

**为什么要计算第 1 与第 99 分位数分界线（$q_1^{(i)}$ 和 $q_{99}^{(i)}$）**：对连续的动作数值进行离散划分（量化），同时抵抗数据中的噪点和异常值。

1. **为什么要划分 256 个区间？**  
   LLM 的预测是输出离散类别概率。因此需要把原本连续的物理变化量（比如机械臂向左移动 $0.0123\text{m}$）划分到 256 个固定档位（Bin Index: $0 \sim 255$）中，离散化为整数。
2. **为什么要用第 1 和第 99 分位数，而不是最小值和最大值（Min-Max）？**  
   如果直接取数据集中的最小值与最大值作为映射边界（Min-Max），假设某一次采集数据时手臂被撞了一下，产生了一个极大的速度噪点（比如 $\Delta x = 10.0$），那么最大值会被拉得极大。这会导致原本正常的动作范围（比如 $-0.1 \sim +0.1$）在映射后全部挤在非常窄的小区间里，大大浪费了 256 个档位的分辨率（有效粒度变极低）。  
   用第 1 分位数 $q_1^{(i)}$（去掉极小的前 1% 异常值）和第 99 分位数 $q_{99}^{(i)}$（去掉极大的后 1% 异常值）作为 256 个区间的上下边界，能将区间均匀铺在 98% 的正常动作数据上，超出边界的离散化时直接截断（Clip），从而确保对正常动作有极高的分辨率。

> **划分 256 个区间而非其它数量区间的原因**  
> 在计算机科学中，$256$ 是一个非常特殊的二进制数字，其刚好占满 1 个字节（1 Byte / 8-bit），同时与图像/传感器数据天然对齐。机器人视觉输入的 RGB 图像，每个颜色通道的像素值也是 256 阶。使用 256 阶离散化在数据表示和内存对齐上非常顺畅。  
> OpenVLA 使用 Llama 2 作为语言模型的骨干网络。Llama 2 采用的 Byte-Pair Encoding (BPE) 分词器有一个硬性约束——特殊标记（Special Tokens）预算受限。Llama 分词器在预训练时，预留给微调新增的“自定义/特殊 Token”（Special Tokens）只有 100 个。  
> - 为了引入全新的“动作 Token”，OpenVLA 遵循了 RT-2 等前作的惯例，直接覆盖 Llama 词汇表中最罕用/使用频率最低的最后 256 个 Token。如果设置成 1024 档，就需要覆盖原词表中过多有用的文本 Token，可能会损坏 LLM 原有的语言理解和推理能力；如果设置成 64 档，对 Token 空间的占用倒是小了，但又会牺牲控制精度。  
> 另外，连续动作空间离散化时，档位数目决定了机器人的最小控制分辨率（Sensitivity）。假设机械臂末端在一个控制周期内的移动范围是 $[-0.1\text{m}, +0.1\text{m}]$，总跨度为 $0.2\text{m}$（$200\text{mm}$）。  
> - 如果设为 16 档：每个档位代表 $\frac{200\text{mm}}{16} = 12.5\text{mm}$。机器人的控制极其粗糙，无法完成插拔、按按钮等精细操作。  
> - 如果设为 256 档：每个档位代表 $\frac{200\text{mm}}{256} \approx 0.78\text{mm}$。小于 $1\text{mm}$ 的控制精度对于绝大多数日常桌面抓取和操纵任务（如抓取瓶子、推按开关）已经完全足够。  
> - 如果设为 65,536 档（16-bit）：精度虽然极高，但会给 LLM 的分类预测带来极大的学习难度。  
> 在神经网络训练中，LLM 预测动作本质上是在做 256 分类的 Softmax：$P(y_i) = \frac{e^{z_i}}{\sum_{j=0}^{255} e^{z_j}}$。如果分类类别数太多（如 10,000 分类），Softmax 的概率分布会非常稀释，模型不仅收敛极慢，而且相邻档位之间的差距过于微小（例如第 5000 档和第 5001 档），会导致交叉熵损失难以有效指导梯度更新。256 跨度的多分类问题在现代深度学习中已经被验证为非常容易优化（就像分类 CIFAR-100 或 ImageNet-1k 级别的分类节点）。  
{: .prompt-info }

### 第三步：LLM 前向预测与训练目标（Autoregressive Action Prediction）

将拼接好的上下文序列 $X = [X_v \,\Vert{}\, X_l]$ 喂入 LLM 骨干网，LLM 以自回归（Next-Token Prediction）的方式，顺序预测 $N$ 个动作 Token：

$$P(y_{a_1}, y_{a_2}, \dots, y_{a_N} \mid X) = \prod_{i=1}^N P_\theta \left( y_{a_i} \mid y_{<a_i}, X \right)$$

模型优化目标为仅对这 $N$ 个动作 Token 计算的标准交叉熵损失（忽略图像与文本指令位置）：

$$\mathcal{L}_{\text{Action}}(\theta) = - \sum_{i=1}^N \log P_\theta \left( y_{a_i} \mid y_{<a_i}, X \right)$$

在该训练阶段，关键的工程决策包括：
* **解冻（Unfreeze）并全程微调视觉编码器**：训练中解冻视觉编码器对捕捉细粒度空间几何细节至关重要，如果按照传统 VLM 做法冻结视觉编码器，会导致控制精度大幅下降。
* **高 Epochs 充分训练**：全量迭代训练多达 **27 轮（Epochs）**，直到动作 Token 预测准确率超过 95%。
* **学习率策略**：采用固定学习率 $\eta = 2 \times 10^{-5}$（不使用 Warmup），与 VLM 预训练保持一致。

### 第四步：推断时的动作解码（Action Inference / Unquantization）

在实际控制机器人时，模型输出 $N$ 个动作 Token后，执行**反量化（Unquantization）**还原为真实物理世界的连续动作标量并下发给控制器：

$$\hat{a}_i = q_1^{(i)} + \frac{\tilde{a}_i}{255} \cdot \left( q_{99}^{(i)} - q_1^{(i)} \right)$$

将还原出的 $\hat{\mathbf{a}} = [\hat{a}_1, \hat{a}_2, \dots, \hat{a}_N]^\top$ 组合下发给机器人的底层伺服电机，即完成了一次“观测图像+指令 $\rightarrow$ 物理动作”的端到端决策控制。

### 附：训练数据的构建策略

为了让上述流程能泛化控制多种机器人形态，训练数据基于 Open X-Embodiment (OpenX) 跨具身数据集构建，通过严格的过滤机制与启发式重采样均衡形态分布：

$$\begin{aligned} & \mathcal{D}_{\text{OpenVLA}} = \sum_{k \in \mathcal{K}_{\text{filtered}}} w_k \cdot \mathcal{D}_k \\ & \text{s.t.} \\ & \quad \mathcal{K}_{\text{filtered}} = \{k \mid \text{Camera}(k) \ge 1 \text{ (3rd-person)}, \, \text{Control}(k) = \text{Single-Arm EE}\} \\ & \quad w_k = f_{\text{Octo}}(\text{Diversity}(k), \text{Domain}(k)) \end{aligned}$$

* $\mathcal{D}_k, w_k$：第 $k$ 个独立的子数据集及其对应的混合采样权重。
* $\mathcal{K}_{\text{filtered}}$：经过过滤条件（包含第三人称视角相机且采用单臂末端执行器控制）筛选出的子数据集集合。
* $f_{\text{Octo}}$：继承自 Octo 的启发式重采样策略，降低低多样性数据集权重，提高高多样性数据集权重；训练后三分之一阶段排除表现较差的 DROID 数据集。

## FAST：面向视觉-语言-动作模型的高效动作标记化

本研究（Physical Intelligence 提出的 FAST 分词器）旨在解决高频机器人控制场景下，经典自回归 VLA 模型（如 OpenVLA、RT-2）采用“逐时间步分箱（Binning）分词”所导致的信息冗余、收敛缓慢以及高频控制性能急剧退化问题。

<img src="/assets/images/具身智能/自主学习/模型结构/pi_fast.png" alt="FAST 分词器流程" width="900" height="400">

FAST 通过将时域连续动作块映射至频域（离散余弦变换 DCT），结合标量量化与字节对编码（BPE），实现了将高频动作块压缩为少量高效 Token 的端到端映射过程。

### 动作块预测任务界定

策略网络 $\pi(\mathbf{a}_{1:H} \mid o)$ 接收当前视觉/文本观测 $o$，直接预测包含 $H$ 个时间步的连续动作块（Action Chunk）$\mathbf{a}_{1:H}$，用以保证时间连续性并减少累积误差。

动作分词器 $\mathcal{T}_a$ 的目标是将连续动作块映射为离散 Token 序列：

$$
\mathcal{T}_a: \mathbf{a}_{1:H} \in \mathbb{R}^{H \times |\mathcal{A}|} \longrightarrow [T_1, T_2, \dots, T_n], \quad T_i \in \{1, 2, \dots, |\mathcal{V}|\}
$$

* $\mathbf{a}_{1:H} = [\mathbf{a}_1, \mathbf{a}_2, \dots, \mathbf{a}_H]^\top \in \mathbb{R}^{H \times D}$：连续动作块，时间步长为 $H$，动作空间维度为 $D = |\mathcal{A}|$（如 7 自由度末端执行器动作）。
* $|\mathcal{V}|$：动作词表的大小（Vocabulary Size）。
* $n$：分词后产生的离散 Token 数量（因压缩率不同，序列长度 $n$ 可变）。

### 经典逐时间步分箱（Naive Per-Timestep Binning）缺陷

经典方法（如 OpenVLA、RT-2）将每个时间步 $t \in [1, H]$ 的每个维度 $d \in [1, D]$ 独立划分至 $N=256$ 个区间，展开为固定长度 $n = H \times D$ 的 Token 序列：

$$
\mathcal{T}_{\text{Binning}}(\mathbf{a}_{1:H}) = [T_{1,1}, \dots, T_{1,D}, \; T_{2,1}, \dots, T_{2,D}, \; \dots, \; T_{H,1}, \dots, T_{H,D}]
$$

对自回归模型而言，下一个 Token 的学习信号强度取决于给定历史条件下的边际信息增量（Conditional Entropy / Information Gain）：

$$\mathcal{I}(T_i \mid T_{1:i-1})$$

在连续平滑动作信号下，当采样频率提升（即时间步长 $\Delta t \to 0$）时：

$$\lim_{\Delta t \to 0} \|\mathbf{a}_{t+1} - \mathbf{a}_t\| = 0 \implies \mathcal{I}(T_{t+1, d} \mid T_{1:t, d}) \to 0$$

连续相邻时间步的 Token 强高度相关，导致每个 Token 包含的边际信息量趋近于零。这使得自回归模型梯度收敛极慢，在高频数据（如 DROID 数据集，50Hz）训练时极易退化为简单重复预测首个动作（Copying First Action），使得预测均方误差（MSE）急剧上升。

### FAST 频域动作压缩全流程 (The FAST Tokenization Pipeline)

FAST 的核心思想是利用频域变换（DCT）去除连续时域信号的高频冗余，仅提取表征轨迹整体形状的低频系数，再通过 BPE 实现进一步无损压缩。

#### 第一步：分位数归一化 (Percentile Normalization)

对输入动作块 $\mathbf{a}_{1:H}$ 的每个维度 $d \in \{1, \dots, D\}$ 分别进行截断归一化，将正常动作范围线性缩放至 $[-1, 1]$：

$$
\bar{a}_{t, d} = \text{Clip}\left( 2 \cdot \frac{a_{t, d} - q_1^{(d)}}{q_{99}^{(d)} - q_1^{(d)}} - 1, \, -1, \, 1 \right), \quad \forall t \in \{1, \dots, H\}
$$

* $q_1^{(d)}, q_{99}^{(d)}$：训练集中第 $d$ 维动作的第 1 和第 99 分位数边界，抵抗离群噪点干扰。
* $\bar{\mathbf{A}} \in \mathbb{R}^{H \times D}$：归一化后的连续动作块矩阵。

#### 第二步：离散余弦变换 (Discrete Cosine Transform, DCT)

沿时间轴（长度为 $H$）对归一化矩阵 $\bar{\mathbf{A}}$ 的每一个动作维度 $d$ 独立施加 1D-DCT-II 变换，将信号从时域转换至频域：

$$
C_{k, d} = w(k) \sum_{t=1}^{H} \bar{a}_{t, d} \cos \left( \frac{\pi (2t - 1) (k - 1)}{2H} \right), \quad k \in \{1, \dots, H\}
$$

$$
w(k) = \begin{cases} 
\frac{1}{\sqrt{H}}, & k = 1 \text{ (直流分量 DC, 表征整体均值)} \\ 
\sqrt{\frac{2}{H}}, & 2 \le k \le H \text{ (交流分量 AC, 由低到高频)} 
\end{cases}
$$

* $C_{k, d}$：第 $d$ 维动作在第 $k$ 个频率分量上的 DCT 系数。
* $\mathbf{C} \in \mathbb{R}^{H \times D}$：频域系数矩阵，其中低频系数（$k$ 较小）集中了轨迹绝大部分能量与轮廓信息，高频系数（$k$ 较大）多为微小震荡或 0。

#### 第三步：标量量化与稀疏化 (Quantization & Rounding)

利用缩放因子 $\gamma$ 对频域系数矩阵 $\mathbf{C}$ 进行缩放并四舍五入取整，使不重要的高频微小系数直接归零，形成稀疏整数矩阵：

$$
\bar{C}_{k, d} = \text{Round}\left( \gamma \cdot C_{k, d} \right) \in \mathbb{Z}
$$

* $\gamma$：缩放超参数（在所有实验中默认设为 $\gamma = 10$），用于在有损压缩重建精度与压缩率之间取得平衡。
* $\bar{\mathbf{C}} \in \mathbb{Z}^{H \times D}$：量化后的稀疏整数频域矩阵，绝大多数元素为 0。

#### 第四步：列优先展平与 BPE 无损压缩 (Column-Major Flattening & BPE)

1. **列优先展平 (Column-Major Flattening)**：
为了让自回归模型在预测时首先生成对轨迹整体形状影响最大的低频分量，对矩阵 $\bar{\mathbf{C}}$ 采用列优先（Column-Major / Frequency-First）方式展平为一维整数序列：

$$
\mathbf{S}_{\text{flat}} = [\bar{C}_{1,1}, \bar{C}_{1,2}, \dots, \bar{C}_{1,D}, \; \bar{C}_{2,1}, \bar{C}_{2,2}, \dots, \bar{C}_{2,D}, \; \dots, \; \bar{C}_{H,1}, \dots, \bar{C}_{H,D}]
$$

2. **BPE 算法压缩 (Byte-Pair Encoding)**：
训练一个词汇表大小为 $|\mathcal{V}_{\text{BPE}}|$（默认 1024）的 BPE 分词器 $\phi$。BPE 逐步将频繁出现的零值片段及相邻维度间的高频系数模式合并为单一离散 Token，生成最终送入 VLA 的短 Token 序列：

$$
[T_1, T_2, \dots, T_n] = \text{BPE-Encode}\left( \mathbf{S}_{\text{flat}}, \, \phi \right)
$$

* $n \ll H \times D$：压缩后的 Token 序列长度大幅缩短，彻底消除了高频冗余。

#### 第五步：动作解码与反量化 (Action Decoding & Inverse DCT)

在 VLA 模型推断出 Token 序列 $[T_1, \dots, T_n]$ 后，执行全套逆过程快速还原物理动作：

1. **BPE 解码**：$\mathbf{S}_{\text{flat}} = \text{BPE-Decode}([T_1, \dots, T_n], \phi)$
2. **重构频域矩阵**：将一维序列按列优先还原为矩阵 $\bar{\mathbf{C}} \in \mathbb{Z}^{H \times D}$。
3. **反量化**：$\hat{C}_{k, d} = \frac{\bar{C}_{k, d}}{\gamma}$
4. **逆离散余弦变换 (IDCT)**：
   $$
   \hat{a}_{t, d} = \sum_{k=1}^{H} w(k) \hat{C}_{k, d} \cos \left( \frac{\pi (2t - 1) (k - 1)}{2H} \right)
   $$
5. **反归一化**：
   $$
   a_{t, d}^{\text{pred}} = q_1^{(d)} + \frac{\hat{a}_{t, d} + 1}{2} \left( q_{99}^{(d)} - q_1^{(d)} \right)
   $$

### 算法实现与通用动作分词器 (FAST Algorithm & FAST+)

1. 归一化输入动作块，得到范围在 $[-1, 1]$ 上的矩阵 $\bar{\mathbf{A}}$。
2. 对每个动作维度沿时间轴独立执行 1D-DCT，提取频域矩阵 $\mathbf{C}$。
3. 应用缩放因子 $\gamma$ 放大系数并四舍五入取整，获得稀疏频域矩阵 $\bar{\mathbf{C}}$。
4. 按列优先（低频优先）交错顺序展开为一维整数数组 $\mathbf{S}_{\text{flat}}$。
5. 通过训练好的 BPE 编码器将稀疏整数序列压缩成固定词表范围内的离散 Token 序列 $[T_1, \dots, T_n]$。

为了消除针对每个新机器人数据集重新训练 BPE 词汇表的时间开销，作者在包含单臂、双手及移动操作机器人的 **100 万条 1 秒长动作片段（包含 Joint 与 End-Effector 空间，涵盖 10Hz~50Hz 各种频率）** 的跨具身混合数据集上，训练了通用动作分词器 **FAST+**。

FAST+ 可作为开箱即用的黑盒分词器直接应用于任意全新机器人形态。

# Diffusion Action Policy

## Octo：一款开源通用机器人策略

Octo 是一个开源的通用机器人策略（Generalist Robot Policy），其核心设计思想是通过**统一标记化（Tokenization）**、**模块化 Transformer 骨干网**与**轻量级扩散解码头（Diffusion Readout Head）**，实现跨不同机器人形态、传感器配置（摄像头与本体感觉）和动作空间的端到端控制与高效微调。

<img src="/assets/images/具身智能/自主学习/模型结构/octo_architecture.png" alt="Octo 结构" width="900" height="450">

### 任务与多模态输入标记化 (Task & Observation Tokenization)

Octo 将包含自然语言指令 $\ell$、目标图像 $g$ 以及多时间步多视角观测历史 $\mathbf{o}_{1:H}$ 的多模态输入统一转化为通用 Token 序列：

$$\begin{aligned} & \mathcal{T}_{\text{lang}} = E_{\text{T5}}(\ell) \in \mathbb{R}^{L \times D_{\text{model}}} \\ & \mathcal{T}_{\text{img}}^{(v, t)} = \text{Patchify}\left(\text{ConvStack}(I_t^{(v)})\right) \in \mathbb{R}^{P \times D_{\text{model}}}, \quad v \in \{\text{wrist}, \text{3rd-person}, \dots\}, \quad t \in \{1, \dots, H\} \\ & \mathcal{T}_{\text{goal}} = \text{Patchify}\left(\text{ConvStack}(I_g)\right) \in \mathbb{R}^{P \times D_{\text{model}}} \\ & \mathbf{z}_{\text{in}} = \left[ \mathcal{T}_{\text{lang}} \,\Vert{}\, \mathcal{T}_{\text{goal}} \,\Vert{}\, \mathcal{T}_{\text{img}}^{(1, 1)} \,\Vert{}\, \dots \,\Vert{}\, \mathcal{T}_{\text{img}}^{(V, H)} \,\Vert{}\, \mathcal{T}_{\text{read}, 1} \,\Vert{}\, \dots \,\Vert{}\, \mathcal{T}_{\text{read}, H} \right] + \mathbf{P}_{\text{pos}} \end{aligned}$$

* $\ell$：输入的自然语言指令；$E_{\text{T5}}$：预训练 T5-Base (111M) 语言模型，提取长度为 $L$ 的语言嵌入 Token 序列 $\mathcal{T}_{\text{lang}}$。
* $I_t^{(v)} \in \mathbb{R}^{H_i \times W_i \times C}$：时间步 $t$ 下第 $v$ 个摄像头视角（如手腕视角或第三人称视角）的观测图像；$I_g$：事后重标记（Hindsight Relabeling）或指定的目标图像（Goal Image）。
* $\text{ConvStack}$ 与 $\text{Patchify}$：浅层卷积堆栈与图像切片映射，将每张图像转换为 $P$ 个维度为 $D_{\text{model}}$ 的图像 Token。
* $H$：观测历史长度，默认设为 $H=2$（两帧观测历史即可提供足够的时域上下文，更长历史效益递减）。
* $\mathcal{T}_{\text{read}, t} \in \mathbb{R}^{1 \times D_{\text{model}}}$：显式插入的**可学习读取 Token（Readout Tokens）**，对应时间步 $t$，用于后续聚合并提取动作特征。
* $\mathbf{P}_{\text{pos}}$：可学习的位置编码（Learned Positional Embeddings）。

### 模块化 Transformer 骨干网与分块注意力掩蔽 (Transformer Backbone & Block-Masked Attention)

统一 Token 序列 $\mathbf{z}_{\text{in}}$ 送入 Transformer 骨干网络（提供 Octo-Small 27M 与 Octo-Base 93M 两种规格），采用**分块注意力掩蔽（Block-Masked Attention）**机制进行特征提取：

$$\mathbf{E} = \text{Transformer}(\mathbf{z}_{\text{in}}, \mathbf{M}) \in \mathbb{R}^{N_{\text{tokens}} \times D_{\text{model}}}$$

#### 注意力掩蔽矩阵 $\mathbf{M}$ 的因果约束规则

* **因果约束（Causal Constraint）**：观察 Token $\mathcal{T}_{\text{img}}^{(v, t)}$ 只能因果地关注来自相同或更早时间步（$\le t$）的观察 Token 以及任务 Token（$\mathcal{T}_{\text{lang}}, \mathcal{T}_{\text{goal}}$）。
* **读取 Token 隔离约束（Readout Token Isolation）**：读取 Token $\mathcal{T}_{\text{read}, t}$ 可以单向关注当前及之前的所有观察 Token 与任务 Token，但**任何观察 Token 与任务 Token 均不可关注读取 Token**。读取 Token 类似 BERT 的 `[CLS]` 标记，只被动聚合时域语义，不破坏原始特征。
* **缺失模态掩蔽（Missing Modality Masking）**：对于缺失摄像头视角或无语言标注的数据集样本，其对应的输入 Token 被完全屏蔽（Fully Masked），避免影响模型参数传播。

> **分块注意力掩蔽的实现与目的**  
> Octo 的“分块注意力掩蔽”是把输入的数据划分成不同的“数据块”（Block），并为这些块制定了三条严格的“偷看规则”（通过在注意力矩阵上加掩蔽 Mask 来实现）：  
> - 观察块（Observation Blocks）：机器人第 $t$ 秒看到的画面，只能看当前和过去（$\le t$）的画面以及任务指令，绝对不能偷看未来（$t+1$ 秒）的画面。  
> - 读取 Token（Readout Tokens）：它像是一个“只许听不许说”的旁听生。它可以看自己当前和之前的所有观察画面、任务指令，但所有的观察画面和指令，绝对不能看这个读取 Token。  
> - 缺失模态块（Missing Modality Blocks）：如果某个数据集根本没有手腕摄像头，或者没有语言指令，这些缺失的数据块在掩蔽矩阵里就会被完全遮挡（Mask 为 0），相当于直接在模型里“隐身”。  
> 它的目的包括：  
> - 实现“单向偷听”，安全提取控制特征：Octo 把过去所有的画面和任务指令融合压缩成一个精炼的向量（类似于 BERT 里的 [CLS] 标记），然后直接丢给后面的动作头去解算动作，既不破坏前面的特征表达，又提取到了最纯粹的决策信息。  
> - 极强的主插拔灵活性（插件化）：传统的模型（如 OpenVLA）如果预训练时用了“主摄像头+手腕摄像头”，微调时想加一个“力矩传感器”，就必须把整个网络结构改掉、重新初始化训练。而 Octo 这种分块掩蔽机制，把输入变成了“拼图”。微调时想加一个力矩传感器，只需要在输入序列里追加一个新 Token 块，并为它配置一条掩蔽规则，预训练好的 Transformer 主干网权重完全不需要破坏或重新初始化，直接像插拔 U 盘一样即插即用。  
{: .prompt-info }

### 扩散解码动作头与连续动作块预测 (Diffusion Readout Head & Chunked Action Prediction)

Octo 从读取 Token 得到的输出嵌入 $\mathbf{e}_t = \mathbf{E}[\mathcal{T}_{\text{read}, t}] \in \mathbb{R}^{D_{\text{model}}}$ 中解码出连续的多模态动作分布。相比离散化分类（OpenVLA/RT-2）或 MSE 回归，采用轻量级条件扩散解码头在单次 Transformer 前向传播后进行多步去噪预测：

$$\begin{aligned} & \mathbf{a}_{t:t+K-1} \sim p_\theta(\mathbf{a}_{t:t+K-1} \mid \mathbf{e}_t) \\ & \mathbf{x}_K \sim \mathcal{N}(\mathbf{0}, \mathbf{I}) \\ & \text{For } k = K, K-1, \dots, 1: \\ & \quad \mathbf{x}_{k-1} = \frac{1}{\sqrt{\alpha_k}} \left( \mathbf{x}_k - \frac{1 - \alpha_k}{\sqrt{1 - \bar{\alpha}_k}} \boldsymbol{\epsilon}_\theta(\mathbf{x}_k, \mathbf{e}_t, k) \right) + \sigma_k \mathbf{z}, \quad \mathbf{z} \sim \mathcal{N}(\mathbf{0}, \mathbf{I}) \\ & \hat{\mathbf{a}}_{t:t+K-1} = \mathbf{x}_0 \in \mathbb{R}^{K \times D_{\text{action}}} \end{aligned}$$

#### 训练目标 (DDPM Objective)

去噪网络 $\boldsymbol{\epsilon}_\theta$ 采用标准 DDPM 目标进行端到端优化，对数据集加噪动作进行重建：

$$\mathcal{L}_{\text{Diffusion}}(\theta) = \mathbb{E}_{k \sim U(1, K), \boldsymbol{\epsilon} \sim \mathcal{N}(\mathbf{0}, \mathbf{I}), (\mathbf{a}, \mathbf{e})} \left[ \left\Vert{} \boldsymbol{\epsilon} - \boldsymbol{\epsilon}_\theta\left( \sqrt{\bar{\alpha}_k}\mathbf{a}_{t:t+K-1} + \sqrt{1 - \bar{\alpha}_k}\boldsymbol{\epsilon}, \, \mathbf{e}_t, \, k \right) \right\Vert{}_2^2 \right]$$

* $\mathbf{a}_{t:t+K-1} \in \mathbb{R}^{K \times D_{\text{action}}}$：从时间步 $t$ 开始预测的连续动作块（Action Chunk），包含 $K$ 个连续时间步的动作。
* $\mathbf{x}_k$：第 $k$ 步去噪过程中的动作隐变量；$K$ 为扩散去噪总步数。
* $\boldsymbol{\epsilon}_\theta$：以 Transformer 输出嵌入 $\mathbf{e}_t$、去噪步索引 $k$ 及当前带噪动作 $\mathbf{x}_k$ 为条件的轻量去噪 MLP 网络。
* $\alpha_k, \bar{\alpha}_k, \sigma_k$：扩散预定义预设噪声调度表参数（Noise Schedule）。

> **扩散解码动作头与连续动作块预测**  
> 相比之前的“离散方法”（如 OpenVLA/RT-2），Octo 完全放弃将动作转成文本 Token，而是直接在连续的物理数值空间里，利用 Diffusion（扩散去噪模型）生成连续的动作曲线。其连续控制极度平滑精确；能够天然生成多模态的动作分布；预测的是未来一整块动作（比如未来 1 秒内的 $K$ 个动作，即 Action Chunking），大幅减少了控制延迟。  
> 扩散解码的推理过程（Inference）就像在迷雾中把一块纯噪声一步步雕刻成一条完美的动作轨迹：  
> - 扩散的开始（起点 $k=K$）：从标准高斯分布中随机抽样出一个纯随机的高斯噪声向量 $\mathbf{x}_K \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$。此时的动作数据没有任何含义，完全是雪花噪点。  
> - 一步步去噪（中间过程 $k \to 0$）：去噪网络 $\boldsymbol{\epsilon}_\theta$ 接收两个输入，当前的带噪动作 $\mathbf{x}_k$ 和 Transformer 读取 Token 提取出的上下文向量 $\mathbf{e}$。去噪网络预测出当前的噪声成分，并将其扣除一点点，推算出稍微清晰一点的下一个动作状态 $\mathbf{x}_{k-1}$。这个过程通常重复 $K$ 步（例如 10~100 步）。  
> - 扩散的结束（终点 $k=0$）：经过 $K$ 步递归去噪后，输出最终收敛的 $\mathbf{x}_0$。这就是一个纯净、连续的物理动作块 $\hat{\mathbf{a}}_{t:t+K-1}$（比如未来 0.5 秒内机械臂 3D 位姿变化和夹爪开合的连续数值轨迹）。  
> 注意：整个去噪过程完全是在后面那个极其轻量级的“扩散动作头（MLP）”内部递归进行的，前面的 Transformer 大模型主干网只需要运行 1 次前向传播提取出上下文向量 $\mathbf{e}$ 即可，因此推断速度非常快！  
{: .prompt-info }

> **训练时输入的数据是什么**  
> 训练时输入的是：真实数据集里的连续动作向量 $\mathbf{a}$ 加噪后的“带噪动作”。训练过程采用的是标准 DDPM（扩散概率模型）的训练逻辑，不需要像推断那样一步步递归去噪，而是“一步到位”：  
> - 提取真值：从机器人训练数据集中取出当前时间步真实的未来动作块 $\mathbf{a}_{\text{real}}$（比如未来 10 个时间步的真实末端位姿变化）。  
> - 随机加噪：随机挑选一个去噪步数 $k$（如 $k=45$），并抽样一个标准高斯噪声 $\boldsymbol{\epsilon}$。利用数学公式一次性将噪声混入真实动作中，得到加噪后的动作 $\mathbf{x}_k = \sqrt{\bar{\alpha}_k} \mathbf{a}_{\text{real}} + \sqrt{1 - \bar{\alpha}_k} \boldsymbol{\epsilon}$。  
> - 前向与 Loss 计算：将这个带噪动作 $\mathbf{x}_k$、去噪步数 $k$ 以及 Transformer 提取的上下文 $\mathbf{e}$ 一起喂给去噪网络 $\boldsymbol{\epsilon}_\theta$。  
> 训练目标：让去噪网络去预测我们刚刚加进去的那个噪声 $\boldsymbol{\epsilon}$，计算预测噪声与真实噪声之间的 MSE 损失（$\Vert{}\boldsymbol{\epsilon} - \boldsymbol{\epsilon}_\theta(\mathbf{x}_k, \mathbf{e}, k)\Vert{}^2$）。  
{: .prompt-info }

### 预训练数据流与微调范式 (Training Data Curation & Downstream Adaptation)

#### 数据集重采样与动作空间统一

预训练基于 Open X-Embodiment 中精选的 25 个子数据集，处理逻辑如下：

1. **筛选过滤**：仅保留包含图像流并采用 Delta 末端执行器（Delta End-Effector）控制的数据集，剔除无图像、非 Delta 控制及小众极度重复数据集。
2. **动作空间标准化**：将所有数据集的夹爪控制指令归一化为连续标量，使得 $+1$ 代表“夹爪打开”，$0$ 代表“夹爪关闭”。
3. **启发式加权采样**：将数据集划分为高多样性与低多样性两类，高多样性数据集采样的批次权重翻倍；对无语言标签的数据集随机采用 100% 事后目标图像重标记（Hindsight Goal Relabeling）条件化。

#### 下游极简高效微调 (Downstream Fine-Tuning)

在 downstream 迁移至新机器人形态、新传感器输入（如增加力矩传感器输入）或新动作空间（如关节位置控制）时，得益于分块掩蔽与读取 Token 设计：

* **完全保留 Transformer 骨干网预训练权重**，仅针对新引入的传感器输入添加浅层编码器/位置编码，或针对新动作空间/损失函数挂载新的读取头。
* **全参数端到端更新**：使用余弦衰减学习率与线性预热（Linear Warmup），在约 100 条下游目标轨迹上微调 50,000 步，全参数更新效果显著优于冻结部分骨干网参数。

## 三维扩散策略 (3D Diffusion Policy)

DP3 (3D Diffusion Policy) 旨在仅通过少量专家演示（如 5 条演示），学习一个能精准泛化至 3D 物理空间的视觉运动策略 $\pi: \mathcal{O} \mapsto \mathcal{A}$。

<img src="/assets/images/具身智能/自主学习/模型结构/dp3_method.png" alt="3D扩散策略（DP3）概述。上图：在训练阶段，DP3利用专家演示，以端到端的方式同时训练其感知模块和决策模块。在评估阶段，DP3基于对环境的视觉观察来确定动作。 下图： DP3通过单视角点云感知环境。稀疏采样的点云通过轻量级MLP编码器编码成紧凑的3D表示。随后，DP3以扩散模型为骨干，根据这些3D表示和机器人状态生成动作。" width="900" height="400">

系统整体从单视角深度相机观测（RGB-D 或单深度图）出发，将其转化为稀疏点云，经轻量级点编码器提炼为紧凑的 3D 视觉特征向量，最后以此特征和机器人自身状态为条件，利用条件扩散过程去噪生成连续动作序列。

### 3D 视觉感知与特征提取 (3D Perception & Feature Encoding)

#### 单视角点云生成与预处理

系统仅接收单个摄像头拍摄的低分辨率深度图像（如 $84 \times 84$），结合相机内参矩阵 $\mathbf{K} \in \mathbb{R}^{3 \times 3}$ 和外参矩阵 $[\mathbf{R} \mid \mathbf{t}] \in \mathbb{R}^{3 \times 4}$，将其反投影为原始 3D 点云矩阵 $\mathbf{P}_{\text{raw}}$。为增强空间外观泛化能力，点云中仅包含 3D 空间坐标，丢弃 RGB 颜色通道。

为了去除桌尾、地面等环境背景冗余并减小数据随机性，对点云进行**空间裁剪**与**最远点采样 (FPS)**：

$$
\begin{aligned}
& \mathbf{P}_{\text{raw}} = \text{Backproject}(D, \mathbf{K}, [\mathbf{R} \mid \mathbf{t}]) \in \mathbb{R}^{N_{\text{raw}} \times 3} \\
& \mathbf{P}_{\text{crop}} = \{ \mathbf{p}_i \in \mathbf{P}_{\text{raw}} \mid \mathbf{p}_{\text{min}} \le \mathbf{p}_i \le \mathbf{p}_{\text{max}} \} \in \mathbb{R}^{N_{\text{crop}} \times 3} \\
& \mathbf{P} = \text{FPS}(\mathbf{P}_{\text{crop}}, N) \in \mathbb{R}^{N \times 3}
\end{aligned}
$$

* $D \in \mathbb{R}^{H \times W}$：单视角深度图像（分辨率为 $H \times W = 84 \times 84$）。
* $\mathbf{p}_i = [x_i, y_i, z_i]^\top$：单点在 3D 摄像机/世界坐标系下的绝对空间位置。
* $[\mathbf{p}_{\text{min}}, \mathbf{p}_{\text{max}}]$：工作空间 3D 边界框 (Bounding Box)，用于裁剪无用背景点。
* $\text{FPS}(\cdot, N)$：最远点采样（Fartherst Point Sampling），将裁剪后的点云下采样至固定点数 $N$（在仿真与真实场景中均取 $N \in \{512, 1024\}$）。

---

#### 轻量级 DP3 编码器 (DP3 Point Encoder)

下采样后的稀疏点云 $\mathbf{P}$ 送入一个轻量级 MLP 网络（DP3 Encoder），提取出低维紧凑的 3D 特征向量 $\mathbf{v}$：

$$
\begin{aligned}
& \mathbf{H} = \text{LayerNorm}\left( \text{MLP}_{3\text{-Layer}}(\mathbf{P}) \right) \in \mathbb{R}^{N \times d_{\text{hidden}}} \\
& \mathbf{h}_{\text{global}} = \text{MaxPool}_{i=1}^N \left( \mathbf{H}_{i, :} \right) \in \mathbb{R}^{d_{\text{hidden}}} \\
& \mathbf{v} = \text{ProjectionHead}(\mathbf{h}_{\text{global}}) \in \mathbb{R}^{d_v}
\end{aligned}
$$

* $\mathbf{P} \in \mathbb{R}^{N \times 3}$：预处理后的稀疏 3D 点云。
* $\text{MLP}_{3\text{-Layer}}$：交错使用层归一化 (Layer Normalization) 的 3 层多层感知机，稳定小样本训练。
* $\text{MaxPool}$：沿点维度（$N$ 个点）取最大池化，确保点云顺序排列的置换不变性（Permutation Invariance）。
* $\mathbf{v} \in \mathbb{R}^{d_v}$：生成的紧凑 3D 视觉特征向量，维度仅为 $d_v = 64$（低维紧凑表达可防止过拟合，性能显著优于大型预训练点云骨干网 PointNeXt）。

---

### 条件扩散动作生成与优化 (Conditional Action Generation)

#### 去噪扩散生成推理 (DDIM Sampling / Inference)

决策模块构建为以 3D 视觉特征 $\mathbf{v}$ 和机器人状态 $\mathbf{q}$ 为条件的多层卷积（1D-CNN）扩散模型。

推断阶段，从标准高斯噪声 $\mathbf{a}_K \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$ 出发，利用 DDIM 调度器进行 $K$ 步（推理取 $K=10$）迭代去噪，还原出无噪动作序列 $\mathbf{a}_0$：

$$
\mathbf{a}_{k-1} = \alpha_k \left( \mathbf{a}_k - \gamma_k \boldsymbol{\epsilon}_\theta(\mathbf{a}_k, k, \mathbf{v}, \mathbf{q}) \right) + \sigma_k \mathbf{z}, \quad \mathbf{z} \sim \mathcal{N}(\mathbf{0}, \mathbf{I})
$$

* $\mathbf{a}_0 \in \mathbb{R}^{T_a \times D_a}$：生成的连续动作序列（Action Chunk），包含 $T_a$ 个未来时间步上的机器人动作（如末端位姿变化量或关节角度）。
* $\mathbf{q} \in \mathbb{R}^{D_q}$：机器人本体感觉状态（如本体关节角度、末端执行器当前位姿）。
* $\boldsymbol{\epsilon}_\theta(\mathbf{a}_k, k, \mathbf{v}, \mathbf{q})$：条件去噪网络（采用 1D Temporal CNN 架构），输入为带噪动作 $\mathbf{a}_k$、当前扩散时间步 $k$、3D 特征 $\mathbf{v}$ 及状态 $\mathbf{q}$。
* $\alpha_k, \gamma_k, \sigma_k$：由 DDIM 噪声调度器在第 $k$ 步预设的系数。

---

#### 训练目标与噪声预测 (Training Objective)

训练阶段，从专家演示数据集中随机采样无噪动作轨迹 $\mathbf{a}_0 \sim \mathcal{D}$，随机抽取训练扩散步数 $k \in \{1, \dots, 100\}$，并混入高斯噪声 $\boldsymbol{\epsilon}_k \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$。

网络采用样本预测/噪声重建均方误差 (MSE) 损失进行端到端优化：

$$
\begin{aligned}
& \mathbf{a}_k = \bar{\alpha}_k \mathbf{a}_0 + \bar{\beta}_k \boldsymbol{\epsilon}_k \\
& \mathcal{L}_{\text{DP3}}(\theta) = \text{MSE}\left( \boldsymbol{\epsilon}_k, \, \boldsymbol{\epsilon}_\theta(\mathbf{a}_k, k, \mathbf{v}, \mathbf{q}) \right) = \left\| \boldsymbol{\epsilon}_k - \boldsymbol{\epsilon}_\theta\left( \bar{\alpha}_k \mathbf{a}_0 + \bar{\beta}_k \boldsymbol{\epsilon}_k, \, k, \, \mathbf{v}, \, \mathbf{q} \right) \right\|_2^2
\end{aligned}
$$

* $\bar{\alpha}_k, \bar{\beta}_k$：根据扩散调度器推导出的单步加噪前向扩散系数。
* 训练超参数设置：训练时扩散步数设为 100，Batch Size 设为 128，训练 3000 个 Epoch 以确保收敛。

# Flow Matching Action Expert (Pi0 and Pi0.7 as example)

$\pi_0$ 与 $\pi_{0.7}$ 是一系列基于条件流匹配（Conditional Flow Matching, CFM）的视觉-语言-动作（VLA）基础策略模型。其核心设计是将多模态感知输入与低级控制解耦，利用独立的**动作专家（Action Expert）**在连续空间中建模多模态动作分布，实现高频、平滑且精准的机器人控制。

## 系统架构与端到端特征前向传播

系统由 **VLM 视觉-语言骨干网（VLM Backbone）**、**MEM 历史视频编码器（History Vision Encoder）** 以及 **动作专家网络（Action Expert）** 三部分构成，遵循**知识隔离（Knowledge Insulation, KI）**与**双专家混合（MoE-style Architecture）**设计。

### 多模态 Prompt 输入标记化

在时间步 $t$，模型接收包含环境观测、本体状态与多模态上下文的统一 Prompt $\mathcal{C}_t$：

$$\begin{aligned} & \mathbf{o}_{t-T:t} = \left[ \mathbf{I}_{t-T:t}^1, \dots, \mathbf{I}_{t-T:t}^n, \mathbf{q}_{t-T:t} \right], \quad \mathbf{g}_t^\star = \left[ G_{t}^1, \dots, G_{t}^n \right] \\ & \mathcal{C}_t = \left\{ \ell_t, \, \hat{\ell}_t, \, \mathbf{g}_t^\star, \, m_t, \, c_t \right\} \end{aligned}$$

* $\mathbf{I}_{t-T:t}^i \in \mathbb{R}^{(T+1) \times H \times W \times C}$：第 $i \in \{1, \dots, n\}$ 个摄像头视角（主视角、双腕视角及后视角）保留的 $T+1$ 帧历史图像，统一缩放至 $448 \times 448$。经由 MEM 视觉编码器在空域与时域压缩后，输出固定数量的视觉 Token。
* $\mathbf{g}_t^\star$：由世界模型 $g_\psi$ 生成或从未来轨迹采样的多视角子目标图像（Subgoal Images），通过同一视觉编码器提取 Token。
* $\ell_t, \hat{\ell}_t$：高层任务自然语言指令（如 `"clean the kitchen"`）与当前局部子任务指令（如 `"open the fridge door"`）。
* $m_t = \{s_t, q_t, \text{mistake}_t\}$：Episode 元数据，包含整体执行速度 $s_t$、质量评分 $q_t \in \{1,\dots,5\}$ 及错误标记 $\text{mistake}_t \in \{\text{true}, \text{false}\}$。
* $c_t \in \{\text{joint}, \text{ee}\}$：低级控制模式标识符（关节空间或末端执行器空间）。
* $\mathbf{q}_{t-T:t} \in \mathbb{R}^{(T+1) \times D_q}$：机器人关节/末端本体感觉历史状态向量，通过线性投影矩阵映射至 VLM 骨干网嵌入空间：
  
  $$\mathbf{x}_{\text{state}} = \mathbf{W}_q \mathbf{q}_{t-T:t} \in \mathbb{R}^{(T+1) \times D_{\text{VLM}}}$$

### 骨干网注意力掩蔽与知识隔离 (Knowledge Insulation)

VLM 骨干网（$\pi_{0.7}$ 为 Gemma3 4B，$\pi_0$ 为 PaliGemma 3B）采用分块因果注意力掩蔽（Block-Causal Masking）：
* 图像观测 Token 与子目标图像 Token 内部使用双向注意力，且子目标 Token 可注意力感知观测 Token；随后的文本与状态 Token 严格执行因果注意力。

动作专家网络（$\pi_{0.7}$ 参数量为 860M，$\pi_0$ 为 300M）处理 $H=50$ 个动作 Token，内部采用全双向注意力，并交叉注意力感知 VLM 骨干网的全部特征激活：
* **知识隔离 (KI)**：VLM 骨干网仅由 FAST 离散 Token 的交叉熵损失进行梯度更新；动作专家的流匹配梯度**严禁回传（No Gradient Flow）**至 VLM 骨干网，以保证视觉语言表征的稳健性。

## 基于条件流匹配的动作生成 (Conditional Flow Matching)

动作生成被表述为连续空间上的条件流匹配（CFM）过程，直接预测未来 $H=50$ 步的连续动作块 $\mathbf{A}_t = \mathbf{a}_{t:t+H-1} \in \mathbb{R}^{H \times D_a}$。

### 概率路径与目标向量场

定义流匹配时间 $\tau \in [0, 1]$ 上的线性高斯概率路径（Optimal Transport Path）：

$$q(\mathbf{A}_t^\tau \mid \mathbf{A}_t) = \mathcal{N}\left( \tau \mathbf{A}_t, \, (1 - \tau) \mathbf{I} \right)$$

采样标准高斯噪声 $\boldsymbol{\epsilon} \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$，构建带噪动作轨迹：

$$\mathbf{A}_t^\tau = \tau \mathbf{A}_t + (1 - \tau) \boldsymbol{\epsilon}$$

该概率路径对应的目标去噪向量场为：

$$\mathbf{u}(\mathbf{A}_t^\tau \mid \mathbf{A}_t) = \frac{d}{d\tau} \mathbf{A}_t^\tau = \mathbf{A}_t - \boldsymbol{\epsilon}$$

### 训练优化目标

动作专家网络拟合条件向量场 $\mathbf{v}_\theta(\mathbf{A}_t^\tau, \mathbf{o}_{t-T:t}, \mathcal{C}_t, \tau)$，损失函数定义为：

$$\mathcal{L}_{\text{CFM}}(\theta) = \mathbb{E}_{\tau \sim \text{Beta}(a,b), \, (\mathbf{o}, \mathbf{A}_t) \sim \mathcal{D}, \, \boldsymbol{\epsilon} \sim \mathcal{N}(\mathbf{0}, \mathbf{I})} \left[ \left\Vert{} \mathbf{v}_\theta\left( \tau \mathbf{A}_t + (1 - \tau)\boldsymbol{\epsilon}, \, \mathbf{o}_{t-T:t}, \, \mathcal{C}_t, \, \tau \right) - (\mathbf{A}_t - \boldsymbol{\epsilon}) \right\Vert{}_2^2 \right]$$

* $\tau \sim \text{Beta}(a, b)$：从偏向低数值（高噪声区间）的 Beta 分布中抽样的流匹配时间步，通过 Adaptive RMSNorm 注入动作专家。

### 欧拉积分推断与无分类器引导 (CFG)

推断时，从纯高斯噪声 $\mathbf{A}_t^0 \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$ 开始，采用前向欧拉积分执行 $K$ 步去噪迭代（积分步长 $\delta = 1/K$）：

$$\mathbf{A}_t^{\tau + \delta} = \mathbf{A}_t^\tau + \delta \cdot \hat{\mathbf{v}}_\theta(\mathbf{A}_t^\tau, \mathbf{o}_{t-T:t}, \mathcal{C}_t, \tau)$$

针对 Episode 元数据 $m_t$，引入无分类器引导（Classifier-Free Guidance, CFG）强化特定属性控制：

$$\hat{\mathbf{v}}_\theta = \mathbf{v}_\theta(\mathbf{A}_t^\tau, \mathbf{o}_{t-T:t}, \mathcal{C}_t, \tau) + \beta \left( \mathbf{v}_\theta(\mathbf{A}_t^\tau, \mathbf{o}_{t-T:t}, \mathcal{C}_t, \tau) - \mathbf{v}_\theta(\mathbf{A}_t^\tau, \mathbf{o}_{t-T:t}, \mathcal{C}_t^{\text{uncond}}, \tau) \right)$$

* $\mathcal{C}_t^{\text{uncond}}$：将元数据 $m_t$ 进行 Dropout 后的条件集合。
* $\beta \in [1.3, 2.2]$：CFG 引导权重，用于激发高质、高速的控制表现。

> **基于条件流匹配（Conditional Flow Matching, CFM）的动作生成详解**  
> 传统机械臂控制要么预测单一的数值，要么把动作分成离散的档位（如 OpenVLA）。但真实世界中，完成一个任务（比如“把手伸过去拿杯子”）往往有无数种平滑的画线方式。  
> - **扩散模型（Diffusion）** 就像是把一张照片加满噪点，然后一步步把噪点擦掉恢复照片。它的轨迹是随机游走弯弯曲曲的，需要去噪很多步（如 20~50 步），速度较慢。  
> - **流匹配（Flow Matching）** 不走弯路，而是直接在“随机噪声”和“真实动作”之间拉一条最平直的路线（直达矢量的场/速度场）。模型不需要一步步繁琐去噪，只需沿着这个“矢量场”推几步（如 5~10 步），就能极快地生成平滑连续的动作。  
> 训练的目标是让网络学会：“给定当前的图像/指令（条件 $\mathcal{C}$）以及一个半成品带噪动作，告诉我接下来应该往哪个方向推，才能最快变回真实动作？” 训练时并不是真的走多步去噪，而是一步到位采样训练：  
> - 获取真值（Target）：从数据集中取出真实机械臂未来 50 步的连续动作轨迹，记为 $\mathbf{A}_{\text{real}}$。  
> - 随机加噪（构建直达路径）：  
>   - 随机抽样一个纯高斯噪声轨迹 $\boldsymbol{\epsilon} \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$（代表起点 $\tau=0$ 的状态）。  
>   - 随机选择一个时刻 $\tau \in [0, 1]$（比如 $\tau = 0.4$）。  
>   - 根据最平直的线性插值路径，合成出该时刻的“半成品带噪动作”：$\mathbf{A}^\tau = \tau \mathbf{A}_{\text{real}} + (1 - \tau) \boldsymbol{\epsilon}$  
> - 计算理想速度矢量（Ground Truth Field）：从起点 $\boldsymbol{\epsilon}$ 直接指向终点 $\mathbf{A}_{\text{real}}$ 的直达速度方向，就是 $\mathbf{u} = \mathbf{A}_{\text{real}} - \boldsymbol{\epsilon}$。  
> - 网络预测与 Loss 计算：把“半成品动作” $\mathbf{A}^\tau$、时刻 $\tau$ 和视觉/指令条件 $\mathcal{C}$ 喂给动作专家网络 $\mathbf{v}_\theta$。网络会预测一个速度方向 $\mathbf{v}_\theta(\mathbf{A}^\tau, \mathcal{C}, \tau)$。计算预测速度与理想速度之间的 均方误差（MSE Loss） 并更新网络参数：$\mathcal{L} = \Vert{}\mathbf{v}_\theta - \mathbf{u}\Vert{}^2$。  
> 当机器人在真实世界中运行，需要预测未来 50 步动作时，流匹配执行以下全流程推断（如 5 步欧拉积分）：  
> - 起点（$\tau = 0$）：完全不依赖上一时刻的动作，直接凭空从标准高斯分布中随机抽样出一个纯噪声动作序列 $\mathbf{A}^0 \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$。  
> - 多步欧拉积分去噪（例如 $K=5$ 步，步长 $\delta = 0.2$）：第 1 步（$\tau = 0.0$）把纯噪声 $\mathbf{A}^0$ 和图像/指令条件 $\mathcal{C}$ 送入动作专家，模型输出当前推进方向 $\mathbf{v}_0$。将状态沿着方向推一步：$\mathbf{A}^{0.2} = \mathbf{A}^0 + 0.2 \times \mathbf{v}_0$。第 2 步（$\tau = 0.2$）把 $\mathbf{A}^{0.2}$ 送入网络，计算方向 $\mathbf{v}_{0.2}$，继续往前推：$\mathbf{A}^{0.4} = \mathbf{A}^{0.2} + 0.2 \times \mathbf{v}_{0.2}$。依次迭代，直至第 5 步（$\tau = 1.0$）。  
> - 终点（$\tau = 1.0$）：最终输出的 $\mathbf{A}^{1.0}$ 就是一个完全消除噪声、物理平滑且符合图像/指令要求的连续 50 步机械臂动作矩阵（如关节角度或末端位姿）。  
> - 下发执行：将这 50 步动作的前 15~25 步直接下发给底层的机械臂电机控制器（PD / IK）去执行，同时异步启动下一次流匹配推理。  
{: .prompt-info }

## 多模态 Prompt 扩充与 Dropout 训练策略

为了利用次优轨迹、失败样例与异构跨具身数据，$\pi_{0.7}$ 在训练阶段对 Prompt 各组件施加随机 Dropout，提升测试期灵活组合能力：

1. **子目标图像 $\mathbf{g}_t^\star$**：仅在 25% 的训练样本中保留。保留样本中，75% 采样未来 $0 \sim 4$ 秒内的真实图像，25% 采样段尾图像；并混合世界模型 $g_\psi$ 生成的合成图像。包含子目标图像时，有 30% 概率丢弃子任务文本 $\hat{\ell}_t$。
2. **Episode 元数据 $m_t$**：15% 的概率整体丢弃；保留时，内部各字段（Speed, Quality, Mistake）各有 5% 的独立丢弃概率。
3. **历史帧与视角**：历史图像与状态整体有 30% 概率丢弃；后视摄像头有 30% 概率独立丢弃。

## 实时动作块控制与测试期部署算法 (RTC Deployment)

测试部署时，结合实时动作块（Real-Time Action Chunking, RTC）机制与多线程异步推断，消除推理延迟带来的机械臂卡顿。

### 测试期部署逻辑说明

1. **初始化**：传入初始观测 $\mathbf{o}_0$、高层指令 $\ell$、元数据 $m$（速度设为 P15 分位数，质量设为 5，错误设为 false）及控制模式 $c$；获得当前子任务指令 $\hat{\ell}$。
2. **异步线程 1（子目标生成）**：当子任务 $\hat{\ell}$ 发生变更，或计时器满 $\Delta = 4$ 秒时，异步调用世界模型更新子目标图像：$\mathbf{g}^\star \sim p_\psi(\mathbf{g}^\star \mid \mathbf{o}_t, \hat{\ell}, m)$，并刷新上下文 $\mathcal{C}$。
3. **主控制线程（动作专家推断）**：若距离上次推断已执行 $\hat{H}$ 步（$\hat{H} \in [15, 25]$），调用动作专家进行流匹配采样生成新动作块：$\mathbf{A}_t \sim \pi_\theta(\mathbf{A} \mid \mathbf{o}_{t-T:t}, \mathcal{C}, \mathbf{a}_{t:})$（结合训练期模拟的 $0 \sim 240\text{ms}$ 延迟残差做平滑衔接）。
4. **底层执行**：下发当前步物理动作 $\mathbf{a}_t$ 给底层 PD/IK 控制器执行。

# 统一或混合式动作生成

## RDT2：探索UMI数据在零样本跨具身泛化中的扩展极限

RDT2 旨在解决大规模多模态动作分布建模与超大型 VLA 模型实时部署的冲突。系统通过硬件升级采集大规模 UMI（Universal Manipulation Interface）双手数据，并引入三阶段混合训练架构（离散预训练 $\to$ 连续流匹配专家 $\to$ 扩散蒸馏），兼顾 VLM 知识保留、表达能力与低延迟推理。

### 硬件迭代与数据规模 (Hardware & Dataset Scaling)

采用重新设计的手持 UMI 硬件，通过 CNC 尼龙66/玻璃纤维加工提升机械刚度，引入红外光六维姿态跟踪解决无纹理/高速运动场景漂移，并优化平行颌夹爪结构。

在自然环境中录制超过 10,000 小时、涵盖 100+ 家庭的双手 6 自由度末端姿态与夹爪动作数据集 $\mathcal{D}$：

$$
\mathcal{D} := \left\{ \left( \ell^{(i)}, \, \mathbf{o}_t^{(i)}, \, \mathbf{A}_t^{(i)} \right) \;\middle|\; 0 \le t < T^{(i)}, \, 1 \le i \le N \right\}
$$

* $\ell^{(i)}$：第 $i$ 条轨迹的自由格式自然语言任务指令。
* $\mathbf{o}_t^{(i)} \in \mathbb{R}^{H \times W \times C}$：时间步 $t$ 的单帧 RGB 视觉观测（假定包含决策所需的完备信息）。
* $\mathbf{A}_t^{(i)} = [\mathbf{a}_t^{(i)}, \mathbf{a}_{t+1}^{(i)}, \dots, \mathbf{a}_{t+T_a}^{(i)}]^\top \in \mathbb{R}^{T_a \times d}$：连续动作块（Action Chunk），其中 $d$ 为单步动作维度（末端姿态 + 夹爪宽度），$T_a$ 为动作块预测步长。
* $N$：轨迹总数（$N > 10,000$ 小时数据）。

### 第一阶段：残差矢量量化与离散 VLM 预训练 (Stage 1: RVQ & Discrete VLM Pre-training)

为了保留预训练 VLM 的语言推理与离散概率知识，并加速收敛，第一阶段通过残差矢量量化（RVQ）将连续动作块离散化，使用交叉熵目标对 VLM 骨干网进行预训练。

#### RVQ 动作分词器 (RVQ Action Tokenizer)

采用一维时间卷积神经网络编码器 $\phi_{\text{enc}}$、深度为 $M$ 的码本（Codebook）与解码器 $\phi_{\text{dec}}$：

$$
\{\mathbf{z}_i\}_{i=1}^n = \phi_{\text{enc}}(\mathbf{A}_t), \quad \mathbf{z}_i \in \mathbb{R}^C
$$

对每个潜在向量 $\mathbf{z}_i$（令初始残差 $\mathbf{r}_0^i = \mathbf{z}_i$），通过深度 $j = 1, \dots, M$ 迭代量化：

$$
\begin{aligned}
k_j^i &= \arg\min_{1 \le k \le K} \left\| \mathbf{r}_{j-1}^i - \mathbf{e}_j(k) \right\|_2^2 \\
\mathbf{r}_j^i &= \mathbf{r}_{j-1}^i - \mathbf{e}_j(k_j^i)
\end{aligned}
$$

解码重构动作块 $\hat{\mathbf{A}}_t$ 及训练损失 $\mathcal{L}_{\text{vq}}$：

$$
\hat{\mathbf{A}}_t = \phi_{\text{dec}}\left( \left\{ \hat{\mathbf{z}}_i \right\}_{i=1}^n \right) = \phi_{\text{dec}}\left( \left\{ \sum_{j=1}^M \mathbf{e}_j(k_j^i) \right\}_{i=1}^n \right)
$$

$$
\mathcal{L}_{\text{vq}} = \mathbb{E}_{(\cdot, \cdot, \mathbf{A}_t) \sim \mathcal{D}} \left[ \|\mathbf{A}_t - \hat{\mathbf{A}}_t\|_2^2 + \|\text{sg}(\mathbf{z}_i) - \hat{\mathbf{z}}_i\|_2^2 + \beta \|\mathbf{z}_i - \text{sg}(\hat{\mathbf{z}}_i)\|_2^2 \right]
$$

* $\mathbf{e}_j \in \mathbb{R}^{K \times C}$：第 $j$ 层深度大小为 $K$ 的可学习码本（通过余弦相似度、EMA 平滑更新及不活跃条目重启防止崩溃）。
* $\{k_1^i, \dots, k_M^i\}_{i=1}^n$：动作块 $\mathbf{A}_t$ 压缩后生成的 $n \times M$ 个离散动作 Token 索引。
* $\text{sg}(\cdot)$：Stop-gradient 算子。

#### VLM 骨干网交叉熵预训练

基于 Qwen2.5-VL (7B) 骨干网，覆盖词表末尾使用频率最低的 1024 个标记用于映射动作 Token。采用标准自回归下一个 Token 预测（Next-Token Prediction）目标训练 128k 次迭代：

$$
\mathcal{L}_{\text{Stage1}}(\Theta_{\text{VLM}}) = -\sum_{i=1}^n \sum_{j=1}^M \log P_{\Theta_{\text{VLM}}}\left( k_j^i \;\middle|\; k_{<j}^i, k_{<i}, \ell, \mathbf{o}_t \right)
$$

* $\Theta_{\text{VLM}}$：Qwen2.5-VL 7B 可训练参数。

### 第二阶段：连续流匹配动作专家训练 (Stage 2: Flow Matching Action Expert)

为了消除自回归生成的量化误差与低效性，第二阶段**冻结已预训练的 VLM 骨干网**，训练一个 400M 参数的连续动作专家（RDT-1B 变体，引入 GQA 优化速度）。动作专家通过交叉注意力（Cross-Attention）融合 VLM 各层的潜在特征。

#### 连续流匹配训练目标 (Flow Matching Loss)

采样流匹配时间步 $\tau \sim \mathcal{U}(0, 1)$ 及高斯噪声 $\boldsymbol{\epsilon} \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$，构造带噪动作轨迹 $\mathbf{A}_t^\tau$ 与真实速度 $\mathbf{u}$：

$$
\mathbf{A}_t^\tau = (1 - \tau)\boldsymbol{\epsilon} + \tau \mathbf{A}_t, \quad \mathbf{u}(\mathbf{A}_t^\tau \mid \mathbf{A}_t) = \mathbf{A}_t - \boldsymbol{\epsilon}
$$

动作专家去噪网络 $\mathbf{v}_\theta$ 的优化目标为：

$$
\mathcal{L}_{\text{expert}}(\theta) = \mathbb{E}_{(\ell, \mathbf{o}_t, \mathbf{A}_t) \sim \mathcal{D}, \, \tau \sim \mathcal{U}(0, 1), \, \boldsymbol{\epsilon} \sim \mathcal{N}(\mathbf{0}, \mathbf{I})} \left[ \left\| \mathbf{v}_\theta\left( \tau, \mathbf{A}_t^\tau, \text{VLA}_{\text{frozen}}(\ell, \mathbf{o}_t) \right) - (\mathbf{A}_t - \boldsymbol{\epsilon}) \right\|_2^2 \right]
$$

* $\theta$：动作专家网络可训练参数，训练 66k 次迭代。
* $\text{VLA}_{\text{frozen}}(\ell, \mathbf{o}_t)$：冻结的 VLM 骨干网各层特征，在多步积分推断中仅计算一次前向传播。

#### 采样推断 (Multi-step Euler Inference)

从纯高斯噪声 $\mathbf{A}_t^0 \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$ 开始，采用 5 步前向欧拉积分（步长 $\delta\tau = 0.2$）解算动作块：

$$
\mathbf{A}_t^{\tau + \delta\tau} = \mathbf{A}_t^\tau + \delta\tau \cdot \mathbf{v}_\theta\left( \tau, \mathbf{A}_t^\tau, \text{VLA}_{\text{frozen}}(\ell, \mathbf{o}_t) \right), \quad \tau \in \{0, 0.2, 0.4, 0.6, 0.8\}
$$

### 第三阶段：单步生成器扩散蒸馏 (Stage 3: Diffusion Distillation for Fast Inference)

为满足高动态任务（如打乒乓球）的极低延迟需求，第三阶段通过在线扩散蒸馏，将第二阶段的多步动作专家 $\mathbf{v}_\theta$ 压缩为单步生成器 $\mathcal{G}_{\theta'}$。

#### 单步回归目标 (On-the-fly Regression Loss)

初始化可训练参数 $\theta' \leftarrow \theta$，冻结 VLM 与第二阶段教师专家 $\mathbf{v}_\theta$。在训练过程中实时运行教师模型的 5 步采样过程 $\mathcal{F}$（避免离线数据集过拟合）：

$$
\begin{aligned}
& \mathcal{F}(\mathbf{A}_t^0, \ell, \mathbf{o}_t; \theta) = \mathbf{A}_t^{\tau=1} \quad (\text{来自第二阶段教师模型的 5 步积分结果}) \\
& \mathcal{G}(\mathbf{A}_t^0, \ell, \mathbf{o}_t; \theta') = \mathbf{A}_t^0 + \mathbf{v}_{\theta'}\left( 0, \mathbf{A}_t^0, \text{VLA}_{\text{frozen}}(\ell, \mathbf{o}_t) \right)
\end{aligned}
$$

损失函数定义为单步预测与教师 5 步结果的 MSE 回归：

$$
\mathcal{L}_{\text{distill}}(\theta') = \mathbb{E}_{(\ell, \mathbf{o}_t) \sim \mathcal{D}, \, \mathbf{A}_t^0 \sim \mathcal{N}(\mathbf{0}, \mathbf{I})} \left[ \left\| \mathcal{F}(\mathbf{A}_t^0, \ell, \mathbf{o}_t; \theta) - \mathcal{G}(\mathbf{A}_t^0, \ell, \mathbf{o}_t; \theta') \right\|_2^2 \right]
$$

#### 极速推断 (Single-Step Inference)

部署时仅需一次前向传播即可直接生成最终连续动作块：

$$
\mathbf{A}_t^{\text{final}} = \mathbf{A}_t^0 + \mathbf{v}_{\theta'}\left( 0, \mathbf{A}_t^0, \text{VLA}_{\text{frozen}}(\ell, \mathbf{o}_t) \right), \quad \mathbf{A}_t^0 \sim \mathcal{N}(\mathbf{0}, \mathbf{I})
$$

## 离散扩散 VLA：将离散扩散引入 视觉-语言-行动策略中的动作解码

离散扩散 VLA（Discrete Diffusion VLA）旨在解决传统自回归 VLA 模型（如 OpenVLA）逐标记预测导致的高延迟问题，同时消除单独引入连续扩散网络时与 VLM 交叉熵损失产生的梯度竞争。

<img src="/assets/images/具身智能/自主学习/模型结构/discretevla_method.png" alt="离散扩散 VLA 架构概述：扩展了 VLM 主干网络，该网络编码多视图 RGB 图像（SigLIP+DINOv2 ViTs）和语言指令，并通过扩散式迭代细化解码离散动作块。自适应解码（左下）在每一轮中保留高置信度标记，并使用余弦调度来降低保留比例。二级重掩蔽（右下）使用阈值检查来重新掩蔽不确定标记，从而确保多迭代一致性并实现鲁棒的纠错。" width="900" height="400">

该架构将感知、指令理解与动作去噪统一于单一 Transformer 主干网络中，将动作生成表述为在离散词表上的掩码扩散（Masked Diffusion）过程，支持测试期的高效动作块并行解码与自适应二次重掩蔽（Secondary Remasking）。

### 动作离散化与词表扩充 (Action Discretization & Vocabulary Augmentation)

输入动作采用基于分位数的离散化方案，将连续动作块映射为离散标记序列，并扩充特殊掩码标记 `[MASK]`。

$$\begin{aligned} & \mathbf{a}_0 = (a_{0, 1}, a_{0, 2}, \dots, a_{0, L}), \quad a_{0, i} \in \{1, 2, \dots, K\} \\ & L = H \times D_{\text{action}}, \quad D_{\text{action}} = 7, \quad K = 256 \\ & \mathcal{V}_{\text{action}} = \{1, 2, \dots, K\} \cup \{\text{[MASK]}\}, \quad \vert{}\mathcal{V}_{\text{action}}\vert{} = V = K + 1 \end{aligned}$$

* $H$：连续动作块包含的时间步数。
* $D_{\text{action}}$：单步控制维度（如 3 平移 + 3 旋转 + 1 夹爪 = 7）。
* $L$：一个完整动作块展开后的总动作标记数量。
* $K$：基于训练集第 1 至 99 分位数划分的离散箱（Bin）数量，单维度离散化为 256 个档位。
* $\mathbf{a}_0$：原始无噪离散动作块，每个标记位置用 One-hot 向量 $\mathbf{e}_{a_{0, i}} \in \mathbb{R}^V$ 表示。

> **动作离散化与词表扩充：把物理动作变成“填字游戏”**  
> 这里的核心目的是：把机器人连续的物理运动（比如“机械臂向左移动 $0.0123\text{m}$”），转换成大语言模型（LLM/VLM）能看懂的“单词（Token）”。  
> - 机械臂的单步动作（$D_{\text{action}} = 7$）：机械臂在任意一个瞬间，控制它需要 7 个数字（3 个空间平移 $\Delta x, \Delta y, \Delta z$ + 3 个角度旋转 $\Delta \text{roll}, \Delta \text{pitch}, \Delta \text{yaw}$ + 1 个夹爪开合度）。  
> - 动作块（Action Chunk, $H$）：模型不会只预测眼下一个瞬间，而是预测未来一小段连续轨迹（比如预测未来 $H = 10$ 个时间步）。  
> - 动作序列总长度 $L$（$L = H \times D_{\text{action}}$）：如果预测未来 $H=10$ 步，每步有 7 个控制量，那么总共就要预测 $10 \times 7 = 70$ 个数字。这里的 $L$ 就是总数字个数（$L=70$），而 $i$ 代表这 70 个数字里的第 $i$ 个位置（比如 $i=1$ 是第 1 步的 $x$ 轴平移，$i=7$ 是第 1 步的夹爪开合度，$i=8$ 是第 2 步的 $x$ 轴平移……）。  
{: .prompt-info }

> **$\{1, \dots, K\}$ 与 \[MASK\] 的“交集”到底在做什么**  
> - $\{1, \dots, K\}$（用 $K=256$ 个桶来装数字）：物理动作是连续的（比如移动量可以是 $0.0123456\dots\text{m}$），但语言模型只懂离散的单词。所以我们把动作允许的最大最小值之间切成 256 个等份区间（桶）。每一个连续的物理数值，映射进去后都会变成一个 $1 \sim 256$ 之间的整数编号。这就是 $\{1, \dots, K\}$，代表 256 个具体的动作指令。  
> - \[MASK\] 遮罩标记：这是一个特殊符号，代表“还没想好 / 空白”。  
> - 扩充词表 $\mathcal{V} = \{1, \dots, K\} \cup \{\text{[MASK]}\}$：动作块是一条长度为 $L$ 的长横条纸带（共有 $L$ 个格子）。在推断刚开始时，模型不知道机器人该干嘛，纸带上全是空白格（也就是全是 \[MASK\]）。模型每往前推一步，就会把某些格子上的 [MASK] 擦掉，填入真实的动作编号（即从 $\{1, \dots, K\}$ 中选一个 $1 \sim 256$ 的数字填进去）。所以，这个词表必须同时包含“具体的动作指令 $\{1,\dots,K\}$”和“代表空白待填的 \[MASK\]”。  
{: .prompt-info }

### 离散扩散马尔可夫前向过程 (Discrete Diffusion Forward Noise Process)

前向加噪过程定义为离散马尔可夫链 $\{ \mathbf{a}_t \}_{t=0}^T$。在每一步，每个标记位置以概率 $\beta_t$ 被替换为特殊标记 `[MASK]`（记为 $\mathbf{e}_M$），以概率 $1 - \beta_t$ 保持原状。

单步转移矩阵 $\mathbf{Q}_t \in \mathbb{R}^{V \times V}$ 与任意时刻 $t$ 的边际破坏分布 $q(\mathbf{a}_t \mid \mathbf{a}_0)$ 定义如下：

$$\begin{aligned} & \mathbf{Q}_t \mathbf{e}_{a_{t, i}} = (1 - \beta_t) \mathbf{e}_{a_{t, i}} + \beta_t \mathbf{e}_M \\ & \bar{\mathbf{Q}}_t = \mathbf{Q}_t \mathbf{Q}_{t-1} \cdots \mathbf{Q}_1 \\ & q(\mathbf{a}_t \mid \mathbf{a}_0) = \prod_{i=1}^L \text{Categorical}\left( a_{t, i} \;\middle\vert{}\; \bar{\mathbf{Q}}_t \mathbf{e}_{a_{0, i}} \right) \end{aligned}$$

* $\beta_t \in (0, 1)$：时刻 $t$ 的加噪率。
* $\gamma_t \in (0, 1]$：时刻 $t$ 的累积掩码比例（Mask Ratio），即整条序列中被替换为 `[MASK]` 的标记比例。
* $\tilde{\mathbf{a}}_t$：根据掩码比例 $\gamma_t$ 随机将选定位置替换为 `[MASK]` 后获得的损坏动作序列。

> **离散扩散马尔可夫前向过程：通俗理解与核心目的**  
> 这一步本质上是在训练阶段给模型“出难题/做坏事”，教模型以后怎么把被涂黑的字擦掉还原。离散扩散的前向过程，就是拿着涂改液，按照时间一步步往纸带上随机盖遮罩（涂黑）。这就是数学公式 $q(\mathbf{a}_t \mid \mathbf{a}_0)$ 干的事情：它根据当前的时间步 $t$（对应涂黑比例 $\gamma_t$），随机把一部分原本正确的动作 Token 破坏成 \[MASK\]。  
> 前向加噪过程的最终目的只有一个：制造“半成品（破坏数据）”，拿去训练模型学会“反向去噪/修补（逆过程）”。有了这个训练出来的能力，在实际部署（推断）时：模型拿到的直接就是一条100% 全被 [MASK] 涂黑的空白纸带。模型看一眼摄像头画面，第一轮先填上它最有把握的 20% 动作；第二轮看着这 20% 的已知信息，再填上剩下 80% [MASK] 中的一部分……经过几轮迭代（比如 5 步），原本全黑的纸带就被并行且自适应地恢复成了一条完整的平滑运动轨迹！  
{: .prompt-info }

### 统一多模态骨干网架构 (Unified Transformer Architecture)

基于 Prismatic-7B / Llama 2 VLM 骨干网络，多模态特征输入与注意力掩蔽规则如下：

$$\begin{aligned} & \mathbf{c} = \left[ \mathbf{X}_{\text{vis}}, \, \mathbf{X}_{\text{lang}}, \, \mathbf{X}_{\text{prop}} \right] \\ & \mathbf{X}_{\text{vis}} = \text{Projector}\left( \left[ \text{SigLIP}(I_{\text{head}}), \, \text{DINOv2}(I_{\text{head}}), \, \text{WristViews} \right] \right) \\ & \mathbf{X}_{\text{prop}} = \text{MLP}(\mathbf{q}_{\text{arm}}) \\ & \mathbf{Z}_{\text{in}} = \left[ \mathbf{c} \,\Vert{}\, \tilde{\mathbf{a}}_t \right] \\ & p_\theta(\cdot \mid \tilde{\mathbf{a}}_t, \mathbf{c}) = \text{Softmax}\left( \mathbf{W}_{\text{head}} \cdot f_\theta(\mathbf{Z}_{\text{in}}) \right) \end{aligned}$$

* $\mathbf{c}$：拼接后的多模态上下文特征（包含头部与双腕图像特征 $\mathbf{X}_{\text{vis}}$、语言指令嵌入 $\mathbf{X}_{\text{lang}}$ 以及本体状态特征 $\mathbf{X}_{\text{prop}}$）。
* $\tilde{\mathbf{a}}_t$：带掩码的动作标记序列。
* **全模态融合注意力**：取消动作标记上的因果掩蔽，对动作标记采用**全双向注意力（Full Bidirectional Attention）**，使其可以同时感知所有视觉、语言、本体特征及其他动作标记。
* $\mathbf{W}_{\text{head}} \in \mathbb{R}^{K \times D_{\text{hidden}}}$：共享分类头，将隐藏状态直接投影到 256 路动作词表中。

> **统一多模态骨干网架构的变量与符号拆解**  
> - $\mathbf{Z}_{\text{in}} = \left[ \mathbf{c} \,\Vert{}\, \tilde{\mathbf{a}}_t \right]$（统一输入 Token 序列）：  
>   - $\mathbf{c}$：多模态上下文特征（把头部/手腕摄像头图像特征、语言指令 Token、机械臂本体状态特征直接拼接在一起）。  
>   - $\tilde{\mathbf{a}}_t$：带有 [MASK] 的动作标记序列（即长为 $L$ 的“被部分涂黑的纸带”）。  
>   - $\mathbf{Z}_{\text{in}}$ 就是把上下文和带掩码的动作拼接成一条长序列，直接喂给 Transformer。  
> - $f_\theta(\mathbf{Z}_{\text{in}})$（统一 Transformer 主干网的隐层输出）：  
>   - $f_\theta$ 表示整个 Prismatic-7B / Llama 2 骨干网络（参数为 $\theta$）。
>   - 输出结果是每个 Token 对应的高维隐层特征向量（Hidden States）。  
> - $\mathbf{W}_{\text{head}}$（共享分类头矩阵 / Action Head）：  
>   - 这是一个线性投影矩阵（Linear Projection Layer），维度为 $K \times D_{\text{hidden}}$（其中 $K = 256$ 是离散化档位数，$D_{\text{hidden}}$ 是 Transformer 的隐层特征维度）。  
>   - 它的作用是将动作位置输出的高维抽象特征映射到 256 个档位的原始 Logits 上。
> - $\text{Softmax}(\cdot)$（归一化函数）：把分类头输出的 256 个数值转换成相加等于 $1$ 的概率分布。  
> - $p_\theta(\cdot \mid \tilde{\mathbf{a}}_t, \mathbf{c})$（最终输出的概率分布）：代表在给定当前上下文 $\mathbf{c}$ 和损坏动作序列 $\tilde{\mathbf{a}}_t$ 的条件背景下，模型对动作位置填空结果的后验预测分布。  
> 
{: .prompt-info }

### 离散扩散训练目标 (Discrete Diffusion Training Objective)

训练时采样扩散时间时刻的掩码比例 $\gamma_t \sim \text{CosineSchedule}$，对动作位置施加掩码，仅对被掩码标记计算交叉熵损失（使用硬标签独热向量监督）：

$$\mathcal{L}_{\text{CE}}(\theta) = - \sum_{i \in \mathcal{M}_{\gamma_t}} \log p_\theta\left( a_{0, i} \;\middle\vert{}\; \tilde{\mathbf{a}}_t, \mathbf{c} \right)$$

* $\mathcal{M}_{\gamma_t}$：根据掩码比例 $\gamma_t$ 选中的被掩码标记索引集合（包含 $\gamma_t \times L$ 个位置）。
* 单次前向传播同时并行预测所有 $L$ 个动作位置，所有参数（VLM 骨干网与动作投影头）进行端到端更新，无辅助损失项。

### 推理流水线：自适应解码与二次重掩蔽 (Adaptive Inference & Secondary Remasking)

推理阶段从全掩码序列 $\mathbf{a}_T = [\text{MASK}]^L$（对应 $\gamma_1 = 1$）出发，执行 $T$ 轮并行细化。

在每个时间步 $t$（掩码比例由 $\gamma_t$ 余弦递减至 $\gamma_{t+1}$）：

#### 贝叶斯反向去噪核 (Bayesian Reverse Step)

对每个位置 $i \in \{1, \dots, L\}$ 计算恢复概率分布与置信度评估：

$$p_\theta(a_{t-1, i} \mid a_{t, i}, \mathbf{c}) = \begin{cases}  \delta(a_{t-1, i} = a_{t, i}), & a_{t, i} \neq \text{[MASK]} \\  \text{Categorical}\left( a_{t-1, i} \;\middle\vert{}\; \pi_\theta(i \mid \mathbf{c}) \right), & a_{t, i} = \text{[MASK]}  \end{cases}$$

设置两种自适应置信度评估指标之一：

$$\begin{aligned} & \text{最大置信度: } s_{t, i} = \max_k p_\theta(k \mid \mathbf{a}_t, \mathbf{c}) \\ & \text{置信度间隙: } g_{t, i} = p_\theta(k^{(1)} \mid \mathbf{a}_t, \mathbf{c}) - p_\theta(k^{(2)} \mid \mathbf{a}_t, \mathbf{c}) \end{aligned}$$

* $k^{(1)}, k^{(2)}$：概率最高与次高的预测标签。

#### 提交选择与 Gumbel 采样 (Commitment & Gumbel Sampling)

选取置信度评分最高的前 $(1 - \gamma_{t+1}) L$ 个位置构成已保留集合 $\mathcal{K}_t$。对该集合中的位置进行带温度衰减的 Gumbel-Max 采样以增加探索能力：

$$a_{t+1, i} \in \mathcal{K}_t \sim \text{Categorical}\left( \text{Softmax}\left( \frac{\log p_\theta(\cdot \mid \mathbf{a}_t, \mathbf{c}) + \boldsymbol{\varepsilon}}{\tau_t} \right) \right)$$

* $\boldsymbol{\varepsilon} \sim \text{Gumbel}(0, 1)$：独立同分布的 Gumbel 噪声。
* $\tau_t$：随着时间步逐步衰减的采样温度。

#### 二次重掩蔽与阈值检查 (Secondary Remasking)

为了防止早期步骤中低置信度错误标记累积传播，在提交位置集 $\mathcal{K}_t$ 上运行阈值检查：

$$\begin{aligned} & \mathcal{R}_t^{\text{abs}} = \left\{ i \in \mathcal{K}_t \;\middle\vert{}\; s_{t, i} < \eta_t^{\text{abs}} \right\} \\ & \forall i \in \mathcal{R}_t^{\text{abs}}, \quad a_{t+1, i} \leftarrow \text{[MASK]} \end{aligned}$$

* $\eta_t^{\text{abs}}$：单调递增的步长依赖门限阈值。置信度低于该阈值的已有标记将被重新重置为 `[MASK]`，供后续迭代继续优化，直到 $\gamma_T = 0$ 最终输出纯净动作块 $\mathbf{a}_0$。

