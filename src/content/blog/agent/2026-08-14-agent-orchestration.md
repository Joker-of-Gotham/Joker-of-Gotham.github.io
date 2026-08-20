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

# 单 Agent 系统

## Agent 可观测性

### OpenInference 规范

[OpenInference 规范](https://github.com/Arize-ai/openinference) 是一个建立在 OpenTelemetry 之上的开源语义约定标准，专门用于大语言模型（LLM）和 AI 应用的可观测性。该规范以 Markdown 文件的形式编辑，这些文件位于 [spec 目录](https://github.com/Arize-ai/openinference/tree/main/spec) 中。它旨在深入剖析 LLM 的调用以及相关的应用程序上下文，例如从向量存储中检索数据以及使用外部工具（如搜索引擎或 API）。该规范与传输方式和文件格式无关，旨在与其他规范（例如 JSON、ProtoBuf 和 DataFrames）结合使用。

### PROV

PROV 系列文档定义了一个模型、相应的序列化和其他支持性定义，以实现异构环境（例如 Web）中溯源信息的互操作交换。

PROV 的核心是一个概念数据模型（PROV-DM），它定义了一套用于描述溯源信息的通用词汇表。该词汇表通过各种序列化方式进行实例化。这些序列化方式被各种实现用于交换溯源信息。为了帮助开发者和用户表达有效的溯源信息，又定义了一组约束（PROV-Constraints），这些约束可用于实现溯源验证器。此外，还提供了形式语义（PROV-SEM）。最后，为了进一步支持溯源信息的交换，还提供了额外的规范，用于定义溯源信息的定位和访问协议（PROV-AQ）、溯源描述包的连接协议（PROV-Links）、字典式集合的表示协议（PROV-Dictionary）以及定义如何与广泛使用的都柏林核心词汇表（PROV-DC）进行互操作的协议。

<div class="image-grid" style="--cols:1">
  <figure>
    <img src="/assets/images/Agent/orchestration/prov-family.png" alt="PROV 系列规范家族结构图" loading="lazy" />
    <figcaption>PROV 规范家族：PROV-DM 核心、序列化与各支持规范</figcaption>
  </figure>
</div>

| 序号 | 观众类型 | 文档类型 | 简述 |
| :--- | :--- | :--- | :--- |
| 1 | 用户 | 笔记 | **PROV-PRIMER** 是 PROV 的入门指南，它介绍了溯源数据模型。这是您应该开始学习的地方，对许多人来说，也可能是唯一需要的文档。 |
| 2 | 开发者 | 推荐 | **PROV-O** 为溯源数据模型定义了一个轻量级的 OWL2 本体。它面向链接数据和语义网社区。 |
| 3 | 开发者 | 笔记 | **PROV-XML** 定义了溯源数据模型的 XML 模式。它面向需要对 PROV 数据模型进行原生 XML 序列化的开发人员。 |
| 4 | 先进的 | 推荐 | **PROV-DM** 定义了一个包含 UML 图的溯源概念数据模型。PROV-O、PROV-XML 和 PROV-N 是该概念模型的序列化版本。 |
| 5 | 先进的 | 推荐 | **PROV-N** 为溯源模型定义了一种易于理解的符号。它用于在概念模型中提供示例，也用于定义 PROV-CONSTRAINTS。 |
| 6 | 先进的 | 推荐 | **PROV-CONSTRAINTS** 定义了一组针对 PROV 数据模型的约束，用于明确有效溯源的概念。它专门针对验证器的实现者。 |
| 7 | 开发者 | 笔记 | **PROV-AQ** 定义了如何使用基于 Web 的机制来查找和检索溯源信息。 |
| 8 | 开发者 | 笔记 | **PROV-DC** 定义了 Dublin Core 和 PROV-O 之间的映射关系。 |
| 9 | 开发者 | 笔记 | **PROV-DICTIONARY** 定义了用于表达字典式数据结构来源的结构。 |
| 10 | 先进的 | 笔记 | **PROV-SEM** 根据 PROV 数据模型的一阶逻辑定义了一个声明式规范。 |
| 11 | 先进的 | 笔记 | **PROV-LINKS** 定义了 PROV 的扩展，以实现跨多个溯源描述包链接溯源信息。 |

**PROV-O (PROV Ontology)**

[PROV-O (PROV Ontology)](https://www.w3.org/TR/prov-o/) 是万维网联盟（W3C）推荐的基于 OWL2 语言构建的标准网络本体，用于用机器可读的格式描述和交换数据溯源（Provenance）信息。它将现实中“谁、在什么时间、通过什么活动、使用了什么输入、生成了什么输出”的来龙去脉结构化为统一的语义网词汇。

整体来说，PROV 数据模型通过 **活动(Activity)、实体(Entity) 和 代理(Agent)** 三个核心类构建数据溯源链：

1. **活动与实体（生成与使用）**：
  - 动在特定时段内运行（`startedAtTime` / `endedAtTime`），通过使用实体（`prov:used`）和生成实体（`prov:wasGeneratedBy`）建立关联。
  - 若忽略中间实体，活动间可通过 `prov:wasInformedBy` 建立直接依赖链；若忽略中间活动，实体间可直接通过 `prov:wasDerivedFrom` 建立派生链。
2. **代理与责任（归属与授权）**：
  - 代理对活动承担关联责任（`prov:wasAssociatedWith`），对实体承担归属责任（`prov:wasAttributedTo`）。
  - 代理之间可通过委托关系（`prov:actedOnBehalfOf`）代表其他代理履行职责。

```mermaid
flowchart TD
    %% 节点定义
    Entity(["Entity"])
    Activity["Activity"]
    Agent{{"Agent"}}
    TimeStart["xsd:dateTime"]
    TimeEnd["xsd:dateTime"]

    %% 实体与活动关系
    Activity -->|"used"| Entity
    Entity -->|"wasGeneratedBy"| Activity
    Entity -->|"wasDerivedFrom"| Entity

    %% 活动生命周期与活动间依赖
    Activity -->|"startedAtTime"| TimeStart
    Activity -->|"endedAtTime"| TimeEnd
    Activity -->|"wasInformedBy"| Activity

    %% 代理与责任关系 (归属/关联/委托)
    Entity -->|"wasAttributedTo"| Agent
    Activity -->|"wasAssociatedWith"| Agent
    Agent -->|"actedOnBehalfOf"| Agent

    %% 节点样式设置（匹配原图颜色）
    style Entity fill:#FAF8D4,stroke:#A39100,stroke-width:1.5px
    style Activity fill:#DCDCF5,stroke:#5C5CA9,stroke-width:1.5px
    style Agent fill:#FBE3C7,stroke:#C67A26,stroke-width:1.5px
    style TimeStart fill:#EAEAEA,stroke:#888888,stroke-width:1px
    style TimeEnd fill:#EAEAEA,stroke:#888888,stroke-width:1px

    %% 责任关系连线高亮 (粉色/玫红色)
    linkStyle 6,7,8 stroke:#FF007F,stroke-width:2px;
```

进一步的，PROV-O 扩展词汇通过继承、生命周期建模与视角划分，对核心模型进行了五个层面的补充与深化：

1. **核心类的子类与属性扩展**
  - **Agent 子类** ：包含 `prov:Person`（个人）、`prov:Organization`（组织）与 `prov:SoftwareAgent`（软件代理）。
  - **Entity 子类** ：包含 `prov:Collection`（集合实体，用 `prov:hadMember` 声明成员）、`prov:Bundle`（命名的出处描述集合）与 `prov:Plan`（计划或行动步骤）。
  - **派生细化与超属性** ：
    - **派生子属性** ：`prov:wasQuotedFrom`（引用）、`prov:wasRevisionOf`（修订）与 `prov:hadPrimarySource`（一手来源）。
    - **通用影响** ：`prov:wasInfluencedBy` 作为顶层超属性，用于描述任何受影响对象与影响源之间的通用关联。
2. **抽象层级与视角的关联**
  - **`prov:specializationOf`** ：将具体实体指向更一般的实体（如具体日期的网页与常规主页）。
  - **`prov:alternateOf`** ：连接同一事物在不同形式或时间下的不同表现（如文件的不同格式或备份）。
3. **实体细节与空间属性**
  - **`prov:value`** ：直接用字面量表示实体的取值（如字符串或数值）。
  - **`prov:atLocation`** ：将实体、活动、代理或瞬间事件关联到具体的地理/逻辑位置（`prov:Location`）。
4. **实体的生命周期控制**
  - **时间界定** ：通过 `prov:generatedAtTime`（生成时间）和 `prov:invalidatedAtTime`（失效时间）限定实体的存续期。
  - **活动驱动** ：通过 `prov:wasGeneratedBy` / `prov:generated` 表示实体生成，通过 `prov:wasInvalidatedBy` / `prov:invalidated` 表示实体失效。
5. **活动生命周期的扩展控制** ：活动不仅能关联时间的开始与结束，还可以直接由特定实体或代理触发启动（`prov:wasStartedBy`）或终止（`prov:wasEndedBy`）。

```mermaid
flowchart TD
    %% Agent 复合节点
    subgraph Agent ["Agent"]
        direction TB
        Person["Person"]
        Organization["Organization"]
        SoftwareAgent["SoftwareAgent"]
    end

    %% Entity 复合节点
    subgraph Entity ["Entity"]
        direction LR
        Collection["Collection"]
        Bundle["Bundle"]
        Plan["Plan"]
    end

    %% 其他核心节点
    Activity["Activity"]
    Location["Location"]
    DT_Gen["xsd:dateTime"]
    DT_Inv["xsd:dateTime"]
    LiteralVal[" "]

    %% 时间与属性关联
    Entity -->|"generatedAtTime"| DT_Gen
    Entity -->|"invalidatedAtTime"| DT_Inv
    Entity -->|"value"| LiteralVal

    %% Entity 自关联关系
    Entity -->|"wasInfluencedBy /<br/>wasQuotedFrom /<br/>wasRevisionOf /<br/>hadPrimarySource"| Entity
    Entity -->|"alternateOf /<br/>specializationOf"| Entity
    Entity -->|"hadMember"| Collection

    %% Entity 与 Activity 交互关系
    Activity -->|"wasStartedBy /<br/>wasEndedBy"| Entity
    Entity -->|"wasInvalidatedBy"| Activity

    %% Location 关系
    Location -->|"atLocation"| Location

    %% 节点样式（匹配原图配色）
    style Agent fill:#FBE3C7,stroke:#C67A26,stroke-width:1.5px
    style Person fill:#FAF8D4,stroke:#C67A26,stroke-width:1px
    style Organization fill:#FAF8D4,stroke:#C67A26,stroke-width:1px
    style SoftwareAgent fill:#FAF8D4,stroke:#C67A26,stroke-width:1px

    style Entity fill:#FAF8D4,stroke:#A39100,stroke-width:1.5px
    style Collection fill:#FFFFFF,stroke:#A39100,stroke-width:1px
    style Bundle fill:#FFFFFF,stroke:#A39100,stroke-width:1px
    style Plan fill:#FFFFFF,stroke:#A39100,stroke-width:1px

    style Activity fill:#DCDCF5,stroke:#5C5CA9,stroke-width:1.5px
    style Location fill:#D2B48C,stroke:#8B5A2B,stroke-width:1.5px
    style DT_Gen fill:#EAEAEA,stroke:#888888,stroke-width:1px
    style DT_Inv fill:#EAEAEA,stroke:#888888,stroke-width:1px
    style LiteralVal fill:#EAEAEA,stroke:#888888,stroke-width:1px
```

PROV-O 的 **“限定模式”（Qualified Pattern）** 则旨在解决 RDF 语法无法直接在“关系/边”上附加属性的局限，通过引入中间节点将简单的二元关系转换为可附加丰富元数据的多元结构。这种方法受影响方与影响源之间插入一个“影响类实例”（Influence Instance），建立 **“受影响方 → 影响事件 → 影响源”** 的三段式结构，从而允许在“影响事件”节点上挂载上下文属性。

<div class="image-grid" style="--cols:1">
  <figure>
    <img src="/assets/images/Agent/orchestration/prov-o-qualified-pattern.png" alt="PROV-O 限定模式（Qualified Pattern）示意图" loading="lazy" />
    <figcaption>PROV-O 限定模式：受影响方 → 影响事件 → 影响源</figcaption>
  </figure>
</div>

**PROV-Constraints**

在构建了 PROV-O 本体后，接下来便需要考虑 [PROV 约束](https://www.w3.org/TR/prov-constraints/)。一个有效 (valid，PROV 实例/文档中的有效在概念上更接近于逻辑上的一致性 (consistency)) 的 PROV 实例对应于一个一致的对象和交互历史记录，可以安全地对其进行逻辑推理。通过指定约束条件来验证 PROV 实例 有效的 PROV 实例必须满足以下条件。这些约束共有四种：唯一性约束 (uniqueness constraints)、事件顺序约束 (event ordering constraints)、不可能性约束 (impossibility constraints) 和类型约束 (type constraints)。

在 PROV 中， **并不假设列出的属性集实体描述并不完整，属性之间也并非相互独立或正交** 。同样，也 **不假设实体的属性能够唯一地标识该实体** 。两个不同的实体如果展现了可能不同的事物的相同方面，则可能拥有相同的属性；这会导致潜在的歧义，而 **使用标识符可以减轻这种歧义** 。

活动并非实体。事实上，实体在其生命周期的任何时刻都完整存在，并持续存在，且保持其固有的特征。与之相反，活动是随着时间推移而发生、展开或发展的事物。这种区别类似于逻辑学中“持续性”和“偶发性”的区别。

PROV 中使用了5种瞬时事件：

- 活动开始和活动结束界定了活动产生与终止的边界
- 实体产生、实体使用和实体失效事件均作用于实体，其中实体产生和实体失效事件则界定了实体的生命周期

| 关系 | 标识符/参数 | 具有类型... |
| :--- | :--- | :--- |
| `entity(e,attrs)` | `e` | `'实体'` |
| `activity(a,t1,t2,attrs)` | `a` | `'活动'` |
| `agent(ag,attrs)` | `ag` | `'代理人'` |
| `used(id; a,e,t,attrs)` | `e`<br>`a` | `'实体'`<br>`'活动'` |
| `wasGeneratedBy(id; e,a,t,attrs)` | `e`<br>`a` | `'实体'`<br>`'活动'` |
| `wasInformedBy(id; a2,a1,attrs)` | `a2`<br>`a1` | `'活动'`<br>`'活动'` |
| `wasStartedBy(id; a2,e,a1,t,attrs)` | `a2`<br>`e`<br>`a1` | `'活动'`<br>`'实体'`<br>`'活动'` |
| `wasEndedBy(id; a2,e,a1,t,attrs)` | `a2`<br>`e`<br>`a1` | `'活动'`<br>`'实体'`<br>`'活动'` |
| `wasInvalidatedBy(id; e,a,t,attrs)` | `e`<br>`a` | `'实体'`<br>`'活动'` |
| `wasDerivedFrom(id; e2,e1,a,g,u,attrs)` | `e2`<br>`e1`<br>`a` | `'实体'`<br>`'实体'`<br>`'活动'` |
| `wasAttributedTo(id; e,ag,attr)` | `e`<br>`ag` | `'实体'`<br>`'代理人'` |
| `wasAssociatedWith(id; a,ag,pl,attrs)` | `a`<br>`ag`<br>`pl` | `'活动'`<br>`'代理人'`<br>`'实体'` |
| `actedOnBehalfOf(id; ag2,ag1,a,attrs)` | `ag2`<br>`ag1`<br>`a` | `'代理人'`<br>`'代理人'`<br>`'活动'` |
| `alternateOf(e1,e2)` | `e1`<br>`e2` | `'实体'`<br>`'实体'` |
| `specializationOf(e1,e2)` | `e1`<br>`e2` | `'实体'`<br>`'实体'` |
| `hadMember(c,e)` | `c`<br>`e` | `'实体'`, `'prov:Collection'`<br>`'实体'` |
| `entity(c,[prov:type='prov:EmptyCollection',...])` | `c` | `'实体'`, `'prov:Collection'`, `'prov:EmptyCollection'` |

总体来说，PROV 数据变“规范”的过程是：先用类型、时序和逻辑约束进行“健康检查”（Validation），剔除不合规的错误数据；再根据定义与推理规则补充隐含信息、合并重复项（Normalization），最终把一份原始数据加工成标准、完备的 PROV 数据。

<div class="image-grid light-fig" style="--cols:1">
  <figure>
    <img src="/assets/images/Agent/orchestration/overview-of-validation-process.svg" alt="PROV 数据 Validation 与 Normalization 流程总览" loading="lazy" />
    <figcaption>PROV 数据规范化流程总览：Validation（健康检查）与 Normalization（补全合并）</figcaption>
  </figure>
</div>

在文档中，各种具体的约束条件被详细定义，且针对各概念和推论提供了标准性的解释，它们也为整个 PROV 体系提供了一致性约束。

另外，PROV 也提供了语义逻辑和语义学的证明 [PROV-SEM](https://www.w3.org/TR/prov-sem/)，主要运用数理逻辑工具，特别是模型论，帮助用户理解 PROV 某些特性背后的意图，也有助于研究人员探索更丰富的溯源推理形式。

# Agent Loop 的终止条件

在文章 [深入解析 Codex 智能体循环](https://openai.com/zh-Hans-CN/index/unrolling-the-codex-agent-loop/) 中，OpenAI 归纳了一种最容易的范式用于推进 Agent Loop。在文章中，整个循环停止的条件是，“直至模型不再发起工具调用，转而生成一条面向用户的消息（在 OpenAI 模型中称为助手消息）”。但是其问题在于，以“生成助手消息”为标志判断 Agent Loop 从而终止当前轮对话，本质上是 **“通过形式判断终止”** ，而非 **内容** 。

无独有偶，Anthropic 在文章 [How the agent loop works](https://code.claude.com/docs/en/agent-sdk/agent-loop) 中同样描述了类似的过程：接收提示信息-进行评估并作出响应-执行工具-重复操作-返回结果。文章中写道：“Turns continue until Claude produces output with no tool calls, at which point the loop ends and the final result is delivered.”

两种典型的 Agent Loop 范式如下图所示，分别为 OpenAI 的 Codex 多轮智能体循环与 Anthropic Claude 的 Agent Loop：

<div class="image-grid" style="--cols:1">
  <figure>
    <img src="/assets/images/Agent/orchestration/oai_Unrolling_the_Codex_agent_loop_Multi-turn_agent_loop_desktop-dark.svg" alt="OpenAI Codex 多轮智能体循环示意图" loading="lazy" />
    <figcaption>OpenAI Codex 多轮智能体循环</figcaption>
  </figure>
  <figure>
    <img src="/assets/images/Agent/orchestration/agent-loop-diagram-dark-claude.svg" alt="Anthropic Claude Agent Loop 示意图" loading="lazy" />
    <figcaption>Anthropic Claude Agent Loop</figcaption>
  </figure>
</div>

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

## 计算目标满足度

基于如上建模，每个条件会产生 $q_{i,t}=v_{i}(c_i , x_t ) \in [0,1]$，同时定义证据可信度 $\rho_{i,t} \in [0,1]$，进而可以得到硬条件门：

$$H_{t}= \underset{i:k_i=\text{hard} }{\Pi}\mathbb{I}[q_{i,t} \rho_{i,t} \geq \tau_{i}]$$

总体完成度为：

$$C_t = \frac{\Sigma_{i} w_i q_{i,t} \rho_{i,t} }{\Sigma_{i} w_i}$$

不确定度为：

$$U_t = \frac{\Sigma_{i} w_i (1-\rho_{i,t}) }{\Sigma_{i} w_i}$$

当 $C_t$ 较高则说明完成度较高，但如果同时 $U_t$ 较高则说明不确定度较大，从而需要进入核验环节。

## 开放文本目标

对于“论文论证充分”“报告覆盖完整”等难以写成精确断言的条件，可以使用 embedding，但只把它当作语义传感器。

