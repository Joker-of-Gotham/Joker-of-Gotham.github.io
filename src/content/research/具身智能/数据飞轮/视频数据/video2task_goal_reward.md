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

