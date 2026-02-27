---
title: 自动化特征工程(AutoFE)
date: 2025-08-05T00:00:00.000Z
categories:
  - 人工智能
  - 机器学习
  - 特征工程
tags:
  - 综述笔记
  - 数据挖掘
slug: 2025-08-21-auto-feature-engineering
collection: llm_learning
summary: "特征工程(FE)的数学表达与自动化特征工程基本框架。"
related_nodes: []
---
# 特征工程(FE)的数学表达

特征工程的数学表达为：

$$\begin{aligned} & C(T,X)=[t_{i1}(t_{i2}(\cdots(X))),t_{j1}(t_{j2}(\cdots(X))),\cdots] \to [C^{*},T^{*}]=\argmax\limits_{C,T} R_{m}(C(T,X)) \\ & X:\text{raw dataset} \quad T:\text{feature generation operator set} \quad C:\text{feature selection operator set} \end{aligned}$$
