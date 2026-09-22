export type NewsSource = {
  id: string;
  name: string;
  url: string;
};

export type Article = {
  id: string;
  url: string;
  title: string;
  summary: string;
  body: string;
  sourceId: string;
  sourceName: string;
  publishedAt: string | null;
};

export type ClusterDoc = {
  id: string;
  label: string;
  topTerms: string[];
  articleIds: string[];
  articleCount: number;
  start: string | null;
  end: string | null;
  intensity: number;
  sources: string[];
};

export type PipelineDocument = {
  generatedAt: string;
  approach: {
    name: "tfidf-cosine";
    cosineThreshold: number;
    overlapMin: number;
  };
  sources: NewsSource[];
  errors: { source: string; error: string }[];
  articles: Article[];
  clusters: ClusterDoc[];
  stats: {
    fetched: number;
    stored: number;
    clusters: number;
    elapsedMs: number;
  };
};

export type JobStatus = "queued" | "running" | "complete" | "failed";

export type IngestJob = {
  jobId: string;
  status: JobStatus;
  stage: string;
  message: string;
  articlesSeen: number;
  articlesNew: number;
  clustersBuilt: number;
  startedAt: string;
  finishedAt: string | null;
  error: string | null;
};
