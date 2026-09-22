import { ExternalLink, X, FileText } from "lucide-react";
import { useState } from "react";
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

function EmptyState() {
  return (
    <div className="mt-8 flex flex-col items-center gap-3 py-4 text-center">
      <FileText
        className="size-8 text-rule-strong"
        strokeWidth={1.25}
        aria-hidden="true"
      />
      <p className="max-w-[200px] text-sm leading-relaxed text-ink-muted">
        Click a bar on the timeline to read the headlines grouped together.
      </p>
    </div>
  );
}

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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
            className="grid size-11 shrink-0 place-items-center text-ink-muted transition-colors hover:text-ink"
            aria-label="Close cluster detail"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm text-oxblood">{error}</p> : null}

      {!cluster && !loading ? <EmptyState /> : null}

      {cluster ? (
        /* Keyed so the panel animates in when a new cluster is selected */
        <div
          key={cluster.id}
          style={{ animation: "panel-in 200ms ease-out both" }}
        >
          <p className="mt-3 font-mono text-xs text-ink-muted">
            {cluster.articleCount} articles · {formatSpan(cluster.start, cluster.end)}
          </p>

          {/* Top terms as editorial chips */}
          {cluster.topTerms.length ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {cluster.topTerms.map((term) => (
                <span
                  key={term}
                  className="border border-rule px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-ink-subtle uppercase"
                >
                  {term}
                </span>
              ))}
            </div>
          ) : null}

          <ol className="mt-5 space-y-4">
            {cluster.articles.map((article) => {
              const expanded = expandedIds.has(article.id);
              const longSummary = article.summary && article.summary.length > 280;
              return (
                <li key={article.id} className="border-t border-rule pt-4 first:border-t-0 first:pt-0">
                  <p className="font-mono text-[11px] tracking-wide text-ink-muted uppercase">
                    {article.sourceName} · {formatClock(article.publishedAt)}
                  </p>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-start gap-2 text-base font-medium transition-opacity hover:opacity-75"
                  >
                    <span>{article.title}</span>
                    <ExternalLink className="mt-1 size-3.5 shrink-0" aria-hidden="true" />
                  </a>
                  {article.summary ? (
                    <div className="mt-2">
                      <p className="text-sm leading-relaxed text-ink-muted">
                        {longSummary && !expanded
                          ? `${article.summary.slice(0, 277).trimEnd()}…`
                          : article.summary}
                      </p>
                      {longSummary ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(article.id)}
                          className="mt-1 text-[11px] text-ink-subtle underline-offset-2 hover:text-ink hover:underline"
                        >
                          {expanded ? "Show less" : "Read more"}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}
    </aside>
  );
}
