---
layout: post
title: "强化学习(reinforcement learning)"
date: 2025-07-18
categories: [人工智能, 强化学习]
tags: [综述笔记]
published: true
mermaid: true
math: true
---

# 强化学习的数学基础

## 基本概念

### 强化学习的基础概名词

- **状态(State)**：表示当下环境，是做决策的唯一依据
- **动作(Action)**：做出的决策，动作种数一般用$i$表示
- **环境(Environment)**：使智能体不断变换状态的位置
- **智能体(Agent)**：动作主体
- **奖励(Reward)**：智能体执行一个动作后返回的具体数值，由实验者定义
- **状态空间(State Space)**：所有状态集合，表示为$\mathcal{S}$
- **动作空间(Action Space)**：动作的集合，表示为$\mathcal{A}$
- **策略函数(Policy Function)**：根据观测到的状态作决策控制智能体动作，记为$\pi(a \| s)=P(A=a \| S=s),\pi:\mathcal{S} \times \mathcal{A} \to [0,1]$
- **状态转移(State Transition)**：指由当前状态$s$变为$s'$的过程，该过程执行动作$a$
- **状态转移函数(State-Transition Function)**：产生新状态$s'$时用到的函数，可以是确定或随机的，如随机状态转移函数记为$p(s' \| s,a)=\mathbb{P}(S'=s' \| S=s,A=a)$
- **智能体与环境交互 (Agent Environment Interaction)**：是上述所有参量组成的一整个循环系统
    <img src="/assets/images/强化学习/强化学习智能体环境交互示意图.png" alt="描述文字" width="480" height="350">

### 强化学习中的回报(Return)

整个流程下来的奖励综合就叫**回报(Return)**，而汇报依赖于 **(i) 观测到的不具随机性数值 (ii) 未观测到的具随机性的数值**；随着时间的滞后奖励会乘以逐渐变小的**折扣率(Discount Factor)**，表示为**折扣回报 (Discounted Return)**：

$$U_t=\sum\limits_{i=0}^{n} \gamma^{i} \cdot R_{t+i},\gamma \in [0,1]$$

### 价值函数——回报的期望

由于在整个流程结束前，都无法获取$U_t$的实际值，因此需要对$U_t$求期望从而尽可能消除其中的随机性；考虑到这种随机性来源于未来，因此可以求得条件期望如下：

$$Q_{\pi}(s_t,a_t)=\mathbb{E}_{\{S_{t+i},A_{t+i} \| i=1,2,\cdots\}}\left[
 \begin{matrix}
   U_{t} \| S_t=s_t,A_t=a_t
  \end{matrix}
  \right]$$
  
$$=\int \cdots \int P(\{S_{t+i},A_{t+i} \| i=1,2,\cdots\} \| s_t,a_t) \cdot U_t ds_{t+1}da_{t+1} \cdots ds_{t+n}da_{t+n}$$

$$=\int_{\mathcal{S}}ds_{t+1} \int_{\mathcal{S}}da_{t+1}\cdots \int_{\mathcal{S}}ds_{t+n} \int_{\mathcal{S}}da_{t+n}\left(
 \begin{matrix} \Pi_{k=t+1}^{n}p(s_k \| s_{k-1},a_{k-1}) \cdot \pi(a_k \| s_k) \end{matrix}
  \right) \cdot U_t$$

根据公式可得，$Q_{\pi}(s_t,a_t)$依赖的三个因素：

- 当前状态$s_t$越好，$Q_{\pi}(s_t,a_t)$越大，回报期望值越大
- 当前动作$a_t$越好，$Q_{\pi}(s_t,a_t)$越大，回报期望值越大
- 策略函数$\pi$越好，$Q_{\pi}(s_t,a_t)$越大，回报期望值越大

其中最优动作价值函数能排除策略的影响，通俗理解为其作为一个先知执行尽量高收益的动作；表示为：

$$Q_{*} (s_t,a_t)=\max_{\pi} \ Q_{\pi} (s_t,a_t) \to \pi * =argmax_{\pi} \  Q_{\pi} (s_t,a_t)$$

状态价值函数则用于量化双方胜算，表示为：

$$V_{\pi}(s_t)=\mathbb{E}_{A_t \sim \pi(\cdot \| s_t)} \left[
 \begin{matrix}
   Q_{\pi}(s_t,A_t)
  \end{matrix}
  \right] = \sum\limits_{a \in \mathcal{A}}\pi(a \| s_t) \cdot Q_{\pi}(s_t,a)=\mathbb{E}_{A_t,S_{t+1},A_{t+1},\cdots,S_{n},A_{n}} \left[
 \begin{matrix}
   U_{t} \| S_t=s_t
  \end{matrix}
  \right]$$

## 强化学习过程中随机性的来源

基于当前状态$s$，考虑**策略函数的随机性**产生新动作；基于新动作和当前状态，考虑**状态转移函数的随机性**，产生新状态；基于**新状态的随机性**进而产生新奖励，该**奖励也是随机的**；从而形成一整条**随机的轨迹(Trajectory)**，完整简洁的数学表达如下：

$$Trajectory:s_t \stackrel{\pi(\cdot \| s_t)}{\longrightarrow} a_t \stackrel{p(\cdot \| s_t,a_t)}{\longrightarrow} s_{t+1},r_t \to \cdots $$

回报过程中其实也具有随机性，即在一定状态之后的部分是未知的，因此其状态和动作也都是未知的

## 策略学习与价值学习

强化学习方法主要分为两类：一类是基于模型的方法(Model-Based)，另一类是无模型方法(Model-Free)；无模型方法又可以分为价值学习和策略学习。

**价值学习(Value-Based Learning)**指学习最优价值函数$Q_{*}(s,a)$，使智能体通过$Q_{*}$做决策选出最好的动作，即每观测到一个状态$s_t$，把其输入至$Q_{*}$函数，让$Q_{*}$对所有动作做评价，选出得到最优评价的动作；该过程用公式表示为：

$$a_t=\argmax\limits_{a \in \mathcal{A}} Q_{*}(s_t,a)$$

**策略学习(Policy-Based Learn)**指学习策略函数$\pi(a \| s)$；即将观测状态$s_t$输入到$\pi$函数中，让其对所有动作作评价，进而得到概率值$\pi(* \| s_t)$；然后智能体作随机抽样，执行选中动作
