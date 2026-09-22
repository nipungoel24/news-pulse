import { STOPWORDS } from "./stopwords.ts";
import type { Article, ClusterDoc } from "./types.ts";
import { createHash } from "node:crypto";

export const COSINE_THRESHOLD = 0.48;
export const OVERLAP_MIN = 2;
const RARE_DF_FRACTION = 0.12;
const TOKEN_RE = /[a-z][a-z0-9'-]{2,}/g;

export function tokenize(text: string): string[] {
  const matches = text.toLowerCase().match(TOKEN_RE) ?? [];
  return matches.filter((tok) => !STOPWORDS.has(tok));
}

function titleTokens(article: Article): string[] {
  return tokenize(article.title);
}

function documentTokens(article: Article): string[] {
  const title = titleTokens(article);
  const summary = tokenize(article.summary);
  return [...title, ...title, ...title, ...summary];
}

function buildIdf(docs: string[][]): Map<string, number> {
  const n = Math.max(docs.length, 1);
  const df = new Map<string, number>();
  for (const doc of docs) {
    for (const term of new Set(doc)) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }
  const idf = new Map<string, number>();
  for (const [term, count] of df) {
    idf.set(term, Math.log((1 + n) / (1 + count)) + 1);
  }
  return idf;
}

function tfidfVector(tokens: string[], idf: Map<string, number>): Map<string, number> {
  const vec = new Map<string, number>();
  if (tokens.length === 0) return vec;
  const tf = new Map<string, number>();
  for (const term of tokens) tf.set(term, (tf.get(term) ?? 0) + 1);
  const total = tokens.length;
  let norm = 0;
  for (const [term, count] of tf) {
    const weight = (count / total) * (idf.get(term) ?? 0);
    vec.set(term, weight);
    norm += weight * weight;
  }
  const scale = Math.sqrt(norm) || 1;
  for (const [term, weight] of vec) vec.set(term, weight / scale);
  return vec;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  if (a.size > b.size) return cosine(b, a);
  let sum = 0;
  for (const [term, weight] of a) sum += weight * (b.get(term) ?? 0);
  return sum;
}

class UnionFind {
  parent: number[];
  rank: number[];
  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = Array(n).fill(0);
  }
  find(x: number): number {
    while (this.parent[x] !== x) {
      this.parent[x] = this.parent[this.parent[x]!]!;
      x = this.parent[x]!;
    }
    return x;
  }
  union(a: number, b: number) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;
    if (this.rank[ra]! < this.rank[rb]!) this.parent[ra] = rb;
    else if (this.rank[ra]! > this.rank[rb]!) this.parent[rb] = ra;
    else {
      this.parent[rb] = ra;
      this.rank[ra]! += 1;
    }
  }
}

export function clusterArticles(articles: Article[]): ClusterDoc[] {
  if (articles.length === 0) return [];
  const n = articles.length;
  const docs = articles.map(documentTokens);
  const titles = articles.map((article) => new Set(titleTokens(article)));
  const idf = buildIdf(docs);
  const vectors = docs.map((doc) => tfidfVector(doc, idf));

  const titleDf = new Map<string, number>();
  for (const title of titles) {
    for (const term of title) titleDf.set(term, (titleDf.get(term) ?? 0) + 1);
  }
  const rareCap = Math.max(2, Math.floor(RARE_DF_FRACTION * n));
  const rare = titles.map((title) => {
    const set = new Set<string>();
    for (const term of title) if ((titleDf.get(term) ?? 0) <= rareCap) set.add(term);
    return set;
  });

  const uf = new UnionFind(n);
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      let overlap = 0;
      for (const term of rare[i]!) if (rare[j]!.has(term)) overlap += 1;
      const sim = cosine(vectors[i]!, vectors[j]!);
      if (sim >= COSINE_THRESHOLD || overlap >= OVERLAP_MIN) uf.union(i, j);
    }
  }

  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i += 1) {
    const root = uf.find(i);
    const list = groups.get(root) ?? [];
    list.push(i);
    groups.set(root, list);
  }

  const clusters = [...groups.values()].map((members) =>
    describeCluster(articles, vectors, members),
  );
  clusters.sort((a, b) => b.articleCount - a.articleCount || (a.start ?? "").localeCompare(b.start ?? ""));
  return clusters;
}

function describeCluster(
  articles: Article[],
  vectors: Map<string, number>[],
  members: number[],
): ClusterDoc {
  const mean = new Map<string, number>();
  for (const idx of members) {
    for (const [term, weight] of vectors[idx]!) {
      mean.set(term, (mean.get(term) ?? 0) + weight);
    }
  }
  for (const [term, weight] of mean) mean.set(term, weight / members.length);
  const topTerms = [...mean.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([term]) => term);

  const memberArticles = members.map((idx) => articles[idx]!);
  const times = memberArticles
    .map((article) => article.publishedAt)
    .filter((value): value is string => Boolean(value))
    .sort();
  const articleIds = memberArticles.map((article) => article.id);
  const sources = [...new Set(memberArticles.map((article) => article.sourceId))].sort();
  const id = "c_" + createHash("sha1").update([...articleIds].sort().join("|")).digest("hex").slice(0, 12);

  return {
    id,
    label: clusterLabel(memberArticles, topTerms),
    topTerms,
    articleIds,
    articleCount: members.length,
    start: times[0] ?? null,
    end: times[times.length - 1] ?? null,
    intensity: intensity(members.length, times[0] ?? null, times[times.length - 1] ?? null),
    sources,
  };
}

function clusterLabel(members: Article[], topTerms: string[]): string {
  if (members.length === 1) return trimTitle(members[0]!.title);
  if (members.length === 2) {
    const longest = [...members].sort((a, b) => b.title.length - a.title.length)[0]!;
    return trimTitle(longest.title);
  }
  if (topTerms.length) {
    return topTerms
      .slice(0, 3)
      .map((term) => term.replace(/-/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase()))
      .join(" / ");
  }
  return "Related coverage";
}

function trimTitle(title: string): string {
  const cleaned = title.trim() || "Untitled";
  return cleaned.length < 78 ? cleaned : `${cleaned.slice(0, 75).trimEnd()}...`;
}

function intensity(count: number, start: string | null, end: string | null): number {
  if (!start || !end || start === end) return count;
  const a = Date.parse(start);
  const b = Date.parse(end);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return count;
  const hours = Math.max((b - a) / 3_600_000, 0.25);
  return Math.round((count / hours) * 10000) / 10000;
}
