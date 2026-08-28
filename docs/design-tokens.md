# Lunar Signal Observatory 设计令牌

> 规范意图：[`DESIGN.md`](../DESIGN.md)<br>
> 实现合同：[`design-system/MASTER.md`](../design-system/MASTER.md)<br>
> 运行时事实源：[`src/styles/tokens.css`](../src/styles/tokens.css)<br>
> 快照日期：2026-08-28

本文件是令牌注册表与使用指南，不复制组件样式。若文档和值发生漂移，应在同一变更中修正；不得以“现有组件就是这样”为理由绕过令牌系统。

## 1. 三层架构

```text
Layer 1 — Base       --primitive-*      OKLCH、字体栈、尺寸、时长
Layer 2 — Semantic   --color-* 等       background、foreground、primary、motion
Layer 3 — Component  --component-*      button、card、nav、article、canvas、audio
```

读取规则：

- 新组件优先读取 Layer 3；没有组件合同才读取 Layer 2。
- 禁止组件直接读取 Layer 1。
- Dark / Light 只重映射 Layer 2 颜色；Layer 1 和组件结构不复制。
- 历史别名继续可用，但只作为迁移桥，不作为新命名范例。
- 仓库当前未安装 Tailwind，因此运行时不输出 `@theme`；未来引入 Tailwind v4 时按同名语义 token 一对一映射，不能建立第二套颜色事实源。

## 2. Primitive palette

十六进制仅用于对应已批准 Brief；CSS 中的源值全部为 OKLCH。

### 2.1 Lunar neutral

| Token | OKLCH | 用途 |
|---|---|---|
| `--primitive-color-void-950` | `oklch(0.1229 0.0108 271.39)` | Void，深空最底层 |
| `--primitive-color-ink-900` | `oklch(0.1604 0.0152 272.20)` | Ink，深色页面底 |
| `--primitive-color-ink-850` | `oklch(0.19 0.02 273)` | 深色抬升背景 |
| `--primitive-color-ink-800` | `oklch(0.2162 0.0241 273.38)` | 深色 surface |
| `--primitive-color-ink-750` | `oklch(0.2686 0.0323 273.83)` | 浅色正文 / 深色 strong surface |
| `--primitive-color-ink-700` | `oklch(0.3056 0.0369 273.23)` | 可选深灰阶 |
| `--primitive-color-ink-600` | `oklch(0.48 0.026 272)` | 浅色 muted text |
| `--primitive-color-mist-500` | `oklch(0.7338 0.0186 264.45)` | 深色 muted text |
| `--primitive-color-mist-300` | `oklch(0.8638 0.0187 269.07)` | 深色正文 |
| `--primitive-color-paper-100` | `oklch(0.9264 0.0092 78.28)` | 浅色深层 / 暖纸 |
| `--primitive-color-paper-50` | `oklch(0.9618 0.0086 84.57)` | Moon Paper |
| `--primitive-color-white` | `oklch(1 0 0)` | 仅用于浅色抬升表面 |

### 2.2 Brand and status

| 色组 | 300 | 500（批准锚点） | 700 | 语义 |
|---|---|---|---|---|
| Violet | `0.79 0.125 286` | `0.6642 0.1875 286.04` | `0.4714 0.1734 280.97` | 主信号、关键动作 |
| Orbit Blue | `0.82 0.095 258.5` | `0.7240 0.1439 258.69` | `0.49 0.145 259` | 链接、轨道、信息 |
| Afterlight Rose | `0.82 0.075 359` | `0.7371 0.1159 359.13` | `0.5116 0.128 358.13` | 个人彩蛋 |
| Observatory Gold | `0.84 0.06 85` | `0.7494 0.0826 84.76` | `0.59 0.095 88` | 刻度、警告、稀有强调 |
| Success | — | `0.72 0.12 165` | `0.49 0.105 165` | 完成 / 成功 |
| Danger | — | `0.70 0.16 25` | `0.50 0.145 25` | 错误 / 危险 |

表中三个数字依次为 OKLCH 的 L / C / H，实际变量含完整 `oklch()`。

## 3. Semantic color mapping

| Semantic token | Void Observatory（暗） | Moon Paper Archive（亮） |
|---|---|---|
| `--color-background-deep` | void 950 | paper 100 |
| `--color-background` | ink 900 | paper 50 |
| `--color-background-raised` | ink 850 | white |
| `--color-surface` | ink 800 | white |
| `--color-surface-strong` | ink 750 | paper 100 |
| `--color-foreground` | paper 50 | void 950 |
| `--color-foreground-soft` | mist 300 | ink 750 |
| `--color-muted` | mist 500 | ink 600 |
| `--color-primary` | violet 500 | violet 700 |
| `--color-secondary` | blue 500 | blue 700 |
| `--color-accent` | rose 500 | rose 700 |
| `--color-metal` | gold 500 | gold 700 |
| `--color-link` | blue 300 | violet 700 |
| `--color-focus-ring` | blue 500 | blue 700 |
| `--color-success` | success 400 | success 700 |
| `--color-warning` | gold 500 | gold 700 |
| `--color-danger` | danger 400 | danger 700 |
| `--color-info` | blue 500 | blue 700 |

每个交互 / 状态色有对应 `*-foreground`。边框通过语义前景色与透明色的 OKLCH 混合得到；普通分隔线不承担唯一状态信息，可交互边界使用 stronger token 和 focus ring。

### 3.1 Scene bridge

Three.js / WebGL 不复制颜色字面量，而从计算样式读取：

- `--scene-fog-color`
- `--scene-signal-color`
- `--scene-orbit-color`
- `--scene-afterlight-color`
- `--scene-metal-color`
- `--scene-particle-base`

主题变化只需更新 CSS 映射。Shader 需要数字向量时，由统一 bridge 转换一次并更新 uniform。

## 4. Component tokens

| Family | Tokens | 责任 |
|---|---|---|
| Button | `--component-button-primary-*`, `secondary-*`, `border`, `focus-ring` | 按钮状态基线 |
| Card | `--component-card-bg*`, `border*`, `shadow*` | 卡片 / 档案表面 |
| Field | `--component-field-bg*`, `edge*` | 开放式内容平面与局部光轨边缘 |
| Nav | `--component-nav-bg`, `border`, `active` | 悬浮或档案导航 |
| Form | `--component-form-bg`, `border`, `placeholder` | 输入与筛选 |
| Article | `--component-article-*`, `--component-code-*` | 正文和代码；代码面固定深色以匹配 Shiki dark 输出 |
| Canvas | `--component-canvas-*`, `--component-avatar-*` | Poster、2.5D 角色、环境信号 |
| Audio | `--component-audio-control-*` | 用户主动启用的环境音控制 |

组件可以在自身作用域重映射 Layer 3 token，但不能把新的 raw 值塞入局部覆盖。例如某重大成果卡需要更强边框时，应将 `--component-card-border` 重映射到现有 `--color-primary` 混合值，而不是写十六进制。

## 5. Typography

### 5.1 Font stacks

| Token | Stack / intent |
|---|---|
| `--font-display` | Space Grotesk；缺失 CJK 字形回退到 Source Han Serif SC / Noto Serif CJK SC |
| `--font-sans` | Inter；中文回退到 Source Han Sans SC / Noto Sans CJK SC / 系统无衬线 |
| `--font-mono` | JetBrains Mono → SFMono / Consolas / Liberation Mono |

兼容别名：`--font-heading → --font-display`，`--font-body → --font-sans`。

### 5.2 Fluid scale

| Token | Range | Intended use |
|---|---|---|
| `--text-xs` | `0.75–0.8125rem` | 元数据、坐标 |
| `--text-sm` | `0.8125–0.9rem` | UI label、图注 |
| `--text-base` | `0.975–1.075rem` | 正文 |
| `--text-lg` | `1.0875–1.25rem` | 导语、小标题 |
| `--text-xl` | `1.25–1.5rem` | 卡片标题 |
| `--text-2xl` | `1.5–1.95rem` | 章节次标题 |
| `--text-3xl` | `1.9–2.65rem` | 页面标题 |
| `--text-4xl` | `2.5–3.9rem` | 大章节标题 |
| `--text-5xl` | `3.25–6rem` | 首页主标题 |

所有条目由 `clamp()` 实现。行高语义为 `--leading-tight / heading / body / code`。新代码不能在媒体查询里写另一套固定字号。

## 6. Spacing, layout, radius, and depth

### 6.1 Spacing

四点基线：`--space-1/2/3/4/5/6/8/10/12/16/20/24/32` 对应 `0.25rem` 至 `8rem`。历史“8pt 基线”描述已废弃；偶数步仍自然落在 8pt 节奏上，奇数步用于细部对齐。

### 6.2 Layout

| Token | Value | Role |
|---|---:|---|
| `--layout-reading-width` | `44rem` | 文章正文 |
| `--layout-content-width` | `75rem` | 常规页面 |
| `--layout-cinematic-width` | `100rem` | 电影化章节 |
| `--layout-page-inline` | fluid `1–3.5rem` | 页面安全边距 |
| `--layout-section-block` | fluid `4–9rem` | 章节节奏 |
| `--layout-grid-gap` | fluid `1–2rem` | 网格间距 |

### 6.3 Radius

`xs 6px`、`sm 10px`、`md 16px`、`lg 24px`、`xl 32px`、`orbit/full` 近似无限圆角。`--radius-pill` 与 `--radius-full` 都映射到 orbit，保留旧组件兼容。

线条使用 `--line-hairline`（1px）或 `--line-emphasis`（2px）；组件不得自行发明第三种常规边框宽度。

### 6.4 Depth

`--shadow-sm/md/lg` 对应普通表面、仪器浮层和对话层。Glow shadow 使用语义 primary 的透明混合，不再内嵌旧 cyan RGB。Glass blur 保留 thin 8px、regular 16px、thick 24px，但只有确实叠在场景 / 图像上方时才可用。

## 7. Motion and reduced motion

| Semantic token | Default | Use |
|---|---:|---|
| `--motion-duration-instant` | `0ms` | 即时状态 |
| `--motion-duration-fast` | `120ms` | hover / tooltip |
| `--motion-duration-normal` | `220ms` | 菜单 / 聚焦 |
| `--motion-duration-slow` | `420ms` | 局部转场 |
| `--motion-duration-cinematic` | `900ms` | 角色聚合 / 主题形态 |

Easing：`standard` 用于状态，`out` 用于进入和反馈，`in` 用于离开，`spring` 只用于小位移弹性反馈。

`prefers-reduced-motion: reduce` 或 `data-motion="reduced"` 会将有效时长设为 `1ms`、位移设为 `0px`，并将视差、粒子漂移、持续动画开关设为 0。运行时代码必须读取 `--motion-continuous-enabled`；不能只依赖 CSS 停掉一部分动画。

兼容别名 `--duration-fast/normal/slow` 与 `--ease-out/spring/smooth` 已指向新的语义层。

## 8. Theme application

```html
<!-- explicit user choice -->
<html data-theme="light">

<!-- manual accessibility choice -->
<html data-motion="reduced">
```

没有 `data-theme` 时跟随系统；显式属性优先。默认 CSS 为深色，系统浅色映射使用 `:root:not([data-theme])`，因此不会覆盖手动深色。未来增加主题脚本时需在首屏绘制前应用已保存的属性，避免闪烁。

## 9. Compatibility alias registry

| Legacy token | Current mapping |
|---|---|
| `--bg-void/base/muted` | semantic backgrounds |
| `--bg-elevated/surface` | card contract |
| `--text-strong/default/muted` | semantic foreground roles |
| `--accent-violet` | primary Signal Violet |
| `--accent-blue` | secondary Orbit Blue |
| `--accent-cyan` | secondary Orbit Blue（仅历史名称，已无 cyan primitive） |
| `--accent-rose` | Afterlight accent |
| `--accent-amber/yellow` | Observatory Gold / warning |
| `--accent-green` | success |
| `--status-*` | semantic status colors |
| `--glass-*` | semantic surfaces and borders |
| `--cover-grad-1…6` | theme-aware semantic gradients |
| `--hero-bg-overlay`, `--about-bg-overlay` | theme-aware semantic overlays |

删除兼容别名前必须用 `rg` 证明没有消费者，并执行检查与生产构建。不能盲目替换 `--text-*`：旧的 `--text-strong` 是颜色，而新的 `--text-xs…5xl` 是字号。

## 10. Usage examples

```css
/* Preferred: Layer 3 contract */
.signal-card {
  color: var(--color-foreground);
  background: var(--component-card-bg);
  border: var(--line-hairline) solid var(--component-card-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--component-card-shadow);
}

/* Acceptable: semantic role when no component contract exists */
.observation-coordinate {
  color: var(--color-muted);
  font: var(--text-sm) / var(--leading-body) var(--font-mono);
}

/* Forbidden: primitive and raw visual value inside a component */
.bad-example {
  color: var(--primitive-color-violet-500);
  background: #05060a;
  margin: 18px;
}
```

## 11. Contrast report

The following core opaque pairs were calculated from the declared OKLCH anchors by conversion to clamped sRGB and WCAG 2.x relative luminance on 2026-08-28:

| Pair | Ratio | Result |
|---|---:|---|
| Dark heading / background | 17.37:1 | AA / AAA |
| Dark body / background | 12.83:1 | AA / AAA |
| Dark muted / background | 8.23:1 | AA / AAA |
| Dark primary text / primary | 6.23:1 | AA |
| Dark secondary text / secondary | 8.23:1 | AA / AAA |
| Dark accent text / accent | 8.23:1 | AA / AAA |
| Dark warning text / warning | 9.05:1 | AA / AAA |
| Light heading / background | 18.13:1 | AA / AAA |
| Light body / background | 13.59:1 | AA / AAA |
| Light muted / background | 5.87:1 | AA |
| Light primary text / primary | 6.48:1 | AA |
| Light secondary text / secondary | 5.70:1 | AA |
| Light accent text / accent | 5.49:1 | AA |
| Light warning text / warning | 4.91:1 | AA |
| Light link / background | 6.48:1 | AA |

This arithmetic check does not validate translucent glass, gradients, imagery, focus-ring adjacency, font rendering, P3 gamut mapping, or real component states. Those remain **unverified** until browser-level visual/accessibility testing.

## 12. Change checklist

1. Does the value express an existing semantic role?
2. If not, is a new role justified across more than one component?
3. Are dark, light, reduced motion, and static/no-WebGL states defined?
4. Are all new assets/dependencies recorded in `docs/asset-provenance.md`?
5. Were `DESIGN.md`, `MASTER.md`, this registry, and CSS kept consistent?
6. Were only actually executed checks reported?
