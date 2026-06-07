# 图片系统替换指南

## 目录结构

```
public/assets/img/
├── profile.png              ← 侧边栏头像 (建议 256×256)
├── heroes/
│   ├── hero-1.webp          ← 首页 Hero 轮播图 #1
│   ├── hero-2.webp          ← 首页 Hero 轮播图 #2
│   ├── hero-3.webp          ← 首页 Hero 轮播图 #3
│   ├── hero-4.webp          ← 首页 Hero 轮播图 #4
│   └── hero-5.webp          ← 首页 Hero 轮播图 #5
├── banners/
│   └── about-bg.webp        ← About 页面横幅背景图
└── covers/
    ├── artifact-ml4t.webp         ← Artifact: CSIRO Biomass
    ├── artifact-alignment.webp    ← Artifact: Alignment (ICML)
    ├── artifact-mmopera.webp      ← Artifact: MM-OPERA (NeurIPS)
    ├── artifact-zanao.webp        ← Artifact: Zanao 市场系统
    ├── artifact-airi.webp         ← Artifact: AIRI LocalGUI
    ├── artifact-graph.webp        ← Artifact: 关键节点识别
    └── blog-*.webp                ← 博客文章封面（可选）
```

---

## 图片清单统计

### 必需图片：12 张

| # | 用途 | 文件名 | 建议尺寸 | 推荐内容 |
|---|------|--------|----------|----------|
| 1 | Hero 轮播 #1 | `heroes/hero-1.webp` | 2560×1440 (16:9) | 氛围场景：夜景/星空/黄昏 |
| 2 | Hero 轮播 #2 | `heroes/hero-2.webp` | 2560×1440 (16:9) | 乐队/音乐主题 |
| 3 | Hero 轮播 #3 | `heroes/hero-3.webp` | 2560×1440 (16:9) | 校园/日常氛围 |
| 4 | Hero 轮播 #4 | `heroes/hero-4.webp` | 2560×1440 (16:9) | 科幻/赛博/技术感 |
| 5 | Hero 轮播 #5 | `heroes/hero-5.webp` | 2560×1440 (16:9) | 柔和插画/人物群像 |
| 6 | About 横幅 | `banners/about-bg.webp` | 2560×800 (宽幅) | 横构图人物/团体 |
| 7 | Artifact 封面 | `covers/artifact-ml4t.webp` | 1920×1080 | CV/ML 主题 |
| 8 | Artifact 封面 | `covers/artifact-alignment.webp` | 1920×1080 | 具身智能/交互 |
| 9 | Artifact 封面 | `covers/artifact-mmopera.webp` | 1920×1080 | 视觉推理/VLM |
| 10 | Artifact 封面 | `covers/artifact-zanao.webp` | 1920×1080 | 数据系统/全栈 |
| 11 | Artifact 封面 | `covers/artifact-airi.webp` | 1920×1080 | 桌面自动化/Agent |
| 12 | Artifact 封面 | `covers/artifact-graph.webp` | 1920×1080 | 图论/网络 |

### 可选图片：28 张（博客文章封面）

所有 28 篇博客文章目前均无封面，使用 CSS 渐变占位。如需添加：

1. 将图片放入 `public/assets/img/covers/`
2. 在文章 `.md` 文件的 frontmatter 中添加 `cover: /assets/img/covers/你的文件名.webp`

---

## 首页 Hero 轮播系统

轮播支持 **多张背景图自动切换**：

- 每 6 秒切换一张，带 1.5s 淡入淡出过渡
- 当前活跃图片有 Ken Burns 缓动效果（微缩放 + 微位移）
- 底部有指示器小圆点，点击可跳转
- 如只放 1 张图，则禁用轮播，等同于静态背景
- **无图时**: 显示纯色 + 渐变发光占位

### 修改轮播图片列表

编辑 `src/pages/index.astro`，找到 `data-slides` 属性：

```html
<div class="hero-carousel" id="hero-carousel"
  data-slides="/assets/img/heroes/hero-1.webp,/assets/img/heroes/hero-2.webp,..."
  data-interval="6000">
</div>
```

- 用逗号分隔图片路径
- `data-interval` 控制切换间隔（毫秒）

---

## About 页面横幅

- **文件路径**: `public/assets/img/banners/about-bg.webp`
- **建议尺寸**: 2560×800 或 3840×1200 (宽幅)
- **引用位置**: `src/pages/about.astro` 中的 `--about-bg-image: url('...')`

---

## 快速替换操作

### 替换 Hero 轮播图

1. 将图片转 WebP（推荐 [Squoosh](https://squoosh.app/)，Quality 80-85）
2. 命名为 `hero-1.webp` ~ `hero-5.webp`
3. 放入 `public/assets/img/heroes/`
4. 刷新页面即可

### 替换 Artifact 封面

1. 将图片转 WebP
2. 按对应文件名放入 `public/assets/img/covers/`
3. 封面路径已在各 Artifact 的 `.md` 文件中配置好，无需修改

### 修改遮罩透明度

如果背景图太亮或太暗，调整 `src/styles/tokens.css`：

```css
--hero-bg-overlay: linear-gradient(
  180deg,
  rgba(3, 5, 8, 0.5) 0%,     /* 顶部透明度 */
  rgba(3, 5, 8, 0.25) 40%,    /* 中间透明度 */
  rgba(3, 5, 8, 0.55) 100%    /* 底部透明度 */
);
```

---

## 推荐图片来源

| 来源 | 类型 | 链接 |
|------|------|------|
| Pixiv | 画师插画 | https://www.pixiv.net/ |
| Wallhaven | 4K壁纸精选 | https://wallhaven.cc/ |
| Konachan | 动漫壁纸 | https://konachan.com/ |
| yande.re | 高清扫描/官图 | https://yande.re/ |
| Danbooru | 标签化动漫图库 | https://danbooru.donmai.us/ |
| Zerochan | 动漫角色壁纸 | https://www.zerochan.net/ |
| 官方画集 / BD 特典 | 正版扫描 | — |

### 搜索关键词

| 作品 | 推荐关键词 |
|------|-----------|
| 败犬女主太多了 | `too many losing heroines`, `make heroine ga oosugiru` |
| 四月是你的谎言 | `shigatsu wa kimi no uso`, `kaori miyazono` |
| 冰菓 | `hyouka`, `chitanda eru`, `千反田える` |
| 爱捉弄的高木同学 | `karakai jouzu no takagi-san`, `高木さん` |
| 我的青春恋爱物语果然有问题 | `oregairu`, `yukinoshita yukino` |
| 孤独摇滚 | `bocchi the rock`, `後藤ひとり` |
| 哭泣少女乐队 | `girls band cry`, `nina iseri` |
| 轻音少女 | `k-on`, `けいおん` |
| 悠哉日常大王 | `non non biyori` |
| MyGO!!!!! | `mygo`, `bang dream mygo` |
| Ave Mujica | `ave mujica`, `bang dream ave mujica` |
| BanG Dream! | `bang dream`, `バンドリ` |
| 超时空辉夜姬 | `kaguya-hime no monogatari` |
| 上伊娜牡丹，醉姿如百合 | `上伊那ぼたん`, `ueina botan` |

### 筛选建议

- **分辨率**: ≥ 2560×1440（Hero）/ ≥ 1920×1080（封面）
- **色调**: 优先暗色调 / 夜景 / 黄昏 / 柔和色彩，与深色主题匹配
- **构图**: Hero 选横构图场景；封面选人物特写或半身

---

## 图片格式与性能

- **推荐格式**: WebP
- **转换工具**: [Squoosh](https://squoosh.app/)，Quality 80-85
- **Hero/横幅**: 压缩后 < 500KB/张
- **卡片封面**: 压缩后 < 200KB/张
- **头像**: 压缩后 < 50KB

## 占位系统

无图时系统自动显示 CSS 渐变占位：

- **Hero**: 渐变发光 + 动态光点
- **卡片封面**: 6 种色彩变体自动循环
