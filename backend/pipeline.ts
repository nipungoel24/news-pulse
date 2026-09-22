import { clusterArticles } from "./cluster.ts";
import { extractBody, mapPool } from "./extract.ts";
import { FEEDS } from "./feeds.ts";
import { ingestFeed } from "./rss.ts";
import type { Article, PipelineDocument } from "./types.ts";

export type PipelineProgress = (stage: string, message: string, extra?: Partial<PipelineDocument["stats"]>) => void;

export async function runPipeline(
  existing: Article[] = [],
  onProgress: PipelineProgress = () => {},
): Promise<PipelineDocument> {
  const started = Date.now();
  const seen = new Map<string, Article>();
  for (const article of existing) seen.set(article.id, article);

  const errors: PipelineDocument["errors"] = [];
  let fetched = 0;

  onProgress("feeds", "Fetching RSS feeds");
  for (const source of FEEDS) {
    const result = await ingestFeed(source);
    if (result.error) {
      errors.push({ source: source.id, error: result.error });
      continue;
    }
    fetched += result.articles.length;
    for (const article of result.articles) {
      if (!seen.has(article.id)) seen.set(article.id, article);
    }
  }

  const articles = [...seen.values()];
  const needBody = articles.filter((article) => !article.body);
  onProgress("extract", `Extracting article text (${needBody.length} pages)`, { fetched });
  await mapPool(needBody, 6, async (article) => {
    article.body = await extractBody(article.url);
    return article;
  });

  articles.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  onProgress("cluster", `Grouping ${articles.length} articles`);
  const clusters = clusterArticles(articles);

  return {
    generatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    approach: {
      name: "tfidf-cosine",
      cosineThreshold: 0.48,
      overlapMin: 2,
    },
    sources: FEEDS,
    errors,
    articles,
    clusters,
    stats: {
      fetched,
      stored: articles.length,
      clusters: clusters.length,
      elapsedMs: Date.now() - started,
    },
  };
}
