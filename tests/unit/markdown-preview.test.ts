import { describe, it, expect } from 'vitest';
import { renderPreview } from '../../src/lib/markdown/preview';

describe('shared Markdown previews', () => {
  it('retains inline formatting and flattens prose while skipping block content', async () => {
    const {html} = await renderPreview('**加粗** 与 *强调*，`Map<T>`，$x^2$。\n\n- 第一项\n- 第二项\n\n```ts\nconst n = 1;\n```\n\n$$\ny = x + 1\n$$');
    expect(html).toContain('<strong>加粗</strong>');
    expect(html).toContain('<em>强调</em>');
    expect(html).toMatch(/<code>Map(?:&lt;|&#x3C;)T(?:&gt;|>)<\/code>/);
    expect(html).toContain('第一项 第二项');
    expect(html).toContain('katex');
    expect(html).not.toMatch(/<ul|<pre|astro-code|katex-display|const n|y = x/);
    expect(html.match(/<p>/g)).toHaveLength(1);
    expect(html).not.toContain('katex-error');
  });
  it('uses only the authored summary even with bare CRs or unfinished Markdown', async () => {
    const {html} = await Reflect.apply(renderPreview, null, ['简介\r\r**图**\r\r未完成的 **强调', '正文内容\n\n```bash\necho wrong\n```']);
    expect(html).toContain('<strong>图</strong>');
    expect(html).toContain('简介');
    expect(html).not.toContain('**');
    expect(html).not.toMatch(/正文内容|echo wrong|astro-code/);
  });
  it('leaves a missing summary empty even when a legacy caller supplies the body', async () => {
    expect(await Reflect.apply(renderPreview, null, ['', '正文不应作为简介'])).toEqual({html:'',text:''});
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
    expect(html).not.toMatch(/example|iframe|onclick/);
    expect(html).not.toContain('tabindex');
  });
  it('omits all block kinds without spending the prose budget', async () => {
    const {html,text} = await renderPreview('开头\n\n| 表头 | 值 |\n| --- | --- |\n| 单元格 | 123 |\n\n```bash\n'+ 'echo hidden\n'.repeat(100) +'```\n\n    indented code\n\n$$x^2$$\n\n$$\ny=2\n$$\n\n![图片引用][photo]\n\n[photo]: /image.png\n\n后面的 **正文** 与 $z$。');
    expect(html).not.toMatch(/<table|<pre|<img|katex-display|表头|单元格|echo|indented|图片引用/);
    expect(text).toContain('后面的');
    expect(html).toContain('<strong>正文</strong>');
    expect(html).toContain('katex');
  });
  it('keeps initial indentation meaningful and preserves inline literal markers', async () => {
    expect(await renderPreview('    echo hidden\n    more hidden')).toEqual({html:'',text:''});
    expect((await renderPreview('文字 {: .prompt-info } 与 `{: .prompt-info }`')).html).toContain('<code>{: .prompt-info }</code>');
  });
  it.each([
    '<img src="/assets/images/LLM学习/deepseek-R1训练范式.png" alt="描述文字" width="900"',
    '![图片引用](/assets/images/incomplete',
    '![图片引用](https://example.org/incomplete',
    '<img src=https://example.org/incomplete',
    '![图片引用][missing',
    '| 名称 | 功能 |\n| :--',
    '$$\\alpha= - \\ln (\\frac{\\text{tod',
    '$\\frac{x}{',
    '$',
    '$ unclosed',
    '$\\frac{x}{$',
  ])('drops incomplete non-prose fragments: %s', async fragment => {
    const {html,text} = await renderPreview('保留简介。\n\n'+fragment);
    expect(text).toBe('保留简介。');
    expect(html).not.toMatch(/katex-error|<img|<pre|<table|\$|\\frac/);
  });
  it('removes dangling emphasis and link syntax without inventing missing content', async () => {
    const {html,text}=await renderPreview('**瓦格勒(Wagner,1936)-珐里定理(Fáry,194');
    expect(text).toBe('瓦格勒(Wagner,1936)-珐里定理(Fáry,194');
    expect(html).not.toContain('**');
    expect((await renderPreview('[阅读说明](https://example.org/incomplete')).text).toBe('阅读说明');
  });
  it('preserves literal escaped symbols, currency, identifiers and inline source examples', async () => {
    const {html,text}=await renderPreview('\\*字面符号\\* &amp; file_name，$50 美元。`<img src="x">` 与 `**raw**`');
    expect(text).toContain('*字面符号* & file_name，$50 美元。');
    expect(html).toContain('<code>**raw**</code>');
    expect(html).toMatch(/<code>(?:&lt;|&#x3C;)img/);
  });
});
