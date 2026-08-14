---
title: "Agent Orchestration"
date: 2026-08-14T00:00:00.000Z
cover: /assets/img/covers/GBC-五人合照4.webp
categories:
  - 人工智能
  - Agent
tags:
  - 智能体
  - LLM
slug: 2026-08-14-agent-orchestration
collection: agent
summary: >-
  Agent Orchestration 是整个 Agent 领域中的重要一环，我们推出了 Cantilune 项目，旨在为 Agent Orchestraion 提供更好的自主性、观测性、稳定性与长程可执行性。
related_nodes: []
---

# Agent Loop 的终止条件

在文章 [深入解析 Codex 智能体循环](https://openai.com/zh-Hans-CN/index/unrolling-the-codex-agent-loop/) 中，OpenAI 归纳了一种最容易的范式用于推进 Agent Loop。在文章中，整个循环停止的条件是，“直至模型不再发起工具调用，转而生成一条面向用户的消息（在 OpenAI 模型中称为助手消息）”。但是其问题在于，以“生成助手消息”为标志判断 Agent Loop 从而终止当前轮对话，本质上是 **“通过形式判断终止”** ，而非 **内容** 。

无独有偶，Anthropic 在文章 [How the agent loop works](https://code.claude.com/docs/en/agent-sdk/agent-loop) 中同样描述了类似的过程：接收提示信息-进行评估并作出响应-执行工具-重复操作-返回结果。文章中写道：“Turns continue until Claude produces output with no tool calls, at which point the loop ends and the final result is delivered.”

但是，这样的建模方式使 Agent Loop 在终止条件的判定上陷入到了严重的形式化洼地：严重依赖模型本身，且实际终止条件不一定满足预期。举一个简单的例子，模型因为不可纠正的格式错误，导致本应是调用 MCP 工具的行为回堕为纯文本输出，该输出是没有 `tool_calls` 的纯文本，因而对话终止(猫猫就在今天使用claude code时遇到了这种情况)。

针对上述问题，猫猫想到了一种最简单的做法： $J(g, r_t) \to [0,1]$，其中 $g$ 是目的， $r_t$ 是回复， $J$ 为一个判分器 (LLM as a Judge)，当评分超过一定阈值则说明 Agent Loop 完成了目标，便可以停止。进一步的，可以得到更有意思的方法，通过探索目的和回复之间的向量空间关系、来去作空间上的预期逼近从而“计算出”差异，进而产生出信号用于判断 Agent Loop 是否应该结束。

下面，我们用更严谨的数学模型来表示整个过程。

## 设计定义

### 定义目标

首先，对于任意需求都必然有一个目标，这个目标可以建模为：

$$\mathcal{G}=\{ (c_i , w_i , \tau_i , k_i , v_i) \}_{i=1}^{m}$$

其中：

- $c_i$: 第 i 个验收条件
- $w_i$: 重要性
- $\tau_i$: 通过阈值
- $k_i \in \{ \text{hard} , \text{soft} \}$: 硬条件或软条件
- $v_i$: 对应验证器

例如：

```yaml
goal: 修复重复回复问题

criteria:
  - id: no_duplicate_output
    type: hard
    verifier: duplicate_message_test
    threshold: 1.0

  - id: normal_chat_yields
    type: hard
    verifier: integration_test
    threshold: 1.0

  - id: tool_task_continues
    type: hard
    verifier: regression_test
    threshold: 1.0

  - id: architecture_quality
    type: soft
    verifier: structured_rubric
    weight: 0.3
```

### 定义评价对象

评价对象应该是一个完整的状态而非最终回复，其可以表示为：

$$x_t = (S_t , A_t , E_t , \Tau_{ \leq t} , R_t )$$

- $S_t$: 环境或系统状态
- $A_t$: 代码、论文、文件、图谱等产物
- $E_t$: 测试、工具结果、引用、日志等证据
- $\Tau_{ \leq t}$: 完整执行轨迹
- $R_t$: 准备发送给用户的回复

其中，回复只是其中一个分量。否则模型只要说“已经完成”，目标与回复的语义相似度就会非常高，堪称文字版伪造竣工验收。

### 计算目标满足度

基于如上建模，每个条件会产生 $q_{i,t}=v_{i}(c_i , x_t ) \in [0,1]$，同时定义证据可信度 $\rho_{i,t} \in [0,1]$，进而可以得到硬条件门：

$$H_{t}= \underset{i:k_i=\text{hard} }{\Pi}\mathbb{I}[q_{i,t} \rho_{i,t} \geq \tau_{i}]$$

总体完成度为：

$$C_t = \frac{\Sigma_{i} w_i q_{i,t} \rho_{i,t} }{\Sigma_{i} w_i}$$

不确定度为：

$$U_t = \frac{\Sigma_{i} w_i (1-\rho_{i,t}) }{\Sigma_{i} w_i}$$

当 $C_t$ 较高则说明完成度较高，但如果同时 $U_t$ 较高则说明不确定度较大，从而需要进入核验环节