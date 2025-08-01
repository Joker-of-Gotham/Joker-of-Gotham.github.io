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

    <div style="text-align: center;">
    <img src="/assets/images/强化学习/强化学习智能体环境交互示意图.png" alt="描述文字" width="480" height="350">
    </div>

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

$$Q_{\ast} (s_t,a_t)=\max_{\pi} \ Q_{\pi} (s_t,a_t) \to \pi * =arg \max_{\pi} \  Q_{\pi} (s_t,a_t)$$

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

**价值学习(Value-Based Learning)**指学习最优价值函数$Q_{\ast}(s,a)$，使智能体通过$Q_{\ast}$做决策选出最好的动作，即每观测到一个状态$s_t$，把其输入至$Q_{\ast}$函数，让$Q_{\ast}$对所有动作做评价，选出得到最优评价的动作；该过程用公式表示为：

$$a_t=arg \max_{a \in \mathcal{A}} Q_{\ast}(s_t,a)$$

**策略学习(Policy-Based Learn)**指学习策略函数$\pi(a \| s)$；即将观测状态$s_t$输入到$\pi$函数中，让其对所有动作作评价，进而得到概率值$\pi(* \| s_t)$；然后智能体作随机抽样，执行选中动作

# 价值学习

## DQN网络

### DQN网络基本概念

构造DQN网络的目的是通过重复训练得到最优价值函数$Q_{\ast}$，其的逼近记为$Q(s,a;\bf{w})$，其中$w$为神经网络参数；在训练DQN时则需要对$w$求参数，具体表达为：

$$\bigtriangledown_w Q(s,a;{\bf{w}})=\frac{\partial Q(s,a;{\bf{w}})}{\partial {\bf{w}}}$$

<img src="/assets/images/强化学习/DQN网络.webp" alt="描述文字" width="680" height="360">

### DQN训练方法：时间差分算法(Temporal Difference)

#### DQN的基本流程

- **步骤一**：确定起始点$s$和终止点$d$，随机取$\bf{w}$作预测$\hat{q}=Q(s,a;{\bf{w}})$
- **步骤二**：统计实际值$y$，然后利用预测值和实际值求导：

    $${\bf{w}}'={\bf{w}}-\alpha \cdot \bigtriangledown_w L({\bf{w}})={\bf{w}}-\alpha \cdot (\hat{q}-y)\bigtriangledown_w Q(s,d;{\bf{w}}),L({\bf{w}})=\frac{1}{2} \left[
 \begin{matrix}
   Q(s,d;{\bf{w}})-y
  \end{matrix}
  \right]^2$$
- **步骤三**：重复该过程至预测与实际用时一致

在实际过程中途，可以对预测作修正，得到TD目标(TD Targe)记为$\hat{y}$；将$\hat{y}$取代上式的$y$，记TD误差(TD error) $\delta=\hat{q}-\hat{y}$；进一步不断更新参数即可

#### 利用TD训练DQN

由定义得回报的计算公式为：

$$U_t=\sum\limits_{k=t}^{n}\gamma^{k-t} \cdot R_k=R_t+U_{t+1}=R_t+\sum\limits_{k=t+1}^{n}\gamma^{k-t-1} \cdot R_k$$

最优价值函数写作：

$$Q_{\ast}(s_t,a_t)=\max_{\pi} \mathbb{E} \left[
 \begin{matrix}
   U_{t} \| S_t=s_t,A_t=a_t
  \end{matrix}
  \right]$$

从上述两式可推导出最优贝尔曼方程：

$$\underbrace{Q_{\ast}(s_t,a_t)}_{U_t的期望}=\mathbb{E}_{S_{t+1} \sim p(\cdot \| s_t,a_t)} [R_t + \gamma \cdot \underbrace{\max\limits_{A \in \mathcal{A}} Q_{\ast}(S_{t+1},A)}_{U_{t+1}的期望}\| S_t=s_t,A_t=a_t ]$$

当智能体执行动作$a_t$，则可以利用 $p(s_{t+1} \| s_t,a_t)$ 计算出 $s_{t+1}$ ，使得 $s_t,a_t,s_{t+1}$ 都被观测到；进而观测到$r_t$，从而拥有四元组$(s_T,a_t,r_t,s_{t+1})$，进而计算出 $r_t+\max\limits_{a \in \mathcal{A}} \gamma \cdot Q_{\ast}(s_{t+1},a)$ ，以此看作项 $${\mathbb{E}}_{S_{t+1} \sim p(\cdot \| s_t,a_t)} [R_t + \gamma \cdot \max\limits_{A \in \mathcal{A}} Q_{\ast}(S_{t+1},A) \| S_t=s_t,A_t=a_t ]$$ 的近似；然后 $$将{Q_{\ast}} (s,a)替换为{Q(s,a;{\bf{w}})}$$ 得到：

$$\underbrace{Q(s,a;{\bf{w}})}_{预测\hat{q_t}} \approx \underbrace{r_t+\gamma \cdot Q_{\ast}(s_{t+1},a;\bf{w})}_{TD目标\hat{y_t}} $$

然后重复DQN基本流程中的步骤即可。

**训练流程**

根据四元组 $(s_T,a_t,r_t,s_{t+1})$ 可以求出DQN的观测值，以及TD目标和TD误差；由于算法所需数据为四元组，与控制智能体运动的策略 $\pi$ 无关，因此可以用任何策略控制智能体与环境交互，并记录算法轨迹作为训练数据。因此**DQN的训练可以分为两个独立部分**：

- 收集训练数据：可以用任何策略 $\pi$ 与环境交互，该策略被称作**行为策略(Behavior Policy)**，常用的是$\epsilon -greedy$策略：
    
    $$ a_t=\left\{ \begin{aligned} & arg \max_{a} Q(s,a;{\bf{w}})\ \ \ \ \ \ 以概率(1-\epsilon) \\ & 均匀抽取\mathcal{A}中的一个动作 \ \ \ \ 以概率\epsilon \end{aligned} \right.$$

    智能体在整个过程中的轨迹记作 $\{ s_i,a_i,r_i \| i=1,2,\cdots,n \}$ ，把一条轨迹划为$n$个四元组 $(s_T,a_t,r_t,s_{t+1})$ 存入数组，从而得到经验回放数组(Reply Buffer)

- 更新参数${\bf{w}}$
    随机从经验回放数组中取一个四元组记作 $(s_j,a_j,r_j,s_{j+1})$ ，设当前DQN参数为$w_{now}$；执行下面步骤对参数做更新得到新参数 $\bf{w}_{new}$ ：

    - 对DQN作正向传播，得到Q值： $$\hat{q}_{j}=Q(s_{j},a_{j},{\bf{w}}_{now})和\hat{q}_{j+1}=\max\limits_{a \in \mathcal{A}} Q(s_{j+1},a_{j},{\bf{w}}_{now})$$
    - 计算TD目标和TD误差： $$\hat{y}_{j}=r_j+\gamma \cdot \hat{q}_{j+1}和\delta=\hat{q}_j-\hat{y}_j$$
    - 对DQN作反向传播得到梯度： $${\bf{g}}_{j}=\bigtriangledown_{\bf{w}} Q(s_j,a_j;{\bf{w}}_{now})$$
    - 做梯度下降更新参数： $${\bf{w}}_{now}-\alpha \cdot \delta_j \cdot {\bf{g}}_j \to {\bf{w}}_{new}$$

因为两者是独立的；因此训练数据收集和参数更新可以同步进行，也可以异步进行。

#### 利用Q学习算法训练DQN

Q学习最初以表格形式出现，参照表格作出决策；该种情况下$\mathcal{S}$和$\mathcal{A}$为有限集，它们的组合有限；从这些组合中，针对每个状态选择回报最大的动作，从而实现最优决策；数学表示为：

$$a_t=arg \max_{a \in \mathcal{A}} Q_{\ast} (s_t,a)$$ 

如果要让智能体的轨迹学习这样一个表格，则可用一个表格$\tilde{Q}$近似$Q_{\ast}$：

- 首先初始化 $\tilde{Q}$，如使其为全0的表格
- 然后用表格形式的Q学习算法更新 $\tilde{Q}$
- 每次更新表格的一个元素，使其最终收敛到 $Q_{\ast}$

**训练流程**

根据四元组 $(s_T,a_t,r_t,s_{t+1})$ 可以求出DQN的观测值，以及TD目标和TD误差；由于算法所需数据为四元组，与控制智能体运动的策略 $\pi$ 无关，因此可以用任何策略控制智能体与环境交互，并记录算法轨迹作为训练数据。因此**DQN的训练可以分为两个独立部分**：

- 收集训练数据：可以用任何策略 $\pi$ 与环境交互，该策略被称作**行为策略(Behavior Policy)**，常用的是$\epsilon -greedy$策略：
    
    $$ a_t=\left\{ \begin{aligned} & arg \max_{a} \tilde{Q}(s_{t},a)\ \ \ \ \ \ 以概率(1-\epsilon) \\ & 均匀抽取\mathcal{A}中的一个动作 \ \ \ \ 以概率\epsilon \end{aligned} \right.$$

    智能体在整个过程中的轨迹记作 $\{ s_i,a_i,r_i \| i=1,2,\cdots,n \}$ ，把一条轨迹划为$n$个四元组 $(s_T,a_t,r_t,s_{t+1})$ 存入数组，从而得到经验回放数组(Reply Buffer)；事后通过经验回访更新表格 $\tilde{Q}$

- 更新参数${\bf{w}}$
    随机从经验回放数组中取一个四元组记作 $(s_j,a_j,r_j,s_{j+1})$ ，设当前DQN参数为$w_{now}$；执行下面步骤对参数做更新得到新参数 $\bf{w}_{new}$ ：

    - 对DQN作正向传播，得到Q值： $$\hat{q}_{j}=\tilde{Q}_{now} (s_{j},a_{j})和\hat{q}_{j+1}=\max\limits_{a \in \mathcal{A}} \tilde{Q}_{now} (s_{j+1},a)$$
    - 计算TD目标和TD误差： $$\hat{y}_{j}=r_j+\gamma \cdot \hat{q}_{j+1}和\delta=\hat{q}_j-\hat{y}_j$$
    - 更新表格中 $(s_{j},a_{j})$ 位置上的元素：$$\tilde{Q}_{now} (s_{j},a_{j})-\alpha \cdot \delta_{j} \to \tilde{Q}_{new} (s_{j},a_{j})$$

同理，因为两者是独立的;因此训练数据收集和参数更新可以同步进行，也可以异步进行。

## 同策略(On-policy)与异策略(Off-policy)

行为策略是控制智能体与环境交互的策略，作用是收集经验(即观测的环境、动作、奖励)；目标策略是结束训练后得到的用于控制目标智能体的策略函数，该策略函数暂时作为一个确定性策略，用于控制智能体：

$$a_{t}=arg \max_{a} Q(s_{t},a_{t};\bf{w})$$

同策略指用相同的行为策略和目标策略，异策略指用不同的行为策略和目标策略；DQN则是经典的异策略，通过经验回放的形式建立目标策略。

<img src="/assets/images/强化学习/同策略和异策略.png" alt="描述文字" width="980" height="360">

### SARSA(State-Action-Reward-State-Action)算法

针对强化学习，$Q_{\pi}$常常和策略函数$\pi$结合使用，被称作Actor-Critic方法，而SARSA算法则就是被用来训练该方法$Q_{\pi}$的工具。

**SARSA算法的推导**

- 首先根据贝尔曼方程可知：

  $$Q_{\pi} (s_{t},a_{t})={\mathbb{E}}_{S_{t+1},A_{t+1}} [R_t + \gamma \cdot Q_{\pi}(S_{t+1},A_{t+1}) \| S_t=s_t,A_t=a_t ]$$

- 然后对贝尔曼方程左右两边作近似，左边近似为$q(s_{t},a_{t})$，是表格在$t$时刻对$Q_{\pi} (s_{t},a_{t})$做出的估计
- 对于方程右边，给定当前状态$s_{t}$和智能体执行动作$a_{t}$，环境给出奖励$r_{t}$和新状态$s_{t+1}$，然后基于$s_{t+1}$随机采样得到新动作

  $$\tilde{a}_{t+1} \sim \pi (cdot \| s_{t+1})$$

  进一步作蒙特卡洛近似得到：

  $$r_t + \gamma \cdot Q_{\pi}(s_{t+1},\tilde{a}_{t+1})$$
- 进一步把上面中公式中的$Q_{\pi}$近似成$q$，得到：

  $$\hat{y_{t}} \triangleq r_t + \gamma \cdot q_{\pi}(s_{t+1},\tilde{a}_{t+1})$$

  其被称作TD目标，是表格在$t+1$时刻对$Q_{\pi} (s_{t},a_{t})$做出的估计

$q(s_{t},a_{t})$和$\hat{y_{t}}$都是对动作价值$Q_{\pi} (s_{t},a_{t})$的估计，而$\hat{y_{t}}$部分基于真实观测到的奖励$r_{t}$；由于$\hat{y_{t}}$更可靠，因此鼓励$q(s_{t},a_{t})$趋近$\hat{y_{t}}$，即：

$$(1-\alpha) \cdot q(s_{t},a_{t}) + \alpha \cdot \hat{y_{t}} \to q(s_{t},a_{t})$$

#### SARSA的训练流程

**前提假设**：设当前表格为$q_{now}$，当前策略为$\pi_{now}$，每轮更新表格中的一个元素，把更新后的表格记作$q_{new}$

**具体步骤**

- **步骤一**：观测到当前状态$s_{t}$，根据当前策略抽样：$a_{t} \sim \pi_{now} (\cdot \| s_{t})$
- **步骤二**：把表格$q_{now}$中第$(s_{t},a_{t})$位置上的元素记为：$\hat{q_{t}}=q_{now}(s_{t},a_{t})$
- **步骤三**：智能体执行动作$a_{t}$，观测到奖励$r_{t}$和新状态$s_{t+1}$
- **步骤四**：根据当前策略抽样 $$\tilde{a}_{t+1} \sim \pi_{now} (\cdot \| s_{t})$$ ，其中 $\tilde{a_{t+1}}$ 为假想动作，智能体不予执行
- **步骤五**：记 $$\hat{q}_{t+1} =q_{now} (s_{t+1}, \tilde{a}_{t+1})$$，计算TD目标和TD误差 $$\hat{y_{t}}=r_{t}+ \gamma \cdot \hat{q}_{t+1},\delta_{t}=\hat{q}_{t}-\hat{y}_{t}$$
- **步骤六**：更新表格中$(s_{t},a_{t})$位置上的元素：$$q_{now} (s_{t},a_{t}) -\alpha \cdot \delta_{t} \to q_{new} (s_{t},a_{t})$$

> **Q学习与SARSA对比**
> - Q学习属于异策略，可以用经验回放，目标是学到表格$\tilde{Q}$作为$Q_{\ast}$的近似而与$\pi$无关，所以无论$\pi$是什么都不影响Q学习结果  
> - SARSA属于同策略，不能用经验回放，目标是学到表格$q$作为动作价值函数$Q_{\pi}$的近似吗，必须通过收集当前策略$\pi_{now}$学习$Q_{\pi}$
{: .prompt-attention } 

#### 神经网络形式训练SARSA

若状态空间$\mathcal{S}$为无限集，则无法用表格表示$Q_{\pi}$，而是用神经网络$q(s,a;\bf{w})$近似：

$$q(s,a;{\bf{w}})=Q_{\pi}, \forall s \in \mathcal{S},a \in \mathcal{A}$$

神经网络的结构被预先设定，参数通过智能体与环境的交互确定

**算法推导**

给定当前状态$s_{t}$，智能体执行动作$a_{t}$，环境给出奖励$r_{t}$和新状态$s_{t+1}$，然后基于$s_{t+1}$作随机抽样，得到新动作$$\tilde{a}_{t+1} \sim \pi (\cdot \| s_{t+1})$$，定义TD目标：

$$\hat{y}_{t}=r_{t}+ \gamma \cdot q (s_{t+1},\tilde{a}_{t+1};{\bf{w}})$$

进而定义损失函数：

$$L({\bf{w}}) \triangleq \frac{1}{2} [q(s_{t},a_{t};{\bf{w}})-\hat{y}_{t}]^{2}$$

进一步利用梯度下降计算损失函数：

$$\bigtriangledown_{\bf{w}} L({\bf{w}})=\underbrace{(\hat{q}_{t}-\hat{y}_{t})}_{TD误差 \delta_{t}} \cdot \bigtriangledown_{\bf{w}} q(s_{t},a_{t};{\bf{w}})$$

然后作梯度下降更新：

$$w-\alpha \cdot \delta_{t} \cdot \bigtriangledown_{\bf{w}} q(s_{t},a_{t};{\bf{w}})$$

利用神经网络训练和上面一节的训练流程类似，只是把相应参数替换为了含$\bf{w}$的内容，此处省略

#### 多步TD目标和蒙特卡洛与自举

多步TD目标实质上就是对贝尔曼方程做了一些修改：

  $$\underbrace{Q_{\pi} (s_{t},a_{t})}_{U_{t}的期望} = {\mathbb{E}} [(\sum\limits_{i=0}^{m-1} r^{i} R_{t+i}) + \gamma^{m} \cdot \underbrace{Q_{\pi}(S_{t+m},A_{t+m})}_{U_{t+m}的期望} \| S_t=s_t,A_t=a_t ]$$

即用策略$\pi$控制智能体与环境交互$m$次得到轨迹后，再作近似得到近似结果；其它内容和传统训练方式差距不大

蒙特卡洛和自举可以看作是多步TD朝两个相反方向的延申。

<img src="/assets/images/强化学习/自举解释.png" alt="描述文字" width="780" height="140">

前者依赖完整经历完一轮交互后的所有显式状态，无偏但方差大；后者仅依赖后一步交互，方差小但有偏差。

<div style="text-align: center;">
<img src="/assets/images/强化学习/自举图.png" alt="描述文字" width="380" height="300">
</div>

## 价值学习高级技巧

该部分主要包含两个技巧：经验回放(Experience Replay)、高估问题的解决方案

### 经验回放

**概念**：把智能体与环境交互的记录(即经验)储存到一个数组里，事后反复利用这些经验训练智能体；该数组被称为**经验回放数组(Replay Buffer)**，一般智能体轨迹被划分为四元组$(s_{t},a_{t},r_{t},s_{t+1})$，大小为最近保留的$b$条数据(一般被设置为$10^{5} \sim 10^{6}$)；在实践中，要等回放数组中有足够多四元组，才开始经验回放更新DQN。


