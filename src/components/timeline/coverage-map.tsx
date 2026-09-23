/**
 * CoverageMap — Source-Lane Article Event Timeline
 *
 * Replaces the Gantt bar chart with a newsroom story-map:
 * - Four horizontal source lanes (BBC, NPR, Guardian, Al Jazeera)
 * - Article events as dots positioned by real publishedAt timestamps
 * - Cluster membership shown via connecting bands
 * - Selection highlights all articles in a cluster, dims others
 * - Hover tooltip reveals article headline + cluster name
 */

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { TooltipRoot, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { ArticleEvent } from "@/lib/news/store";

// ─── Constants ───────────────────────────────────────────────────────────────

const LANE_H = 60; // px per source lane
const DOT_R = 5; // default dot radius px
const DOT_R_SELECTED = 7; // selected/hovered dot radius
const LABEL_W = 72; // source label column width px
const AXIS_H = 28; // time axis height px
const CANVAS_MIN_W = 480; // minimum chart width px

// Source display config
const SOURCE_CONFIG: Record<string, { abbr: string; label: string }> = {
  bbc: { abbr: "BBC", label: "BBC News" },
  npr: { abbr: "NPR", label: "NPR" },
  guardian: { abbr: "GRDN", label: "The Guardian" },
  aljazeera: { abbr: "AJ", label: "Al Jazeera" },
};

// Canonical source order (matches feeds.ts)
const SOURCE_ORDER = ["bbc", "npr", "guardian", "aljazeera"];

// ─── Utilities ───────────────────────────────────────────────────────────────

function formatAxisLabel(ts: number, spanMs: number): string {
  const d = new Date(ts);
  if (spanMs <= 12 * 3600_000) {
    // Within a day: show time only
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  }
  if (spanMs <= 72 * 3600_000) {
    // 1–3 days: show "Tue 14:00"
    return (
      d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }) +
      " " +
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })
    );
  }
  // >3 days: show "21 Sep"
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

function buildTicks(minMs: number, maxMs: number): number[] {
  const span = maxMs - minMs;
  let stepMs: number;
  if (span > 4 * 86400_000) stepMs = 24 * 3600_000; // >4d: daily
  else if (span > 2 * 86400_000) stepMs = 12 * 3600_000; // >2d: 12h
  else if (span > 86400_000) stepMs = 6 * 3600_000; // >1d: 6h
  else if (span > 12 * 3600_000) stepMs = 3 * 3600_000; // >12h: 3h
  else stepMs = 3600_000; // default: 1h
  const first = Math.ceil(minMs / stepMs) * stepMs;
  const ticks: number[] = [];
  for (let t = first; t < maxMs; t += stepMs) ticks.push(t);
  return ticks;
}

function toPercent(ms: number, minMs: number, spanMs: number): number {
  return ((ms - minMs) / spanMs) * 100;
}

// Stable colour per cluster ID (ink palette, not neon)
const CLUSTER_COLORS = [
  "#2c4a62", "#5a3d32", "#2f4a3c", "#6a3d36",
  "#4a4e3a", "#8a5a2b", "#3a3a38", "#4a3a2c",
];
function clusterColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return CLUSTER_COLORS[h % CLUSTER_COLORS.length]!;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TimeAxis({
  ticks,
  minMs,
  spanMs,
  spanMsTotal,
}: {
  ticks: number[];
  minMs: number;
  spanMs: number;
  spanMsTotal: number;
}) {
  return (
    <div
      className="relative border-t border-rule"
      style={{ height: AXIS_H, marginLeft: LABEL_W }}
    >
      {ticks.map((t) => {
        const left = toPercent(t, minMs, spanMs);
        return (
          <div
            key={t}
            className="absolute top-0 bottom-0 flex items-center"
            style={{ left: `${left}%` }}
          >
            <span className="absolute -translate-x-1/2 whitespace-nowrap font-mono text-[9px] tracking-widest text-ink-subtle uppercase select-none">
              {formatAxisLabel(t, spanMsTotal)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function GridLines({ ticks, minMs, spanMs }: { ticks: number[]; minMs: number; spanMs: number }) {
  return (
    <>
      {ticks.map((t) => {
        const left = toPercent(t, minMs, spanMs);
        return (
          <div
            key={t}
            className="pointer-events-none absolute top-0 bottom-0 border-l border-dashed border-rule/50"
            style={{ left: `calc(${LABEL_W}px + ${left}% * (100% - ${LABEL_W}px) / 100)` }}
          />
        );
      })}
    </>
  );
}

type EventDotProps = {
  event: ArticleEvent;
  left: number; // %
  selectedClusterId: string | null;
  hoveredClusterId: string | null;
  onSelect: (clusterId: string, articleId: string) => void;
  onHover: (clusterId: string | null) => void;
};

function EventDot({
  event,
  left,
  selectedClusterId,
  hoveredClusterId,
  onSelect,
  onHover,
}: EventDotProps) {
  const isSelected = selectedClusterId === event.clusterId;
  const isHovered = hoveredClusterId === event.clusterId;
  const hasSelection = selectedClusterId !== null;
  const hasHover = hoveredClusterId !== null;

  const dimmed = (hasSelection && !isSelected) || (hasHover && !isHovered && !isSelected);
  const highlighted = isSelected || isHovered;
  const color = clusterColor(event.clusterId);

  const r = highlighted ? DOT_R_SELECTED : DOT_R;

  // Format publish time for tooltip
  const pubTime = new Date(event.publishedAt).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    hour12: false,
  });

  return (
    <TooltipRoot>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full",
            "transition-[width,height,opacity] duration-150 ease-out",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-oxblood",
            dimmed && "opacity-[0.12]",
            !dimmed && !highlighted && "opacity-80 hover:opacity-100",
          )}
          style={{
            left: `${left}%`,
            width: r * 2,
            height: r * 2,
            background: highlighted ? "#9c2b1a" : color, // oxblood for selected
            boxShadow: highlighted
              ? `0 0 0 2px #f7f3eb, 0 0 0 4px #9c2b1a`
              : undefined,
          }}
          onClick={() => onSelect(event.clusterId, event.id)}
          onMouseEnter={() => onHover(event.clusterId)}
          onMouseLeave={() => onHover(null)}
          aria-label={`${event.title} — ${event.sourceName}, ${pubTime}`}
          aria-pressed={isSelected}
        />
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        <p className="font-mono text-[9px] tracking-wider text-ink-muted uppercase">
          {event.sourceName} · {pubTime}
        </p>
        <p className="mt-1 text-[11px] font-medium leading-snug text-ink line-clamp-2">
          {event.title}
        </p>
        <p className="mt-1.5 font-mono text-[9px] text-ink-subtle uppercase tracking-wide">
          Topic: {event.clusterLabel}
        </p>
      </TooltipContent>
    </TooltipRoot>
  );
}

type ClusterBandProps = {
  events: ArticleEvent[];
  minMs: number;
  spanMs: number;
  sourceRows: Map<string, number>; // sourceId → y-center px offset from chart top
  selectedClusterId: string | null;
  hoveredClusterId: string | null;
  chartH: number;
};

function ClusterBands({
  events,
  minMs,
  spanMs,
  sourceRows,
  selectedClusterId,
  hoveredClusterId,
  chartH,
}: ClusterBandProps) {
  // Group events by cluster
  const clusters = useMemo(() => {
    const map = new Map<string, { events: ArticleEvent[]; label: string }>();
    for (const event of events) {
      if (!map.has(event.clusterId)) {
        map.set(event.clusterId, { events: [], label: event.clusterLabel });
      }
      map.get(event.clusterId)!.events.push(event);
    }
    return map;
  }, [events]);

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width="100%"
      height={chartH}
      style={{ marginLeft: 0 }}
      aria-hidden="true"
    >
      {Array.from(clusters.entries()).map(([clusterId, { events: clEvents, label }]) => {
        // Only draw bands for clusters with articles in multiple rows
        const sourceSet = new Set(clEvents.map((e) => e.sourceId));
        if (sourceSet.size < 2) return null; // single-source cluster — no band to draw

        const isSelected = selectedClusterId === clusterId;
        const isHovered = hoveredClusterId === clusterId;
        const hasSelection = selectedClusterId !== null;
        const isActive = isSelected || isHovered;

        // Don't render bands at all unless hovered/selected (keeps default view clean)
        if (!isActive && !(!hasSelection)) return null;
        // In default state (no selection, no hover): show faint band
        // In hover/selection state: show only active cluster's band prominently

        const hasAnyActive = selectedClusterId !== null || hoveredClusterId !== null;
        if (hasAnyActive && !isActive) return null;

        const opacity = isSelected ? 0.35 : isHovered ? 0.22 : 0.06;
        const color = isSelected || isHovered ? "#9c2b1a" : clusterColor(clusterId);

        const sortedEvents = [...clEvents].sort(
          (a, b) => Date.parse(a.publishedAt) - Date.parse(b.publishedAt),
        );
        const firstTs = Date.parse(sortedEvents[0]!.publishedAt);
        const lastTs = Date.parse(sortedEvents[sortedEvents.length - 1]!.publishedAt);

        const leftPct = toPercent(firstTs, minMs, spanMs);
        const rightPct = toPercent(lastTs, minMs, spanMs);

        // Draw a band from min source row to max source row, spanning the time range
        const rows = clEvents
          .map((e) => sourceRows.get(e.sourceId))
          .filter((r): r is number => r !== undefined);
        const minRow = Math.min(...rows);
        const maxRow = Math.max(...rows);

        if (minRow === maxRow) return null; // same lane

        return (
          <g key={clusterId}>
            <rect
              x={`${leftPct}%`}
              y={minRow - DOT_R_SELECTED}
              width={`${Math.max(rightPct - leftPct, 0.5)}%`}
              height={maxRow - minRow + DOT_R_SELECTED * 2}
              fill={color}
              fillOpacity={opacity}
              rx={2}
            />
            {isActive && (
              <text
                x={`${leftPct}%`}
                y={minRow - DOT_R_SELECTED - 4}
                fontSize={9}
                fontFamily="ui-monospace, 'SF Mono', Menlo, monospace"
                fill={color}
                opacity={0.85}
                className="uppercase tracking-widest"
              >
                {label.length > 28 ? label.slice(0, 28) + "…" : label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export type { ArticleEvent };

export function CoverageMap({
  events,
  sources,
  selectedClusterId,
  onSelectCluster,
}: {
  events: ArticleEvent[];
  sources: { id: string; name: string }[];
  selectedClusterId: string | null;
  onSelectCluster: (clusterId: string | null, articleId?: string) => void;
}) {
  const [hoveredClusterId, setHoveredClusterId] = useState<string | null>(null);

  // Determine which sources actually have events
  const activeSources = useMemo(() => {
    const seen = new Set(events.map((e) => e.sourceId));
    // Filter the canonical order to only include sources with events OR in the sources list
    const all = SOURCE_ORDER.filter((id) => sources.some((s) => s.id === id));
    return all.length ? all : [...seen];
  }, [events, sources]);

  // Time range
  const { minMs, maxMs, spanMs } = useMemo(() => {
    if (!events.length) {
      const now = Date.now();
      return { minMs: now - 3600_000, maxMs: now, spanMs: 3600_000 };
    }
    const times = events.map((e) => Date.parse(e.publishedAt));
    const pad = Math.max((Math.max(...times) - Math.min(...times)) * 0.05, 30 * 60 * 1000);
    const mn = Math.min(...times) - pad;
    const mx = Math.max(...times) + pad;
    return { minMs: mn, maxMs: mx, spanMs: mx - mn };
  }, [events]);

  const ticks = useMemo(() => buildTicks(minMs, maxMs), [minMs, maxMs]);

  // Source row y-centers (relative to chart top, i.e. within source lanes area)
  const sourceRows = useMemo(() => {
    const map = new Map<string, number>();
    activeSources.forEach((id, idx) => {
      map.set(id, LANE_H * idx + LANE_H / 2);
    });
    return map;
  }, [activeSources]);

  const chartH = LANE_H * activeSources.length;
  const totalH = chartH + AXIS_H;

  // Statistics
  const totalArticles = events.length;
  const totalClusters = new Set(events.map((e) => e.clusterId)).size;

  // Empty state
  if (!events.length) {
    return (
      <div className="border border-dashed border-rule px-4 py-12 text-center">
        <p className="font-display text-xl text-ink-subtle">No coverage yet</p>
        <p className="mt-2 text-sm text-ink-muted">
          Refresh data to pull the latest feeds from BBC, NPR, The Guardian, and Al Jazeera.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-ink bg-paper-raised">
      {/* Header */}
      <div className="border-b border-rule px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="font-display text-lg">Coverage window</h2>
          <div className="flex gap-4 font-mono text-[10px] tracking-[0.16em] uppercase text-ink-muted">
            <span>
              <span className="text-ink tabular-nums">{totalArticles}</span> articles
            </span>
            <span>
              <span className="text-ink tabular-nums">{totalClusters}</span> topics
            </span>
            <span>
              <span className="text-ink tabular-nums">{activeSources.length}</span> sources
            </span>
          </div>
        </div>
        <p className="mt-0.5 font-mono text-[9px] text-ink-subtle">
          {new Date(minMs).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
          {" "}→{" "}
          {new Date(maxMs).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
          {" "}· UTC · click any article to explore its topic cluster
        </p>
      </div>

      {/* Chart */}
      <div className="overflow-x-auto">
        <div
          className="relative"
          style={{ minWidth: CANVAS_MIN_W, height: totalH }}
          // Click outside dots to deselect
          onClick={(e) => {
            if ((e.target as HTMLElement).tagName !== "BUTTON") {
              onSelectCluster(null);
            }
          }}
          onMouseLeave={() => setHoveredClusterId(null)}
        >
          {/* Grid lines */}
          <GridLines ticks={ticks} minMs={minMs} spanMs={spanMs} />

          {/* Cluster bands (SVG overlay, behind dots) */}
          <div className="absolute inset-0" style={{ left: LABEL_W }}>
            <ClusterBands
              events={events}
              minMs={minMs}
              spanMs={spanMs}
              sourceRows={sourceRows}
              selectedClusterId={selectedClusterId}
              hoveredClusterId={hoveredClusterId}
              chartH={chartH}
            />
          </div>

          {/* Source lanes */}
          {activeSources.map((sourceId, idx) => {
            const config = SOURCE_CONFIG[sourceId] ?? { abbr: sourceId.toUpperCase().slice(0, 4), label: sourceId };
            const laneEvents = events.filter((e) => e.sourceId === sourceId);
            const isLastLane = idx === activeSources.length - 1;

            return (
              <div
                key={sourceId}
                className={cn(
                  "relative flex items-center",
                  !isLastLane && "border-b border-rule/50",
                )}
                style={{ height: LANE_H }}
              >
                {/* Source label */}
                <div
                  className="shrink-0 flex items-center justify-end pr-3 border-r border-rule/60"
                  style={{ width: LABEL_W, height: "100%" }}
                >
                  <span
                    className="font-mono text-[9px] tracking-[0.2em] text-ink-muted uppercase select-none"
                    title={config.label}
                  >
                    {config.abbr}
                  </span>
                </div>

                {/* Event area */}
                <div className="relative flex-1 h-full">
                  {laneEvents.map((event) => {
                    const ts = Date.parse(event.publishedAt);
                    const left = toPercent(ts, minMs, spanMs);
                    return (
                      <EventDot
                        key={event.id}
                        event={event}
                        left={left}
                        selectedClusterId={selectedClusterId}
                        hoveredClusterId={hoveredClusterId}
                        onSelect={(cid, aid) => onSelectCluster(cid, aid)}
                        onHover={setHoveredClusterId}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Time axis */}
          <TimeAxis ticks={ticks} minMs={minMs} spanMs={spanMs} spanMsTotal={spanMs} />
        </div>
      </div>

      {/* Footer legend */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-full bg-ink-subtle" aria-hidden="true" />
          <span className="text-[10px] text-ink-subtle">Article</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-oxblood ring-2 ring-oxblood/30" aria-hidden="true" />
          <span className="text-[10px] text-ink-subtle">Selected topic cluster</span>
        </div>
        <p className="ml-auto text-[10px] text-ink-subtle">
          Hover an article · click to explore its topic cluster
        </p>
      </div>
    </div>
  );
}
