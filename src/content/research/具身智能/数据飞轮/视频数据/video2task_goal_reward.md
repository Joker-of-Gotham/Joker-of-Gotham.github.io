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

