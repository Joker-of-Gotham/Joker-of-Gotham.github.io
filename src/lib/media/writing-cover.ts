// Existing site assets; provenance is recorded in docs/asset-provenance.md.
const defaults: Record<string, string> = {
  research: '/assets/img/covers/超时空辉夜姬壁纸-三人合照2.webp',
  reading: '/assets/img/covers/败犬女主-小鞠知花.webp',
  musings: '/assets/img/covers/青春恋爱物语-雪乃.webp',
  blog: '/assets/img/covers/孤独摇滚-四人合照.webp',
};
export const writingCover = (cover: string | undefined, section: string) => cover || defaults[section] || defaults.blog;
