import { ExternalLink, X } from "lucide-react";
import { formatClock, formatSpan } from "@/lib/utils";

export type ClusterArticle = {
  id: string;
  title: string;
  url: string;
  summary: string;
  sourceId: string;
  sourceName: string;
  publishedAt: string | null;
};

export type ClusterDetailData = {
  id: string;
  label: string;
  articleCount: number;
  start: string | null;
  end: string | null;
  sources: string[];
  topTerms: string[];
  articles: ClusterArticle[];
};

export function ClusterDetail({
  cluster,
  loading,
  error,
  onClose,
}: {
  cluster: ClusterDetailData | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
}) {
  return (
    <aside
      className="border border-ink bg-paper-raised p-4 shadow-sheet"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] tracking-[0.18em] text-ink-muted uppercase">Cluster</p>
          <h2 className="font-display mt-1 text-2xl leading-tight">
            {cluster?.label ?? (loading ? "Loading story" : "Select a cluster")}
          </h2>
        </div>
        {cluster ? (
          <button
            type="button"
            onClick={onClose}
            className="grid size-11 place-items-center text-ink-muted hover:text-ink"
            aria-label="Close cluster detail"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-3 text-sm text-oxblood">{error}</p> : null}
      {!cluster && !loading ? (
        <p className="mt-4 text-sm text-ink-muted">
          Click a bar on the timeline to read the headlines that were grouped
          together, with source and original link.
        </p>
      ) : null}
      {cluster ? (
        <>
          <p className="mt-3 font-mono text-xs text-ink-muted">
            {cluster.articleCount} articles · {formatSpan(cluster.start, cluster.end)}
          </p>
          {cluster.topTerms.length ? (
            <p className="mt-1 text-xs text-ink-subtle">
              Terms: {cluster.topTerms.join(", ")}
            </p>
          ) : null}
          <ol className="mt-5 space-y-4">
            {cluster.articles.map((article) => (
              <li key={article.id} className="border-t border-rule pt-4 first:border-t-0 first:pt-0">
                <p className="font-mono text-[11px] tracking-wide text-ink-muted uppercase">
                  {article.sourceName} · {formatClock(article.publishedAt)}
                </p>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-start gap-2 text-base font-medium hover:underline"
                >
                  <span>{article.title}</span>
                  <ExternalLink className="mt-1 size-3.5 shrink-0" aria-hidden="true" />
                </a>
                {article.summary ? (
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    {article.summary.length > 220
                      ? `${article.summary.slice(0, 217).trimEnd()}...`
                      : article.summary}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </aside>
  );
}
