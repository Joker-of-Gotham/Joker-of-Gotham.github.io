---
title: 模型结构
summary: 当前具身智能领域的模型结构主要包括VLA、WM、WAM，不同的模型结构具有不同的侧重。
papers:
  - title: "OpenVLA: An Open-Source Vision-Language-Action Model"
    url: "https://arxiv.org/abs/2406.09246"
    year: 2024
    venue: "arXiv"
    abstract: "融合 DINOv2 与 SigLIP 视觉特征，以语言模型自回归预测离散动作 Token。"
    abstract_kind: "summary"
  - title: "FAST: Efficient Action Tokenization for Vision-Language-Action Models"
    url: "https://arxiv.org/abs/2501.09747"
    year: 2025
    venue: "arXiv"
    abstract: "通过离散余弦变换和压缩分词表示高频动作序列，用于自回归 VLA。"
    abstract_kind: "summary"
  - title: "RT-2: Vision-Language-Action Models Transfer Web Knowledge to Robotic Control"
    url: "https://arxiv.org/abs/2307.15818"
    year: 2023
    venue: "arXiv"
    abstract: "将机器人动作表示为 Token，联合视觉语言任务与机器人数据学习控制策略。"
    abstract_kind: "summary"
  - title: "Octo: An Open-Source Generalist Robot Policy"
    url: "https://arxiv.org/abs/2405.12213"
    year: 2024
    venue: "arXiv"
    abstract: "以可适配多种观察和动作空间的 Transformer 与扩散动作头构建通用机器人策略。"
    abstract_kind: "summary"
  - title: "3D Diffusion Policy: Generalizable Visuomotor Policy Learning via Simple 3D Representations"
    url: "https://arxiv.org/abs/2403.03954"
    year: 2024
    venue: "arXiv"
    abstract: "利用稀疏点云编码的紧凑三维表征，为扩散动作策略提供空间条件。"
    abstract_kind: "summary"
  - title: "Diffusion Policy: Visuomotor Policy Learning via Action Diffusion"
    url: "https://arxiv.org/abs/2303.04137"
    year: 2023
    venue: "arXiv"
    abstract: "把视觉运动控制建模为条件动作去噪，以滚动时域执行预测的动作序列。"
    abstract_kind: "summary"
  - title: "π₀: A Vision-Language-Action Flow Model for General Robot Control"
    url: "https://arxiv.org/abs/2410.24164"
    year: 2024
    venue: "arXiv"
    abstract: "将预训练视觉语言模型与连续动作流匹配专家连接，生成机器人动作块。"
    abstract_kind: "summary"
  - title: "π₀.₇: a Steerable Generalist Robotic Foundation Model with Emergent Capabilities"
    url: "https://arxiv.org/abs/2604.15483"
    year: 2026
    venue: "arXiv"
    abstract: "通过多样化上下文条件、子目标和性能信息，使通用机器人策略更易于指引。"
    abstract_kind: "summary"
  - title: "RDT2: Exploring the Scaling Limit of UMI Data Towards Zero-Shot Cross-Embodiment Generalization"
    url: "https://arxiv.org/abs/2602.03310"
    year: 2026
    venue: "arXiv"
    abstract: "研究规模化 UMI 数据与分阶段动作建模，面向零样本跨具身泛化。"
    abstract_kind: "summary"
  - title: "RDT-1B: a Diffusion Foundation Model for Bimanual Manipulation"
    url: "https://arxiv.org/abs/2410.07864"
    year: 2024
    venue: "arXiv"
    abstract: "通过大规模扩散 Transformer 学习双臂机器人操作的连续动作分布。"
    abstract_kind: "summary"
  - title: "Discrete Diffusion VLA: Bringing Discrete Diffusion to Action Decoding in Vision-Language-Action Policies"
    url: "https://proceedings.mlr.press/v306/liang26l.html"
    year: 2026
    venue: "ICML"
    abstract: "在统一 Transformer 中对离散动作块迭代去噪，支持并行解码与不确定位置的重新掩蔽。"
    abstract_kind: "summary"
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
  - title: "π₀.₅: a Vision-Language-Action Model with Open-World Generalization"
    url: "https://arxiv.org/abs/2504.16054"
    year: 2025
    venue: "arXiv"
    abstract: "通过异构数据联合训练和分层推理，提高机器人策略在开放环境中的泛化。"
    abstract_kind: "summary"
  - title: "SpatialVLA: Exploring Spatial Representations for Visual-Language-Action Model"
    url: "https://arxiv.org/abs/2501.15830"
    year: 2025
    venue: "arXiv"
    abstract: "将空间表征引入视觉语言动作模型，强化三维几何理解与机器人动作预测。"
    abstract_kind: "summary"
  - title: "MolmoAct: Action Reasoning Models that can Reason in Space"
    url: "https://arxiv.org/abs/2508.07917"
    year: 2025
    venue: "arXiv"
    abstract: "通过深度感知、空间轨迹规划和动作预测，构建可解释、可指引的动作推理流程。"
    abstract_kind: "summary"
  - title: "MolmoAct2: Action Reasoning Models for Real-world Deployment"
    url: "https://arxiv.org/abs/2605.02881"
    year: 2026
    venue: "arXiv"
    abstract: "面向真实部署扩展动作推理模型，连接空间理解、推理与机器人控制。"
    abstract_kind: "summary"
  - title: "π*₀.₆: a VLA That Learns From Experience"
    url: "https://arxiv.org/abs/2511.14759"
    year: 2025
    venue: "arXiv"
    abstract: "RECAP 用价值模型估计优势，结合演示、自主采样和人工纠正进行优势条件策略学习。"
    abstract_kind: "summary"
  - title: "RL Token: Bootstrapping Online RL with Vision-Language-Action Models"
    url: "https://arxiv.org/abs/2604.23073"
    year: 2026
    venue: "arXiv"
    abstract: "将 VLA 表征压缩为 RL Token，以轻量 Actor-Critic 接口进行在线策略改进。"
    abstract_kind: "summary"
  - title: "RL-100: Performant Robotic Manipulation with Real-World Reinforcement Learning"
    url: "https://arxiv.org/abs/2510.14830"
    year: 2025
    venue: "arXiv"
    abstract: "对扩散策略采用去噪过程中的 PPO 风格更新，并结合离线评估和一致性蒸馏。"
    abstract_kind: "summary"
---
# 主要模型架构一览

## 交互式模型结构图谱

切换总览、VLA、WM、WAM 查看结构与变量传导。图内可缩放、拖动，或通过模型索引定位；复杂结构建议全屏查看。

<figure class="html-embed">
  <iframe src="/embeds/embodied-architecture-atlas/" title="具身模型结构与变量图谱：VLA、WM、WAM" loading="lazy" sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-downloads" allow="fullscreen" allowfullscreen data-embed-theme></iframe>
  <figcaption><span>具身模型结构与变量图谱</span><a href="/embeds/embodied-architecture-atlas/" target="_blank" rel="noopener">独立页面查看 ↗</a><a href="/embeds/embodied-architecture-atlas/overview.svg" target="_blank" rel="noopener">静态 SVG 总览 ↗</a></figcaption>
</figure>



VLA、WM、WAM 作为具身智能领域的三种代表性模型，它们的本质区别是：

- VLA 从观察和目标直接生成动作：$\pi_{\theta}(a_{t:t+H} | o_{\leq t},g)$。关键架构是多模态 Encoder / Backbone 与 Action Decoder。RL 主要改进动作选择，或者为它增加价值函数、轻量 Actor-Critic 等模块。
- WM 从当前观察和动作预测未来：$\pi_{\theta}(o_{t+1:t+H} | o_{\leq t},a_{t:t+H})$。关键架构是状态表示和 Dynamics Model。它支持候选动作评估、想象式 rollout、规划与训练。
- WAM 则联合建模动作与未来世界：$p_{\omega}(a_{t:t+H},o_{t+1:t+H} | o_{\leq t},g)$。关键架构是共享或耦合的世界与动作表示。实际系统可以是联合生成，也可以通过多个模块组合实现，不意味着所有 WAM 都有同一套网络。

## VLA：Vision-Language-Action Model

VLA 主要关注机器人的动作究竟如何从多模态表征中产生。这部分涉及到的结构分支和代表性论文如下：

| 结构分支 | 重新选择的主论文 | 关键架构 | 必须保留的前作 |
| :--- | :--- | :--- | :--- |
| **离散动作 Token** | FAST（RSS 2025） | 连续动作序列经频域压缩、离散化，再由自回归模型预测 | RT-2、OpenVLA |
| **生成式连续动作 Expert** | RDT2（ICML 2026） | 7B VLM、RVQ、Flow Matching、动作生成蒸馏 | Diffusion Policy、Octo、RDT-1B |
| **VLM + Flow Action Expert** | π₀.₇（2026） | VLM、视频历史表征、连续动作 Expert、异构条件输入 | π₀、π₀.₅、π₀.₆ |
| **空间推理与分层动作生成** | MolmoAct2（2026） | 空间表征、离散推理与连续动作 Expert 的组合 | SpatialVLA、MolmoAct |

## WM：World Model

WM 主要关注世界状态应该怎样表示、预测并用于决策。世界模型内部也存在明显不同的架构。尤其必须区分潜在状态动力学模型与高保真视频生成世界模型：它们都能预测未来，但其训练开销、预测对象、可微接口以及与 RL 结合的方式差别很大。这部分涉及到的结构分支和代表性论文如下：

| 结构分支 | 主方法论文 | 核心模型结构 | RL 接入方式 |
| :--- | :--- | :--- | :--- |
| **潜在状态动力学 WM** | DreamerV3（Nature 2025） | Encoder + RSSM + Decoder / Reward Head | 在潜在状态中进行 Actor-Critic 学习 |
| **大规模想象式 WM** | Dreamer 4（2025） | 视频 Tokenizer + 交互式 Transformer 动力学模型 | 世界模型内部生成轨迹并优化策略 |
| **特征空间 WM** | DINO-WM（ICML 2025） | DINOv2 视觉特征 + 特征动力学预测器 | 使用预测特征进行动作规划，可扩展至 RL |
| **大规模视频机器人 WM** | DreamDojo（ICML 2026） | 视频扩散模型 + 潜在动作 + 实体动作适配 | 可用于策略评估、模型规划和模拟训练 |
| **长时程因果视频 WM** | WALL-SS（2026） | 多尺度自回归 + 动作条件 + 长期记忆 | 使用 RL 改进世界模型本身的动作一致性 |

很多时候，WM 的结构直接决定 RL 设计，以 DreamerV3 为例(如图)，这样的系统中，RL 的主要优化对象可以是 Actor 和 Critic，世界模型则通过环境数据学习状态转移、观察和奖励预测。DreamerV3 的核心就是在模型想象出的潜在轨迹上学习策略。相较之下，WALL-SS 的 RL 主要改进生成世界的动作遵循和时间一致性。两个系统都使用 RL，但被优化的神经网络不同。

<img src="/assets/images/具身智能/自主学习/模型结构/WM的结构直接决定RL设计.png" alt="Dreamer 的模型式 RL 机制" width="900" height="450">

## WAM：World Action Model

WAM 在世界模型的基础上，进一步关心世界模型与动作策略怎样结合。同时，WAM 也需要进一步拆分。尤其不应把所有“具有视频预测能力的 VLA”自动归为同一种架构。

| 结构分支 | 推荐的主论文 | 核心结构特征 |
| :--- | :--- | :--- |
| **视频生成骨干 + 动作联合预测** | DreamZero（2026.02） | 预训练视频扩散模型，同步生成未来视频与动作 |
| **原生因果视频—动作模型** | LingBot-VA 2.0（2026.07） | 语义视觉动作 Tokenizer、因果预训练、稀疏 MoE、异步闭环执行 |
| **统一多模态世界与动作模型** | Cosmos 3（2026.06） | Mixture-of-Transformers，统一语言、视觉、视频、音频和动作的理解与生成 |
| **组合式 WM + 独立策略** | RISE（RSS 2026） | 动力学模型、进度价值模型与策略分离，实现模型内 RL |

# 模型架构怎样具体连接到 RL

接下来应建立一个贯穿综述的核心表格：模型中有什么模块、RL 更新什么、可以由哪篇方法论文验证。

| 模型类别 | 具体架构类型与代表模型 | RL 的具体优化位置 | 对应 RL 方法论文 | 优化方式 |
| :--- | :--- | :--- | :--- | :--- |
| **VLA** | 离散自回归动作模型（OpenVLA、FAST） | Action Token Policy，动作 Token 的生成概率分布 | 离散动作策略优化方向，待补直接对应的代表论文 | 对动作 Token 序列进行策略优化或偏好优化 |
| **VLA** | Flow Matching 动作生成模型（π₀、π₀.₅、π₀.₆） | Action Expert、优势条件与动作生成分布 | π*₀.₆ / RECAP | 利用价值模型估计优势，通过 Advantage-conditioned Policy Training 改进动作生成 |
| **VLA** | 冻结基础模型 + 轻量 RL 适配器（π 系列 VLA） | 新增 RL Token、轻量 Actor-Critic | RL Token | 冻结基础 VLA，通过离策略 RL 优化轻量动作策略 |
| **VLA** | Diffusion / Flow 动作策略（Diffusion Policy、Flow Policy） | 动作去噪网络、生成策略分布 | RL-100 | 在扩散去噪过程中进行 PPO 风格策略优化，并通过一致性蒸馏提高推理速度 |
| **WM** | 潜在状态动力学模型（DreamerV3、Dreamer 4） | 潜在空间中的 Actor、Critic | Dreamer 4、DreamerV3 | 通过世界模型生成想象轨迹，在潜在状态空间执行 Actor-Critic 学习 |
| **WM** | 动作条件自回归视频世界模型（WALL-SS） | 世界模型的视觉生成分布、动作条件动力学 | WALL-SS | 利用动作遵循性与长期一致性奖励优化世界模型的预测结果 |
| **WAM** | 组合式 WM + VLA（Dynamics Model + Value Model + Policy） | VLA 动作策略、想象轨迹的价值与优势估计 | RISE | 世界模型生成想象轨迹，价值模型计算优势，在想象空间中更新策略 |
| **WAM** | WM 与 VLA 交替协同优化架构（Action-conditioned WM + VLA） | 世界动力学模型与 VLA 动作策略 | VLAW | 利用真实机器人数据更新 WM，再用世界模型生成的交互数据改进 VLA，交替迭代 |

由此，RL Automation 章节便可以进一步研究：奖励、价值估计、数据收集、探索、环境构建和模型更新能否自动进行。