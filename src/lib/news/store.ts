import { FEEDS } from "@backend/feeds.ts";
import type { Article, IngestJob, PipelineDocument } from "@backend/types.ts";
import { getSql } from "@/lib/db";
import { clusterInk } from "@/lib/news/palette";

type ArticleRow = {
  id: string;
  url: string;
  title: string;
  summary: string;
  body: string;
  source_id: string;
  source_name: string;
  published_at: string | null;
};

type ClusterRow = {
  id: string;
  label: string;
  top_terms: string;
  article_count: number;
  start_at: string | null;
  end_at: string | null;
  intensity: number;
};

function asIso(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().replace(/\.\d{3}Z$/, "Z");
  const parsed = Date.parse(value);
  if (Number.isFinite(parsed)) return new Date(parsed).toISOString().replace(/\.\d{3}Z$/, "Z");
  return String(value);
}

export async function loadExistingArticles(): Promise<Article[]> {
  const sql = await getSql();
  const rows = await sql<ArticleRow>`
    select id, url, title, summary, body, source_id, source_name, published_at
    from articles
  `;
  return rows.map((row) => ({
    id: row.id,
    url: row.url,
    title: row.title,
    summary: row.summary,
    body: row.body,
    sourceId: row.source_id,
    sourceName: row.source_name,
    publishedAt: asIso(row.published_at),
  }));
}

export async function persistDocument(doc: PipelineDocument): Promise<void> {
  const sql = await getSql();

  for (const rawArticle of doc.articles) {
    const article = rawArticle as unknown as Record<string, unknown>;
    const sourceId = (article.sourceId ?? article.source_id) as string;
    const sourceName = (article.sourceName ?? article.source_name) as string;
    const publishedAt = (article.publishedAt ?? article.published_at ?? null) as string | null;

    await sql.query(
      `insert into articles (id, url, title, summary, body, source_id, source_name, published_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8)
       on conflict (url) do update set
         title = excluded.title,
         summary = excluded.summary,
         body = case when excluded.body <> '' then excluded.body else articles.body end,
         source_id = excluded.source_id,
         source_name = excluded.source_name,
         published_at = coalesce(excluded.published_at, articles.published_at)`,
      [
        article.id,
        article.url,
        article.title,
        article.summary,
        article.body,
        sourceId,
        sourceName,
        publishedAt,
      ],
    );
  }

  const genRows = await sql<{ value: string }>`
    select value from ingest_meta where key = 'generation'
  `;
  const generation = Number(genRows[0]?.value ?? "0") + 1;

  for (const rawCluster of doc.clusters) {
    const cluster = rawCluster as unknown as Record<string, unknown>;
    const rawTerms = (cluster.topTerms ?? cluster.top_terms ?? []) as string[];
    const topTerms = Array.isArray(rawTerms) ? rawTerms.join(", ") : String(rawTerms);
    const articleCount = Number(cluster.articleCount ?? cluster.article_count ?? 0);
    const rawArticleIds = (cluster.articleIds ?? cluster.article_ids ?? []) as string[];
    const articleIds = Array.isArray(rawArticleIds) ? rawArticleIds : [];

    await sql.query(
      `insert into clusters (id, label, top_terms, article_count, start_at, end_at, intensity, generation, active)
       values ($1,$2,$3,$4,$5,$6,$7,$8,true)
       on conflict (id) do update set
         label = excluded.label,
         top_terms = excluded.top_terms,
         article_count = excluded.article_count,
         start_at = excluded.start_at,
         end_at = excluded.end_at,
         intensity = excluded.intensity,
         generation = excluded.generation,
         active = true`,
      [
        cluster.id,
        cluster.label,
        topTerms,
        articleCount,
        cluster.start,
        cluster.end,
        cluster.intensity,
        generation,
      ],
    );
    for (const articleId of articleIds) {
      await sql.query(
        `insert into cluster_articles (cluster_id, article_id)
         values ($1,$2)
         on conflict do nothing`,
        [cluster.id, articleId],
      );
    }
  }

  await sql.query(
    `update clusters set active = false where generation < $1`,
    [generation],
  );
  await sql.query(
    `insert into ingest_meta (key, value) values ('generation', $1)
     on conflict (key) do update set value = excluded.value`,
    [String(generation)],
  );
  await sql.query(
    `insert into ingest_meta (key, value) values ('last_run', $1)
     on conflict (key) do update set value = excluded.value`,
    [doc.generatedAt ?? (doc as unknown as { generated_at?: string }).generated_at ?? new Date().toISOString()],
  );
}

export async function articleCount(): Promise<number> {
  const sql = await getSql();
  const rows = await sql<{ n: number }>`select count(*)::int as n from articles`;
  return rows[0]?.n ?? 0;
}

function parseSources(raw: string | null): string[] | null {
  if (!raw) return null;
  const ids = raw
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  if (!ids.length) return null;
  const known = new Set(FEEDS.map((feed) => feed.id));
  for (const id of ids) {
    if (!known.has(id)) {
      const error = new Error(`Unknown source '${id}'`);
      (error as Error & { status: number }).status = 400;
      throw error;
    }
  }
  return ids;
}

export type ClusterSummary = {
  id: string;
  label: string;
  articleCount: number;
  start: string | null;
  end: string | null;
  sources: string[];
  topTerms: string[];
};

export async function listClusters(sourcesParam: string | null): Promise<ClusterSummary[]> {
  const sources = parseSources(sourcesParam);
  const sql = await getSql();
  const rows = await sql<ClusterRow & { sources: string | null }>`
    select c.id, c.label, c.top_terms, c.article_count, c.start_at, c.end_at, c.intensity,
           string_agg(distinct a.source_id, ',') as sources
    from clusters c
    join cluster_articles ca on ca.cluster_id = c.id
    join articles a on a.id = ca.article_id
    where c.active = true
    group by c.id, c.label, c.top_terms, c.article_count, c.start_at, c.end_at, c.intensity
    order by c.start_at desc nulls last
  `;
  return rows
    .map((row) => ({
      id: row.id,
      label: row.label,
      articleCount: Number(row.article_count),
      start: asIso(row.start_at),
      end: asIso(row.end_at),
      sources: (row.sources ?? "").split(",").filter(Boolean).sort(),
      topTerms: row.top_terms ? row.top_terms.split(", ").filter(Boolean) : [],
    }))
    .filter((cluster) => !sources || cluster.sources.some((id) => sources.includes(id)));
}

export type ClusterDetail = ClusterSummary & {
  intensity: number;
  articles: {
    id: string;
    title: string;
    url: string;
    summary: string;
    sourceId: string;
    sourceName: string;
    publishedAt: string | null;
  }[];
};

export async function getCluster(id: string, sourcesParam: string | null): Promise<ClusterDetail | null> {
  if (!/^[a-z0-9_-]{4,40}$/i.test(id)) {
    const error = new Error("Invalid cluster id");
    (error as Error & { status: number }).status = 400;
    throw error;
  }
  const sources = parseSources(sourcesParam);
  const sql = await getSql();
  const clusters = await sql<ClusterRow>`
    select id, label, top_terms, article_count, start_at, end_at, intensity
    from clusters
    where id = ${id} and active = true
  `;
  const cluster = clusters[0];
  if (!cluster) return null;
  const articles = await sql<ArticleRow>`
    select a.id, a.url, a.title, a.summary, a.body, a.source_id, a.source_name, a.published_at
    from articles a
    join cluster_articles ca on ca.article_id = a.id
    where ca.cluster_id = ${id}
    order by a.published_at asc nulls last
  `;
  const mapped = articles
    .filter((row) => !sources || sources.includes(row.source_id))
    .map((row) => ({
      id: row.id,
      title: row.title,
      url: row.url,
      summary: row.summary,
      sourceId: row.source_id,
      sourceName: row.source_name,
      publishedAt: asIso(row.published_at),
    }));
  if (!mapped.length) return null;
  const times = mapped.map((article) => article.publishedAt).filter(Boolean) as string[];
  times.sort();
  return {
    id: cluster.id,
    label: cluster.label,
    articleCount: mapped.length,
    start: times[0] ?? asIso(cluster.start_at),
    end: times[times.length - 1] ?? asIso(cluster.end_at),
    sources: [...new Set(mapped.map((article) => article.sourceId))].sort(),
    topTerms: cluster.top_terms ? cluster.top_terms.split(", ").filter(Boolean) : [],
    intensity: Number(cluster.intensity),
    articles: mapped,
  };
}

export type TimelinePayload = {
  rangeStart: string | null;
  rangeEnd: string | null;
  generatedAt: string | null;
  sources: { id: string; name: string }[];
  items: {
    id: string;
    label: string;
    start: string;
    end: string;
    articleCount: number;
    intensity: number;
    size: number;
    sources: string[];
    color: string;
  }[];
};

export async function getTimeline(sourcesParam: string | null): Promise<TimelinePayload> {
  const clusters = await listClusters(sourcesParam);
  const sql = await getSql();
  const meta = await sql<{ key: string; value: string }>`select key, value from ingest_meta`;
  const generatedAt = meta.find((row) => row.key === "last_run")?.value ?? null;
  const dated = clusters.filter((cluster) => cluster.start);
  const starts = dated.map((cluster) => cluster.start!) ;
  const ends = dated.map((cluster) => cluster.end ?? cluster.start!);
  const maxCount = Math.max(1, ...clusters.map((cluster) => cluster.articleCount));
  const items = dated.map((cluster) => {
    const start = cluster.start!;
    const end = cluster.end && cluster.end >= start ? cluster.end : start;
    return {
      id: cluster.id,
      label: cluster.label,
      start,
      end,
      articleCount: cluster.articleCount,
      intensity: cluster.articleCount / maxCount,
      size: cluster.articleCount,
      sources: cluster.sources,
      color: clusterInk(cluster.id),
    };
  });
  items.sort((a, b) => a.start.localeCompare(b.start));
  return {
    rangeStart: starts.sort()[0] ?? null,
    rangeEnd: ends.sort().at(-1) ?? null,
    generatedAt,
    sources: FEEDS.map((feed) => ({ id: feed.id, name: feed.name })),
    items,
  };
}

export async function upsertJob(job: IngestJob): Promise<void> {
  const sql = await getSql();
  await sql.query(
    `insert into ingest_jobs (id, status, stage, message, articles_seen, articles_new, clusters_built, started_at, finished_at, error)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     on conflict (id) do update set
       status = excluded.status,
       stage = excluded.stage,
       message = excluded.message,
       articles_seen = excluded.articles_seen,
       articles_new = excluded.articles_new,
       clusters_built = excluded.clusters_built,
       finished_at = excluded.finished_at,
       error = excluded.error`,
    [
      job.jobId,
      job.status,
      job.stage,
      job.message,
      job.articlesSeen,
      job.articlesNew,
      job.clustersBuilt,
      job.startedAt,
      job.finishedAt,
      job.error,
    ],
  );
}

export async function readJob(jobId: string): Promise<IngestJob | null> {
  if (!/^job_[a-z0-9]{8,24}$/i.test(jobId)) {
    const error = new Error("Invalid job id");
    (error as Error & { status: number }).status = 400;
    throw error;
  }
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    status: IngestJob["status"];
    stage: string;
    message: string;
    articles_seen: number;
    articles_new: number;
    clusters_built: number;
    started_at: string;
    finished_at: string | null;
    error: string | null;
  }>`select * from ingest_jobs where id = ${jobId}`;
  const row = rows[0];
  if (!row) return null;
  return {
    jobId: row.id,
    status: row.status,
    stage: row.stage,
    message: row.message,
    articlesSeen: Number(row.articles_seen),
    articlesNew: Number(row.articles_new),
    clustersBuilt: Number(row.clusters_built),
    startedAt: asIso(row.started_at) ?? row.started_at,
    finishedAt: asIso(row.finished_at),
    error: row.error,
  };
}

export function httpErrorStatus(error: unknown): number {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === "number") return status;
  }
  return 500;
}
