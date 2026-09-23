import { ExternalLink, X } from "lucide-react";
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

// Source abbreviations matching coverage-map
const SOURCE_ABBR: Record<string, string> = {
  bbc: "BBC News",
  npr: "NPR",
  guardian: "The Guardian",
  aljazeera: "Al Jazeera",
};

function EmptyState({ clusterCount, articleCount }: { clusterCount?: number; articleCount?: number }) {
  return (
    <div className="flex flex-col gap-5 py-2">
      {/* Instructional copy */}
      <div>
        <p className="text-[11px] tracking-[0.18em] text-ink-muted uppercase">
          Cluster Explorer
        </p>
        <p className="font-display mt-2 text-xl leading-snug text-ink">
          Select an article to see how different sources covered the same story.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Each dot on the timeline is an article. Dots in the same topic cluster are
          connected — click any to read all coverage of that story.
        </p>
      </div>

      {/* Editorial metadata */}
      {(clusterCount !== undefined || articleCount !== undefined) && (
        <div className="border-t border-rule pt-4">
          <dl className="grid grid-cols-2 gap-3">
            {articleCount !== undefined && (
              <div>
                <dt className="font-mono text-[9px] tracking-[0.18em] text-ink-muted uppercase">Articles</dt>
                <dd className="font-display mt-0.5 text-3xl tabular-nums text-ink">{articleCount}</dd>
              </div>
            )}
            {clusterCount !== undefined && (
              <div>
                <dt className="font-mono text-[9px] tracking-[0.18em] text-ink-muted uppercase">Topics</dt>
                <dd className="font-display mt-0.5 text-3xl tabular-nums text-ink">{clusterCount}</dd>
              </div>
            )}
          </dl>
          <p className="mt-3 text-[11px] text-ink-subtle">
            from BBC News, NPR, The Guardian, and Al Jazeera
          </p>
        </div>
      )}
    </div>
  );
}

export function ClusterDetail({
  cluster,
  loading,
  error,
  onClose,
  clusterCount,
  articleCount,
}: {
  cluster: ClusterDetailData | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  clusterCount?: number;
  articleCount?: number;
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
      {/* Header area */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] tracking-[0.18em] text-ink-muted uppercase">
            {cluster ? "Topic cluster" : loading ? "Loading" : "Cluster Explorer"}
          </p>
          <h2 className="font-display mt-1 text-2xl leading-tight">
            {cluster?.label ?? (loading ? "Loading story…" : "")}
          </h2>
        </div>
        {cluster && (
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center text-ink-muted transition-colors hover:text-ink"
            aria-label="Close cluster detail"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-oxblood">{error}</p>}

      {!cluster && !loading ? (
        <div style={{ animation: "fade-up 200ms ease-out both" }}>
          <EmptyState clusterCount={clusterCount} articleCount={articleCount} />
        </div>
      ) : null}

      {cluster && (
        <div key={cluster.id} style={{ animation: "panel-in 200ms ease-out both" }}>
          {/* Cluster meta */}
          <p className="mt-2 font-mono text-xs text-ink-muted">
            {cluster.articleCount} article{cluster.articleCount !== 1 ? "s" : ""}
            {" · "}
            {cluster.sources.length} source{cluster.sources.length !== 1 ? "s" : ""}
            {" · "}
            {formatSpan(cluster.start, cluster.end)}
          </p>

          {/* Sources covered */}
          {cluster.sources.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {cluster.sources.map((sid) => (
                <span
                  key={sid}
                  className="border border-rule px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-ink-subtle uppercase"
                >
                  {SOURCE_ABBR[sid] ?? sid}
                </span>
              ))}
            </div>
          )}

          {/* Top terms */}
          {cluster.topTerms.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {cluster.topTerms.map((term) => (
                <span
                  key={term}
                  className="border border-rule/60 bg-paper px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-ink-subtle uppercase"
                >
                  {term}
                </span>
              ))}
            </div>
          )}

          {/* Article list */}
          <ol className="mt-5 space-y-4">
            {cluster.articles.map((article) => {
              const expanded = expandedIds.has(article.id);
              const longSummary = article.summary && article.summary.length > 280;
              return (
                <li key={article.id} className="border-t border-rule pt-4 first:border-t-0 first:pt-0">
                  <p className="font-mono text-[10px] tracking-wide text-ink-muted uppercase">
                    {article.sourceName} · {formatClock(article.publishedAt)}
                  </p>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-start gap-2 text-[15px] font-medium leading-snug transition-opacity hover:opacity-70"
                  >
                    <span>{article.title}</span>
                    <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
                  </a>
                  {article.summary && (
                    <div className="mt-2">
                      <p className="text-sm leading-relaxed text-ink-muted">
                        {longSummary && !expanded
                          ? `${article.summary.slice(0, 277).trimEnd()}…`
                          : article.summary}
                      </p>
                      {longSummary && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(article.id)}
                          className="mt-1 text-[11px] text-ink-subtle underline-offset-2 hover:text-ink hover:underline"
                        >
                          {expanded ? "Show less" : "Read more"}
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </aside>
  );
}
