import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkLegacyCallout from "./src/lib/markdown/remarkLegacyCallout.ts";

export default defineConfig({
  site: "https://joker-of-gotham.github.io",
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover"
  },
  integrations: [mdx(), sitemap()],
  vite: {
    server: {
      watch: {
        ignored: ["**/dist/**", "**/.dist/**", "**/docs/**", "**/.codemap/**"]
      }
    }
  },
  markdown: {
    syntaxHighlight: "shiki",
    remarkPlugins: [remarkLegacyCallout, remarkMath],
    rehypePlugins: [
      [
        rehypeKatex,
        {
          // Suppress noisy dev warnings when legacy posts contain CJK text or special punctuation in math mode.
          strict: "ignore"
        }
      ]
    ]
  }
});
