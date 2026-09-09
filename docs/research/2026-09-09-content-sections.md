# 研究、杂谈与阅读

## 决策与范围

Owner：Chika Komari。实现 DRI：Codex。用户于 2026-09-09 授权依据前一轮规划实现三个栏目，读取 Notion 选材，撰写教育主题杂谈。未请求部署。

| 工作对象 | 风险 | 质量目标 | 当前成熟度 | 验证与评审 |
| --- | --- | --- | --- | --- |
| Feature：个人站内容体系 | S1：可逆的本地内容与界面修改 | QA-L2：类型检查、内容关系测试、路由与无障碍回归 | 本地实现与验证完成，待 Owner 视觉审阅 | 源材料检查、桌面与移动端浏览器验证已执行；不代表 Owner 已批准发布 |

## 信息架构

- 研究按 Markdown `research` 路径自动生成递归专题，不要求先注册分类。可选 `kind: overview` Markdown 为专题增加导读。
- 杂谈独立写在 `src/content/musings`。阅读文章独立写在 `src/content/reading`，与博客共用基础阅读能力，但独立模板入口。
- 各类文章均可通过 `books`、`research` 关联书籍及专题；聚合页指向原始正文，不复制页面。
- 书籍由 `books` 字段自动创建；可选 `src/content/books/*.md` 补充作者、题材、阅读状态、封面和总评。
- 旧博客地址保持稳定。书籍与专题聚合按规范化名称识别，改名须同步关联字段；不新增后台、注册流程或数据库。
- 论文引用使用 Markdown 题头 `papers`，正文承担研读，文献索引自动聚合相同 URL。
- 首页沿用六个场景，依次为开场、写作、研究、作品、阅读、关于。书架详细条目在阅读页展开，首页保持简短入口。没有新增 WebGL 世界。

## 资料范围与溯源

只选取与本次专题有关的概念笔记与公开论文研读，未导入实习周报、通信、个人申请材料、论文草稿或附件。Notion 临时图片地址不写入站点。新增内容为整理摘要，不声称新实验或已验证成果。

| 来源 | 用途 |
| --- | --- |
| https://www.notion.so/37d96e595da880699e05dd586bef302b | KG 质量管理综述研读 |
| https://www.notion.so/39d96e595da880c0aa9cee4c75def54e | Linked Data 质量维度研读 |
| https://www.notion.so/36d96e595da880059f97d90187c860ed | Agent 语义控制平面与研究问题 |
| https://www.notion.so/1f796e595da88083b925d5dfd22f6436 | 随机图读书笔记，修正极限条件与巨分支表述 |
| https://www.notion.so/7ea96e595da882aca770011b82f34325 | 《人生的意义》作者、已读状态、原阅读日期 |
| https://www.notion.so/a0696e595da8834ea59f014f0070f071 | 《善恶的彼岸》作者与已读状态 |

未有来源的书籍状态不推断。书名排印是无图片时的界面占位，不是出版社封面。教育杂谈为用户委托新写的评论，避免虚构个人经历和未经支持的总体统计。

## 验证记录

2026-09-09，本地最终实现验证结果：

| 检查 | 实际结果 |
| --- | --- |
| `npm run check` | 0 errors、0 warnings；保留 3 条原有提示 |
| `npm run test` | 15 个测试文件、69 项单元测试通过 |
| `npm run build`（含 Pagefind postbuild） | 成功，82 个静态页面 |
| 浏览器回归 | 下列 7 个测试文件，共 50 项通过；Chrome，单 worker |
| `git diff --check` | 通过；仅 Windows 换行转换提示 |

浏览器命令：

```sh
npx playwright test tests/e2e/library.spec.ts tests/e2e/archive.spec.ts tests/e2e/observatory.spec.ts tests/e2e/observatory-dom-motion.spec.ts tests/e2e/route-scenes.spec.ts tests/e2e/reading-outline.spec.ts tests/e2e/reading-media.spec.ts
```

覆盖三级专题与共享祖先去重、论文讨论回链、书籍聚合后打开唯一博客地址、独立书评、无书评状态、筛选与历史返回、跨来源的书评搜索、快捷搜索、320/768/1280 宽度的页面溢出、明暗主题自动无障碍检查、无 JavaScript 浏览，以及原首页六场景、目录、Mermaid 与媒体查看回归。

使用 Codex 浏览器另行查看了桌面与 390px 手机端的研究首页、专题页、书架、单本书籍与杂谈正文。调整了专题标题与留白、书名中英文断行、浅色小字对比度和首页阅读入口的位置。无障碍自动检查不是完整人工 WCAG 认证；浏览器宽度模拟不是物理设备测试。

首批内容为 3 个研究方向、5 篇独立研究文章、1 篇同时关联复杂网络专题的独立阅读文章、5 本书和 1 篇教育杂谈。另将 9 篇已有博客通过题头关联到对应书籍。Notion 只读，站点未部署，未推送 GitHub。

后续写作参见 [Markdown 写作说明](../content-writing.md)。

## 论文卡片与文章配图修正 · 2026-09-09

Work object: Feature correction；S1 / QA-L2；Owner: Joker-of-Gotham；DRI: Codex；成熟度目标 M3（本地验证）。本次为用户明确要求的本地迭代，未涉及发布或 Notion 写入；增量内容模型和现有组件复用不需要独立 RFC / ADR，决定记录于此。

问题：原研究页面把两条论文引用置于专题末尾的折叠区，文献索引只有标题，没有摘要；研究、阅读、杂谈的 `cover` 未接入列表和正文。

修正：独立 `papers` Markdown 集合允许先收录再研读，兼容文章题头内联引用。论文在研究首页、各层专题、文献索引和引用文章末尾使用同一张卡片，展示完整标题、作者、摘要、原文及可用 PDF，并自动关联原有文章。独立资料优先，按统一 URL 去重。新增三篇论文仅作收录，不声称作者已研读；已有 Notion 研读不冒充论文 Abstract。摘要都是依据原始来源写的简短中文整理，不是全文转载或逐字翻译。

| 论文 | 原始来源与版本说明 |
| --- | --- |
| Knowledge Graph Quality Management | [北京大学作者机构版 PDF](https://www.wict.pku.edu.cn/docs/20240422164533167415.pdf)，摘要与作者已核对；IEEE 页面触发机器人验证。2022 在线、2023 正式卷期，卡片明确区分。 |
| Quality assessment for Linked Data | [出版方页面](https://journals.sagepub.com/doi/10.3233/SW-150175)，作者与摘要已核对，2015 首次在线。页面标题聚合的编辑名未作为论文作者。 |
| ReAct | [arXiv:2210.03629](https://arxiv.org/abs/2210.03629)，2022 预印本 / ICLR 2023；本次新增收录。 |
| Reflexion | [arXiv:2303.11366](https://arxiv.org/abs/2303.11366)，2023；本次新增收录。 |
| Random graphs with arbitrary degree distributions | [arXiv:cond-mat/0007235](https://arxiv.org/abs/cond-mat/0007235)，2001 正式发表；本次新增收录。 |

七篇新板块文章均补上明确的 `cover`，并通过 `ResponsiveCover` 复用现有优化图片。所有既有博客均已有 `cover`，其图片不变。使用的图片均为仓库内既有图，不新增外部图片；来源沿用 [资产记录](../asset-provenance.md) 中的 Owner attestation，未重新作独立权利认定。

本次实际验证：`npm run check` 0 errors、0 warnings、3 条原有 hints；`npm run test` 71 项通过；`npm run build` 与 Pagefind 成功，82 页。`tests/e2e/library.spec.ts` 最终 8 项全部通过，覆盖论文卡片/摘要/原文链接、作者及摘要搜索、独立论文的全局搜索定位、引用去重、七篇文章缩略图与头图加载一致性、手机头图放大、320/768/1280 宽度与明暗主题 Axe 检查、无 JS 浏览。另 9 项既有阅读目录/媒体测试在本轮通过，之后只调整了新板块卡片颜色和新文章头图布局。第一轮发现浅色卡片小字对比度 4.29:1，修正局部文字颜色后两种主题复查通过；不将初次失败报告为通过。

使用 Codex 浏览器查看研究首页完整卡片与文章缩略图、浅色文献索引及杂谈正文；查看了测试生成的手机截图。修正新正文头图的人物裁切，并移除头图前多余的返回行以延续博客首屏布局。`git diff --check` 通过。上一节 69 / 50 / 82 为前一轮历史结果。本次未推送、未部署。
