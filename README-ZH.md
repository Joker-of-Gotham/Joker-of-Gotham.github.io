<div align="center">

# Komari

**在月光之下，记录研究、代码与日常。**

[探索网站](https://joker-of-gotham.github.io/) · [博客](https://joker-of-gotham.github.io/blog/) · [研究路线图](https://joker-of-gotham.github.io/roadmap/) · [English](README.md)

Astro · Three.js · TypeScript · Mermaid · Pagefind

</div>

[![夜色中的 Komari——灯笼、繁花与水中倒影](docs/screenshots/home-dark.webp)](https://joker-of-gotham.github.io/)

这是 **Chika Komari** 的个人网站。穿行于六幕运河街景，再停下来阅读文章、研究计划与正在推进的项目。世界实时渲染，文字则始终保留为可搜索的普通 HTML。

## 一个世界，六幕旅程

入口鸟居 → 右侧街道 → 第一座桥 → 左侧街道 → 第二座桥 → 出口。每一站介绍网站的一个部分，文字排布和镜头运动共享同一个滚动位置。

灯笼、花树、沿岸摊位、游鱼、流云、细雨、涟漪、萤火与远处的烟花，为街景带来节奏。你可以在近黑的紫色夜景和温暖清浅的晨光之间切换。

[![同一条运河的晨光景色](docs/screenshots/home-light.webp)](https://joker-of-gotham.github.io/)

## 方便浏览，也适合认真阅读

- **杂志式文章索引。** 最新文章以图片引导，较早的内容以紧凑、可筛选的列表呈现。
- **连贯的场景。** 栏目页保留在运河中的对应位置。内部跳转复用画布，进入详情页阅读时暂停渲染。
- **可以仔细查看。** 图片、表格和 Mermaid 图支持在独立窗口中缩放和平移。图表随主题适配，在接近视口时按需渲染。
- **清晰的长文排版。** 自适应目录、明确的标题层级、自动换行的表格、深浅主题代码块与 KaTeX 数学公式。
- **轻量的降级体验。** 减少动态效果、节省流量或 WebGL 不可用时，使用仅含场景的底图。不依赖三维渲染器，文字和链接依然可用。
- **可搜索的内容。** Astro 内容集合与构建时生成的 Pagefind 索引，串联文章、研究节点和成果。

[![博客——杂志式文章排版，运河街景延续在其后](docs/screenshots/blog-light.webp)](https://joker-of-gotham.github.io/blog/)

### 研究与成果

从研究领域一路追踪到具体任务，浏览与之相关的论文、系统与实现。

| 研究路线图 | 成果 |
| --- | --- |
| [![夜色主题下的研究路线图](docs/screenshots/roadmap-dark.webp)](https://joker-of-gotham.github.io/roadmap/) | [![晨光主题下的成果页面](docs/screenshots/artifacts-light.webp)](https://joker-of-gotham.github.io/artifacts/) |

### 看得更仔细

打开图表，放大某条关系。文章图片和表格使用同一个查看器。通过控件或鼠标滚轮缩放，拖动平移，按 **Esc** 回到正文。

![真实 Mermaid 图在深色主题的放大窗口中呈现](docs/screenshots/diagram-viewer-dark.webp)

<details>
<summary>查看浅色主题与移动端视图</summary>

![同一张图在浅色主题下的呈现](docs/screenshots/diagram-viewer-light.webp)

<img src="docs/screenshots/home-phone-dark.webp" width="390" alt="窄屏移动视口下的实时首页" />

</details>

### 关于作者

研究、工程，以及这些笔记背后的项目。

[![Chika Komari 的个人简介页面](docs/screenshots/about-dark.webp)](https://joker-of-gotham.github.io/about/)

以上均为 **2026 年 9 月 8 日**对本地生产构建拍摄的真实浏览器截图，以 WebP 格式存储。截图反映当前工作区，公开网站可能仍处于其他已部署版本。来源与哈希见[截图清单](docs/screenshots/manifest.json)。

## 本地运行

使用 **Node.js 20.19+** 和 npm。

```bash
git clone https://github.com/Joker-of-Gotham/Joker-of-Gotham.github.io.git
cd Joker-of-Gotham.github.io
npm ci
npm run dev
```

打开 [localhost:4321](http://localhost:4321/)。如需运行包含 Pagefind 搜索索引的生产构建：

```bash
npm run build
npm run preview
```

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动 Astro 开发模式 |
| `npm run check` | 检查 Astro 与 TypeScript |
| `npm run test` | 运行单元测试 |
| `npm run build` | 构建静态页面与 Pagefind 索引 |
| `npm run preview` | 在本地预览生产构建 |
| `npm run test:e2e` | 构建并运行浏览器测试 |
| `npm run verify` | 运行检查、单元测试、构建与浏览器测试 |
| `npm run cms:local` | 启动本地 Decap CMS 后端 |

浏览器测试使用 Playwright 与 Google Chrome；如果机器上没有 Chrome，请先安装。

## 实现方式

**Astro** 管理路由、内容与文档结构。**Three.js** 渲染程序化几何、水面、光照和氛围。共享的滚动时间线协调场景与 HTML。Astro 客户端路由在页面间保留画布；直接打开文章不会初始化 WebGL。**Mermaid + ELK** 按需绘制图表，**KaTeX** 负责公式，**Pagefind** 提供静态搜索。

```text
src/
├── components/          导航、文章索引、媒体与首页体验
├── content/             文章、研究节点、成果与站点配置
├── lib/observatory/     场景几何、氛围、镜头与生命周期
├── lib/                 内容查询、目录、图表与媒体查看器
├── pages/               首页、博客、路线图、成果、关于与搜索
└── styles/              主题、排版、布局与动效
public/                  静态资源与 Decap CMS
scripts/                 素材处理与截图编码
tests/                   单元与浏览器检查
docs/                    内容指南、设计记录与素材来源
```

## 写作与定制

| 内容 | 位置 |
| --- | --- |
| 文章 | `src/content/blog/<collection>/*.md` |
| 研究节点 | `src/content/roadmap/<node_level>/*.md` |
| 成果 | `src/content/artifacts/<type>/*.md` |
| 首页配置 | `src/content/site/home.yml` |

使用 `related_nodes`、`related_posts` 与 `related_artifacts` 建立条目关联。路线图节点通过 `node_level`（`domain`、`pillar`、`initiative` 或 `task`）、`parent` 和 `sort_order` 组织为树形结构。

如需可视化编辑，在不同终端分别运行 `npm run cms:local` 与 `npm run dev`，再打开 [/admin/](http://localhost:4321/admin/)。线上 CMS 登录需要在 [public/admin/config.yml](public/admin/config.yml) 中配置 OAuth 代理；代理需要单独部署和配置。

可查看[文档索引](docs/README.md)、[frontmatter 指南](docs/frontmatter-and-tags.md)、[Markdown 指南](docs/markdown-presentation.md)与[图片指南](docs/image-guide.md)。使用其他域名或账号前，请修改 [astro.config.mjs](astro.config.mjs) 以及作者相关配置。

## 部署

[GitHub Actions 工作流](.github/workflows/deploy.yml)会构建 Astro、生成搜索索引，并在推送到 `main` 或手动运行时，将 `dist/` 发布到 GitHub Pages。请在仓库设置中将 Pages 的构建来源设为 **GitHub Actions**。

## 设计与致谢

运河世界是受《超时空辉夜姬》中月读世界启发的个人演绎。运行时街景由程序构建，不将影片截图加载为场景背景。本站是独立的个人网站，与官方无关联。

[Meng To 的 Kage](https://github.com/MengTo/kage)为场景、文字与滚动之间的关系，以及本 README 以视觉为先的呈现方式提供了参考。本站的实现与内容结构均独立组织。

图片来源与已记录的使用条件见[素材来源台账](docs/asset-provenance.md)。第三方代码与美术素材保留各自权利。本仓库未提供涵盖全部内容的通用复用许可；再分发内容或素材前，请确认相应权限。

---

[访问 Komari](https://joker-of-gotham.github.io/) · [GitHub 主页](https://github.com/Joker-of-Gotham) · [阅读英文版](README.md)

如果这里的体验或实现对你有帮助，欢迎点一颗 Star，让更多人发现它。
