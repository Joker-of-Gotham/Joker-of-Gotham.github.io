---
layout: post
title: "自动化特征工程(AutoFE)"
date: 2025-08-05
categories: [人工智能, 机器学习, 特征工程]
tags: [综述笔记, 数据挖掘]
published: true
mermaid: true
math: true
toc: true
---

# 特征工程(FE)的数学表达

特征工程的数学表达为：

$$\begin{aligned} & C(T,X)=[t_{i1}(t_{i2}(\cdots(X))),t_{j1}(t_{j2}(\cdots(X))),\cdots] \to [C^{*},T^{*}]=\argmax\limits_{C,T} R_{m}(C(T,X)) \\ & X：原始数据集 \quad T：特征生成算子集 \quad C：特征选择算子集 \end{aligned}$$

