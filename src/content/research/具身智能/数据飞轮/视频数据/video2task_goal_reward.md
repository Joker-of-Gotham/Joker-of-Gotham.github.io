---
title: Video2Task：让视频提供任务、目标和奖励
slug: video2task_goal_reward
date: 2026-09-21
kind: reflection
cover: /assets/img/covers/GBC-仁菜.webp
order: 11
summary: 这部分整理，如何从视频数据中提取任务、目标和奖励。具体以 AVID、DVD、VIP、LIV 和 RoboCLIP 为典型案例进行分析。
tags: [研究札记, 视频数据, 任务提取, 目标与奖励设置]
papers:
  - title: "AVID: Learning Multi-Stage Tasks via Pixel-Level Translation of Human Videos"
    url: https://arxiv.org/html/1912.04443v3
    year: 2020
  - title: "Learning Generalizable Robotic Reward Functions from “In-The-Wild” Human Videos"
    url: https://arxiv.org/html/2103.16817v1
    year: 2021
  - title: "Towards Universal Visual Reward and Representation via Value-Implicit Pre-Training"
    url: https://arxiv.org/html/2210.00030v2
    year: 2023
  - title: "LIV: Language-Image Representations and Rewards for Robotic Control"
    url: https://arxiv.org/html/2306.00958v1
    year: 2023
  - title: "RoboCLIP: One Demonstration is Enough to Learn Robot Policies"
    url: https://arxiv.org/html/2310.07899v1
    year: 2023
---

# AVID: Automated Visual Instruction-Following with Demonstrations (自动化视觉指令遵循法)

机器人可以通过多阶段学习掌握复杂任务，但是任务分解和设置各阶段奖励却非常困难。虽然可以使用模仿学习来解决这个困难，但是该过程往往需要手动引导或进行远程操作，且非常繁琐。

因此，可以尝试使用人类示范视频，利用这些示范视频来提供自然的、详细的指导，从而让机器人能够借助任务的阶段性特征来有效学习。

本文则提出一种方法：

1. 首先，构建人类示范。
2. 然后，借助 CycleGAN 框架，在像素级别将人类的示范转化为机器人执行任务的图像。
3. 在处理多阶段任务时，人类的示范被简化为几张指示图片，代表了任务的各个阶段。
4. 这些指示图片通过 CycleGAN 进行转换，然后将其作为基于模型的强化学习的奖励，从而让机器人能够反复练习这项技能，进而掌握其物理执行能力。

这种方法被命名为“自动化视觉指令遵循法” (AVID)。

## 学习预备阶段

该部分包括：将人类的行为转化为可处理的格式，对机器人的图像和行为进行建模。

### 无监督的图像到图像转换

人机演示翻译问题可以看作无监督的图像到图像翻译问题，目标是在没有成对数据的情况下、将源域中的图像映射到目标域。

这里，假设一个可以在无监督形式下被发现的双射映射，目标是学习两个映射框架：$G: \ X \to Y$ 以及 $F: \ Y \to X$。这些映射是为了欺骗用来区分源域和目标域中真是图像域翻译结果的判别器 $D_Y$ 和 $D_X$，进而可以构造出损失函数：

$$\mathcal{L}(G,D_Y)=\mathbb{E}[\log D_Y(y)+ \log (1-D_Y(G(x)))]$$

对 $F$ 和 $D_{X}$ 也和上式类似。

此外，需要引入额外的损失项，促进 $G$ 和 $F$ 之间的循环一致性：

$$\mathcal{L}_{cyc}(G,F)=\mathbb{E}[|| x-F(G(x))||_1 + || y-G(F(y))||_1]$$

进而得到 CycleGAN 的整体训练目标：

$$\mathcal{L}_{CG}(G,F,D_X,D_Y)=\mathcal{L}_{GAN}(G,D_Y)+\mathcal{L}_{GAN}(F,D_X)+\lambda \mathcal{L}_{cyc}(G,F)$$

该部分使用 CycleGAN，将人类演示视频翻译为机器人演示视频。

### 结构化表示学习 (Structured Representation Learning)

在基于图像的控制学习中，状态表示学习是一种提高数据利用效率的有效方法，通过定义一个概率性的、具有时间结构的潜在变量模型来学习图像观测到的潜在状态表示。

<img src="/assets/images/具身智能/数据飞轮/视频数据/avid-pgm.png" alt="AVID使用的潜变量模型用于表示机器人图像和动作。其中，生成模型用实线表示，而变分族和编码器则用虚线表示。" width="400" height="800">

首先定义：

- **原始图像 $o_t$**：RGB 摄像机拍到的图片，图片里包含很多无用细节（如墙壁颜色、背景光照等）。
- **潜在状态 $s_t$**：机器人的核心物理特征（比如：门把手的角度、机械臂末端的位置，可能只需要少数几个数字就能描述）。

直接用像素级图像去算机器人下一步该怎么走，计算量太大且极其笨拙，因此状态表示学习要做的就是：

- **压缩**：把庞大的图像 $o_t$ 压成一串很短的向量 $s_t$。
- **预测（动态模型）**：在低维的 $s_t$ 空间里预测“如果我做动作 $a_t$，下一刻的状态 $s_{t+1}$ 会变成什么样”。
- **解码**：重构网络。把低维向量 $s_t$ 解码还原成原始图像 $o_t$，确保 $s_t$ 没有丢失关键的视觉信息。

在该过程中，首先加假设初始的低维状态假设符合标准正态分布：

$$p(s_1)=\mathcal{N}(s_{1};\mathbf{0},\mathbf{I})$$

进一步构建系统动态模型，计算转移概率。该过程给定现在的状态 $s_t$ 和执行的动作 $a_t$，神经网络（用 $\mu$ 和 $\Sigma$ 表示）会预测出下一个时刻状态 $s_{t+1}$ 的高斯分布。

$$p(s_1)=\mathcal{N}(s_{t+1};\mu (s_t,a_t),\Sigma (s_t,a_t))$$

然后使用解码器重构，把低维向量 $s_t$ 解码还原成原始图像 $o_t$，确保 $s_t$ 没有丢失关键的视觉信息：

$$p(\mathbf{o}_t | \mathbf{s}_t)$$

为了学习出这一模型，引入一个变分分布 $q(\mathbf{s}_{1:T};\mathbf{o}_{1:T})$ 近似表示后验分布 $q(\mathbf{s}_{1:T} | \mathbf{o}_{1:T},\mathbf{a}_{1:T})$，$1:T$ 表示完整轨迹。进而可以使用均值场变分近似方法来构建模型：

$$q(\mathbf{s}_{1:T};\mathbf{o}_{1:T})=\Pi_{i} q(\mathbf{s}_{t};\mathbf{o}_{t})$$

通俗来说，该编码器的意义是，引入一个编码器 $q(s_t; o_t)$ 用它来近似真正的状态分布。因为我们无法直接得知真实的状态 $s_t$，只能通过图像 $o_t$ 反推（即计算后验分布 $p(s_1:T\vert{}o_1:T, a_1:T)$），但这在数学上不可积（Intractable）。其中，均值场近似（Mean Field Variational Approximation），意思是假设各个时刻的状态变化在给定当前观测时是相对独立简化的，直接表示为各时刻的乘积。

为了训练该模型，采用变分下界 ELBO：

$$\text{ELBO} = \underbrace{\mathbb{E}_q [\log p(\mathbf{o}_t\vert{}\mathbf{s}_t)]}_{\text{第一项：重构项}} - \underbrace{D_{\text{KL}}(q_{\mathbf{s}_1} \parallel p_{\mathbf{s}_1})}_{\text{第二项：初始约束}} - \underbrace{\mathbb{E}_q \left[\sum_{t=1}^{T-1} D_{\text{KL}}(q_{\mathbf{s}_{t+1}}(\cdot;\mathbf{o}_{t+1}) \parallel p_{\mathbf{s}_{t+1}}(\cdot\vert{}\mathbf{s}_t, \mathbf{a}_t))\right]}_{\text{第三项：动态一致性约束}}$$

其中：

- 重构项 (Reconstruction Term)：从 $s_t$ 解码出的图片 $o_t$ 和实际看到的图片越像越好（要求 $s_t$ 保留图片信息）。
- 初始约束 (Initial KL Divergence)：第一个时刻预测的状态分布，不能偏离预设的先验分布 $p(s_1)$ 太远。
- 动态一致性约束 (Transition KL Divergence)：要求“用下一张图片直接编码出的状态 $q(s_{t+1}\vert{}o_{t+1})$”与“用上一时刻状态加上动作推导出的状态 $p(s_{t+1}\vert{}s_t, a_t)$”尽可能一致。

该部分利用翻译好的机器人图像序列，提炼出纯粹的物理状态轨迹 $\mathbf{s}_{1:T}$（如物体与机械臂的相对位姿），进而以提炼出的 $\mathbf{s}_T$ 作为目标状态（Goal State），利用学习到的隐空间动态模型 $p(\mathbf{s}_{t+1} \vert{} \mathbf{s}_t, \mathbf{a}_t)$ 进行预演规划（Latent Planning），计算出机械臂当前应该执行的物理动作 $\mathbf{a}_t$。

## 基于示范的自动化视觉指令执行技术 (AVID, Automated Visual Instruction-Following with Demonstrations)

该技术的目标是，在最少的人员投入、专业知识以及设备需求的情况下，实现机器人的学习功能。

<img src="/assets/images/具身智能/数据飞轮/视频数据/avid-cyclegan.png" alt="用于训练 CycleGAN 算法的机器人数据示例。上图展示了机器人进行取咖啡杯操作的场景，下图则展示了机器人随机移动的场景。虽然机器人是随机移动的，但我们还是设计了多种不同的场景，例如让机器人负责递送咖啡杯或打开抽屉等。" width="400" height="800">

### CycleGAN 的训练

首先，需要训练 CycleGAN，其需要来自源域和目标域的训练数据。研究者发现，使用多样化的数据对于捕捉各种可能的场景以及生成真实的转换效果非常重要。

为此，研究者从人类域中提取的训练图像中包含了人类的行为表现，同时包含了少量“随机”数据——在这些数据中，人类只是在场景中自由移动，并没有刻意执行特定的任务。而从机器人域中提取的训练图像则完全由机器人执行随机采样的行为组成，如上图所示，在这些场景中，研究者会通过随机改变物体的位置或给机器人提供可握持的物品来手动调整环境。

这类人类干预行为并不需要任何特殊的设备或技术能力，研究者发现，只需少量此类干预措施就足以完成 CycleGAN 的数据收集任务。因此，与提供一系列机器人演示相比，这种整体操作方式所需的人工专业知识和努力要少得多。

### 基于关键帧或状态的模仿学习

训练好 CycleGAN 模型后，可通过从 CycleGAN 翻译好的机器人视频中选择一些关键帧或状态来进行模仿学习。对于多阶段任务来说，通过提取并学习那些与各个阶段完成相对应的关键帧，从而实现目标的分离的方式尤为自然，因为在 **多阶段任务** 中，实现对整体成功至关重要的特定状态，比精确匹配特定的轨迹要重要得多。

在多阶段任务中，第 $i$ 阶段的指令图像从翻译后视频的第 $t_i$ 帧中提取，其中时间步长 $\{ t_1, \cdots, t_s \}$ 由用户手动指定；自然的，对应阶段的目标图像就是 $\mathbf{o}_{t_i}$。同时对每一个阶段，为了指定奖励函数，需要为每个阶段训练成功分类器 $\{ \mathcal{C_1},\cdots,\mathcal{C_{s}} \}$。其中，$\mathcal{C}_i$ 阶段会提供时间步 $t_i$ 时的图像作为正例，而其它所有机器人图像被作为负例。该分类器的奖励信号，是直接用分类器输出的对数概率（Log-probability）。如果分类器觉得当前像成功帧，奖励就高。这样彻底摆脱了人工设计数学奖励公式（Reward Shaping）的麻烦。

进一步为了做到高效控制，研究者通过隐空间 MPC 规划，首先使用 $q(\mathbf{s}_t,\mathbf{o}_{t})$ 对图像进行编码，得到当前地位潜在状态 $\mathbf{s}_t$；进一步通过 Latent MPC/CEM 交叉熵采样随机生成动作序列 $( \mathbf{a}_{t}, \mathbf{a}_{t+1}, \dots )$，进一步用 $p(\mathbf{s}_{t+1}\vert{}\mathbf{s}_t, \mathbf{a}_t)$ 推演出潜在状态 $s_{t+k}$；然后将获得的潜在状态作为输入提供给分类器 $\mathcal{C}_i$，分类器输出的对数概率可以作为奖励信号，通过这种方式提供奖励，无需依赖任何人工设计的奖励 shaping 或 instrumentation 机制。此外，使用学习到的分类器还可以实现在线优化，这为人类提供了反馈的机会。该方法使用模型，能进一步降低学习过程中对人类监督的需求。

> 潜在空间模型预测控制方法  
> 具体来说，本文使用的强化学习算法是 **潜在空间模型预测控制方法**。该方法采用基于采样优化的交叉熵方法来迭代寻找最优的动作序列。在搜索过程中，会评估潜在空间中由模型生成的轨迹，这些轨迹的奖励函数由研究者设计的分类器给出。随后，机器人会执行优化出的动作序列中的第一个动作。  
> 当机器人尝试进入阶段 $s$，规划器会使用 $\mathcal{C}_{s}$ 的日志概率作为奖励函数，并试图突破作为超参数的分类器阈值 $\alpha \in [0,1]$，阈值未达到时，规划器会自动切换到 $\mathcal{C}_{s-1}$ 模式，即尝试回到该阶段初始状态。同时约束机器人最多会进行 $K$ 次这种前向重置操作，该值也是一个超参数。  
> 如果在规划阶段就达到了阈值，机器人则向用户发出请求，从而让用户指示任务的成功或失败：如果失败，机器人则切换回重置模式，然后循环继续；如果成功，则进入下一阶段，并重复相同过程。其中，$\mathcal{C}_{s+1}$ 用于指定目标，$\mathcal{C}_{s}$ 用于指定重置点。这种分阶段的学习方式可以避免一次性尝试完整任务时可能出现的错误累积问题。  
{: .prompt-info }

## 实验结果

该项目的实验探索三个问题：

- AVID 能否直接从人类演示中解决时间跨度较长的基于视觉的任务？
- 使用教学图像和潜在空间规划能给我们带来哪些好处（如果有的话）？
- 如果我们无法直接观看机器人演示，会产生哪些成本（如果有的话）？

### 方法对比

该研究使用以下方法和 AVID 作对比：

- **行为克隆 (Behavioral Cloning, BC)**：利用专家遥控操作（Teleoperation）获取的“观察-动作”数据，直接进行监督学习来拟合策略。该方法作为拥有完整动作标注的“理想基线”。因其不具备阶段概念且存在单步误差累积（分布偏移）问题，以此证明 AVID “分阶段强化学习” 的优势。
- **基于观察的行为克隆 (BCO)**：同样使用遥控数据，但假设无法获取动作，仅有图像观察。先训练一个逆模型（Inverse Model）去“反推”动作，再利用推断出的动作做行为克隆。评估在缺乏直接动作标注时，仅靠“反推动作+克隆”的表现，作为无动作监督下的基础基线。
- **全视频消融 (Full-video Ablation)**：不将任务拆解为关键阶段，而是直接使用完整的真人演示视频（经域转换后），结合 BCO 算法进行端到端模仿学习。验证 AVID “仅抽取阶段指令图像” 的轻量化设计是否比“直接学习整段连续视频”更高效且有效。
- **像素空间消融 (Pixel-space Ablation / DVF)**：保留 AVID 的分阶段训练、学习重置和人工反馈机制，但将其中的“隐空间（Latent Space）规划”替换为基于 DVF（深度视觉预测）的“像素空间（Pixel Space）规划”。控制其他变量一致，专门验证 AVID 在 “高维隐空间中进行规划” 相比于“直接在原始像素空间规划”的性能提升。
- **时间对比网络 (TCN)**：通过时序一致性损失（Temporal Consistency）学习单视角人类视频的表征嵌入，并以当前轨迹与人类演示在特征空间中的距离（负欧氏距离）作为 RL 的奖励信号。验证 AVID 所采用的 “阶段分类器奖励” 是否优于这种基于“时序嵌入特征距离”的经典特征奖励机制。

### 实验结果

研究使用两个视觉领域的、时间跨度较长的任务来评估 AVID 方法：操作个人咖啡机和从关闭的抽屉中取出杯子。这些任务表明，AVID 方法能够通过遵循从人类演示中提取的一系列指令，学习按顺序组合多种技能。

| 监督 (Supervision) | 方法 (Method) | 咖啡制作<br>Coffee making<br>Stage 1 | 咖啡制作<br>Coffee making<br>Stage 2 | 咖啡制作<br>Coffee making<br>Stage 3 | 杯子取出<br>Cup retrieval<br>Stage 1 | 杯子取出<br>Cup retrieval<br>Stage 2 | 杯子取出<br>Cup retrieval<br>Stage 3 | 杯子取出<br>Cup retrieval<br>Stage 4 | 杯子取出<br>Cup retrieval<br>Stage 5 |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Human Demos**<br>人类演示 | **AVID (ours)**<br>AVID（我们的） | 100% | 80% | 80% | 100% | 100% | 100% | 80% | 70% |
| **Human Demos**<br>人类演示 | **Full-video ablation**<br>全视频消融 | 70% | 10% | 0% | 0% | 0% | 0% | 0% | 0% |
| **Human Demos**<br>人类演示 | **Pixel-space ablation**<br>像素空间消融 | 60% | 20% | 0% | 50% | 50% | 30% | 10% | 0% |
| **Human Demos**<br>人类演示 | **TCN [46]** | 10% | 10% | 0% | 60% | 20% | 0% | 0% | 0% |
| **Teleoperated Robot Demos**<br>遥控机器人演示 | **BCO [56]** | 80% | 30% | 0% | 30% | 10% | 0% | 0% | 0% |
| **Teleoperated Robot Demos**<br>遥控机器人演示 | **Behavioral Cloning**<br>行为克隆 | 90% | 90% | 90% | 100% | 100% | 60% | 60% | 40% |

# Learning Generalizable Robotic Reward Functions from “In-The-Wild” Human Videos (领域无关视频判别器， DVD)

视频平台中具有大量真实场景数据，但利用这类“真实场景”的人类数据进行机器人学习会面临诸多挑战，包括：观察空间差异、智能体形态与场景视觉呈现差异、人类和机器人的动作空间差异、视频噪声大且质量参差不齐等等。

此前的相关研究已大量关注逆强化学习或逆最优控制问题，即从任务演示中学习奖励函数的问题；进一步的，本研究聚焦于学习用于视觉机器人操作的可泛化的多任务奖励函数，该函数可通过对“展示人类完成任务的单个视频”进行条件化，为不同的任务生成奖励。

另外，也有许多研究探讨了如何从人类视频中学习机器人行为，包括在人类视频中显式进行物体或手部跟踪、通过像素转换讲人类演示或目标转换为机器人视角、对人类视频中的动作/奖励/状态值进行推测等等。

此外，许多先前的研究也探讨了如何利用广泛的数据集来增强机器人学习的泛化能力。这些研究主要集中于如何以可扩展的方式收集大型且多样化的机器人数据集，以及如何以离线或在线的方式从这类数据中学习通用策略等。

针对上述问题和已有研究进展，本研究提出方法——领域无关视频判别器 (DVD)，来预测两个视频是否在完成相同的任务。具体来说，通过利用许多人类视频数据集自带的活动标签，以及少量机器人演示视频，该模型能够捕捉来自截然不同视觉领域的视频之间的功能相似性。训练完成后，DVD 以一段人类视频作为演示，以机器人的行为作为另一段视频，并输出一个分数，该分数可以有效地衡量任务的成功或奖励。

## 问题陈述与奖励函数设计

记机器人完成 $K$ 个任务的集合为 $\mathcal{T} = \{\mathcal{T}_i\}_{i=1}^K$，其中每个任务 $\mathcal{T}_i$ 蕴含一个潜在的标量奖励函数 $\mathcal{R}_i$。对于任意给定任务 $\mathcal{T}_i$，机器人与人类分别运行于有限时域马尔可夫决策过程（MDP）$\mathcal{M}_r^i = (\mathcal{S}, \mathcal{A}_r, p_r, \mathcal{R}_i, T)$ 与 $\mathcal{M}_h^i = (\mathcal{S}, \mathcal{A}_h, p_h, \mathcal{R}_i, T)$ 中。

在此设定下，双方共享以 RGB 图像表征的状态空间 $\mathcal{S}$、任务奖励函数 $\mathcal{R}_i$ 及回合最大时限 $T$，但在动作空间（机器人的 $\mathcal{A}_r$ 与人类的 $\mathcal{A}_h$）和转移动力学（机器人的 $p_r(s_{t+1} \mid s_t, a_t^r)$ 与人类的 $p_h(s_{t+1} \mid s_t, a_t^h)$）上存在域间差异。

### 任务奖励函数 $\mathcal{R}_{i}$

假设任务奖励函数 $\mathcal{R}_{i}$ 不可观测，需要通过任务视频推断。本研究假设时间 $t$ 的奖励取决于 $H \leq T$ 个时间步，进一步构造参数模型，该模型能根据任务指定的视频估计每个任务的潜在奖励函数。数学表达为：

$$
\begin{aligned}
& \text{Given } \mathcal{T} = \{\mathcal{T}_i\}_{i=1}^K, \quad d_i = s_{1:t_{d_i}}^* \in \mathcal{S}^{t_{d_i}} \\
& \text{where } \mathcal{M}_r^i = (\mathcal{S}, \mathcal{A}_r, p_r, \mathcal{R}_i, T), \quad \mathcal{M}_h^i = (\mathcal{S}, \mathcal{A}_h, p_h, \mathcal{R}_i, T) \\
& \text{s.t.} \\
& \quad \mathcal{S} \subseteq \mathbb{R}^{H \times W \times 3} \\
& \quad p_r: \mathcal{S} \times \mathcal{A}_r \to \Delta(\mathcal{S}), \quad p_h: \mathcal{S} \times \mathcal{A}_h \to \Delta(\mathcal{S}) \\
& \quad \mathcal{A}_r \neq \mathcal{A}_h, \quad p_r \neq p_h \\
& \quad \mathcal{R}_i: \mathcal{S}^H \to \mathbb{R} \\
& \text{Find } \mathcal{R}_\theta: \mathcal{S}^H \times \mathcal{S}^* \to \mathbb{R} \\
& \text{s.t. } \mathcal{R}_\theta(s_{1:H}, d_i) \approx \mathcal{R}_i(s_{1:H}), \quad \forall i \in \{1, \dots, K\}, \, s_{1:H} \in \mathcal{S}^H
\end{aligned}
$$

其中，$\mathcal{T}_i$（共 $K$ 个）表示具体任务，对应人类提供的参考视频演示 $d_i$；$\mathcal{M}_r^i$ 与 $\mathcal{M}_h^i$ 分别表示机器人和人类的马尔可夫决策过程，两者共享 RGB 图像状态空间 $\mathcal{S}$（分辨率 $H\times W$）、最大回合时限 $T$ 以及真实奖励函数 $\mathcal{R}_i$，但在动作空间（$\mathcal{A}_r, \mathcal{A}_h$）与环境动力学（$p_r, p_h$）上互相独立；连续 $H$ 步状态构成的轨迹 $s_{1:H}$ 用于捕获非马尔可夫时序特征；而 $\mathcal{R}_\theta$ 则是待学习的目标神经网络，负责根据机器人当前轨迹 $s_{1:H}$ 与人类演示 $d_i$ 计算出逼近真实奖励 $\mathcal{R}_i$ 的标量评估值。

### 奖励函数 $\mathcal{R}_\theta(s_{1:H}, d_i)$

为训练奖励函数 $\mathcal{R}_\theta$，研究者构建由跨域视觉演示构成的非对称双语料数据集，仅依赖无标注的原始 RGB 图像序列推断奖励。

$$
\begin{aligned}
& \text{Given Datasets } \mathcal{D}_h = \{\mathcal{D}_{\mathcal{T}_i}^h\}_{i=1}^N, \quad \mathcal{D}_r = \{\mathcal{D}_{\mathcal{T}_i}^r\}_{i=1}^M \\
& \text{s.t.} \\
& \quad M \le N < K, \quad M \ll N \\
& \quad \{\mathcal{T}_i\}_{i=1}^M \subset \{\mathcal{T}_i\}_{i=1}^N \subset \{\mathcal{T}_i\}_{i=1}^K \\
& \quad \mathcal{D}_{\mathcal{T}_i}^h = \{ d_{i,j}^h \}_{j=1}^{n_i^h}, \quad \mathcal{D}_{\mathcal{T}_i}^r = \{ d_{i,k}^r \}_{k=1}^{n_i^r}, \quad n_i^r \ll n_i^h \\
& \quad d_{i,j}^h, d_{i,k}^r \in \mathcal{S}^* = \bigcup_{t=1}^{\infty} \mathcal{S}^t, \quad \mathcal{S} \subseteq \mathbb{R}^{H \times W \times 3} \\
& \quad a_t^h, a_t^r \notin \text{Observed}, \quad s_{\text{low-dim}} \notin \text{Observed} \\
& \quad \mathbb{P}(\mathcal{S} \mid \mathcal{D}_h) \neq \mathbb{P}(\mathcal{S} \mid \mathcal{D}_r)
\end{aligned}
$$

数据集中，$\mathcal{D}_h$ 与 $\mathcal{D}_r$ 分别为人类与机器人的视觉演示集合；$N$ 与 $M$ 代表各自覆盖的任务数，满足 $M \ll N < K$，体现了“人类数据覆盖广、机器人数据极其稀缺”的非对称假设；$d_{i,j}^h$ 与 $d_{i,k}^r$ 为纯 RGB 图像构成的变长视频序列，且单任务人类样本数 $n_i^h$ 远大于机器人样本数 $n_i^r$；系统的关键约束在于完全无动作（$a_t$）与低维状态信息叠加，且状态分布差异 $\mathbb{P}(\mathcal{S} \mid \mathcal{D}_h) \neq \mathbb{P}(\mathcal{S} \mid \mathcal{D}_r)$ 刻画了视角、背景及具身形态所带来的巨大领域偏移（Domain Gap）。

评估阶段旨在以目标演示为条件隐式推断奖励信号，既要保障已知任务的高效解决，又要实现对未见过新任务的零样本（Zero-Shot）泛化。

$$
\begin{aligned}
& \text{Goal: Optimize } \pi^* = \arg\max_\pi \mathbb{E}_{\tau \sim \pi} \left[ \sum_{t=1}^T \mathcal{R}_\theta(s_{1:t}, d) \right] \\
& \text{s.t.} \\
& \quad \text{Task Completion: } d = d_i \implies \text{Solves } \mathcal{T}_i, \quad \forall \mathcal{T}_i \in \{\mathcal{T}_k\}_{k=1}^N \\
& \text{Zero-Shot Generalization: } d = d_{\text{new}} \implies \text{Solves } \mathcal{T}_{\text{new}}, \quad \forall \mathcal{T}_{\text{new}} \notin \{\mathcal{T}_k\}_{k=1}^N
\end{aligned}
$$

公式表达了策略 $\pi^*$ 在奖励函数 $\mathcal{R}_\theta$ 驱动下的决策优化过程：核心在于让 $\mathcal{R}_\theta$ 具备**条件化表征**与**跨任务泛化**能力——当输入已知任务的演示 $d_i$ 时，能准确引导机器人完成当前任务 $\mathcal{T}_i$；当输入完全未见过的新任务演示 $d_{\text{new}}$ 时，无需重新训练即可仅凭该演示引导机器人完成全新任务 $\mathcal{T}_{\text{new}}$。

