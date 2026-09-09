---
title: 在设计质量分数之前，先写下任务
slug: quality-before-score
date: 2026-09-09
kind: reflection
cover: /assets/img/covers/孤独摇滚-山田凉2.webp
order: 3
summary: 把两篇综述接回自己的问题：质量检查应当留下范围、证据和修正理由。
tags: [研究札记, 数据质量]
papers:
  - title: "Knowledge Graph Quality Management: A Comprehensive Survey"
    url: https://ieeexplore.ieee.org/document/9709663
    year: 2022
  - title: "Quality assessment for Linked Data: A Survey — A systematic literature review and conceptual framework"
    url: https://journals.sagepub.com/doi/10.3233/SW-150175
---
把知识图谱与 Linked Data 的质量综述放在一起后，我更愿意从一个具体任务开始，而不是从“综合评分”开始。

## 一张有边界的检查单

第一步写下任务：服务哪些实体、使用哪段时间的信息、需要回答怎样的问题。第二步写下失败：错误的边、缺少的关系、陈旧的来源，分别会造成什么后果。最后才选择能够观测这些失败的指标。

例如，若一个查询依赖机构之间的当前关联，最需要追踪的可能是关系的有效时间与来源版本。此时，图谱中其他属性更加丰富，并不能抵消这条关键关系过期的影响。

## 检测结果应当可以被反驳

我希望一条质量告警至少带着一个能够复核的理由：违反了哪条约束、使用了哪份数据、为何与任务相关。

如果只能说“模型认为可疑”，它可以进入待检查队列，但不应直接成为事实已错的判决。相应地，一次修复也应保留原值、依据与影响范围，方便发现修错了之后退回去。

## 一个尚待验证的假设

按任务约束组织质量检查，可能比不断增加全局指标更有助于解释错误。但它也可能提高配置成本，遗漏尚未预见的用途。

后续需要拿真实任务比较这两种方式：不是只看告警数量，而是看能否更快找到影响任务的缺陷、是否减少误修，以及换一个任务之后还剩多少可复用的判断。
