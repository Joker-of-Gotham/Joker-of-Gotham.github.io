# 站点规范文档（docs/）

本目录集中存放本仓库所有内容与呈现规范。写文章、调样式、加图片、维护路线图之前，先看这里。

## 文档索引

| 文档 | 作用 | 何时查阅 |
|------|------|----------|
| [content-writing.md](content-writing.md) | 递归目录、每层 index.md 导读、书目/论文与文章同目录、自动继承 | 新建目录、研究札记、书评或杂谈时优先查阅 |
| [frontmatter-and-tags.md](frontmatter-and-tags.md) | 各类 frontmatter 字段、`categories` / `tags` / `collection` / `related_nodes` 等标签怎么打 | 新建或修改任何 `src/content/**` 内容时 |
| [markdown-presentation.md](markdown-presentation.md) | 提示框、引用块、代码段、数学公式、Mermaid、表格、图片等呈现方式怎么打 | 写或排版正文时 |
| [design-tokens.md](design-tokens.md) | 色彩调色板、色号、字体、间距、圆角、阴影等设计令牌及取用方式 | 调整任何框/文字/组件颜色时 |
| [image-guide.md](image-guide.md) | 图片目录结构、命名、尺寸、Hero 轮播、封面、占位系统 | 替换或新增任何站点图片时 |

## 内容分层速查

```
src/content/
├── blog/<topic>/<subtopic>/.../    # 博客系列与子专题，index.md 为导读
├── research/<direction>/.../      # 研究导读、札记与论文资料
├── reading/<genre>/<book>/.../    # 书目、书内目录与独立书评
├── musings/<topic>/.../            # 杂谈分类与文章
├── roadmap/<node_level>/*.md       # 路线图节点，node_level 分目录
├── artifacts/<type>/*.md            # 成果（project/paper/…）
├── site/                            # 首页与站点级配置（home.yml 等）
└── taxonomy/taxonomy.yml            # 全站受控词表（tracks/topics/types/…）
```

字段与 schema 定义见 [src/content/config.ts](../src/content/config.ts)；本目录是对其使用规范的口语化说明，schema 仍是单一事实源（source of truth）。

## 写作流程建议

1. 按 [content-writing.md](content-writing.md) 选择目录和导读，再查 [frontmatter-and-tags.md](frontmatter-and-tags.md) 补充题头。
2. 正文排版看 [markdown-presentation.md](markdown-presentation.md) 选对呈现方式。
3. 需要颜色时查 [design-tokens.md](design-tokens.md)，用既有 token，不要写死十六进制色值。
4. 配图看 [image-guide.md](image-guide.md)。
5. 内容关系用 `related_nodes` / `related_posts` / `related_artifacts` 串起来，闭环见 README「内容更新规则」。

## 约定优先级

当文档与代码冲突时，以代码为准：

- **Schema 事实源**：`src/content/config.ts`（frontmatter 字段与校验）
- **样式事实源**：`src/styles/tokens.css`（设计令牌）+ `src/styles/global.css`（组件样式）
- **构建配置事实源**：`astro.config.mjs`（Markdown 插件、数学渲染、语法高亮）

文档过时了请直接改本目录，并在 PR 描述里点出。
