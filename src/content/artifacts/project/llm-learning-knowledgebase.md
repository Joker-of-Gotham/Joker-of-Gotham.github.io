---
title: AIRI LocalGUI Task Agent (Open Source; In Progress)
slug: llm-learning-knowledgebase
type: project
date: 2025-09-23
venue: Open-source Project
summary: 把自然语言指令转换为可执行桌面任务计划，支持自动校验、自动修复与多工具协同执行。
cover: /assets/images/LLM学习/deepseek-r1/DeepSeek-R1训练范式.png
tags:
  - Desktop Automation
  - Planner-Executor
  - Plan Verification
links:
  - label: Repo
    url: https://github.com/Joker-of-Gotham/Airi-GUI-Automation-Module
  - label: Roadmap
    url: /roadmap/engineering-writing-track/
related_nodes:
  - engineering-writing-track
  - writing-pipeline
---

该项目对应 CV 中的 AIRI LocalGUI Task Agent，当前重点包括：

- 通过 LLM normalizer + planner 将请求拆解为 `Phase / Step / Action` 三层计划。
- 维护 43 个工具注册与签名绑定机制，覆盖文件、Office、网页、进程与屏幕操作。
- 引入多轮计划校验与修复，结合自动检查、自动修复与 LLM 驱动修复提升闭环可靠性。
