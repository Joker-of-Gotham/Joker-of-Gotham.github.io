

 Personal Site V2

基于 `Astro + Pagefind + Decap CMS` 的个人站点。

## 技术栈

- Astro 5
- Astro Islands（原生脚本交互）
- Astro Content Collections (blog / roadmap / artifacts / site)
- Pagefind 全站搜索
- Decap CMS（本地可视化 + 线上可视化）
- GitHub Pages 自动部署

## 路由结构

- `/` Home
- `/roadmap/` 路线图总览
- `/roadmap/[slug]/` 路线图详情
- `/blog/` 博客总览
- `/blog/[slug]/` 文章详情
- `/artifacts/[slug]/` 成果详情
- `/about/` 简历页
- `/search/` 搜索页
- `/admin/` CMS 后台

## 本地开发

```bash
npm install
npm run dev
```

## 本地 CMS 编辑（可视化）

```bash
npm run cms:local
npm run dev
```

启动后访问：`http://localhost:4321/admin/`。

## 线上 CMS 编辑（GitHub Pages）

1. 部署一个轻量 OAuth 代理（推荐 Cloudflare Worker）。
2. 把代理域名填到 `public/admin/config.yml` 的 `backend.base_url`。
3. 在 GitHub OAuth App 回调地址中配置该代理地址。

详细示例见：`docs/cms-oauth-proxy-worker.js`。

## 内容更新规则（无需写脚本）

1. 文章、路线图、成果全部通过 `/admin` 表单更新。
2. 只改 `src/content/*`，页面会自动渲染。
3. 使用 `related_nodes / related_posts / related_artifacts` 维护闭环关系。
4. 首页内容通过 `src/content/site/home.yml` 控制。

## 内容目录分层（已启用）

1. Blog: `src/content/blog/<collection>/*.md`
2. Roadmap: `src/content/roadmap/<node_level>/*.md`
3. Artifacts: `src/content/artifacts/<type>/*.md`
4. Decap CMS 已配置自动写入分层路径，无需手动移动文件。

## 路线图树结构字段（Roadmap）

每个 roadmap 节点支持以下树语义字段：

- `node_level`: `domain | pillar | initiative | task`
- `parent`: 上级节点 slug（可空，空表示根节点）
- `sort_order`: 同层排序，数字越小越靠前

维护建议：

1. 先创建根节点（`parent` 为空，通常 `node_level=domain`）。
2. 再创建子节点并在 `parent` 里选择上级 slug。
3. 同层节点通过 `sort_order` 控制显示顺序。
4. 若要移动分支，只需修改子节点 `parent`，无需改任何脚本。

## 关键脚本

- `npm run dev`: 本地开发
- `npm run build`: 生产构建 + Pagefind 索引
- `npm run check`: 类型与内容检查
- `npm run cms:local`: 启动本地 CMS backend

## 部署

推送到 `main` 后，GitHub Actions 会自动：

1. 安装依赖
2. Astro 构建
3. Pagefind 建索引
4. 部署到 GitHub Pages

## 目录说明

- `src/content/*`: 结构化内容源
- `src/lib/content/*`: 内容查询层
- `src/components/*`: UI 与布局组件
- `public/admin/*`: Decap CMS 后台
- `public/*`: 纯静态资源（`robots.txt`、站点验证文件、图片等）

## 迁移说明

旧的 Jekyll 目录（如 `_posts`、`_layouts`、`assets`、`_tabs` 等）已完成迁移并从仓库移除，当前仅保留 Astro 结构。

## 设计系统

完整 design tokens 在 `src/styles/global.css`：

- 色彩、阴影、圆角、间距、字体、动效
- 8pt spacing
- 状态色 now/next/later/done
- 响应式断点 mobile/tablet/desktop/wide
