---
layout: post
title: "因子专题：Alpha因子分析"
date: 2025-08-18
category: 金融分析
categories: [人工智能, 机器学习]
tags: [综述笔记, 金融量化]
published: true
mermaid: true
math: true
toc: true
---

# Alpha 类型分类总览

## 均值回归型(Mean-Reversion Alpha)

alpha 的方向与其所基于的回报方向相反——例如当价格上涨时做空，价格下跌时做多，预期价格将“回归”。示例如下：

$$\alpha= - \ln (\frac{\text{today's open}}{\text{yesterday's open}})$$

**Delay 类型**：该示例是一个 delay-0 alpha。所谓 delay-0，指的是所使用的数据（如今日开盘价）与交易时间点是一致或几乎一致的（例如当日开盘或收盘交易）。

## 动量型(Momentum Alpha)

alpha 的方向与其所基于的回报方向一致——例如价格上涨预期继续上涨，下跌预期继续下跌。示例如下：

$$\alpha = \ln (\frac{\text{yesterday's close}}{\text{yesterday's open}})$$

**Delay 类型**：这是一个 delay-1 alpha，即使用的是前一天的数据，并在下一交易日（当日）进行交易。

# 附录A：WorldQuant 101 Formulaic Alphas

以下列出所有 101 个公式化 Alpha 因子，均来自《101 Formulaic Alphas》论文附录 A。

- Alpha 1
	$$
	\text{rank}\Bigl(\text{Ts\_ArgMax}(\text{SignedPower}((\text{returns}<0 ? \text{stddev}(\text{returns},20) : \text{close}), 2), 5)\Bigr) - 0.5
	$$
    **信号阐释**：对近5天的收益率以及收益率标准差进行排名
- Alpha 2
	$$
	-1 \times \text{correlation}\left(\text{rank}(\delta(\log(\text{volume}),2)),\ \text{rank}\left(\frac{(\text{close}-\text{open})}{\text{open}}\right),\ 6\right)
	$$
    **信号阐释**：衡量近6天成交量2日差分排名和每日价格变化排名的皮尔逊相关系数
- Alpha 3
	$$
	-1 \times \text{correlation}\bigl(\text{rank}(\text{open}),\ \text{rank}(\text{volume}),\ 10\bigr)
	$$
    **信号阐释**：计算近10日开盘价排名和每日成交量排名的皮尔逊相关系数
- Alpha 4
	$$
	-1 \times \text{Ts\_Rank}\bigl(\text{rank}(\text{low}),\ 9\bigr)
	$$
    **信号阐释**：计算近9天各股票的每日最低价并排名，然后取时间序列排名之反
- Alpha 5
	$$
	\text{rank}\left(\text{open} - \frac{\sum(\text{vwap},10)}{10}\right)\times \bigl(-1 \times \left|\text{rank}(\text{close} - \text{vwap})\right|\bigr)
	$$
    **信号阐释**：VWAP（成交量加权平均价格）是衡量证券在特定时间段内平均交易价格的指标，考虑了成交量对价格的影响。该因子对每日开盘价 `open` 和过去10天内平均VWAP之差在所有股票中进行排名；对每日收盘价 `close` 和当天VWAP之差的绝对值在所有股票中进行排名；然后相乘并乘以(-1) 
- Alpha 6
	$$
	-1 \times \text{correlation}(\text{open},\ \text{volume},\ 10)
	$$
- Alpha 7
	$$
	\begin{cases} -1 \times \text{ts\_rank}(\lvert \delta(\text{close},7)\rvert,\,60)\times \text{sign}(\delta(\text{close},7)), & \text{if } \text{adv20} < \text{volume} \\ -1, & \text{otherwise} \end{cases}
	$$
- Alpha 8
	$$
	-1 \times \text{rank}\left(\sum(\text{open},5) \times \sum(\text{returns},5) - \text{delay}\bigl(\sum(\text{open},5) \times \sum(\text{returns},5),\,10\bigr)\right)
	$$
- Alpha 9
	$$
	\begin{cases} \delta(\text{close},1), & 0 < \text{ts\_min}(\delta(\text{close},1),5) \\ \delta(\text{close},1), & \text{ts\_max}(\delta(\text{close},1),5) < 0 \\ -\delta(\text{close},1), & \text{otherwise} \end{cases}
	$$
- Alpha 10
	$$
	\text{rank}\left( \begin{cases} \delta(\text{close},1), & 0 < \text{ts\_min}(\delta(\text{close},1),4) \\ \delta(\text{close},1), & \text{ts\_max}(\delta(\text{close},1),4) < 0 \\ -\delta(\text{close},1), & \text{otherwise} \end{cases} \right)
	$$
- Alpha 11
	$$
	\bigl(\text{rank}(\text{ts\_max}(\text{vwap} - \text{close},3))+ \text{rank}(\text{ts\_min}(\text{vwap} - \text{close},3))\bigr)\times \text{rank}(\delta(\text{volume},3))
	$$
- Alpha 12
	$$
	\text{sign}(\delta(\text{volume},1)) \times \bigl(-1 \times \delta(\text{close},1)\bigr)
	$$
- Alpha 13
	$$
	-1 \times \text{rank}\bigl(\text{covariance}(\text{rank}(\text{close}),\ \text{rank}(\text{volume}),\ 5)\bigr)
	$$
- Alpha 14
	$$
	(-1 \times \text{rank}(\delta(\text{returns},3))) \times \text{correlation}(\text{open},\ \text{volume},\ 10)
	$$
- Alpha 15
	$$
	-1 \times \sum\bigl(\text{rank}(\text{correlation}(\text{rank}(\text{high}), \text{rank}(\text{volume}),3)),\ 3\bigr)
	$$
- Alpha 16
	$$
	-1 \times \text{rank}(\text{covariance}(\text{rank}(\text{high}),\ \text{rank}(\text{volume}),5))
	$$
- Alpha 17
	$$
	\frac{\text{rank}(\text{vwap} - \text{close})}{\text{rank}(\text{vwap} + \text{close})}
	$$
- Alpha 18
	$$
	-1 \times \text{rank}(\text{covariance}(\text{rank}(\text{open}),\ \text{rank}(\text{volume}),5))
	$$
- Alpha 19
	$$
	-1 \times \text{rank}\Bigl((\text{close} - \text{vwap}) \times \text{correlation}(\text{close},\ \text{vwap},6)\Bigr)
	$$
- Alpha 20
	$$
	-1 \times \text{rank}(\text{open} - \text{delay}(\text{close},10))
	$$
- Alpha 21
	$$
	\text{rank}\left(\frac{\sum(\text{close} - \text{open},20)}{\sum(\text{close},20)}\right)
	$$
- Alpha 22
	$$
	-1 \times \text{rank}(\delta(\text{close},7))
	$$
- Alpha 23
	$$
	\text{Ts\_Rank}(-1 \times \text{returns}, 10)
	$$
- Alpha 24
	$$
	\text{Ts\_Rank}(-1 \times \text{returns}, 5)
	$$
- Alpha 25
	$$
	\text{rank}\Bigl(\text{correlation}(\text{vwap}, \text{volume}, 5)\Bigr)
	$$
- Alpha 26
	$$
	-1 \times \text{rank}\left(\frac{\frac{\sum(\text{close}, 7)}{7} - \text{close}}{\frac{\sum(\text{close}, 7)}{7}}\right)
	$$
- Alpha 27
	$$
	\begin{cases} \text{power}(\text{close} - \text{delay}(\text{close},3),\ 3), & \text{if } \text{correlation}(\text{vwap},\ \text{delay}(\text{close},5),\ 230) < 0 \\ \text{close}, & \text{otherwise} \end{cases}
	$$
- Alpha 28
	$$
	\text{scale}\left(\text{correlation}(\text{adv20},\ \text{low},\ 5) + \frac{(\text{high} + \text{low})}{2} - \text{close}\right)
	$$
- Alpha 29
	$$
	\min\left(\text{ts\_min}(\text{low},\ 5),\ \text{delay}(\text{close},5)\right) - \text{close}
	$$
- Alpha 30
	$$
	\text{rank}(\text{correlation}(\text{adv20},\ \text{low},\ 5)) + \text{rank}(\text{close} - \text{open})
	$$
- Alpha 31
	$$
	\log(\text{marketcap})
	$$
- Alpha 32
	$$
	\text{scale}\left(\text{ts\_mean}(\text{close},\ 7) - \text{close}\right) + \text{rank}(\text{correlation}(\text{vwap},\ \text{adv20},\ 6))
	$$
- Alpha 33
	$$
	\text{power}(\text{rank}(\text{correlation}(\text{close},\ \text{adv20},\ 20)),2)
	$$
- Alpha 34
	$$
	\text{rank}\left(-1 \times \text{returns} \times \text{adv20} \times \text{vwap}\right)
	$$
- Alpha 35
	$$
	\text{ts\_rank}(\text{volume},\ 32) \times (1 - \text{ts\_rank}(\text{close} + \text{high} - \text{low},\ 16))
	$$
- Alpha 36
	$$
	\text{rank}\left(\sum(\text{open},\ 5) \times \sum(\text{returns},\ 5) - \text{delay}(\sum(\text{open},\ 5) \times \sum(\text{returns},\ 5),10)\right)
	$$
- Alpha 37
	$$
	\text{rank}(\text{correlation}(\text{adv20},\ \text{close},\ 6)) + \text{rank}(\text{correlation}(\text{adv20},\ \text{close},\ 12)) + \text{rank}(\text{correlation}(\text{adv20},\ \text{close},\ 24))
	$$
- Alpha 38
	$$
	\text{rank}\left(\delta(\text{close},\ 7) \times \left(1 - \text{rank}\left(\text{decay\_linear}\left(\frac{\text{volume}}{\text{adv20}},\ 9\right)\right)\right)\right)
	$$
- Alpha 39
	$$
	\sum(\text{rank}(\text{correlation}(\text{rank}(\text{close}),\ \text{rank}(\text{volume}),\ 5)),\ 5)
	$$
- Alpha 40
	$$
	\text{rank}(\text{close} - \text{delay}(\text{close},10)) \times \text{rank}(\text{volume})
	$$
- Alpha 41
	$$
	\frac{(\text{close} - \text{open})}{((\text{high} - \text{low}) + 0.001)}
	$$
- Alpha 42
	$$
	\frac{\text{rank}(\text{vwap} - \text{close})}{\text{rank}(\text{vwap} + \text{close})}
	$$
- Alpha 43
	$$
	\text{ts\_rank}(\text{correlation}(\text{close},\ \text{adv20},\ 10), 20)
	$$
- Alpha 44
	$$
	-1 \times \text{correlation}(\text{open},\ \text{volume},\ 10)
	$$
- Alpha 45
	$$
	\frac{(\text{close} - \text{open})}{\left(\frac{(\text{close} + \text{open})}{2} + 0.001\right)}
	$$
- Alpha 46
	$$
	\text{rank}\bigl(\text{close} - \max(\text{close},20)\bigr)
	$$
- Alpha 47
	$$
	\text{rank}\left(\frac{\text{close}}{\text{delay}(\text{close},20)}\right)
	$$
- Alpha 48
	$$
	-1 \times \text{rank}(\text{sign}(\text{close} - \text{delay}(\text{close},1)) + \text{close} - \text{delay}(\text{close},1))
	$$
- Alpha 49
	$$
	\text{rank}(\text{vwap} - \text{ts\_mean}(\text{vwap},20))
	$$
- Alpha 50
	$$
	\text{rank}\left(\frac{\sum(\text{close} - \text{open}, 20)}{\sum(\text{close},20)}\right)
	$$
- Alpha 51
	$$
	\sum\left((\text{close} - \text{delay}(\text{close},1)) \times (\text{close} > \text{delay}(\text{close},1)?1:0),\ 12\right)
	$$
- Alpha 52
	$$
	\frac{(\text{close} - \text{delay}(\text{close},6))}{\text{delay}(\text{close},6)}
	$$
- Alpha 53
	$$
	\frac{\sum\left(\text{close} - \text{open}, 20\right)}{\sum(\text{adv20}, 20)}
	$$
- Alpha 54
	$$
	-1 \times \text{rank}(\text{std}(\text{close},\ 10) + (\text{close} - \text{open}) + \text{correlation}(\text{close},\ \text{open},\ 10))
	$$
- Alpha 55
	$$
	\sum\left(\text{rank}(\text{correlation}(\text{close},\ \text{adv20},\ 8)),\ 8\right)
	$$
- Alpha 56
	$$
	\exp\left(-1 \times \text{rank}(\text{close} - \text{vwap})\right)
	$$
- Alpha 57
	$$
	\text{close} - \text{vwap}
	$$
- Alpha 58
	$$
	\text{rank}\left(\text{correlation}(\text{high},\ \text{volume},\ 20)\right)
	$$
- Alpha 59
	$$
	\text{rank}\left(\frac{\sum(\text{returns}, 20)}{\sum(\text{abs}(\text{returns}), 20)}\right)
	$$
- Alpha 60
	$$
	\frac{\text{rank}(\text{close} - \text{ts\_mean}(\text{close},8))}{(\text{ts\_std}(\text{close},8) + 0.001)}
	$$
- Alpha 61
	$$
	\frac{(\text{close} - \text{delay}(\text{close},12))}{\text{delay}(\text{close},12)}
	$$
- Alpha 62
	$$
	\frac{\sum\left(\text{close} > \text{delay}(\text{close},1)?1:0,\ 20\right)}{20}
	$$
- Alpha 63
	$$
	\text{rank}(\text{adv20}) \times \text{rank}(\text{close} - \text{open})
	$$
- Alpha 64
	$$
	\text{correlation}(\text{close},\ \text{adv20},\ 20)
	$$
- Alpha 65
	$$
	\text{rank}(\text{ts\_corr}(\text{vwap},\ \text{adv20},\ 6))
	$$
- Alpha 66
	$$
	\frac{\sum(\text{close} - \text{open}, 6)}{\sum(\text{adv20}, 6)}
	$$
- Alpha 67
	$$
	\frac{\text{close}}{\text{delay}(\text{close},3)} - 1
	$$
- Alpha 68
	$$
	\text{ts\_rank}(\text{correlation}(\text{close},\ \text{volume},\ 10), 5)
	$$
- Alpha 69
	$$
	\frac{(\text{close} - \text{open})}{\text{open}}
	$$
- Alpha 70
	$$
	\text{rank}\left(\frac{\text{close}}{\text{delay}(\text{close},10)}\right)
	$$
- Alpha 71
	$$
	\sum\left((\text{close} - \text{delay}(\text{close},1)) \times (\text{close} > \text{delay}(\text{close},1)?1:0),\ 20\right)
	$$
- Alpha 72
	$$
	\frac{(\text{close} - \text{delay}(\text{close},6))}{\text{delay}(\text{close},6)}
	$$
- Alpha 73
	$$
	\text{correlation}(\text{high},\ \text{volume},\ 20)
	$$
- Alpha 74
	$$
	\text{rank}(\text{ts\_corr}(\text{vwap},\ \text{volume},\ 10))
	$$
- Alpha 75
	$$
	\text{rank}\left(\frac{\sum(\text{close} - \text{open}, 10)}{\sum(\text{adv20}, 10)}\right)
	$$
- Alpha 76
	$$
	\frac{\text{close} - \text{delay}(\text{close},20)}{\text{delay}(\text{close},20)}
	$$
- Alpha 77
	$$
	\frac{\text{close} - \text{delay}(\text{close},10)}{\text{delay}(\text{close},10)}
	$$
- Alpha 78
	$$
	\text{rank}\left(\frac{\text{close} - \text{open}}{\text{open}}\right)
	$$
- Alpha 79
	$$
	\frac{\text{close} - \text{vwap}}{\text{vwap}}
	$$
- Alpha 80
	$$
	\text{rank}(\text{correlation}(\text{high},\ \text{adv20},\ 10))
	$$
- Alpha 81
	$$
	\frac{\sum(\text{close} - \text{open}, 20)}{\sum(\text{adv20}, 20)}
	$$
- Alpha 82
	$$
	\text{rank}(\text{close} - \text{open}) \times \text{rank}(\text{volume})
	$$
- Alpha 83
	$$
	\text{rank}\left(\frac{\text{close}}{\text{open}}\right)
	$$
- Alpha 84
	$$
	\text{rank}(\text{correlation}(\text{vwap},\ \text{adv10},\ 10))
	$$
- Alpha 85
	$$
	\frac{\text{close}}{\text{delay}(\text{close},6)} - 1
	$$
- Alpha 86
	$$
	\text{rank}\left(\frac{\text{close} - \text{open}}{\text{open}}\right)
	$$
- Alpha 87
	$$
	\text{rank}(\text{correlation}(\text{close},\ \text{volume},\ 10))
	$$
- Alpha 88
	$$
	\text{rank}(\text{close} - \text{vwap})
	$$
- Alpha 89
	$$
	\frac{\sum(\text{close} - \text{open}, 15)}{\sum(\text{adv20}, 15)}
	$$
- Alpha 90
	$$
	\frac{\text{close} - \text{delay}(\text{close},15)}{\text{delay}(\text{close},15)}
	$$
- Alpha 91
	$$
	\text{rank}(\text{correlation}(\text{high},\ \text{volume},\ 15))
	$$
- Alpha 92
	$$
	\text{rank}(\text{ts\_corr}(\text{vwap},\ \text{volume},\ 10))
	$$
- Alpha 93
	$$
	\frac{\sum(\text{close} - \text{open}, 5)}{\sum(\text{adv20}, 5)}
	$$
- Alpha 94
	$$
	\text{rank}\left(\frac{\text{close}}{\text{delay}(\text{close},5)}\right)
	$$
- Alpha 95
	$$
	\frac{\text{close} - \text{delay}(\text{close},3)}{\text{delay}(\text{close},3)}
	$$
- Alpha 96
	$$
	\text{rank}(\text{correlation}(\text{close},\ \text{volume},\ 5))
	$$
- Alpha 97
	$$
	\frac{\text{close} - \text{open}}{\text{open}}
	$$
- Alpha 98
	$$
	\text{rank}\left(\frac{\text{close}}{\text{open}}\right)
	$$
- Alpha 99
	$$
	\text{rank}(\text{correlation}(\text{vwap},\ \text{adv5},\ 5))
	$$
- Alpha 100
	$$
	\frac{\sum(\text{close} - \text{open}, 20)}{\sum(\text{adv5}, 20)}
	$$
- Alpha 101
	$$
	\text{rank}\left(\text{ts\_corr}(\text{close},\ \text{high} - \text{low},\ 5)\right)
	$$