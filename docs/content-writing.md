# 按目录写作

**目录就是分类，`index.md` 是该层导读，其他 Markdown 是内容。** 任意层都可以继续新建子目录，不需要注册分类，也没有固定层数限制。

```text
src/content/
├─ research/
│  └─ 知识图谱/
│     ├─ index.md
│     └─ 数据质量/
│        ├─ index.md
│        └─ 质量评估/
│           ├─ index.md                  # 本层导读
│           ├─ kg-quality-survey.md      # 论文研读
│           ├─ quality-before-score.md   # 自己的思考
│           └─ paper-kg-quality.md       # 论文资料卡
├─ reading/
│  └─ 数学/网络科学/网络科学引论/
│     ├─ index.md                        # 书目与整体介绍
│     └─ 随机图/
│        ├─ index.md                     # 书内小节导读
│        └─ random-graphs.md             # 独立书评
├─ musings/
│  └─ 教育/评价与成长/
│     ├─ index.md
│     └─ after-the-answer.md
└─ blog/
   ├─ graph_theory/图论导论/
   │  ├─ index.md
   │  └─ 2025-07-08-图论导论-定义与案例.md
   └─ llm_learning/机器学习/量化交易/
      ├─ index.md
      └─ 2025-08-05-machine-learning-for-trade-algo-p1.md
```

## 在目录开头写导读

新建 `index.md`：

```markdown
---
title: 质量评估
summary: 先确定任务，再讨论指标与证据。
---
这里解释这一部分关心什么、从哪篇文章开始，以及子目录之间的关系。
```

文件名决定它是导读，不必再填写 `kind: overview` 或日期。正文支持公式、代码、图片等 Markdown，在对应目录页开头显示；同级文章继续使用文章列表，下一级目录使用目录卡片。研究仍是专题页，阅读仍按书归组，博客和杂谈总览保持原有列表方式。

没有 `index.md` 的普通目录也会自动出现，名称使用文件夹名；需要介绍、改显示名称或设置默认信息时再添加即可。根目录的导读正文显示在该板块总览中。导读不进入文章计数、日期排序或书评列表。`index.md` 与 `index.mdx` 二选一，不要在同一目录同时创建。

## 写一篇文章

在合适目录中新建 `.md`，最少只需标题、日期与正文：

```markdown
---
title: 在设计质量分数之前，先写下任务
date: 2026-09-09
---
这里写正文。
```

放在 `research/知识图谱/数据质量/质量评估/` 就会自动属于该专题，无需重复填写 `research`。放在一本书的目录或任意子目录中就会自动关联该书，无需逐篇填写 `books`。

`kind` 可选：`note` 笔记（默认）、`paper` 论文研读、`reflection` 思考、`review` 书评。`order` 可控制同级文章顺序，越小越靠前，相同值按日期倒序；修改文章可写 `updated_at`。

`summary` 是列表和搜索简介的唯一来源，支持 Markdown；省略或留空时不显示简介，不从正文提取，也不会因换行或语法不完整而替换成正文。博客、研究、书评、杂谈和搜索共用预览渲染，支持加粗、公式、代码和列表，先解析再缩短，避免破坏语法。多行摘要使用 YAML 的 `summary: |`，请在题头写完整简介。预览省略原始 HTML、图片和交互控件，完整内容在正文中阅读。

## 书目与多篇书评放在一起

在书籍目录的 `index.md` 中标明 `kind: book`，区分“题材目录”与“一本书”：

```markdown
---
kind: book
title: 人生的意义
author: 特里·伊格尔顿
status: 已读
summary: 自己写的一句介绍或推荐理由。
recommended: true
---
这里写对整本书的介绍，不会被当成一篇书评。
```

同目录可写多篇书评，也可继续建立“章节 / 问题 / 重读”等子目录，每层都可加导读。`kind: book` 只用于阅读目录的 `index.md`。

可选字段：`categories` 题材、`edition` 译者或版本、`cover` 封面。不填题材时，从书籍上方的目录推导，如 `历史/中国史/书名/index.md` 会得到“历史、中国史”。状态支持在读、已读、重读中、暂搁、想读；不填就不推断。只建书目、暂时没有书评也可以。

同一本书只维护一个书目，博客中的相关书评通过 `books` 关联过来，原文仍只有一份。书架只展示书籍，不把所有书评铺到首页。没有封面时使用书名排印，并非虚构出版社封面。

## 论文与札记放在同一专题

在研究专题目录增加一个普通 Markdown，写 `kind: reference`：

```yaml
---
kind: reference
title: '论文标题：有冒号时加引号'
url: https://example.org/paper
abstract: >-
  填写论文摘要，不使用自己的研读文章摘要代替。
abstract_kind: summary
authors: [作者一, 作者二]
year: 2026
venue: 期刊或会议
pdf: https://example.org/paper.pdf
---
```

资料卡需要 `kind: reference`、`title`、`url`、`abstract`，无需文章日期，专题来自目录。文件名可用 `paper-简短名称.md` 方便辨认，前缀不是程序要求。卡片仍展示标题、摘要和原文链接，不会成为札记或独立文章页。

`abstract_kind` 支持 `summary`（中文整理，默认）、`original`（原文）、`translation`（中文翻译）。完整转载或翻译应有相应使用权，图片使用已有授权来源。`pdf` 可选。

研读文章仍可通过题头引用论文：

```yaml
kind: paper
papers:
  - title: 'Knowledge Graph Quality Management: A Comprehensive Survey'
    url: https://ieeexplore.ieee.org/document/9709663
```

论文按 URL 合并，独立资料卡优先，自动列出引用它的研读与思考。`reference` 是论文资料，`paper` 是你写的研读。旧的文章内联 `papers` 写法仍可使用；也可在内联条目中补充摘要、作者和 PDF。

## 目录默认信息与跨目录关联

`index.md` 可以设置子树的 `tags`、`categories`、`cover`、`books`、`research`；博客还可设置 `collection`。

- `tags`、`categories`、`books` 合并祖先信息与文章题头，自动去重。
- `cover`、博客 `collection` 优先采用文章自己的值，否则采用最近祖先的值。博客未设置集合时使用第一层目录名。
- 研究文章自动使用完整目录专题路径，题头 `research` 用于增加其他方向，不重复登记每个祖先专题。
- 阅读文章自动关联最近的书目祖先，题头 `books` 可以增加其他书籍。
- 博客和杂谈里的 `research`、`books` 可从导读继承，也可只写在一篇文章里。

例如只在博客写一篇同时关联书籍和研究方向的文章，仍只需：

```yaml
books: [网络科学引论]
research: ["复杂网络/模型与基准/随机图"]
```

系列博客可把 `books` 写在系列的 `index.md`，整组文章自动关联。聚合页始终链接原文，不复制正文。书名两侧空白和一层《书名号》会规范化；不要给同一本书写多个不同标题。

`cover` 同时控制列表缩略图和正文标题图，沿用响应式图片组件。研究、阅读、杂谈文章不填时使用该板块默认图。书目封面可被子文章继承，若需不同配图，请在文章中写自己的 `cover`。`sources` 可保留 Notion 等资料溯源，不会写回来源平台。

## 移动文件、地址与草稿

- **已发布文章请保留 `slug`。** 显式 slug 不随文件移动改变；本次迁移已保留原有文章链接。
- 新文章不填 slug 时，以相对板块根目录的完整路径生成地址，支持多层级。例如 `musings/生活/旅行/札记.md` 对应 `/musings/生活/旅行/札记/`。
- 若以后会移动文章，首次发布时写稳定的 `slug`，如 `travel-notes`。两篇公开文章不能使用同一个 slug。
- 目录与正文地址分开：研究专题沿用 `/research/topics/.../`；博客、杂谈、阅读目录使用各自 `/topics/.../`；书籍仍是 `/reading/books/书名/`。
- 研究目录的显示名称参与专题地址；修改 `title` 时同步跨专题关联。书目 `title` 改名也会改变书籍地址。
- `draft: true` 或 `published: false` 隐藏文章；写在目录导读上时隐藏整个子树，子文章不能用 `published: true` 穿透草稿父目录。

不需要生成注册表、运行迁移脚本或新增后台操作。直接新建目录和 Markdown 即可；迁移脚本只是本次整理旧内容的工具，不是日常写作步骤。

## 检查

`npm run dev` 预览，`npm run check` 检查内容类型，`npm run build` 检查完整生成及重复地址。目录扫描与父子关系没有人为层数限制，实际路径长度仍受文件系统限制。禁用 JavaScript 时，导读、文章和父子目录链接仍可浏览。
