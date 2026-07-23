import type { BlogEntry } from "./queries";
import { normalizeSlug } from "./queries";

// ── Tokenization ──
// English/latin tokens: lowercase word runs.
// CJK (Chinese etc.): character bigrams — single CJK chars carry little signal on
// their own for short-text similarity, but adjacent bigrams approximate word-level
// meaning well for TF-IDF on article-length text.
// Everything else (whitespace, punctuation, digits-as-glue) is dropped.

const cjkPattern = /[㐀-鿿豈-﫿]/;
const wordPattern = /[A-Za-z][A-Za-z0-9_]*/g;
const cjkCharPattern = /[㐀-鿿豈-﫿]/g;

function tokenize(text: string): string[] {
  const tokens: string[] = [];

  // Latin words
  const wordMatches = text.match(wordPattern) ?? [];
  for (const w of wordMatches) tokens.push(w.toLowerCase());

  // CJK bigrams: collect CJK runs and emit adjacent char pairs
  const cjkRuns = text.match(cjkCharPattern) ?? [];
  for (let i = 0; i < cjkRuns.length - 1; i += 1) {
    tokens.push(cjkRuns[i] + cjkRuns[i + 1]);
  }
  // Also keep single CJK chars as a weaker signal so a lone CJK char still counts
  for (const ch of cjkRuns) tokens.push(ch);

  return tokens;
}

// Strip markdown noise so code blocks / link URLs / image tags don't dominate TF.
function stripMarkdownNoise(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, " ") // fenced code blocks
    .replace(/`[^`]*`/g, " ") // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → keep text
    .replace(/<[^>]+>/g, " ") // html tags
    .replace(/^\s*\{:[^}]*\}\s*$/gm, " ") // callout markers
    .replace(/[#>*_~|=-]/g, " "); // md punctuation
}

function documentText(entry: BlogEntry): string {
  const parts = [
    entry.data.title ?? "",
    entry.data.summary ?? "",
    (entry.data.tags ?? []).join(" "),
    (entry.data.categories ?? []).join(" "),
    stripMarkdownNoise(entry.body ?? "")
  ];
  return parts.join("\n");
}

// ── TF-IDF model ──

interface DocVector {
  slug: string;
  date: Date;
  tf: Map<string, number>; // term frequency (raw count)
  norm: number; // l2 norm of tf-idf vector (precomputed once idf is known)
  tfidf: Map<string, number>; // tf-idf weights
}

function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  return tf;
}

// Build the corpus model. Runs once per build; results are cached in module scope
// so the (potentially many) blog detail pages share one TF-IDF pass.
let modelCache: { vectors: Map<string, DocVector> } | null = null;

function buildModel(posts: BlogEntry[]): { vectors: Map<string, DocVector> } {
  const N = posts.length;
  const docs = posts.map((entry) => {
    const tokens = tokenize(documentText(entry));
    const tf = termFrequency(tokens);
    return { slug: normalizeSlug(entry), date: entry.data.date, tf };
  });

  // document frequency
  const df = new Map<string, number>();
  for (const d of docs) {
    for (const term of d.tf.keys()) df.set(term, (df.get(term) ?? 0) + 1);
  }

  // idf with +1 smoothing so a term in every doc isn't zeroed out completely
  const idf = new Map<string, number>();
  for (const [term, freq] of df) idf.set(term, Math.log((N + 1) / (freq + 1)) + 1);

  const vectors = new Map<string, DocVector>();
  for (const d of docs) {
    const tfidf = new Map<string, number>();
    let norm = 0;
    for (const [term, count] of d.tf) {
      const w = count * (idf.get(term) ?? 0);
      tfidf.set(term, w);
      norm += w * w;
    }
    norm = Math.sqrt(norm);
    vectors.set(d.slug, { slug: d.slug, date: d.date, tf: d.tf, norm, tfidf });
  }

  return { vectors };
}

function getModel(posts: BlogEntry[]): { vectors: Map<string, DocVector> } {
  if (!modelCache) modelCache = buildModel(posts);
  return modelCache;
}

function cosine(a: DocVector, b: DocVector): number {
  // iterate the smaller map for speed
  const [small, large] = a.tfidf.size <= b.tfidf.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [term, w] of small.tfidf) {
    const other = large.tfidf.get(term);
    if (other) dot += w * other;
  }
  if (a.norm === 0 || b.norm === 0) return 0;
  return dot / (a.norm * b.norm);
}

export interface RelatedPostCandidate {
  slug: string;
  date: Date;
  score: number;
}

/**
 * Return candidate posts ranked by TF-IDF cosine similarity to `current`,
 * excluding the current post itself and any `excludeSlugs` (e.g. manually
 * specified ones). Pure, deterministic, no network.
 */
export function computeSimilarPosts(
  current: BlogEntry,
  allPosts: BlogEntry[],
  excludeSlugs: Set<string> = new Set()
): RelatedPostCandidate[] {
  const { vectors } = getModel(allPosts);
  const currentSlug = normalizeSlug(current);
  const currentVec = vectors.get(currentSlug);
  if (!currentVec) return [];

  const results: RelatedPostCandidate[] = [];
  for (const post of allPosts) {
    const slug = normalizeSlug(post);
    if (slug === currentSlug) continue;
    if (excludeSlugs.has(slug)) continue;
    const vec = vectors.get(slug);
    if (!vec) continue;
    const score = cosine(currentVec, vec);
    results.push({ slug, date: post.data.date, score });
  }
  // Primary: similarity desc; tie-break: date desc (newer first)
  results.sort((a, b) => b.score - a.score || b.date.getTime() - a.date.getTime());
  return results;
}

// Test hook — clear cache so unit tests can re-build with a fresh corpus.
export function __resetSimilarityCacheForTests(): void {
  modelCache = null;
}
