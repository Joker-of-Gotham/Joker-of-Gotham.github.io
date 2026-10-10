import { describe, expect, it } from 'vitest';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkDisplayMath from '../../src/lib/markdown/remarkDisplayMath';

const processor = createMarkdownProcessor({ syntaxHighlight: false, remarkPlugins: [remarkMath, remarkDisplayMath], rehypePlugins: [[rehypeKatex, { strict: 'ignore' }]] });
const render = async (source: string) => (await (await processor).render(source)).code;
describe('shared display math rendering', () => {
  it.each(['$$x^2$$', '$$\nx^2\n$$', '> $$x^2$$', '- $$x^2$$', 'Before $$x^2$$ after', '$$x^2$$\n\n$$y^2$$'])('renders display delimiters in %s', async source => {
    const html = await render(source);
    expect(html).toContain('class="katex-display"');
    expect(html).not.toContain('katex-error');
    expect(html).toContain('display="block"');
  });
  it('preserves single-dollar inline math and literal delimiters in code', async () => {
    const html = await render('Inline $x^2$ and `$$code$$`\n\n```text\n$$literal$$\n```\n\n\\$\\$escaped\\$\\$');
    expect(html).toContain('class="katex"');
    expect(html).not.toContain('katex-display');
    expect(html).toContain('$$code$$');
    expect(html).toContain('$$literal$$');
    expect(html).toContain('$$escaped$$');
  });
});
