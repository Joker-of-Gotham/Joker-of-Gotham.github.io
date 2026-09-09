import { describe, it, expect } from 'vitest';
import { renderPreview } from '../../src/lib/markdown/preview';

describe('shared Markdown previews', () => {
  it('renders emphasis, lists, inline code, fenced code and math as structured HTML', async () => {
    const {html} = await renderPreview('**加粗** 与 *强调*，`Map<T>`，$x^2$。\n\n- 第一项\n- 第二项\n\n```ts\nconst n = 1;\n```\n\n$$\ny = x + 1\n$$');
    expect(html).toContain('<strong>加粗</strong>');
    expect(html).toContain('<em>强调</em>');
    expect(html).toMatch(/<code>Map(?:&lt;|&#x3C;)T(?:&gt;|>)<\/code>/);
    expect(html).toContain('<ul>');
    expect(html).toContain('astro-code');
    expect(html).toContain('katex-display');
    expect(html).not.toContain('katex-error');
  });
  it('recovers truncated legacy summaries from the complete body before taking an excerpt', async () => {
    const {html} = await renderPreview('定义\r **图**\r $$ E_1(G) \\leftrightarrow E', '## 定义\n\n**图**\n\n$$ E_1(G) \\leftrightarrow E_2(G) $$');
    expect(html).toContain('<strong>图</strong>');
    expect(html).toContain('katex');
    expect(html).not.toMatch(/<h\d|katex-error|\$\$/);
  });
  it('does not cut atomic formula or inline code at the excerpt boundary', async () => {
    const {html} = await renderPreview('a'.repeat(350)+' $\\frac{x^2 + y^2}{z^2}$ and more');
    expect(html).toContain('katex');
    expect(html).not.toContain('katex-error');
    expect(html).not.toContain('and more');
  });
  it('keeps cards non-interactive inside their article link and excludes raw HTML and images', async () => {
    const {html} = await renderPreview('[标题](javascript:alert%281%29)\n\n![image](https://example.org/pixel)\n\n<script>alert(1)</script>\n\n<iframe src="https://example.org"></iframe>\n\n```html\n<button onclick="evil()">example</button>\n```');
    expect(html).not.toMatch(/<a\b|<img\b|<script\b|<iframe\b|<button\b/);
    expect(html).toContain('标题');
    expect(html).toMatch(/&lt;|&#x3C;/);
    expect(html).not.toContain('tabindex');
  });
});
