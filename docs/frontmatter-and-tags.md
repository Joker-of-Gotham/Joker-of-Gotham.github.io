# Frontmatter 与标签规范

本文件规定 `src/content/**` 下所有 Markdown 内容的 frontmatter 字段与标签打法。**字段 schema 的单一事实源是 [src/content/config.ts](../src/content/config.ts)**；本文档是其使用规范的说明。若与 schema 冲突，以 schema 为准。

---

## 一、Blog 文章（`src/content/blog/<collection>/*.md`）

### 1.1 文件路径与命名

- 目录 = `collection` 的值，例如 `llm_learning`、`graph_theory`、`logic`、`technical_talk`、`software_engineering`、`posts`。
- 文件名：`YYYY-MM-DD-<kebab 或中文短标题>.md`，日期与 frontmatter `date` 一致。
- `slug` 不填则由文件名生成；跨语言/跨系列引用建议显式写 `slug`，便于 `related_posts` 稳定引用。

### 1.2 Frontmatter 字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | ✅ | 文章标题 |
| `date` | date | ✅ | 发布日期（ISO），与文件名日期一致 |
| `slug` | string | — | 显式 slug；跨引用场景建议填 |
| `categories` | string[] | — | 学科/领域分类，**有序，从大到小**（见 §2.1） |
| `tags` | string[] | — | 内容属性标签，自由组合（见 §2.2） |
| `collection` | string | — | 系列/专栏名，默认 `blog`；需与所在目录一致 |
| `related_nodes` | string[] | — | 关联的 roadmap 节点 slug（见 §3） |
| `related_artifacts` | string[] | — | 关联的 artifact slug |
| `summary` | string | — | 摘要；展示在列表与搜索结果，**不填则无摘要** |
| `cover` | string | — | 封面图，`/assets/img/covers/xxx.webp`（见 image-guide） |
| `emoji` | string | — | 列表角标 emoji，可选 |
| `reading_time` | int | — | 手动指定阅读时长（分钟），不填则自动估算 |
| `updated_at` | date | — | 最后更新日期，更新旧文时填 |
| `draft` | bool | — | 草稿，默认 `false` |
| `published` | bool | — | 是否发布，默认 `true` |

> 已弃用但兼容：`category`（单数）。新文章统一用复数 `categories`。

### 1.3 最小示例

```yaml
---
title: 本体工程-第一部分(Ontology Engineering)
date: 2025-07-16T00:00:00.000Z
slug: 2026-07-20-ontology-01
categories:
  - 数学
  - 逻辑学
tags:
  - 综述笔记
collection: logic
related_nodes:
  - graph-logic-track
summary: >-
  本体工程是知识表示与本体构建的系统化方法论……
---
```

---

## 二、标签打法（Blog）

### 2.1 `categories`：学科/领域分类

- **有序数组，从大到小排**。第一项是最大领域，后面逐层细化。
- 尽量复用已有值，新值需具备「学科/领域」语义且足够通用。

当前在用（按频次）：

| 值 | 含义 |
|------|------|
| 人工智能 | AI 总领域 |
| 机器学习 | ML 子领域 |
| 数学 | 数学类总 |
| 技术杂谈 | 工程/杂项技术 |
| 图论 | 图论系列 |
| 软件工程 | Google SE 等 |
| 逻辑学 | 逻辑/本体 |
| 强化学习 | RL 专题 |
| 资源整理 | 资源类 |

> 组合示例：`[数学, 逻辑学]`、`[人工智能, 机器学习, 强化学习]`。

### 2.2 `tags`：内容属性标签

- 自由组合，描述「这篇是什么形态/讲什么」。
- 不承担分类职能，**不要把学科塞进 tags**（那是 `categories` 的事）。

当前在用（按频次）：`综述笔记`、`技术`、`金融量化`、`定义`、`前端`、`核心性质`、`工程`、`资源`、`核心概念`、`数据挖掘`、`指引`、`导入`。

常见搭配建议：

- 系统化长综述 → `综述笔记`
- 形式化定义/定理/性质 → `定义` / `核心性质` / `核心概念`
- 工程实操 → `工程` / `前端` / `技术`
- 资源/索引页 → `资源` / `指引`
- 金融/量化主题 → `金融量化`

### 2.3 `collection`：系列/专栏

当前系列：`llm_learning`、`technical_talk`、`graph_theory`、`software_engineering`、`logic`、`posts`。

- 文件放在 `src/content/blog/<collection>/` 下，且 frontmatter `collection` 与之一致。
- `posts` 为默认/未归类系列，新开系列优先考虑复用已有 collection。

---

## 三、`related_nodes`：内容闭环

`related_nodes` 指向 `src/content/roadmap/**` 中节点的 **slug**，把文章挂到路线图上，形成「路线图 → 文章 → 成果」的闭环。

当前路线图节点 slug（见 [src/content/roadmap/](../src/content/roadmap/)）：

- `llm-systems-track`
- `graph-logic-track`
- `engineering-writing-track`
- `writing-pipeline`
- `llm-rag-workbench`
- `graph-ontology-schema`
- `graph-reasoning-bench`

规则：

1. 一篇文章可关联多个节点；选与主题最相关的 1–3 个即可，不要贪多。
2. 节点 slug 以 roadmap 文件 frontmatter 的 `slug` 为准，**不要凭印象拼**。
3. 同样地用 `related_artifacts` 关联 `src/content/artifacts/**` 的 slug。

---

## 四、Roadmap 节点（`src/content/roadmap/<node_level>/*.md`）

### 4.1 字段

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | ✅ | 节点名 |
| `track` | string | ✅ | 所属 track，见 taxonomy `tracks` |
| `node_level` | enum | — | `domain` / `pillar` / `initiative` / `task`，默认 `initiative` |
| `status` | enum | ✅ | `now` / `next` / `later` / `done` / `blocked` |
| `parent` | string | — | 上级节点 slug；根节点留空 |
| `sort_order` | int | — | 同层排序，越小越靠前 |
| `summary` | string | ✅ | 节点摘要 |
| `cover` | string | — | 封面图 |
| `highlights` | string[] (≤3) | — | 亮点，最多 3 条 |
| `tags` | string[] | — | 标签 |
| `progress` | 0–100 | — | 进度百分比 |
| `last_updated` | date | ✅ | 最后更新日期 |
| `milestones` | object[] | — | 里程碑数组，每项含 `date` / `status` / `evidence`(URL) / `note` |
| `related_posts` | string[] | — | 关联文章 slug |
| `related_artifacts` | string[] | — | 关联成果 slug |

### 4.2 树结构维护

1. 先建根节点（`parent` 空，通常 `node_level=domain`）。
2. 子节点在 `parent` 填上级 slug。
3. 同层排序用 `sort_order`。
4. 移动分支只需改子节点 `parent`，无需改脚本。

### 4.3 `track` 受控值

来自 [src/content/taxonomy.json](../src/content/taxonomy.json) 的 `tracks`：

- `Structural Signal Mining`
- `Semantic Signal Mining`
- `Psychological Signal Mining`

新增 track 必须先在 taxonomy.json 登记。

---

## 五、Artifacts（`src/content/artifacts/<type>/*.md`）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | string | ✅ | 成果名 |
| `type` | enum | ✅ | `project` / `paper` / `competition` / `talk` / `award` / `dataset` |
| `date` | date | ✅ | 日期 |
| `venue` | string | — | 会议/期刊/出处 |
| `summary` | string | ✅ | 摘要 |
| `cover` | string | — | 封面图 |
| `tags` | string[] | — | 标签 |
| `links` | object[] | — | 链接数组，每项 `{label, url}`；url 须为 http(s) 绝对地址或 `/` 开头站内路径 |
| `related_nodes` | string[] | — | 关联 roadmap 节点 slug |

当前在用 type：`paper`、`project`。其余枚举值（`competition` / `talk` / `award` / `dataset`）按需启用。

---

## 六、站点与词表数据

### 6.1 `site` collection（`src/content/site/*.yml`）

首页内容、hero、metrics、quick_links、featured 等。字段见 config.ts `site`。首页改动通过 `src/content/site/home.yml`。

### 6.2 `taxonomy` collection（`src/content/taxonomy.json`）

全站受控词表：`tracks` / `topics` / `types` / `statuses` / `roadmap_levels` / `years`。

- **新增 track / topic / type 前必须先在此登记**，否则无法被引用或筛选。
- 这是唯一允许中文自由扩充的「字典」文件，改动后会影响全站筛选与导航。

---

## 七、通用规则

1. **日期**：一律 ISO（`YYYY-MM-DD` 或 `YYYY-MM-DDTHH:mm:ss.000Z`）。
2. **slug**：kebab-case、稳定不变；引用靠 slug，改 slug 等于断链。
3. **中文文件名**：允许，但**只在与 collection 主题强相关时**用；跨引用/英文场景优先 kebab-case + `slug` 显式声明。
4. **不要用 `category`（单数）**，统一 `categories`。
5. **改 frontmatter 字段名/类型前**先改 [src/content/config.ts](../src/content/config.ts) 的 schema，再同步本文档。
