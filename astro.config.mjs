import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkLegacyCallout from "./src/lib/markdown/remarkLegacyCallout.ts";
import remarkNormalizeDocumentHeadings from "./src/lib/markdown/remarkNormalizeDocumentHeadings.ts";
import {validateDirectorySources} from './src/lib/content/validate-directories.ts';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  site: "https://joker-of-gotham.github.io",
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "hover"
  },
  integrations: [mdx(), sitemap(), {name:'content-directory-validation',hooks:{'astro:config:setup':({config})=>validateDirectorySources(fileURLToPath(new URL('src/content/',config.root)))}}],
  vite: {
    server: {
      watch: {
        ignored: [
          "**/dist/**",
          "**/.dist/**",
          "**/docs/**",
          "**/.codemap/**",
          "**/.playwright-results/**",
          "**/test-results/**",
          "**/playwright-report/**"
        ]
      }
    }
  },
  markdown: {
    syntaxHighlight: "shiki",
    shikiConfig: { themes: { light: "github-light", dark: "github-dark-default" }, defaultColor: false },
    remarkPlugins: [remarkNormalizeDocumentHeadings, remarkLegacyCallout, remarkMath],
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
