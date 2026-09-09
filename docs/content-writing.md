# 用 Markdown 写博客、研究、杂谈和书评

## 最少需要什么

在对应文件夹新建一个 `.md` 文件，写题头和正文即可。`date` 是发布日期。

| 内容 | 文件夹 | 正文地址 |
| --- | --- | --- |
| 博客 | `src/content/blog/` | 保持现有 `/blog/.../` |
| 研究札记、论文研读 | `src/content/research/` | `/research/notes/.../` |
| 杂谈 | `src/content/musings/` | `/musings/.../` |
| 独立书评、阅读笔记 | `src/content/reading/` | `/reading/reviews/.../` |

```yaml
---
title: 又一次读到这里
date: 2026-09-09
summary: 这一次，注意到了不同的问题。
---
```

`slug` 可选，建议用于固定正文网址；默认使用 Markdown 文件的 slug。`tags` 与原博客一样。`draft: true` 或 `published: false` 会从正文路由、聚合与搜索中排除该文章。普通修改可添加 `updated_at`。

`summary` 可以直接写 Markdown，支持加粗、斜体、行内代码、代码块、列表和数学公式。博客、研究/书评/杂谈列表和搜索结果共用渲染；不填写时自动从正文提取。预览在解析后缩短文本，保留完整公式与格式结构；旧版自动摘要若包含截断公式等不完整语法，会从正文重新提取。预览省略图片、原始 HTML、嵌入链接和交互控件，点击文章进入完整正文。多行摘要建议使用 YAML 的 `summary: |`。

`cover: /assets/img/covers/你的图片.webp` 同时控制文章列表缩略图与正文标题背景图。研究、阅读、杂谈与博客使用同一响应式图片组件；已有图片会自动使用优化尺寸。新增文章省略 `cover` 时，研究、阅读、杂谈会各自使用站内默认图，之后可以随时替换。缩略图按固定比例裁切，正文头图自适应；优先选择横向图片。图片须有可使用的来源，不使用会失效的临时附件地址。

要让研究文章进入某个专题，再加下面的 `research`；要让书评出现在书架中，再加 `books`。不关联时，文章仍有独立正文和搜索入口。

## 写一次，关联到书籍和研究

以下字段在博客、研究、杂谈、阅读四种文章里都可用。只添加关联，不搬迁或复制原文。读者从聚合页点开的是同一个正文地址。

```yaml
books: [网络科学引论]
research: ["复杂网络/模型与基准/随机图"]
kind: review
```

- `books`：书名列表。有这行，就会自动出现书籍页面，不需要先创建书目。
- `research`：用 `/` 分隔层级，父专题自动生成。可填多条路径，同一篇文章在共同祖先下只显示一次。
- `kind`：可省略，默认 `note`。支持 `note` 笔记、`paper` 论文研读、`reflection` 思考、`review` 书评。
- `order`：可选的专题/书内顺序，默认 0；值越小越靠前，相同值按日期倒序。章节系列可以填 1、2、3。

书名两侧的空白和一层《书名号》会规范化；“图论导论”与“《图论导论》”是同一本书。专题路径中的多余空白会被去掉。书名和专题名应保持一致；改名时同步关联字段，避免分成两个条目。书籍和专题使用名称生成网址，修改名称也会改变它们的网址。

## 想补充书籍资料时

这一步是可选的。在 `src/content/books/` 放一个 Markdown，以同一个 `title` 匹配书名。正文是这本书的整体介绍，不要求是书评，也不会替代书评列表。

```yaml
---
title: 人生的意义
author: 特里·伊格尔顿
categories: [哲学, 人文]
status: 已读
summary: 自己写的一句介绍或推荐理由。
recommended: true
---
这里可以写对这本书的整体印象。
```

`status` 可选：在读、已读、重读中、暂搁、想读。不填则不推断阅读状态。`recommended` 可选，在书籍页显示推荐；正文可说明推荐理由。`cover` 可选，填有使用权的本地图片路径；没有图片时显示站点设计的书名排印，并非出版社封面。`edition` 可备注译者或版本。只建书目也可以，零篇书评会明确留白。书目 `draft: true` 或 `published: false` 会隐藏该书页及其导航关联，公开文章正文中自己写出的书名仍是正文。

## 研究专题的导读

通常只写文章里的 `research` 就够了。若需要为某个方向或深层专题增加导读，在研究文件夹新建 Markdown：

```yaml
---
title: 知识图谱
date: 2026-09-09
kind: overview
research: ["知识图谱"]
summary: 这个方向关心什么。
---
这里写问题背景、阅读路径和目前的判断。
```

导读只渲染在对应专题页，不另生成正文页。一个导读对应 `research` 第一条路径；一个路径保留一个导读。各层都可以有导读。

## 收录论文与关联研读

收集论文不用先写文章。在 `src/content/papers/` 新建 Markdown，题头写下论文和摘要即可；`research` 和文章使用相同的层级规则，尚无研读的论文也能自动生成专题。

```yaml
---
title: '论文标题：有冒号时加引号'
url: https://example.org/paper
abstract: >-
  在这里填写摘要，不要用自己的研读文章摘要代替论文摘要。
abstract_kind: summary
research: ["研究方向/子方向/问题"]
authors: [作者一, 作者二]
year: 2026
venue: 期刊或会议
pdf: https://example.org/paper.pdf
---
```

`title`、`url`、`abstract` 必填，其他字段可选。`abstract_kind` 默认为 `summary`，界面标作“Abstract · 中文整理”；`original` 为原文摘要，`translation` 为中文翻译。原文转载或完整翻译需要相应使用权。`pdf` 是可选的作者/出版方 PDF 地址。收录年份请统一采用明确的版本，并在 `venue` 中说明在线发表与正式卷期的差异。`draft: true` 或 `published: false` 从卡片、索引和搜索中隐藏该论文；已经公开文章中手写的链接不受此开关影响。

研究首页按方向选取论文卡片，文献索引展示全部；每个专题汇集自身及子专题的论文。卡片直接显示摘要与原文链接，还可以按标题、作者、摘要和方向搜索。未写研读的论文保持独立，不虚构阅读状态。

写研读或思考时，在文章题头引用同一 URL，就会自动生成回链。原有最简写法继续有效：

```yaml
kind: paper
papers:
  - title: 'Knowledge Graph Quality Management: A Comprehensive Survey'
    url: https://ieeexplore.ieee.org/document/9709663
    year: 2023
sources:
  - title: 原始研读笔记
    url: https://www.notion.so/你的页面
```

论文研读和自己的思考放在正文中。同一论文被多篇文章引用，文献索引会按 URL 合并（忽略末尾 `/`），下面列出各篇讨论；独立论文 Markdown 的资料优先，摘要只需维护一次。也可直接在文章的 `papers` 条目里添加 `abstract`、`abstract_kind`、`authors`、`venue`、`pdf`，不必建立独立文件。只有标题与链接的旧引用会明确显示“摘要待补充”，不会冒用文章摘要。尽量统一使用论文的稳定原始地址；DOI 与 arXiv 两个不同地址不会自动判断成同一篇。`sources` 是可选的资料溯源，独立正文页会折叠展示。

## 本地检查

`npm run dev` 预览。`npm run check` 检查题头类型，`npm run build` 验证静态生成。网页筛选无需服务器；禁用 JavaScript 时仍可以逐层浏览所有公开条目。
