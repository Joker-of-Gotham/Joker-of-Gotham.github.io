---
title: "Zanao: LLM-driven Market Archive & Analytics"
slug: campus-market-intel
type: project
date: 2025-07-24
venue: Open-source Project
summary: 面向真实市场信息流的端到端系统，覆盖数据采集、语义检索、多轮问答与可视化分析。
cover: /assets/images/技术杂谈/校园集市信息提取/整体流程.png
tags:
  - LLM Workflow Orchestration
  - Financial Data Pipeline
  - Full-stack Engineering
links:
  - label: GitHub
    url: https://github.com/Joker-of-Gotham
related_nodes:
  - llm-systems-track
  - llm-rag-workbench
---

该项目对应 CV 中的 Zanao 系统实践，强调从数据获取到分析交付的工程闭环：

- 构建 Dify Chatflow，支持多轮“细节问答”和“资源检索”。
- 接入 OpenAPI 工具，并通过 Ollama 本地部署 LLM 与 embedding 模型。
- 打通用户授权数据导出、鉴权采集、Redis producer-consumer、Flask/FastAPI API 服务与前端可视化看板。
