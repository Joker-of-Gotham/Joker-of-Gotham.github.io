---
title: WAM：World-Action Model
slug: wam-series
date: 2026-10-13
kind: reflection
cover: /assets/img/covers/孤独摇滚-喜多和波奇.webp
order: 15
summary: 这部分以 WAM 为主线，整理，按照世界与动作的耦合方式选择 RL 。
tags: [研究札记, WAM, 强化学习]
papers:
  - title: "World Action Models are Zero-shot Policies"
    url: "https://arxiv.org/abs/2602.15922"
    year: 2026
    venue: "arXiv"
    abstract: "DreamZero 基于视频生成先验联合预测未来观察与机器人动作，探索零样本策略泛化。"
    abstract_kind: "summary"
  - title: "Native Video-Action Pretraining for Generalizable Robot Control"
    url: "https://arxiv.org/abs/2607.08639"
    year: 2026
    venue: "arXiv"
    abstract: "LingBot-VA 2.0 面向具身控制原生预训练视频与动作模型，耦合预测与闭环执行。"
    abstract_kind: "summary"
  - title: "Cosmos 3: Omnimodal World Models for Physical AI"
    url: "https://arxiv.org/abs/2606.02800"
    year: 2026
    venue: "arXiv"
    abstract: "使用统一 Mixture-of-Transformers 架构处理语言、图像、视频、音频和动作的理解与生成。"
    abstract_kind: "summary"
  - title: "GE-Act 2.0: Pretraining and Scaling a World-Action Model for Robotic Manipulation"
    url: "https://arxiv.org/abs/2609.05588"
    year: 2026
    venue: "arXiv"
    abstract: "从操作数据出发训练世界动作模型，通过压缩表示、视觉规划与动作解码连接预测和控制。"
    abstract_kind: "summary"
  - title: "RISE: Self-Improving Robot Policy with Compositional World Model"
    url: "https://arxiv.org/abs/2602.11075"
    year: 2026
    venue: "arXiv"
    abstract: "将动力学模型与进度价值模型组合，在想象轨迹中改进独立机器人策略。"
    abstract_kind: "summary"
  - title: "Ctrl-World: A Controllable Generative World Model for Robot Manipulation"
    url: "https://arxiv.org/abs/2510.10125"
    year: 2025
    venue: "arXiv"
    abstract: "以动作条件视频世界模型模拟机器人交互，为策略评估及合成数据驱动的改进提供环境。"
    abstract_kind: "summary"
  - title: "VLAW: Iterative Co-Improvement of Vision-Language-Action Policy and World Model"
    url: "https://proceedings.mlr.press/v306/guo26i.html"
    year: 2026
    venue: "ICML"
    abstract: "交替利用真实策略轨迹改进世界模型，再使用合成轨迹提升 VLA 策略。"
    abstract_kind: "summary"
---

# 视频与动作联合生成

## DreamZero：World Action Models are Zero-shot Policies

DreamZero 是一种端到端的世界动作模型（World Action Model, WAM），旨在解决视频预测与机器人动作预测之间的模态对齐、长时域自回归推演中的复合误差累积，以及高维视频扩散模型在闭环实时控制中的极高推理延迟问题。

系统基于统一的流匹配（Flow Matching）去噪目标，在单一 DiT（Diffusion Transformer）骨干网络中**联合去噪视频帧与机器人动作**；同时利用**闭环真实观察替换 KV Cache** 机制彻底消除自回归误差累积，并结合系统级、编译器级与模型级（DreamZero-Flash）优化实现 38 倍推理加速（延迟降至 150ms / 7Hz），支持端到端实时闭环操控。

### 统一建模范式与联合预测目标 (Joint WAM Formulation)

传统的方案通常将世界模型拆分为“独立的视频预测模型”和“逆动力学模型（IDM）”，而 DreamZero 采用端到端联合分布建模：

$$\pi_0(\mathbf{o}_{l:l+H}, \, \mathbf{a}_{l:l+H} \mid \mathbf{o}_{0:l}, \, \mathbf{c}, \, \mathbf{q}_l) = \underbrace{\pi_0(\mathbf{o}_{l:l+H} \mid \mathbf{o}_{0:l}, \, \mathbf{c}, \, \mathbf{q}_l)}_{\text{视频生成}} \cdot \underbrace{\pi_0(\mathbf{a}_{l:l+H} \mid \mathbf{o}_{0:l+H}, \, \mathbf{q}_l)}_{\text{逆动力学动作预测}}$$

#### 输入与模态 Token 化 (Input Tokenization)

对于给定的轨迹，随机采样起始索引 $l$ 与固定预测视界 $H$：
* $\mathbf{c}$：自然语言任务指令。
* $\mathbf{q}_l$：机器人 $l$ 时刻的本体感觉状态（Proprioceptive State）。
* $\mathbf{o}_{0:l}$：历史及当前视觉观察帧（多视角图像直接拼接为单帧，保留原始采样帧率）。
* $\mathbf{o}_{l:l+H}$：未来 $H$ 步待预测的连续 RGB 视频帧。
* $\mathbf{a}_{l:l+H}$：未来 $H$ 步待预测的归一化机器人动作 Chunk。

#### 块级（Chunk-wise）自回归流匹配损失 (Flow-Matching Objective)

视频帧和动作被切分为固定包含 $K$ 个 Latent 帧的 Chunk。在训练时，对于第 $k$ 个 Chunk，加噪时间步 $t_k \in [0, 1]$ 定义了干净数据 $\mathbf{z}_1^k, \mathbf{a}_1^k$ 与高斯噪声 $\mathbf{z}_0^k, \mathbf{a}_0^k \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$ 之间的线性插值路径：

$$\mathbf{z}_{t_k}^k = t_k \mathbf{z}_1^k + (1 - t_k) \mathbf{z}_0^k, \quad \mathbf{a}_{t_k}^k = t_k \mathbf{a}_1^k + (1 - t_k) \mathbf{a}_0^k$$

基于 Teacher Forcing 模式，模型 $\mathbf{u}_\theta$ 在当前第 $k$ 个带噪 Chunk 上接收历史无噪 Chunk 上下文 $\mathcal{C}_k = \{ (\mathbf{z}_1^j, \mathbf{a}_1^j) \}_{j=1}^{k-1}$，预测联合速度向量 $\mathbf{v}_k = [\mathbf{z}_1^k, \mathbf{a}_1^k] - [\mathbf{z}_0^k, \mathbf{a}_0^k]$：

$$\mathcal{L}(\theta) = \mathbb{E}_{\mathbf{z}, \mathbf{a}, \{t_k\}} \left[ \frac{1}{K} \sum_{k=1}^K w(t_k) \left\Vert{} \mathbf{u}_\theta\left( [\mathbf{z}_{t_k}^k, \mathbf{a}_{t_k}^k], \, \mathcal{C}_k, \, \mathbf{c}, \, \mathbf{q}_k, \, t_k \right) - [\mathbf{z}_1^k - \mathbf{z}_0^k, \, \mathbf{a}_1^k - \mathbf{a}_0^k] \right\Vert{}_2^2 \right]$$

* $w(t_k) > 0$：去噪时间步加权函数。同一 Chunk 内的所有视频帧和动作共享相同的时间步 $t_k$。

### 闭环 KV Cache 真实观察替换机制 (Closed-Loop KV Cache Rollout)

在长时域自回归推演中，传统视频生成模型会因为将上一轮生成的非完美预测帧作为后续输入的上下文，导致复合误差（Compounding Error）迅速积累。

DreamZero 利用机器人**闭环控制（Closed-Loop Control）**的独特性解耦了该难题：

1. **并行采样与动作下发**：在时间步 $k$，模型同时去噪生成未来视频 Chunk $\hat{\mathbf{z}}^k$ 与动作 Chunk $\hat{\mathbf{a}}^k$。
2. **底层控制器执行**：下发动作 Chunk $\hat{\mathbf{a}}^k$ 至底层硬件控制器执行。
3. **真实观察回填 (Ground-Truth KV Swap)**：在下一个控制周期到来时，直接使用机器人相机采集到的**真实视觉观察帧 $\mathbf{z}_{1, \text{real}}^k$ 强制替换**掉 KV Cache 中先前模型自我生成的预测帧 $\hat{\mathbf{z}}^k$。
4. **彻底消除漂移**：此举从根本上阻断了生成的视频噪声沿时间轴累积，使模型既能利用 KV Cache 实现单次前向传导的高效推演，又拥有绝对稳定、无漂移的历史上下文。

### 模型级加速：DreamZero-Flash 解耦噪声采样 (Decoupled Noise Schedules)

为了在极步数（如 1 步去噪）推理下避免视频残留噪声破坏动作预测质量，系统引入 DreamZero-Flash 训练阶段。

#### 训练与推断下的模态噪声失配

在少步或单步去噪推理（Few-step / Single-step Inference）制度下，生成的视频 Token 仍然保持高噪声水平，但动作输出必须被推演至完全无噪的干净状态。标准 DreamZero 让视频与动作共享相同的 $t_k \sim \mathcal{U}(0, 1)$，导致“模型仅学过在视频与动作处于同等噪声水平下预测动作”，产生了训练-测试分布漂移。

#### 解耦 Beta 分布噪声采样

DreamZero-Flash 在主模型训练完成后，冻结部分层或继续微调，对视频与动作施加解耦的加噪采样：

* **动作加噪时间步**：维持均匀采样 $t_k^{\text{action}} \sim \mathcal{U}(0, 1)$。
* **视频加噪时间步**：通过 Beta 分布大幅偏向高噪声状态（即极低 $t$ 值）：
  
  $$t_k^{\text{video}} = 1 - \eta, \quad \eta \sim \text{Beta}(\alpha, \beta), \quad \alpha = 7, \, \beta = 1 \implies \mathbb{E}[t_k^{\text{video}}] = 0.125$$

这强制模型学习“**如何从极其杂乱、未完全去噪的视觉上下文条件中，一次性精确预测出干净可执行的控制动作**”，成功将去噪步数从 16 步/4 步压缩至 1 步，且无动作质量损失。

### 系统与工程级极速推演管线 (Real-Time Control Pipeline)

为了消除 14B 参数 DiT 模型的 5.7 秒原生推演延迟，DreamZero 整合了全栈部署加速技术。

#### 异步闭环控制框架 (Asynchronous Closed-Loop Execution)

将模型推理过程与机器人底层的运动控制解耦。底层控制器以 30Hz 频率持续平滑执行上一次生成的动作 Chunk（视界长度为 48 步，约 1.6 秒），而 DreamZero 运行在独立的后台 GPU 上。

只要模型单次推演延迟小于 200ms，即可保证在动作 Chunk 耗尽前平滑衔接下一个 Chunk，实现零卡顿实时控制。

#### 全栈硬件加速级联逻辑

极速推理管线包含以下层层递进的工程优化技术：

1. **CFG 双卡并行 (CFG Parallelism)**：Classifier-Free Guidance 需要无条件与有条件两次前向传播。将其分配至 2 张 GPU 上并行计算，延迟降低 47%。
2. **DiT 速度 Cache (DiT Caching)**：监控相邻流匹配步骤间预测速度矢量的余弦相似度，若相似度高于门限值则直接复用上一步速度，将去噪步数从 16 步等效降至 4 步。
3. **NVFP4 混合后量化 (Post-Training Quantization)**：在 Blackwell 架构上，将权重与激活转换为 NVFP4 格式，敏感算子（QKV、Softmax）保留在 FP8，非线性算子保留在 FP16。
4. **CUDA Graphs & cuDNN 内核**：使用 `torch.compile` 与静态 CUDA Graphs 消除 CPU-GPU 同步及开销，内核全部转移至 GPU 侧调度。
5. **单步去噪模型 (DreamZero-Flash)**：结合 Flash 解耦训练，在 150ms 延迟内完成单步流匹配计算。
6. **动作轨迹平滑 (Action Chunk Smoothing)**：对输出的动作 Chunk 进行 2 倍过采样，应用 Savitzky-Golay 滤波器消除高频噪点抖动，降采样后下发给电机执行（支持 7Hz 决策与 30Hz 控制）。

## LingBot-VA 2.0：Native Video-Action Pretraining for Generalizable Robot Control

LingBot-VA 2.0 放弃了对通用非因果视频生成模型的简单二次微调，通过构建**原生视动作 Tokenizer（Semantic Visual-Action Tokenizer）**与**稀疏混合专家（Sparse MoE）DiT 骨干网络**，在统一的语义潜在空间中实现了长视域高层 VLM 规划与低层闭环控制的端到端原生协同。

系统由**语义视动作 Tokenizer**、**分层 VLM 规划器 (Hierarchical Planner)**、**MoE 视动作扩散骨干网络**、**多块特征预测 (Multi-Chunk Prediction, MCP)**、**上下文视频学习 (In-context Learning)** 以及 **人机共训 (Human-Robot Co-training)** 六大核心模块组成。

### 第一阶段：语义视动作 Tokenizer (Semantic Visual-Action Tokenizer)

不同于仅优化像素重构的离散 VAE，LingBot-VA 2.0 在第一阶段联合优化图像重构、语义特征对齐与无监督隐动作提取，输出对齐的视动作隐码对 $(\mathbf{z}_{0:N}, \boldsymbol{\ell}_{0:N-1})$。

#### 视觉 Token 化与感知语义对齐 (Visual Tokenization)

ViT 自编码器将首帧图像编码为 $16 \times 16$ 空间 Patch，后续帧编码为 $4 \times 16 \times 16$ 时空 Tubelets，经过编码器 $\mathcal{E}$ 输出视觉潜在隐码 $\mathbf{z} = \mathcal{E}(\mathbf{o})$。重构损失结合像素 $L_1$、感知 LPIPS 与 GAN 对抗损失：

$$\mathcal{L}_{\text{rec}} = \lambda_1 \Vert{}\mathbf{o} - \hat{\mathbf{o}}\Vert{}_1 + \lambda_{\text{perc}} \mathcal{L}_{\text{perc}}(\mathbf{o}, \hat{\mathbf{o}}) + \lambda_{\text{gan}} \mathcal{L}_{\text{gan}}(\hat{\mathbf{o}})$$

为了赋予隐码物理语义，引入冻结的视觉基础大模型 $G$（Perception Encoder）作为 Teacher。使用可学习投影矩阵 $\mathbf{W}_{\text{align}}$ 对齐时域均值池化（Average Pooling）后的语义特征：

$$\mathcal{L}_{\text{align}} = \left\Vert{} \text{avg}\left(\mathbf{W}_{\text{align}} \mathbf{z}\right) - \text{avg}\left(G(\mathbf{o})\right) \right\Vert{}_2^2$$

$$\mathcal{L}_{\text{vis}} = \mathcal{L}_{\text{rec}} + \lambda_{\text{align}} \mathcal{L}_{\text{align}}$$

#### 隐动作 Token 化 (Latent Action Tokenization)

在冻结视觉 Tokenizer 后，无须依赖显式动作标签，通过逆动力学模型（IDM） $q_\phi$ 与正动力学模型（FDM） $f_\psi$ 从连续隐帧转移中自监督提取压缩的隐动作 $\boldsymbol{\ell}_t$（维度 $d_\ell \ll \text{dim}(\mathbf{z}_t)$）：

$$\boldsymbol{\ell}_t = q_\phi(\mathbf{z}_t, \mathbf{z}_{t+1})$$

$$\hat{\mathbf{z}}_{t+1} = f_\psi(\mathbf{z}_t, \boldsymbol{\ell}_t) = \mathbf{K}_t \mathbf{z}_t + \boldsymbol{\delta}_t$$

* $\mathbf{K}_t$：空间 Token 映射传输阵；$\boldsymbol{\delta}_t$：无法被空间传输解释的残差变化量。
* 反向传输模型 $\bar{f}_\psi$ 同时重构前一步隐码 $\hat{\mathbf{z}}_t = \bar{f}_\psi(\mathbf{z}_{t+1}, \boldsymbol{\ell}_t)$，总隐动作损失为 $\mathcal{L}_\ell = \sum_t \left( \Vert{}\hat{\mathbf{z}}_{t+1} - \mathbf{z}_{t+1}\Vert{}_2^2 + \Vert{}\hat{\mathbf{z}}_t - \mathbf{z}_t\Vert{}_2^2 \right)$。最终设置 $\mathbf{a}_t \equiv \boldsymbol{\ell}_t$。

### 第二阶段：分层 VLM 规划器 (Hierarchical VLM Planner)

针对长程操控任务，高层规划器由微调的 Vision-Language Model (VLM) 担当，运行于约 2Hz 的异步共享缓冲区中，解耦于低层闭环控制策略。

#### 结构化输出与边界跨越采样 (Boundary-Crossing Sampling)

高层规划器接收图像帧序列与任务目标，输出包含 `done`（子任务完成标记）、`instruction`（紧凑控制指令）、`generation_instruction`（动作执行细化描述）与 `local_scene_description`（场景几何约束）的结构化 JSON。

训练采样采用**边界跨越采样**策略：
1. **子任务内部采样 (`done = false`)**：观察时间 $t^*$ 落于当前片段内部，目标为当前片段的指导字段。
2. **子任务边界跨越采样 (`done = true`)**：观察时间 $t^*$ 刚越过片段边界，目标直接预测下一个子任务片段的指导字段。

### 第二阶段：低层 MoE 视动作扩散网络 (MoE Video-Action Policy)

低层策略基于双专家 Transformer（Mixture-of-Transformers, MoT）架构，包含视频专家 $v_\theta^{\text{vid}}$ 与动作专家 $v_\theta^{\text{act}}$，共享因果自注意力层（Causal Self-Attention）。

#### 稀疏混合专家视频流 (Sparse MoE Video Stream)

由于视觉动力学建模占据主要计算开销，视频专家采用 DeepSeekMoE 风格的稀疏 MoE 替代传统 FFN 层，动作专家保留密集层（Dense）。

对于隐层 Token $\mathbf{h} \in \mathbb{R}^d$，路由门控矩阵计算 Top-$k$ 分组路由得分：

$$r_i(\mathbf{h}) = \sigma(\mathbf{g}_i^\top \mathbf{h}), \quad i \in \{1, \dots, N_e\}$$

$$\mathcal{R}(\mathbf{h}) = \text{TopK}_{\text{group}}\left(r(\mathbf{h}) + \mathbf{b}, \, k\right)$$

$$\alpha_i(\mathbf{h}) = \frac{\gamma r_i(\mathbf{h})}{\sum_{j \in \mathcal{R}(\mathbf{h})} r_j(\mathbf{h})}$$

$$\text{MoE}(\mathbf{h}) = \mathbf{E}_{\text{shared}}(\mathbf{h}) + \sum_{i \in \mathcal{R}(\mathbf{h})} \alpha_i(\mathbf{h}) \mathbf{E}_i(\mathbf{h})$$

* $N_e = 128$（路由专家总数），$k = 8$（激活专家数），$\mathbf{E}_{\text{shared}}$ 为共享专家。
* **无损失负载均衡 (Loss-Free Balancing)**：根据每个优化步后专家分配到的 Token 计数 $c_i$，通过偏置更新 $\mathbf{b}_i \leftarrow \mathbf{b}_i - \eta_{\text{lb}} (v_i - \frac{1}{N_e}\sum v_j)$ 动态调整选择偏置，避免引入对抗梯度的 Auxiliary Loss。

#### 多块特征预测 (Multi-Chunk Prediction, MCP)

为了解决传统 Teacher Forcing 训练中策略“仅靠复制前帧局部外观即可降低 Loss”的短视（Myopic）问题，模型挂载 $K=3$ 个轻量级 MCP 辅助模块，强制当前隐状态表征预测未来连续 3 个 Chunk 的演化：

$$\mathcal{L}_k^{\text{MCP}} = \mathbb{E}_{t, s, \epsilon_t^k} \left[ \left\Vert{} v_{\theta, k}^{\text{MCP}}\left(\mathbf{z}_{t+k}(s), s \;\middle\vert{}\; \mathbf{h}_t^{(k-1)}\right) - (\mathbf{z}_{t+k} - \epsilon_t^k) \right\Vert{}_2^2 \right]$$

$$\mathcal{L}_{\text{MCP}} = 0.5 \mathcal{L}_1^{\text{MCP}} + 0.2 \mathcal{L}_2^{\text{MCP}} + 0.1 \mathcal{L}_3^{\text{MCP}}$$

* 部署时，MCP 模块可直接丢弃实现零开销推理，或保留用于并行生成未来 Chunk 降低推演延迟。

### 上下文视频学习与人机共训 (ICL & Human-Robot Co-training)

#### 视频上下文学习 (In-context Learning, ICL)

将语义对齐的人类演示视频通过 Tokenizer 编码为上下文隐码 $\mathbf{z}_{\text{icl}}$。在预测机器人未来的视频与动作时，将 $\mathbf{z}_{\text{icl}}$ 作为全时域可感知的条件 Prompt 注入：

$$p_\theta(\mathbf{z}_{t+1} \mid \mathbf{z}_{\le t}, \mathbf{a}_{< t}, \mathbf{z}_{\text{icl}}), \quad p_\theta(\mathbf{a}_t \mid \mathbf{z}_{\le t}, \mathbf{a}_{< t}, \mathbf{z}_{t+1}, \mathbf{z}_{\text{icl}})$$

#### 人机双域共享共训 (Human-Robot Co-training)

针对人类手部与机器人夹爪间的动作空间与运动学不匹配，通过正向运动学将人类手部 3D 指尖距离重定向为标量虚拟夹爪开合度 $\phi(q)$，形成统一动作空间 $\mathcal{A}$：

$$\mathbf{a}_H = \Phi(\tilde{\mathbf{a}}_H) \in \mathcal{A}$$

机器人数据集 $\mathcal{D}_R$ 与人类数据集 $\mathcal{D}_H$ 共享世界模型骨干网（包含 $v_{\text{vid}}$ 与 $v_{\text{act}}$），仅在末端挂载特定领域的动作编码器 $E_d$ 与解码器 $P_d$ ($d \in \{R, H\}$)：

$$\hat{\mathbf{a}}_t^{(d)} = P_d\left( v_{\text{act}}\left( \mathbf{z}_{\le t}, \, E_d(\mathbf{a}_{< t}), \, \hat{\mathbf{z}}_{t+1} \right) \right)$$

$$\mathcal{L}_{\text{co-train}} = \mathbb{E}_{\mathcal{D}_R}[\mathcal{L}_{\text{vid}} + \mathcal{L}_{\text{act}}^R] + \mathbb{E}_{\mathcal{D}_H}[\mathcal{L}_{\text{vid}} + \mathcal{L}_{\text{act}}^H]$$

部署时直接丢弃人类分支 $(E_H, P_H)$，零推理开销继承人类海量数据的物理演化先验。

### 多任务联合预训练配方 (Multi-Task Training Recipe)

为防止逐步迁移训练导致早期视觉物理先验发生灾难性遗忘，系统采用全流程多任务联合共训，动态调整任务采样概率分布 $\pi(\tau)$：

$$\mathcal{L}(\tau) = \pi_{\text{T2I}}(\tau) \mathcal{L}_{\text{T2I}} + \pi_{\text{T2V}}(\tau) \mathcal{L}_{\text{T2V}} + \pi_{\text{TI2VA}}(\tau) \mathcal{L}_{\text{TI2VA}} + \pi_{\text{ICL}}(\tau) \mathcal{L}_{\text{ICL}} + \pi_{\text{HCT}}(\tau) \mathcal{L}_{\text{HCT}}$$

1. **早期阶段 ($\tau \to 0$)**：重点采样文本到图像（T2I），建立高保真视觉语义对齐。
2. **中期阶段**：重点采样文本到视频（T2V），巩固通用时域运动物理先验。
3. **后期阶段 ($\tau \to 1$)**：集中采样文本-图像到视动作（TI2VA）、上下文视频学习（ICL）与人机共训（HCT），完成具体闭环控制技能的特化。

### 视界前瞻推理 (Foresight Reasoning)

传统串行推理/执行流（Serial Stream）具有自我阻塞性：模型必须等待上一动作完全执行且新的环境观察返回后，才能开始下一个 Chunk 的去噪推演，使得模型延迟直接转化为控制延迟。

Foresight Reasoning 将闭环 Rollout 解耦为**快预测流 (Prediction Stream)** 与 **慢执行流 (Execution Stream)** 两个因果耦合的异步流。

#### 异步预测与 FDM 隐空间预演

在机器人于真实世界中执行动作 Chunk $\mathbf{a}_t$ 的同时，预测流提前准备下一个动作 Chunk $\mathbf{a}_{t+1}$：

1. **临时上下文组装**：将当前正在执行的 $\mathbf{a}_t$ 追加到基于真实反馈建立的最新 KV Cache $\mathcal{C}_t$（总结了真实观察历史 $\mathbf{z}_{\le t}, \mathbf{a}_{< t}$）中，得到临时上下文 $\mathcal{C}_{\text{tmp}} = \mathcal{C}_t \cup \{\mathbf{a}_t\}$。
2. **策略内部 FDM 正向动力学预测**：直接由策略网络自身的视频专家（非 Tokenizer 冻结的 FDM）在线运行正向动力学传导，想象当前动作下产生的视觉结果 $\hat{\mathbf{z}}_{t+1}$：

$$\hat{\mathbf{z}}_{t+1} = \text{FDM}_\theta(\mathcal{C}_t \cup \{\mathbf{a}_t\}) = v_\theta^{\text{vid}}(\mathbf{z}_{\le t}, \mathbf{a}_{\le t})$$

3. **预先解码下一个动作**：动作专家从 $\mathcal{C}_{\text{tmp}} \cup \{\hat{\mathbf{z}}_{t+1}\}$ 中事先解码出下一个动作 Chunk $\mathbf{a}_{t+1}$。在 $\mathbf{a}_t$ 执行完成的瞬间，$\mathbf{a}_{t+1}$ 已准备就绪，实现零停顿衔接。

#### 真实观察强制重锚定 (Re-grounding) 与 FDM 训练损失

若预测流持续将自身生成的 $\hat{\mathbf{z}}_{t+1}$ 喂回上下文，会导致开环漂移与视觉幻觉。因此，**每当真实的物理观察返回时，系统进行强制重锚定**：

1. **真实隐码覆盖**：返回的真实图像被编码为真实隐码 $\mathbf{z}_{t+1}$，**强行覆盖**掉 KV Cache 中预演的过期隐码 $\hat{\mathbf{z}}_{t+1}$ 及执行动作 $\mathbf{a}_t$。
2. **重锚定缓存 $\mathcal{C}_{t+1}$**：下一轮预测基于纠偏后的真实缓存 $\mathcal{C}_{t+1}$ 重新展开，形成“**预演-校正 (Predict-then-Correct)**”闭环。

在 Post-training 阶段，专门引入**正向动力学接地损失 (FDM Grounding Loss)**，输入包含当前执行动作 $\mathbf{a}_{\le t}$：

$$\mathcal{L}_{\text{FDM}} = \mathbb{E}_{t, s, \epsilon} \left[ \left\| v_\theta^{\text{vid}}\left( \mathbf{z}_{t+1}(s), s \;\middle|\; \mathbf{z}_{\le t}, \mathbf{a}_{\le t} \right) - (\mathbf{z}_{t+1} - \epsilon) \right\|_2^2 \right]$$

### 扩散一致性蒸馏 (Diffusion Consistency Distillation)

为了将采样步数从原始教师模型的 5 步（视频）与 10 步（动作）压缩至极低步数，模型被蒸馏为**一致性模型 (Consistency Model)**。

一致性模型 $f_\xi(x(s), s)$ 将概率流 ODE（PF-ODE）轨迹上的任意点直接映射至干净终点，满足自一致性 $f_\xi(x(s), s) = f_\xi(x(s'), s')$。

定义 $x(s_n) = (1 - s_n)\epsilon + s_n x$。通过冻结的教师模型 $v_\theta$ 进行单步欧拉更新得到前进点 $\hat{x}(s_{n+1}) = x(s_n) + (s_{n+1} - s_n) v_\theta(x(s_n), s_n)$，一致性蒸馏损失为：

$$\mathcal{L}_{\text{CD}} = \mathbb{E}_{x, \epsilon, n} \left[ d\left( f_\xi\left(x(s_n), s_n\right), \, f_{\xi^-}\left(\hat{x}(s_{n+1}), s_{n+1}\right) \right) \right]$$

* $\xi^-$：目标网络的指数移动平均（EMA）参数。
* 蒸馏后，视频专家与动作专家均降至 **2 步去噪采样**（每次生成仅需 2 次前向计算）。

### 全栈闭环推理部署加速 (Inference Acceleration)

全栈部署加速覆盖模型级、序列级与系统级三个维度：

#### 模型级：低精度编译执行 (Model-Level TensorRT & FP8)

1. **TensorRT 计算图编译**：通过 ONNX 将 PyTorch 计算图转译为 TensorRT 引擎，融合兼容算子。KV Cache 显式定义为引擎的输入/输出张量。
2. **NVFP4/FP8 混合精度**：使用 NVIDIA Model Optimizer 插入 FP8 量化节点。DiT Transformer Block 内部的线性层运行于 FP8 精度，首尾层及敏感算子保留 BF16。

#### 序列级：长时域 Attention 优化 (Sequence-Level FlashInfer)

1. **分页/不规整 KV Cache (Paged/Ragged KV Cache)**：基于滑动窗口预分配内存缓冲，按 Page 动态管理历史 Token，消除长时域自回归填充（Padding）与内存复制开销。
2. **FlashInfer 内核插件**：替代通用 TensorRT Attention 子图，直接在 Paged KV Cache 上执行高效 Attention 计算。

#### 系统级：运行时开销消除 (System-Level Amortization)

预先缓存 TensorRT 绑定与形状配置，预计算 Cross-Attention 状态，跳过重复的 Host 端准备，并彻底移除推理路径上的 CPU-GPU 显式同步点，实现真正的实时闭环控制。

## Cosmos 3: Omnimodal World Models for Physical AI

Cosmos 3 是一种统一的全模态生成式世界模型（支持语言、视觉、音频与机器人动作），将动作（Action）提升为一等模态（First-Class Modality）。

系统利用独立模态编码器将异构输入投射至统一表征空间，结合**双塔 Mixture-of-Transformers (MoT)** 架构、**物理时间对齐的 3D MRoPE** 位置编码以及**域感知动作投影（Domain-Aware Action Projections）**，在一套网络中同时支持高层语言推理、多模态视频/音频生成、正/逆动力学建模与闭环 Policy 决策。

### 统一异构模态编码器 (Modality-Specific Encoders)

系统通过特定的预训练或冻结编码器将多源异构模态转化为统一隐向量，并在输入 MoT 骨干网前叠加可学习的模态偏置向量（Modality-Specific Embedding）。

#### 视觉双通道编码 (Image & Video)

* **理解通道 (Understanding Path)**：采用与视觉-语言对齐的 ViT 编码器（Patch 大小 $16 \times 16$，后接 2 层 MLP 融合 $2 \times 2$ Tokens）。借助 DeepStack 结构聚合 ViT 特征，并将包含绝对时间的文本视频时间戳交错插入图像帧之间。训练期间与骨干网联合微调。
* **生成通道 (Generation Path)**：采用 Wan2.2-TI2V-5B 视频 VAE 编码器，实现时间维度 4 倍、空间维度 $32 \times 32$（$16 \times 16$ 空间压缩加 $2 \times 2$ Patch 融合）压缩。经线性投影至隐层维度，训练时**全程冻结**。

#### 物理音频编码 (Audio)

使用冻结的音频 VAE，将 48kHz 立体声原始波形以 1920 个 Sampling Hop 编码，生成每秒 25 个 Token 的音频隐表征，线性投影后送入 MoT。

#### 统一动作表征与域感知 Token 化 (Unified Action Vector & Domain Projections)

为了屏蔽底层 PID 参数或硬件驱动差异，动作被抽象为“诱发世界状态改变的伪动作（Pseudo-Actions）”。

**几何姿态与夹爪状态分解**

给定连续时刻的 SE(3) 姿态 $\mathbf{T}_{t-1}$ 与 $\mathbf{T}_t$，运动被表示为相对变换 $\Delta \mathbf{T}_t = \mathbf{T}_{t-1}^{-1} \mathbf{T}_t$。旋转采用 Zhou 等人提出的 6D 连续旋转表征（OpenCV 坐标系，Z 轴沿夹爪/指尖朝向，X 轴向右），平移采用 3D 向量。

动作向量在结构上解耦为三部分：
1. **主观察帧位姿变化 (Ego Poses)**：自动驾驶车辆/相机/头部摄像头的相对位姿变化 $\Delta \mathbf{T}_t^{\text{ego}}$。
2. **末端执行器位姿变化 (Effector Poses)**：机器人末端法兰或人类手腕的相对位姿变化 $\Delta \mathbf{T}_t^{\text{eff}}$。
3. **抓握状态 (Grasp States)**：**直接编码当前时刻 $t$ 的状态**（而非时间差分）。机器人采用连续夹爪开合度值，人类手部采用手腕坐标系下的指尖 3D 坐标。

**域感知投影 (Domain-Aware Input/Output Projections)**

针对不同具身领域 $k \in \{1, \dots, K\}$（如自动驾驶、双臂机器人、人眼视角手套），采用领域专属的线性投影层映射至统一维度 $d_{\text{model}}$，共享 MoT 骨干网络参数：

$$\mathbf{z} = \mathbf{W}_{\text{in}}^{(k)} \mathbf{x} + \mathbf{b}_{\text{in}}^{(k)}, \quad \mathbf{x} \in \mathbb{R}^{d_{\text{in}}^{(k)}}, \quad \mathbf{z} \in \mathbb{R}^{d_{\text{model}}}$$

$$\hat{\mathbf{x}} = \mathbf{W}_{\text{out}}^{(k)} \mathbf{z} + \mathbf{b}_{\text{out}}^{(k)}$$

* 预测出的 6D 旋转通过 SVD 奇异值分解还原为 $3 \times 3$ SO(3) 旋转矩阵。

### Token 排列与生成模式 (Token Arrangement & Generation Modes)

打包后的 Token 序列分为两个连续子序列：**自回归 (Autoregressive, AR) 子序列** 与 **扩散 (Diffusion, DM) 子序列**。

#### 序列打包格式 (Token Arrangement)

1. **AR 子序列在前**：包含文本 Token 及 ViT 编码的图像/视频理解 Token，路由至 Reasoner 塔，末尾由 `<EOS>` 与 `<BOG>`（Begin-of-Generation）特殊 Token 标识。
2. **DM 子序列在后**：包含 VAE 编码的视觉、音频与动作 Token。干净条件 Token 摆放在带噪目标 Token 之前。内部按 **Vision $\to$ Audio $\to$ Action** 的模态顺序排列。

#### 多范式动作生成模式 (Action Modes)

通过控制 DM 子序列中 Vision Token $\mathbf{v}$ 与 Action Token $\mathbf{a}$ 的带噪/干净状态（$\tilde{\mathbf{v}}$ 与 $\tilde{\mathbf{a}}$ 为对应带噪状态），实现三种控制模式：

* **正向动力学 (Forward Dynamics)**：根据干净动作预测未来视觉隐状态。
  
  $$\mathbf{S}_{\text{FWD}} = \left[ \mathbf{S}_{\text{AR}}, \, \mathbf{v}_{1:t-1}, \, \mathbf{a}_{1:t}, \, \tilde{\mathbf{v}}_{t:N} \right]$$

* **逆动力学 (Inverse Dynamics)**：根据已观测到的连续视觉演化反推解释动作。
  
  $$\mathbf{S}_{\text{INV}} = \left[ \mathbf{S}_{\text{AR}}, \, \mathbf{v}_{1:N}, \, \tilde{\mathbf{a}}_{1:N} \right]$$

* **联合视动作 Policy 模式 (Policy Mode)**：同时去噪预测未来动作与对应产生的视觉演化。
  
  $$\mathbf{S}_{\text{Policy}} = \left[ \mathbf{S}_{\text{AR}}, \, \mathbf{v}_{1:t-1}, \, \tilde{\mathbf{v}}_{t:N}, \, \tilde{\mathbf{a}}_{t:N} \right]$$

### 双塔 Mixture-of-Transformers (MoT) 架构与双流联合注意力

在 Decoder 层级别，Cosmos 3 包含两套独立的参数塔：**推理塔 (Reasoner Tower)** 与 **生成塔 (Generator Tower)**，均初始化自预训练 VLM，但在 Self-Attention 层面进行**双流联合注意力 (Dual-Stream Joint Attention)** 交互。

#### 独立参数路由 (Dual-Tower Parameter Routing)

AR 子序列路由至 Reasoner 塔（包含专属 LayerNorm、QKV 投影与 FFN），负责文本生成与高层语义理解；DM 子序列路由至 Generator 塔，负责流匹配去噪生成。

#### 双流联合注意力机制 (Dual-Stream Joint Attention)

定义 AR 与 DM 子序列的 Query、Key、Value 为 $\mathbf{Q}_{\text{AR}}, \mathbf{K}_{\text{AR}}, \mathbf{V}_{\text{AR}}$ 及 $\mathbf{Q}_{\text{DM}}, \mathbf{K}_{\text{DM}}, \mathbf{V}_{\text{DM}}$：

* **AR 子序列因果注意力**：仅在 AR 内部执行因果 Self-Attention，保证文本生成能力不被干扰：
  
  $$\mathbf{O}_{\text{AR}} = \text{Attn}_{\text{causal}}\left( \mathbf{Q}_{\text{AR}}, \, \mathbf{K}_{\text{AR}}, \, \mathbf{V}_{\text{AR}} \right)$$

* **DM 子序列全向联合注意力**：DM Tokens 执行全双向 Attention，将 AR 的 Key/Value 与 DM 的 Key/Value 拼接作为条件参照：
  
  $$\mathbf{O}_{\text{DM}} = \text{Attn}_{\text{full}}\left( \mathbf{Q}_{\text{DM}}, \, [\mathbf{K}_{\text{AR}} ; \mathbf{K}_{\text{DM}}], \, [\mathbf{V}_{\text{AR}} ; \mathbf{V}_{\text{DM}}] \right)$$

* **因果单向隔离**：DM 信息**严禁反向传导**至 AR 塔（即 AR 的 Output 运算完全不依赖 DM 节点），确保条件控制链的因果完整性。

### 物理时间对齐的 3D 多模态旋转位置编码 (3D MRoPE & Temporal Modulation)

为了解决视频（如 24/60 FPS）、音频（25 TPS）与动作（如 20/50Hz）在采样率不一致时产生的时域错位问题，扩展了 3D MRoPE 编码，建立统一的物理时间轴。

#### 坐标分配与 AR/DM 模态时间间隔 (Margin Gap)

每个 Token 分配三维坐标 $(t, h, w)$：
* **文本 Token**：$t = h = w$，退化为 1D RoPE。
* **视觉 Token**：$t$ 随 Latent 帧索引递增，$(h, w)$ 平铺空间网格。
* **音频/动作 Token**：仅带有时间坐标 $t$，空间坐标固定为 $h = w = 0$。

为了消除首帧视频 Token 与末尾文本 Token 离散索引相邻产生的重叠伪影（Checkerboard Artifacts），在 AR 子序列与 DM 子序列之间强制插入固定时间缓冲间隔：

$$\Delta t_{\text{gap}} = 15000$$

所有 DM Tokens 的时间坐标 $t$ 统一在 AR 末尾 offset 基础上叠加 $\Delta t_{\text{gap}}$。

### 帧率调制与物理时间对齐 (Absolute Temporal Modulation)

定义物理时间步分辨率 TPS（Temporal Steps per Second）。视频的 $\text{TPS}_{\text{video}} = \text{FPS} / 4$（4 为 VAE 时域压缩比）；音频 $\text{TPS}_{\text{audio}} = 48000 / 1920 \approx 25$；动作 $\text{TPS}_{\text{action}}$ 为采样频率。

设置基准物理分辨率 $\text{TPS}_{\text{base}} = 24 / 4 = 6$（以 24 FPS 视频为基准）。当离散 Token 索引增长 1 步时，实际赋予 3D MRoPE 的物理时间增量 $\delta t$ 调制为：

$$\delta t = \frac{\text{TPS}_{\text{base}}}{\text{TPS}}$$

这确保了不同采样频率的模态在绝对物理时间轴上实现真正的尺度对齐。

# 视频 WM + 耦合式 Actor (GE-Act 2.0: Pretraining and Scaling a World-Action Model for Robotic Manipulation)

GE-Act 2.0 是一种面向具身智能（Embodied AI）的世界动作模型（World-Action Model, WAM），旨在解决传统模型高度依赖预训练非因果视频生成基座所带来的**隐空间 Token 冗余**、**视觉重构与控制任务失配**以及**多步扩散生成无法高效回传动作梯度**等根本痛点。

系统打破了“二次微调已有视频扩散大模型”的常规路径，除了 control-oriented 图像自编码器（CoAE）外，**从头（From Scratch）随机初始化训练**单步视觉规划器（Single-Step Visual Planner, SVP）与逆动力学模型（Inverse Dynamics Model, IDM），并通过**知识对齐选择性优化 (KASO)** 解决了端到端联合训练中的“有效性鸿沟 (Validity Gap)”问题。

整个系统由 **CoAE 极度压缩控制隐空间**、**SVP 单步 MeanFlow 视觉规划器**、**IDM 逆动力学模型** 以及 **KASO 端到端对齐机制** 四大核心部分构成。

## 模块一：面向控制的极度压缩自编码器 (CoAE)

传统视频自编码器（如 Wan2.2）通常仅在空间轴上下采样 8× 或 16×，产生庞大的 Token 数量，给闭环控制带来极大的推理负担。CoAE 实现了 **64× 空间下采样**（将 $256 \times 384$ 分辨率图像映射为仅 $4 \times 6 = 24$ 个 Token），同时保证控制语义与物理变化不丢失。

### 多 Teacher 语义与密集特征对齐

定义单帧图像为 $\mathbf{o}$，Encoder 映射为隐状态 $\mathbf{z} = \mathcal{E}(\mathbf{o}) \in \mathbb{R}^{24 \times 512}$。Decoder 重构图像 $\hat{\mathbf{o}} = \mathcal{D}(\mathbf{z})$。重构损失结合像素 MSE、感知 LPIPS 与 GAN 对抗损失：

$$\mathcal{L}_{\text{rec}} = \|\hat{\mathbf{o}} - \mathbf{o}\|_2^2 + \lambda_{\text{perc}} \mathcal{L}_{\text{perc}}(\hat{\mathbf{o}}, \mathbf{o}) + \lambda_{\text{gan}} \mathcal{L}_{\text{gan}}(\hat{\mathbf{o}})$$

为了弥补超高压缩率带来的语义损失，CoAE 引入三个冻结的视觉 Teacher 模型（SigLIP 2、V-JEPA 2.1 与 DINOv3），通过三个独立的对齐头 $g_k$ 优化余弦距离：

$$\mathcal{L}_{\text{align}} = \sum_{k=1}^3 \lambda_k \left( 1 - \cos\left(g_k(\mathbf{z}), \, G_k(\mathbf{o})\right) \right)$$

$$\mathcal{L}_{\text{CoAE}} = \mathcal{L}_{\text{rec}} + \mathcal{L}_{\text{align}}$$

* **Teacher 协同机制**：SigLIP 2 提供语言对齐语义；V-JEPA 2.1 提供时空结构；DINOv3 提供密集的局部视觉细节。这使得每帧仅 24 个 Token 的 CoAE 在逆动力学动作恢复测试中达到接近 16× 下采样模型（如 DINOv3）的精度，且指令 Grounding 准确率高出 24%。

## 模块二：单步 MeanFlow 视觉规划器 (SVP as a World-Action Interface)

SVP 是 GE-Act 2.0 的生成式世界模型，结合了多模态理解模块与单步条件流生成器（Flow Generator）。

### 场景 Grounded 多模态理解 (Multimodal Understanding)

SVP 引入冻结的 Qwen3.5 VLM 处理主视角观察 $\mathbf{o}_{\text{head}}$ 与文本指令 $c$，提取各隐层文本 Span 隐状态 $\mathbf{h}_\ell[\mathcal{T}]$。通过输入自适应门控网络计算动态标量权重 $\alpha_\ell$，融合生成多模态条件向量 $\mathbf{c}_{\text{vlm}}$：

$$\alpha_\ell = \text{softmax}_\ell\left( g\left( \text{Pool}(\mathbf{h}_\ell[\mathcal{T}]) \right) \right), \quad \mathbf{c}_{\text{vlm}} = \text{LayerNorm}\left( \sum_{\ell=0}^L \alpha_\ell \mathbf{h}_\ell[\mathcal{T}] \right)$$

生成式 DiT 骨干网中的所有 Block 均 Cross-Attend 到 $\mathbf{c}_{\text{vlm}}$。语言指令不直接喂给 IDM，而是通过 SVP 生成的未来视觉状态间接作用于动作，实现模态解耦。

### 多尺度视觉预测 (Multi-Scale Visual Prediction)

为了兼顾微观控制与宏观任务意图，SVP 沿时间轴预测双尺度帧序列：

$$\mathcal{F} = \{\mathbf{f}_0\} \cup \underbrace{\left\{ \mathbf{f}_{0 + j \frac{H}{N_d}} \right\}_{j=1}^{N_d}}_{\text{密集帧：用于近程控制}} \cup \underbrace{\left\{ \mathbf{f}_{0 + H + \lfloor k \frac{T - H}{N_s} \rceil} \right\}_{k=1}^{N_s}}_{\text{稀疏帧：用于远期意图}}$$

* $N_d$：在动作视界 $H$ 内采样的 $N_d$ 个密集帧，指导 IDM 生成高频控制 Chunk。
* $N_s$：在剩余时域 $[H, T]$ 内采样的 $N_s$ 个稀疏帧，约束长程任务语义不变形。

### 单步 Conditional MeanFlow 算法 (One-Step MeanFlow)

SVP 将 Conditional 生成建模为单步 MeanFlow 问题，定义加噪轨迹 $\mathbf{z}_t = (1-t)\mathbf{z} + t\boldsymbol{\epsilon}$（$\boldsymbol{\epsilon} \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$），速度为 $\mathbf{v}_c = \boldsymbol{\epsilon} - \mathbf{z}$。

在平均速度恒等式基础上，网络通过共享 Trunk 输出平均速度头 $\mathbf{u}_\theta$ 与辅助瞬时速度头 $\mathbf{v}_\theta$，通过单次 Jacobian-Vector Product (JVP) 运算得出复合预测 $\mathbf{V}_\theta$：

$$\mathbf{V}_\theta = \mathbf{u}_\theta + (t - r) \text{sg}\left[ \frac{d\mathbf{u}_\theta}{dt} \right], \quad \frac{d\mathbf{u}_\theta}{dt} = \mathbf{m} \odot \mathbf{v}_\theta(\mathbf{z}_t, t) \cdot \frac{\partial \mathbf{u}_\theta}{\partial \mathbf{z}_t} + \frac{\partial \mathbf{u}_\theta}{\partial t}$$

设置条件帧掩蔽 $\mathbf{m}_i = 0$（观察帧，速度置 0）与预测帧掩蔽 $\mathbf{m}_i = 1$。双头在单步流匹配下训练：

$$\mathcal{L}_u = \|\mathbf{m} \odot (\mathbf{V}_\theta - \mathbf{v}_c)\|_2^2, \quad \mathcal{L}_v = \|\mathbf{m} \odot (\mathbf{v}_\theta - \mathbf{v}_c)\|_2^2, \quad \mathcal{L}_{\text{SVP}} = \mathcal{L}_u + \mathcal{L}_v$$

推理时设置 $(r, t) = (0, 1)$，**仅需 1 次前向传导**即可完美去噪生成未来多视角隐状态：

$$\hat{\mathbf{z}}^{(i)} = \mathbf{z}_1^{(i)} - \mathbf{m}_i \mathbf{u}_\theta^{(i)}(\mathbf{z}_1, r=0, t=1)$$

## 模块三：逆动力学模型 (IDM) 与流匹配控制

IDM 接收 CoAE 编码的当前观察隐状态 $\mathbf{o}$、本体感觉状态 $\mathbf{s}$，通过 Cross-Attention 关注 SVP 生成（或真实录制）的未来视觉隐状态序列 $\mathbf{z}$（包含密集帧与稀疏帧）。

IDM 的速度头 $\mathbf{v}_\phi$ 在动作加噪流时间 $t$ 下，训练输出密集控制 Chunk 与稀疏远期动作：

$$\ell_{\text{FM}}(\mathbf{a}, \mathbf{o}, \mathbf{s}, \mathbf{z}) = \mathbb{E}_{t, \boldsymbol{\varepsilon}} \left\| \mathbf{v}_\phi(\mathbf{a}_t, t, \mathbf{o}, \mathbf{s}, \mathbf{z}) - (\boldsymbol{\varepsilon} - \mathbf{a}) \right\|_2^2$$

## 模块四：端到端世界-动作对齐与 KASO 机制

在将解耦预训练好的 SVP 与 IDM 进行端到端联合微调（Co-training）时，由于机器人操控具备高度的多模态性（相同观察与指令下，可能有多种不同的动作路径模式），直接将随机采样的生成视觉 $\hat{\mathbf{z}}$ 与录制动作 $\mathbf{a}$ 配对，会导致严重的不匹配——即**有效性鸿沟 (Validity Gap)**。

这种错位会导致 IDM 的动作预测坍缩为均值（如预测出的动作概率密度退化）。

### 4.1 知识对齐选择性优化 (Knowledge-Aligned Selective Optimization, KASO)

KASO 引入了一种在线 Top-$k$ 过滤机制，在动作空间中判定 SVP 采样的候选视频是否与录制的动作相兼容。

1. **无梯度并行采样**：对于给定的上下文，SVP 在无梯度模式下随机采样 $N$ 组候选未来视频隐状态 $\{\hat{\mathbf{z}}_n\}_{n=1}^N$。
2. **高噪声探针打分 (High-Noise Probing)**：在 IDM 的动作流时间 $t_p$ 选择一个接近纯噪声的高噪声点（如 $t_p \to 1$），构造带噪动作 $\tilde{\mathbf{a}} = t_p \boldsymbol{\epsilon} + (1 - t_p)\mathbf{a}$。比较 IDM 在生成未来 $\hat{\mathbf{z}}_n$ 与真实未来 $\mathbf{z}$ 下预测速度的差异（定义候选能量 $E_n$）：

$$E_n = \frac{1}{|\mathcal{D}|} \sum_{i \in \mathcal{D}} \left\| \mathbf{v}_{\phi, i}(\tilde{\mathbf{a}}, t_p, \mathbf{o}, \mathbf{s}, \hat{\mathbf{z}}_n) - \mathbf{v}_{\phi, i}(\tilde{\mathbf{a}}, t_p, \mathbf{o}, \mathbf{s}, \mathbf{z}) \right\|_2^2$$

* **高噪声探针原理**：在低噪声下 $\tilde{\mathbf{a}} \approx \mathbf{a}$，速度预测主要取决于动作输入本身；而在高噪声下，$\tilde{\mathbf{a}}$ 几乎不含动作信息，IDM 必须完全依赖未来视觉 $\hat{\mathbf{z}}_n$ 来推断动作。低能量 $E_n$ 说明当前 IDM 认为该候选视频所表达的动作路径与真实录制动作高度兼容。

3. **Top-$k$ 重放与梯度反传**：选取能量最低的前 $k$ 个候选集 $\mathcal{S}_k$（通常 $k=1$）。SVP 重新开启梯度，只对选中的噪声矩阵进行精确重放前向传导，计算联合动作损失并更新 SVP 与 IDM：

$$\mathcal{L}_{\text{E2E}}^{\text{sel}} = \frac{1}{k} \sum_{n \in \mathcal{S}_k} \ell_{\text{FM}}(\mathbf{a}, \mathbf{o}, \mathbf{s}, \hat{\mathbf{z}}_n)$$

$$\mathcal{L}_{\text{KASO}} = \mathcal{L}_{\text{E2E}}^{\text{sel}} + \mathcal{L}_{\text{SVP}} + \mathcal{L}_{\text{IDM}}$$

* 保留的 $\mathcal{L}_{\text{SVP}}$ 与 $\mathcal{L}_{\text{IDM}}$ 预训练损失防止了主干网络的知识遗忘，而 $\mathcal{L}_{\text{E2E}}^{\text{sel}}$ 则让 SVP 生成的未来图像具备极高动作导向忠实度，完美保留了双模态的多样性。

# 独立 WM + VLA，想象式策略改进 (RISE: Self-Improving Robot Policy with Compositional World Model)

RISE 旨在解决机器人强化学习（RL）在物理世界中由于高昂的采集成本、安全风险以及离线策略优化易导致卡塔斯特罗菲忘却（Catastrophic Forgetting）与分布外（OOD）过度探索等核心难题。

系统构建了一个解耦的组合式世界模型（Compositional World Model）——将可控时域动力学预测器 (Dynamics Model) 与 多视角进度-TD 价值估计器 (Value Model) 解耦，配合基于优势条件（Advantage-Conditioning）的策略预热与潜在“想象”空间自我进化闭环（Self-Improving Loop），使 VLA 策略网络能在纯虚拟的想象轨迹中通过试错（Trial-and-Error）完成无毒害、高吞吐的 RL 自优升阶，实测测试时零推理额外开销。

整个系统由组合式世界模型架构、真实经验策略预热 以及 潜在想象自进化闭环 三大核心部分构成。

## 系统核心一：组合式世界模型 (Compositional World Model)

RISE 摒弃了将未来视频生成与标量奖励预测绑在单一网络中的做法，而是将其解耦为两个独立架构进行极致优化。

系统前向数据流逻辑如下：

1. 初始多视角观察 $O_t$ 与候选动作 Chunk $\mathbf{a}_t$ 输入至可控动力学模型 $\mathcal{D}$，生成未来想象多视角图像序列 $\{\hat{o}_{t+1}, \dots, \hat{o}_{t+H}\}$。
2. 生成的想象图像序列与任务指令 $\ell$ 输入至价值模型 $\mathcal{V}$，评估出各帧的 Value 标量 $\mathcal{V}(\hat{o}_{t+k}, \ell)$。
3. 结合初始观察 Value 与未来各帧 Value，导出标量优势值 $A(o_t, \mathbf{a}_t, \ell)$。

### 可控动力学预测器 (Controllable Dynamics Model $\mathcal{D}$)

* **架构与吞吐优势**：初始化自预训练的 Genie Envisioner（基于 LTX-Video 的 GE-Base 变体）。相比于 Cosmos 模型生成 25 帧多视角图像需 10 分钟以上的昂贵开销，GE-Base 仅需小于 2 秒，提供了 300 倍级别的推理加速，消除了 RL 闭环模拟的吞吐瓶颈。
* **动作编码与抗噪注入**：挂载轻量级动作编码器接收候选动作 Chunk $\mathbf{a}_t = [a_t, a_{t+1}, \dots, a_{t+H-1}] \in \mathcal{A}^H$；对上下文帧施加更强的噪声扰动，提升遭遇运动模糊或伪影时的生成鲁棒性。
* **任务中心批处理 (Task-Centric Batching)**：在海量跨域数据集（Agibot World、Galaxea）上微调时，每个 Batch 仅从极少数 Task 中采样，但覆盖该 Task 下匹配不同动作的丰富样本。优先保证同一场景下的动作多样性而非场景多样性，大幅提升了动作控制的忠实度。

### 多视角进度-TD 价值模型 (Progress-TD Value Model $\mathcal{V}$)

价值模型 $\mathcal{V}(\hat{o}_t, \ell)$ 接收多视角观察并输出标量进度信号，直接初始化自预训练的 VLA 策略网络（$\pi_{0.5}$），天然具备多视角特征对齐能力与机器人感知空间先验。

价值模型在两阶段损失下训练：

1. **时域进度预热损失 (Progress Loss)**：拟合单 Episode 内的单调时间进度（$t/T$），提供平滑、密集的远期学习信号：

$$\mathcal{L}_{\text{prog}} = \mathbb{E}_{(o_t, \ell) \sim \mathcal{D}_{\text{exp}}} \left[ \left( \mathcal{V}(o_t, \ell) - \frac{t}{T} \right)^2 \right]$$

2. **Temporal-Difference 差分损失 (TD Loss)**：借助成功与失败轨迹，在接触密集型任务中增强对微小故障的敏感度（成功末帧 $r_t=+1$，失败末帧 $r_t=-1$，中间帧 $r_t=0$）：

$$\mathcal{L}_{\text{TD}} = \mathbb{E}_{(o_t, \ell, o_{t+1}) \sim \mathcal{D}} \left[ \left( \mathcal{V}(o_t, \ell) - y_t \right)^2 \right], \quad y_t = r_t + \gamma \mathcal{V}(o_{t+1}, \ell)$$

$$\mathcal{L}_{\mathcal{V}} = \mathcal{L}_{\text{prog}} + \mathcal{L}_{\text{TD}}$$

### 块级优势导出公式 (Chunk-wise Advantage Formulation)

动作 Chunk $\mathbf{a}_t$ 生成未来 $H$ 步想象视觉轨迹 $\{\hat{o}_{t+1}, \dots, \hat{o}_{t+H}\}$。优势函数被定义为该 Chunk 视角内价值增量的时域平均改善量：

$$A(o_t, \mathbf{a}_t, \ell) = \left( \frac{1}{H} \sum_{k=1}^H \mathcal{V}(\hat{o}_{t+k}, \ell) \right) - \mathcal{V}(o_t, \ell)$$

## 系统核心二：真实经验优势预热 (Policy Warm-up on Real Experience)

在开始闭环 RL 自进化前，VLA 策略（如 $\pi_{0.5}$）首先在包含专家演示、带成功/失败标记的离线轨迹以及人机干预数据的离线数据集上进行优势条件微调（Advantage-Conditioned Fine-tuning）。

### 差异化优势标注策略

* **离线 Rollout 数据**：利用已训练好的价值模型 $\mathcal{V}$，将后续视频帧作为未来观察，依据 Chunk 优势导出公式标注实际标量优势 $A$。
* **专家演示与人类干预数据**：强制标注最优优势指示符 $\mathbb{1}$（而非由价值模型评估），避免噪声破坏专家分布。

经此阶段预热后，策略具备了通过输入不同优势 Condition 来显式控制动作意图（积极/保守）的能力：

$$\pi(\mathbb{1}, o_t, \ell) \to \mathbf{a}_{\text{optimal}}$$

## 系统核心三：基于世界模型的潜在自我进化闭环 (Self-Improving Loop)

策略强化学习过程在“想象空间”中循环交替执行 Rollout 阶段 与 Training 阶段：

### 采样阶段 (Rollout Stage)

1. 从离线预热数据集中采样真实初始观察 $o_t$。
2. 给 Rollout 策略 $\pi_{\text{rollout}}$ 注入最优目标优势 Prompt $\mathbb{1}$，引导其采样出具备正向意图的候选动作 Chunk：

$$\hat{\mathbf{a}}_t = \pi_{\text{rollout}}(\mathbb{1}, o_t, \ell)$$

3. 动力学模型 $\mathcal{D}$ 接收初始历史与 $\hat{\mathbf{a}}_t$，在前向生成 $H$ 步未来想象图像 $\{\hat{o}_{t+1}, \dots, \hat{o}_{t+H}\}$。
4. 价值模型 $\mathcal{V}$ 评估想象图像，算得出真实的评估优势 $A_{\pi_{\text{rollout}}}(o_t, \hat{\mathbf{a}}_t, \ell)$，并将该优势连续值离散化至 $N$ 个均匀 Bin 集中。
5. **多步连续推演与防漂移**：想象出的状态可以作为下一轮 Rollout 的输入继续下发，但连续推演最大深度限制为 2 次（以遏制视频生成大模型的复合误差漂移）。
6. Rollout 策略通过行为策略参数的指数移动平均（EMA）进行动态更新。

### 训练阶段 (Training Stage)

将 Rollout 收集的在线三元组样本 $\langle o, \hat{\mathbf{a}}, A \rangle$ 与离线真实数据按比例混合，以流匹配（Flow-Matching）准则训练行为策略 $\pi$。

策略接收实际评估出的优势 $A$，回归拟合动作 $\hat{\mathbf{a}}$：

$$\pi\left( A_{\pi_{\text{rollout}}}(o, \hat{\mathbf{a}}_t, \ell), \, o_t, \, \ell \right) \to \hat{\mathbf{a}}$$

* **闭环演化价值**：策略网络不仅从具有高优势的成功想象中强化良好动作，也从低优势的失败试错中学会了“在何种优势 Condition 下避开错误动作”，实现了高效率、零真实碰撞风险的策略自进化。部署时仅需注入 $\mathbb{1}$ 条件，且无世界模型推理开销。

# 独立 VLA + 动作条件视频 WM，支持连续闭环交互 (Ctrl-World: A Controllable Generative World Model for Robot Manipulation)

Ctrl-World 是一种面向通用视觉-动作-语言（VLA）策略闭环评估与策略进化的**可控多视角世界模型**。

针对现有视频生成基座缺乏精确动作控制、长时域推演易漂移失真以及无法匹配真实机器人关节控制接口的问题，Ctrl-World 基于 Stable Video Diffusion (SVD) 1.5B 骨干网络，通过**多视角联合生成**、**位姿条件记忆检索**与**帧级动作条件注入**，实现了在纯虚拟“想象空间”中与 SOTA 策略（如 $\pi_0$、$\pi_{0.5}$）进行长时域自回归交互，并借助生成的成功轨迹完成策略离线蒸馏进化。

## 交互问题建模与多模态接口对齐 (Problem Formulation & Action Adapter)

### 闭环想象交互循环 (Closed-Loop Rollout)

给定包含 $n$ 个视角图像 $[I_t^1, \dots, I_t^n]$ 与位姿 $q_t$ 的观察 $o_t$，策略 $\pi$ 根据语言指令 $l$ 输出未来 $H$ 步动作 Chunk：

$$A_t = [a_{t+1}, a_{t+2}, \dots, a_{t+H}] \sim \pi(\cdot \mid o_t, l)$$

世界模型 $W$ 接收当前观察与动作 Chunk，在隐空间推演生成未来的多视角图像：

$$o_{t+1}, \dots, o_{t+H} \sim W(\cdot \mid o_t, A_t)$$

末帧预测 $o_{t+H}$ 被喂回策略 $\pi$，自回归生成下一个动作 Chunk $A_{t+H}$，形成完全在想象空间中的长时域闭环交互。

### 关节速-笛卡尔位姿适配器 (Joint-Velocity to Cartesian Adapter)

开源 VLA 策略（如 $\pi_0\text{-droid}$）通常以关节角速度（Joint Velocity）作为输出，而世界模型需要精确的笛卡尔空间末端位姿（Cartesian Pose）以保持控制稳定性。

系统训练了一个 2 层 MLP 适配器，结合正运动学（Forward Kinematics, FK）搭建连接桥梁：

$$q_{t+1:t+H}^{\text{joint}} = \text{Adapter}\left( q_t^{\text{joint}}, \, a_{t+1:t+H}^{\text{jv}} \right)$$

$$q_{t+1:t+H}^{\text{cartesian}} = \text{FK}\left( q_{t+1:t+H}^{\text{joint}} \right)$$

转换后的笛卡尔位姿轨迹被直接作为世界模型的帧级动作条件输入。

## 核心架构与条件控制机制 (Ctrl-World Architecture)

Ctrl-World 初始化自 SVD 1.5B 时空 Transformer 骨干网络，仅新建一个 3 层 MLP 动作投影层（将 7 维笛卡尔动作映射至 1024 维隐空间），施加以下三项改进：

### 多视角联合并行预测 (Multi-View Joint Predictions)

针对第三方视角与手腕视角的协同生成，将 $N$ 个视角的输入图像（每帧由 $8 \times 8$ 下采样的 VAE 编码为 $24 \times 40$ 的 Patch Tokens）沿 Token 维度直接拼接：

$$\text{Shape}_{\text{Input}} = \left[ B, \, (k + H'), \, 3 \times 24 \times 40 \right]$$

在 Spatial-Temporal Transformer 中联合生成所有视角 $o_{t:t+H}$，有效捕捉多相机间的极线与三维几何约束，大幅抑制视角间幻觉。

### 位姿条件记忆检索机制 (Pose-Conditioned Memory Retrieval)

为了缓解长时间自回归推演导致的漂移与积累误差，系统以步长 $m$ 采样的 $k$ 帧历史观察作为 Context：

$$o_{t-km}, \dots, o_{t-m}, o_t$$

在 Spatial Transformer 内部，通过**帧级 Cross-Attention 机制**将机器人历史关节位姿 $[q_{t-km}, \dots, q_t]$ 注入对应历史帧的视觉 Token 中，使模型能够利用位姿作为检索键（Key），将未来的视觉推演强制锚定在相似的历史状态上。

### 帧级动作条件注入 (Frame-Level Action Conditioning)

策略输出的未来 15 步笛卡尔动作在时间轴上降采样至 $H'=5$ 步，并与历史位姿拼接组成全时域位姿序列 $[q_{t-km}, \dots, q_t, a_{t+1}, \dots, a_{t+H'}]$。

未来时间步的视觉 Token 通过 Cross-Attention 关注其对应的未来动作位姿 $a_{t+k}$，确保高频操控动作与低维视觉演化实现物理因果对齐。

### 扩散去噪训练损失 (Diffusion Loss)

目标图像序列 $x_0 = o_{t+1:t+H}$ 被施加高斯噪声 $\epsilon \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$ 生成加噪状态 $x_{t'}$，网络基于 MSE 扩散重构损失在 DROID 95k 轨迹数据集上训练 100k 步：

$$\mathcal{L} = \mathbb{E}_{x_0, \epsilon, t'} \left\| \hat{x}_0\left( x_{t'}, t', c \right) - x_0 \right\|_2^2$$

* $c = [q_{t-km:t}, \, a_{t+1:t+H'}, \, o_{t-km:t}]$ 包含了历史观察与控制条件的集合。

## 策略想象评估与合成数据策略进化 (Policy Evaluation & Self-Improvement)

在训练好 Ctrl-World 后，系统可在无物理机器人的情况下完成策略性能评估与合成数据驱动的策略微调。

### 想象空间中的策略评估 (Policy Evaluation in Imagination)

加载真实采样或验证集快照作为初始观察 $o_0$，策略与 Ctrl-World 闭环推演生成完整轨迹 $\tau = [o_0, A_0, o_1, A_1, \dots]$。人类评估员或大语言视觉模型根据任务规则判定轨迹成功与否，从而精准评估策略的指令跟随与低级操控成功率。

### 基于结构化扰动的合成数据收集与策略微调 (Policy Improvement Loop)

由于定型策略在固定初始状态下的行为趋于确定性，为了在想象空间中探索更大的策略空间，系统在自回归采样中引入**结构化扰动**：

1. **指令改写 (Instruction Rephrasing)**：利用 VLA 策略对自然语言敏感的特性，通过改写同义指令（如将“Pick A”改写为“Grasp the object A”）诱导策略产生不同的动作轨迹。
2. **状态重置 (State Resetting)**：在世界模型内部将策略重置至随机的中途状态，激发多样化的初始动作模式。

策略进化算法的自动化流程如下：

1. 对于给定的任务指令集与初始观察，以扰动策略采样动作 $A_{t:t+H} \sim \pi_\theta(o_t, l, \epsilon_a)$。
2. 世界模型基于历史 Context 与动作推演下一阶段视觉图像 $o_{t+1:t+H} = W(h, o_t, A_{t:t+H})$。
3. 组合形成合成轨迹 $\tau$。经偏好判定为成功的轨迹被加入合成数据集 $\mathcal{D}_s$。
4. 在合成成功数据集 $\mathcal{D}_s$ 上，通过行为克隆损失微调策略网络 $\pi_\theta$：

$$\mathcal{L}_\theta = \mathbb{E}_{o_t, A_{t:t+H} \sim \mathcal{D}_s} \left\| \pi_\theta(o_t, l) - A_{t:t+H} \right\|_2^2$$

# 独立世界模型、动作策略和奖励器，通过数据交换实现联合训练 (VLAW: Iterative Co-Improvement of Vision-Language-Action Policy and World Model)

VLAW 旨在解决传统机器人大模型在部署时面临的**环境泛化性不足**、**物理接触世界模型失真/过度乐观（Over-Optimism）**，以及**在线强化学习（RL）算法过于复杂难以直接作用于 Flow-Matching 策略**等核心瓶颈。

系统构建了一个极简且高可扩展的**交替协同进化（Co-Improvement）闭环**：利用策略网络在真实物理世界中收集包含失败与接触的真实轨迹，端到端微调视频扩散世界模型（Ctrl-World）与视觉-语言奖励模型（Qwen3-VL-4B）；随后在更新后的世界模型中大规模采样虚拟轨迹，筛选成功样本并反向微调 Flow-Matching VLA 策略（如 $\pi_{0.5}$）。从理论上看，该极简微调配方完全等价于正则化强化学习（Regularized RL / Advantage-Weighted Regression）的流匹配等效投影。

整个系统由**基于真实 Rollout 的世界模型与奖励模型 post-training**、**基于合成轨迹过滤的策略 post-training**，以及**正则化强化学习数学证明**三大核心部分构成。

## 阶段一：基于真实 Rollout 的世界模型与奖励模型协同微调 (World Model Learning with Real Roll-outs)

传统世界模型仅在专家演示数据上训练，缺乏对错误动作或复杂物理接触（如易变形物体、高频摩擦）的预测能力，容易导致过度乐观。VLAW 引入真实的交互反馈进行纠偏。

### 真实轨迹收集与双流加权 Post-Training

策略 $\pi_\theta$ 在物理世界中执行 $K$ 条真实轨迹，构建带有稀疏二值奖励 $r_\tau \in \{0, 1\}$ 的真实交互数据集 $\mathcal{D}_{\text{real}} = \{\tau_{\text{real}}^1, \dots, \tau_{\text{real}}^K\}$。

世界模型初始化自 Ctrl-World（基于全量 DROID 95k 轨迹预训练的扩散模型）。在微调时，为了防止世界模型在小规模真实线上数据上过拟合，将新收集的 $\mathcal{D}_{\text{real}}$ 与原始 DROID 预训练数据集 $\mathcal{D}_{\text{DROID}}$ 进行**正则化混合共训（Co-training）**：

$$\mathcal{L}_{\text{WM}} = \mathcal{L}_{\mathcal{D}_{\text{real}}} + \lambda \mathcal{L}_{\mathcal{D}_{\text{DROID}}}$$

$$\mathcal{L}_{\mathcal{D}_{\text{real}}} = \mathbb{E}_{x_0, \epsilon, t'} \left\Vert{} \hat{x}_0(x_{t'}, t', c) - x_0 \right\Vert{}_2^2$$

* $x_0 = o_{t+1:t+H}$：采样自 $\mathcal{D}_{\text{real}}$ 的真实未来观察。
* $c = [o_t, a_{t:t+H}]$：包含当前观察与动作 Chunk 的条件集合。

### 视觉-Language 奖励模型微调 (Reward Model Finetuning)

零样本（Zero-shot）VLM 在判断微妙操控任务成功与否时准确率不足。系统采用 Qwen3-VL-4B-Instruct 作为通用奖励模型 $R$。

在第一轮迭代中，直接使用 $\mathcal{D}_{\text{real}}$ 中的真实成功标签 $r_\tau$ 对 VLM 进行微调。判断采样视频 $\tau_i$ 是否成功时，计算其输出 `"yes"` Token 的后验概率，并施加保守门限 $\alpha$：

$$R(\tau_i) = \left[ P\left(\text{"yes"} \mid \tau_i, I_i\right) > \alpha \right]$$

## 阶段二：基于虚拟轨迹筛选的 VLA 策略自我进化 (Iterative Improvement for VLA Policy)

有了高物理保真度的世界模型与精准的奖励模型后，无需在物理世界中承担碰撞风险即可进行大规模策略升阶。

### 潜在空间自回归 Rollout 与成功集过滤

1. **虚拟轨迹生成**：策略 $\pi_\theta$ 与更新后的世界模型 $M_\phi$ 在“想象空间”中闭环自回归交互 $N$ 条虚拟轨迹 $\mathcal{D}_{\text{syn}} = \{\tau_{\text{syn}}^1, \dots, \tau_{\text{syn}}^N\}$。
2. **奖励模型过滤**：利用微调后的奖励模型 $R$ 评估所有虚拟轨迹，剔除失败样本，提取纯成功虚拟数据集 $\mathcal{D}_{\text{syn}}^+ = \{\tau_{\text{syn}}^{i_1}, \dots, \tau_{\text{syn}}^{i_n}\}$。同时将真实世界中的成功轨迹提取为 $\mathcal{D}_{\text{real}}^+$。

### 策略 Flow-Matching 流匹配二值加权 Post-Training

由于 Flow-Matching 策略（如 $\pi_{0.5}$）无法显式计算动作的对数似然 $\ln \pi(a \mid o)$，传统的 PPO 或 Actor-Critic 框架难以直接适用。VLAW 采用极其简单高效的二值加权回归：

定义权值函数：成功轨迹转换样本 $w(o, a) = 1$，失败轨迹转换样本 $w(o, a) = 0$。策略更新损失为：

$$\mathcal{L}_{\text{Policy}}(\theta) = \mathbb{E}_{(o, a) \sim \mathcal{D}_{\text{syn}} \cup \mathcal{D}_{\text{real}}} \left[ w(o, a) \mathcal{L}_{\text{FM}}(\theta, o, a) \right] = \mathbb{E}_{(o, a) \sim \mathcal{D}_{\text{syn}}^+ \cup \mathcal{D}_{\text{real}}^+} \left[ \mathcal{L}_{\text{FM}}(\theta, o, a) \right]$$

* $\mathcal{L}_{\text{FM}}(\theta, o, a)$：针对 Flow-Matching 策略的矢量场预测均方误差。

## 理论映射：正则化强化学习 (Regularized RL) 的流匹配等效证明

VLAW 采用的二值过滤 Flow-Matching 更新（公式 4），在数学上完全等价于**正则化强化学习（Regularized RL / AWR）**在流匹配概率空间上的代理投影。

### 正则化强化学习的闭环最优解

在带 KL 散度约束的正则化 RL 框架下，目标是寻找与参考策略 $\pi_{\text{ref}}$ 保持临近且最大化奖励的最优策略 $\pi^\star$：

$$\mathcal{J}(\theta) = \mathbb{E}_{\tau \sim \rho_{\pi_\theta}} [R(\tau)] - \beta \mathbb{E}_{o \sim \rho_{\pi_\theta}} \left[ D_{\text{KL}}\left( \pi_\theta(\cdot \mid o) \parallel \pi_{\text{ref}}(\cdot \mid o) \right) \right]$$

其闭环解析解（Closed-form Solution）形式为优势加权：

$$\pi^\star(a \mid o) \propto \pi_{\text{ref}}(a \mid o) \exp\left( \frac{A^{\pi_{\text{ref}}}(o, a)}{\beta} \right) = w(o, a) \pi_{\text{ref}}(a \mid o)$$

### 流匹配代理散度 (Flow-Matching Surrogate Divergence) 投影

由于 Flow-Matching 无法解出标准的对数概率 $\ln \pi_\theta(a \mid o)$，定义流匹配等效代理散度 $D_{\text{FM}}$ 衡量参数化策略 $\pi_\theta$ 对目标分布 $\pi^\star$ 的拟合程度：

$$D_{\text{FM}}\left( \pi^\star(\cdot \mid o), \, \pi_\theta(\cdot \mid o) \right) \triangleq \mathbb{E}_{a \sim \pi^\star(\cdot \mid o)} \left[ \mathcal{L}_{\text{FM}}(\theta; o, a) \right]$$

通过将对于 $\pi^\star$ 的采样近似为在已知数据集上按优势指数加权 $w(o, a) \propto \exp\left( \frac{A^{\pi_{\text{ref}}}(o, a)}{\beta} \right)$：

$$\theta^\star = \arg\min_\theta \mathbb{E}_{o \sim \mathcal{D}} \left[ D_{\text{FM}}\left( \pi^\star(\cdot \mid o), \, \pi_\theta(\cdot \mid o) \right) \right] \approx \arg\min_\theta \mathbb{E}_{(o, a) \sim \mathcal{D}} \left[ w(o, a) \mathcal{L}_{\text{FM}}(\theta, o, a) \right]$$

当折扣因子 $\gamma \to 1$ 且给失败轨迹赋予负极大奖励（失败项权重设为 0，成功项权重设为 1）时，优势加权表达式精确退化为 VLAW 所采用的成功过滤 Flow-Matching 回归损失，完成了理论上的完备闭环。