# 设计令牌与调色板规范

本文件规定站点色彩、字体、间距、圆角、阴影等设计令牌（design tokens）的取用方式。

**事实源**：[src/styles/tokens.css](../src/styles/tokens.css)（令牌定义）+ [src/styles/global.css](../src/styles/global.css)（组件样式）。本文档与样式冲突时以样式为准。令牌值是**当前快照**，以 tokens.css 为准。

---

## 一、核心原则

1. **用 token，不要写死十六进制色值**。写组件/改样式时一律引用 `var(--xxx)`。
2. 深色为默认（`color-scheme: dark`），`@media (prefers-color-scheme: light)` 下自动切换浅色变体——引用背景/文字/边框 token 时会自动跟随，**不要为浅色模式单独写值**。
3. 新颜色需求优先复用现有调色板；确需新色，先在 tokens.css 加 token，再在本文档登记。

---

## 二、背景层（Background depth）

| Token | 深色值 | 用途 |
|------|------|------|
| `--bg-void` | `#030508` | 最底层（hero/全屏背景） |
| `--bg-base` | `#080d18` | 页面基础背景 |
| `--bg-elevated` | `rgba(14,22,38,0.72)` | 卡片/浮层 |
| `--bg-overlay` | `rgba(20,32,54,0.55)` | 遮罩层 |
| `--bg-muted` | `#0c1523` | 弱化背景（legacy 别名） |
| `--bg-surface` | = `--bg-elevated` | 表面（legacy 别名） |
| `--bg-surface-soft` | `rgba(18,30,48,0.42)` | 轻表面 |

---

## 三、玻璃拟态（Glass tiers）

Apple Liquid Glass 风格。三层 blur + 透明度：

| Token | 值 |
|------|------|
| `--glass-blur-thin` | `blur(8px)` |
| `--glass-blur-regular` | `blur(16px)` |
| `--glass-blur-thick` | `blur(24px)` |
| `--glass-bg-thin` | `rgba(8,13,24,0.45)` |
| `--glass-bg-regular` | `rgba(12,18,32,0.5)` |
| `--glass-bg-thick` | `rgba(10,16,28,0.72)` |
| `--glass-border` | `rgba(255,255,255,0.06)` |
| `--glass-border-hover` | `rgba(255,255,255,0.12)` |
| `--glass-highlight` | `rgba(255,255,255,0.03)` |

---

## 四、文字（Text）

| Token | 深色值 | 用途 |
|------|------|------|
| `--text-strong` | `#f4f7fb` | 标题/强调 |
| `--text-default` | `#d0d8e5` | 正文 |
| `--text-muted` | `#8899ad` | 次要/说明 |

---

## 五、强调色调色板（Accent palette）★

站点核心 5 色谱。**框的颜色、强调字体、图标、链接 hover 等都从这里取。**

| Token | 色号 | 色相 | 典型用途 |
|------|------|------|------|
| `--accent-cyan` | `#00e5cc` | 青绿 | 主色（primary）、proof/flow 提示框、status-now、glow |
| `--accent-blue` | `#3d7dff` | 蓝 | 次色（secondary）、info 提示框、普通引用、status-next |
| `--accent-violet` | `#8b5cf6` | 紫 | example 提示框、装饰强调 |
| `--accent-amber` | `#f59e0b` | 琥珀 | attention/warning 提示框、status-blocked |
| `--accent-rose` | `#f43f5e` | 玫红 | 危险/错误（当前未分配语义类，保留备用） |

### 5.1 与提示框的映射

| 提示框类 | 用色 |
|------|------|
| `prompt-info` | `--accent-blue` |
| `prompt-proof` | `--accent-cyan` |
| `prompt-flow` | `--accent-cyan` |
| `prompt-attention` | `--accent-amber` |
| `prompt-warning` | `--accent-amber`（已弃用，用 attention） |
| `prompt-example` | `--accent-violet` |

### 5.2 Legacy 别名（仍可用）

- `--accent-primary` = `--accent-cyan`
- `--accent-secondary` = `--accent-blue`
- `--accent-warm` = `--accent-amber`

### 5.3 取色技巧（color-mix）

提示框底色用 `color-mix(in srgb, <accent> 8%, transparent)` 配 8% 透明度（见 global.css）。需要更低/更高浓度时照此调百分比，**不要直接写 rgba**：

```css
background: color-mix(in srgb, var(--accent-violet) 8%, transparent);
border-left-color: var(--accent-violet);
```

---

## 六、状态色（Status）

用于 roadmap 节点状态。

| Token | 值 | 语义 |
|------|------|------|
| `--status-now` | `--accent-cyan` | 正在做 |
| `--status-next` | `--accent-blue` | 下一个 |
| `--status-later` | `#8899ad` | 以后 |
| `--status-done` | `#34d399` | 已完成（绿） |
| `--status-blocked` | `#fb923c` | 受阻（橙） |

对应枚举：`now` / `next` / `later` / `done` / `blocked`（见 frontmatter 规范）。

---

## 七、边框（Borders）

| Token | 值 | 用途 |
|------|------|------|
| `--border-default` | `rgba(136,153,173,0.18)` | 常规边框 |
| `--border-subtle` | `rgba(255,255,255,0.04)` | 极轻分隔 |

---

## 八、阴影（Shadows）

| Token | 用途 |
|------|------|
| `--shadow-sm` / `--shadow-md` / `--shadow-lg` | 普通层深阴影 |
| `--shadow-glow-sm` / `-md` / `-lg` | 带 cyan 辉光的阴影（主色发光） |

> glow 系列内置 `rgba(0,229,204,...)`（cyan）。需要其它色辉光时另起 token，不要局部改色号。

---

## 九、圆角（Radius）

| Token | 值 |
|------|------|
| `--radius-xs` | 8px |
| `--radius-sm` | 12px |
| `--radius-md` | 16px |
| `--radius-lg` | 24px |
| `--radius-xl` | 32px |
| `--radius-pill` | 999px |

提示框用 `--radius-md`，按钮/标签多用 `--radius-sm` 或 pill。

---

## 十、间距（Spacing，8pt 基线）

| Token | 值 |
|------|------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |
| `--space-20` | 80px |
| `--space-24` | 96px |
| `--space-32` | 128px |

---

## 十一、布局（Layout）

| Token | 值 |
|------|------|
| `--sidebar-width` | 280px |
| `--main-max-width` | 1200px |
| `--mobile-padding` | 16px |
| `--tablet-padding` | 24px |
| `--desktop-padding` | 40px |

---

## 十二、字体（Typography）

| Token | 字族 |
|------|------|
| `--font-body` | `"Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif` |
| `--font-heading` | `"Space Grotesk", "Inter", "PingFang SC", sans-serif` |
| `--font-mono` | `"JetBrains Mono", "SFMono-Regular", Consolas, monospace` |

---

## 十三、动效（Motion）

| Token | 值 |
|------|------|
| `--ease-out` | `cubic-bezier(0.16,1,0.3,1)` |
| `--ease-spring` | `cubic-bezier(0.34,1.56,0.64,1)` |
| `--ease-smooth` | `cubic-bezier(0.4,0,0.2,1)` |
| `--duration-fast` | 150ms |
| `--duration-normal` | 300ms |
| `--duration-slow` | 500ms |

---

## 十四、图片背景槽与占位

| Token | 用途 |
|------|------|
| `--about-bg-image` | About 横幅背景，默认 `none` |
| `--hero-bg-overlay` | Hero 遮罩渐变（控制背景图明暗） |
| `--about-bg-overlay` | About 遮罩渐变 |
| `--cover-grad-1` … `--cover-grad-6` | 6 种无封面时的占位渐变 |

调 Hero 遮罩透明度见 [image-guide.md](image-guide.md)。

---

## 十五、浅色模式

`@media (prefers-color-scheme: light)` 下自动覆盖以下 token（其余继承深色）：

- 背景：`--bg-void` / `--bg-base` / `--bg-elevated` / `--bg-overlay` / `--bg-muted` / `--bg-surface` / `--bg-surface-soft`
- 玻璃：`--glass-bg-*` / `--glass-border*` / `--glass-highlight`
- 文字：`--text-strong` / `--text-default` / `--text-muted`
- 边框：`--border-default` / `--border-subtle`
- 阴影：`--shadow-*` / `--shadow-glow-*`

**强调色 `--accent-*`、状态色 `--status-done/blocked`、圆角、间距、字体在浅色下不变**，因此彩色提示框/标签在两套主题下观感一致。

---

## 十六、新增/修改令牌的流程

1. 在 [src/styles/tokens.css](../src/styles/tokens.css) 增改 token；若涉浅色，在 light media block 同步覆盖。
2. 在 [src/styles/global.css](../src/styles/global.css) 用到的地方引用。
3. 回到本文件登记 token 名、色号、用途、典型用法。
4. 如该 token 对应提示框类，同步更新 [markdown-presentation.md](markdown-presentation.md) 的映射表。
