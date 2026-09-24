/**
 * CoverageMap — Source-Lane Article Event Timeline
 *
 * Newsroom story-map: four source lanes, article events as dots,
 * cluster membership shown via connecting bands on hover/selection.
 *
 * Coordinate model:
 * - The "event canvas" is the area to the right of source labels.
 * - All % positions (dots, grid lines, axis ticks, SVG bands) are
 *   relative to this same canvas width — they always align.
 * - Source label column is a fixed 80px left sidebar.
 */

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { TooltipRoot, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { ArticleEvent } from "@/lib/news/store";

// ─── Layout constants ─────────────────────────────────────────────────────────

const LABEL_W = 88;      // source label column, px
const LANE_H  = 72;      // each source lane height, px
const AXIS_H  = 32;      // time axis row height, px
const DOT_D   = 12;      // default dot diameter, px
const DOT_D_ACTIVE = 16; // hovered / selected dot diameter, px
const CANVAS_MIN_W = 560; // min canvas width before horizontal scroll

// ─── Source config ────────────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<string, { abbr: string; label: string; color: string }> = {
  bbc:       { abbr: "BBC",  label: "BBC News",     color: "#2c4a62" },
  npr:       { abbr: "NPR",  label: "NPR",          color: "#2f4a3c" },
  guardian:  { abbr: "GRDN", label: "The Guardian", color: "#4a4e3a" },
  aljazeera: { abbr: "AJ",   label: "Al Jazeera",   color: "#5a3d32" },
};
const SOURCE_ORDER = ["bbc", "npr", "guardian", "aljazeera"];

// ─── Utilities ────────────────────────────────────────────────────────────────

/** Convert timestamp to % along the canvas (0–100). */
function toPct(ms: number, minMs: number, spanMs: number) {
  return Math.max(0, Math.min(100, ((ms - minMs) / spanMs) * 100));
}

/** Choose axis tick interval based on span. */
function buildTicks(minMs: number, maxMs: number): number[] {
  const span = maxMs - minMs;
  let step: number;
  if      (span > 5  * 86400_000) step = 24 * 3600_000; // >5d  → daily
  else if (span > 2  * 86400_000) step = 12 * 3600_000; // >2d  → 12h
  else if (span > 86400_000)      step =  6 * 3600_000; // >1d  → 6h
  else if (span > 12 * 3600_000)  step =  3 * 3600_000; // >12h → 3h
  else                            step =      3600_000;  // else → 1h
  const first = Math.ceil(minMs / step) * step;
  const out: number[] = [];
  for (let t = first; t < maxMs; t += step) out.push(t);
  return out;
}

/** Format a tick timestamp for the axis label. */
function axisLabel(ts: number, spanMs: number): string {
  const d = new Date(ts);
  if (spanMs <= 86400_000) {
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
  }
  if (spanMs <= 3 * 86400_000) {
    return (
      d.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }) + " " +
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })
    );
  }
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** Day-boundary ticks for background banding. */
function dayBands(minMs: number, maxMs: number): { start: number; end: number; label: string }[] {
  const DAY = 86400_000;
  const firstDay = Math.floor(minMs / DAY) * DAY;
  const bands: { start: number; end: number; label: string }[] = [];
  for (let d = firstDay; d < maxMs; d += DAY) {
    bands.push({
      start: d,
      end: d + DAY,
      label: new Date(d).toLocaleDateString("en-GB", {
        weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
      }),
    });
  }
  return bands;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type EventDotProps = {
  event: ArticleEvent;
  left: number;
  laneColor: string;
  selectedClusterId: string | null;
  hoveredClusterId:  string | null;
  onSelect: (clusterId: string, articleId: string) => void;
  onHover:  (clusterId: string | null) => void;
};

function EventDot({
  event, left, laneColor,
  selectedClusterId, hoveredClusterId,
  onSelect, onHover,
}: EventDotProps) {
  const isInSelectedCluster = selectedClusterId === event.clusterId;
  const isInHoveredCluster  = hoveredClusterId  === event.clusterId;
  const hasActive = selectedClusterId !== null || hoveredClusterId !== null;

  const dimmed      = hasActive && !isInSelectedCluster && !isInHoveredCluster;
  const highlighted = isInSelectedCluster || isInHoveredCluster;
  const d           = highlighted ? DOT_D_ACTIVE : DOT_D;
  const fillColor   = isInSelectedCluster ? "#9c2b1a" : isInHoveredCluster ? "#6a3a2c" : laneColor;

  const pubTime = new Date(event.publishedAt).toLocaleString("en-GB", {
    day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
    timeZone: "UTC", hour12: false,
  });

  return (
    <TooltipRoot>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full",
            "transition-[width,height,opacity,box-shadow] duration-150 ease-out",
            "@media (hover:hover) { hover:opacity-100 }",
            dimmed ? "opacity-[0.15]" : !highlighted ? "opacity-85" : "opacity-100",
          )}
          style={{
            left: `${left}%`,
            width: d,
            height: d,
            background: fillColor,
            boxShadow: isInSelectedCluster
              ? `0 0 0 2.5px #f7f3eb, 0 0 0 4.5px #9c2b1a, 0 4px 12px rgb(156 43 26 / 0.4)`
              : isInHoveredCluster
                ? `0 0 0 2px #f7f3eb, 0 0 0 3.5px ${laneColor}`
                : `0 1px 3px rgb(28 25 21 / 0.2)`,
            zIndex: highlighted ? 20 : dimmed ? 0 : 10,
          }}
          onClick={() => onSelect(event.clusterId, event.id)}
          onMouseEnter={() => onHover(event.clusterId)}
          onMouseLeave={() => onHover(null)}
          aria-label={`${event.title} — ${event.sourceName}, ${pubTime}. Topic: ${event.clusterLabel}`}
          aria-pressed={isInSelectedCluster}
        />
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={10}>
        <p className="font-mono text-[9px] tracking-[0.14em] text-ink-muted uppercase">
          {event.sourceName} · {pubTime}
        </p>
        <p className="mt-1 max-w-[200px] text-[12px] font-medium leading-snug text-ink">
          {event.title}
        </p>
        <p className="mt-1.5 flex items-center gap-1 font-mono text-[9px] text-ink-subtle">
          <span className="inline-block size-1.5 rounded-full bg-ink-subtle" aria-hidden="true" />
          {event.clusterLabel.length > 36 ? event.clusterLabel.slice(0, 36) + "…" : event.clusterLabel}
        </p>
      </TooltipContent>
    </TooltipRoot>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

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

  // Active sources in canonical order
  const activeSources = useMemo(() => {
    return SOURCE_ORDER.filter((id) => sources.some((s) => s.id === id));
  }, [sources]);

  // Time range with 4% padding on each side
  const { minMs, maxMs, spanMs } = useMemo(() => {
    if (!events.length) {
      const now = Date.now();
      return { minMs: now - 3_600_000, maxMs: now, spanMs: 3_600_000 };
    }
    const times = events.map((e) => Date.parse(e.publishedAt));
    const raw   = { mn: Math.min(...times), mx: Math.max(...times) };
    const pad   = Math.max((raw.mx - raw.mn) * 0.04, 30 * 60 * 1000);
    const mn    = raw.mn - pad;
    const mx    = raw.mx + pad;
    return { minMs: mn, maxMs: mx, spanMs: mx - mn };
  }, [events]);

  const ticks  = useMemo(() => buildTicks(minMs, maxMs), [minMs, maxMs]);
  const bands  = useMemo(() => dayBands(minMs, maxMs),   [minMs, maxMs]);

  const totalArticles  = events.length;
  const totalClusters  = useMemo(() => new Set(events.map((e) => e.clusterId)).size, [events]);
  const chartH         = LANE_H * activeSources.length;

  // Source row centres for SVG bands (within the event canvas)
  const sourceRowY = useMemo(() => {
    const map = new Map<string, number>();
    activeSources.forEach((id, i) => map.set(id, i * LANE_H + LANE_H / 2));
    return map;
  }, [activeSources]);

  // Cluster → events map for band drawing
  const clusterMap = useMemo(() => {
    const map = new Map<string, { events: ArticleEvent[]; label: string }>();
    for (const ev of events) {
      if (!map.has(ev.clusterId)) map.set(ev.clusterId, { events: [], label: ev.clusterLabel });
      map.get(ev.clusterId)!.events.push(ev);
    }
    return map;
  }, [events]);

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
      {/* ── Header ── */}
      <div className="border-b border-rule px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="font-display text-lg leading-none">Coverage window</h2>
          <div className="flex gap-5 font-mono text-[10px] tracking-[0.14em] text-ink-muted uppercase">
            <span><span className="font-medium text-ink tabular-nums">{totalArticles}</span> articles</span>
            <span><span className="font-medium text-ink tabular-nums">{totalClusters}</span> topics</span>
            <span><span className="font-medium text-ink tabular-nums">{activeSources.length}</span> sources</span>
          </div>
        </div>
        <p className="mt-1 font-mono text-[9px] text-ink-subtle">
          {new Date(minMs).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
          {" "}→{" "}
          {new Date(maxMs).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
          {" "}(UTC) · each dot is one article · click to explore a topic cluster
        </p>
      </div>

      {/* ── Chart ── */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: CANVAS_MIN_W }}>

          {/* Source lanes + event canvas */}
          <div
            className="relative"
            style={{ height: chartH }}
            onClick={(e) => {
              if ((e.target as HTMLElement).tagName !== "BUTTON") onSelectCluster(null);
            }}
            onMouseLeave={() => setHoveredClusterId(null)}
          >
            {/* Day-boundary background bands */}
            {bands.map((band, bi) => {
              const x1 = toPct(band.start, minMs, spanMs);
              const x2 = toPct(band.end,   minMs, spanMs);
              const w  = x2 - x1;
              return (
                <div
                  key={band.start}
                  className="pointer-events-none absolute top-0 bottom-0"
                  style={{
                    left:    `calc(${LABEL_W}px + ${x1}% * (100% - ${LABEL_W}px) / 100)`,
                    width:   `calc(${w}% * (100% - ${LABEL_W}px) / 100)`,
                    background: bi % 2 === 0 ? "transparent" : "rgb(28 25 21 / 0.025)",
                  }}
                />
              );
            })}

            {/* Vertical grid lines — positioned within event canvas */}
            {ticks.map((t) => {
              const x = toPct(t, minMs, spanMs);
              return (
                <div
                  key={t}
                  className="pointer-events-none absolute top-0 bottom-0 border-l border-dashed border-rule/60"
                  style={{ left: `calc(${LABEL_W}px + ${x}% * (100% - ${LABEL_W}px) / 100)` }}
                />
              );
            })}

            {/* SVG cluster-band overlay (same coordinate space as event canvas) */}
            <svg
              className="pointer-events-none absolute top-0"
              aria-hidden="true"
              style={{ left: LABEL_W, width: `calc(100% - ${LABEL_W}px)`, height: chartH }}
            >
              {Array.from(clusterMap.entries()).map(([clusterId, { events: clEvs, label }]) => {
                const sourceIds = [...new Set(clEvs.map((e) => e.sourceId))];
                if (sourceIds.length < 2) return null; // single-source → no cross-lane band

                const isSelected = selectedClusterId === clusterId;
                const isHovered  = hoveredClusterId  === clusterId;
                const hasActive  = selectedClusterId !== null || hoveredClusterId !== null;

                // In default state: show very faint band for all multi-source clusters
                // When something is active: only show that cluster's band
                if (hasActive && !isSelected && !isHovered) return null;

                const active  = isSelected || isHovered;
                const opacity = isSelected ? 0.3 : isHovered ? 0.18 : 0.05;
                const fill    = active ? "#9c2b1a" : "#2c4a62";

                const sortedEvs = [...clEvs].sort((a, b) => Date.parse(a.publishedAt) - Date.parse(b.publishedAt));
                const x1 = toPct(Date.parse(sortedEvs.at(0)!.publishedAt),  minMs, spanMs);
                const x2 = toPct(Date.parse(sortedEvs.at(-1)!.publishedAt), minMs, spanMs);

                const rows = sourceIds
                  .map((sid) => sourceRowY.get(sid))
                  .filter((r): r is number => r !== undefined);
                const yTop = Math.min(...rows) - DOT_D_ACTIVE / 2;
                const yBot = Math.max(...rows) + DOT_D_ACTIVE / 2;

                return (
                  <g key={clusterId}>
                    <rect
                      x={`${x1}%`}
                      y={yTop}
                      width={`${Math.max(x2 - x1, 0.4)}%`}
                      height={yBot - yTop}
                      fill={fill}
                      fillOpacity={opacity}
                      rx={3}
                    />
                    {active && (
                      <text
                        x={`${x1}%`}
                        dx={4}
                        y={yTop - 5}
                        fontSize={8}
                        fontFamily="ui-monospace, 'SF Mono', Menlo, monospace"
                        fill={fill}
                        opacity={0.9}
                        letterSpacing="0.08em"
                        textAnchor="start"
                      >
                        {label.length > 32 ? label.slice(0, 32) + "…" : label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Source lanes */}
            {activeSources.map((sourceId, idx) => {
              const cfg        = SOURCE_CONFIG[sourceId] ?? { abbr: sourceId.slice(0, 4).toUpperCase(), label: sourceId, color: "#3a3a38" };
              const laneEvents = events.filter((e) => e.sourceId === sourceId);
              const isLast     = idx === activeSources.length - 1;

              return (
                <div
                  key={sourceId}
                  className={cn("relative flex", !isLast && "border-b border-rule/40")}
                  style={{ height: LANE_H }}
                >
                  {/* Label column */}
                  <div
                    className="shrink-0 flex flex-col items-end justify-center gap-0.5 border-r border-rule/60 pr-3"
                    style={{ width: LABEL_W }}
                  >
                    <span
                      className="font-mono text-[10px] tracking-[0.18em] text-ink-muted uppercase select-none"
                      title={cfg.label}
                    >
                      {cfg.abbr}
                    </span>
                    <span
                      className="font-mono text-[8px] tracking-wide text-ink-subtle select-none"
                    >
                      {laneEvents.length} art.
                    </span>
                  </div>

                  {/* Event dots area */}
                  <div className="relative flex-1">
                    {/* Subtle lane baseline */}
                    <div
                      className="pointer-events-none absolute left-0 right-0"
                      style={{ top: LANE_H / 2, borderTop: "1px solid rgb(212 204 192 / 0.4)" }}
                    />
                    {laneEvents.map((event) => {
                      const left = toPct(Date.parse(event.publishedAt), minMs, spanMs);
                      return (
                        <EventDot
                          key={event.id}
                          event={event}
                          left={left}
                          laneColor={cfg.color}
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
          </div>

          {/* ── Time axis ── */}
          <div
            className="relative flex border-t border-rule/80"
            style={{ height: AXIS_H }}
          >
            {/* Spacer for label column */}
            <div className="shrink-0 border-r border-rule/60" style={{ width: LABEL_W }} />
            {/* Tick marks */}
            <div className="relative flex-1">
              {ticks.map((t) => {
                const left = toPct(t, minMs, spanMs);
                return (
                  <div
                    key={t}
                    className="absolute top-0 bottom-0 flex items-center"
                    style={{ left: `${left}%` }}
                  >
                    <span className="absolute -translate-x-1/2 whitespace-nowrap font-mono text-[9px] tracking-[0.1em] text-ink-subtle uppercase select-none">
                      {axisLabel(t, spanMs)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* ── Footer legend ── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-rule px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className="inline-block rounded-full bg-ink-muted"
            style={{ width: DOT_D, height: DOT_D }}
            aria-hidden="true"
          />
          <span className="text-[10px] text-ink-subtle">Article event</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block rounded-full bg-oxblood ring-2 ring-oxblood/30"
            style={{ width: DOT_D_ACTIVE, height: DOT_D_ACTIVE }}
            aria-hidden="true"
          />
          <span className="text-[10px] text-ink-subtle">Topic cluster selected</span>
        </div>
        <p className="ml-auto text-[10px] text-ink-subtle">
          Hover · click to explore topic clusters
        </p>
      </div>
    </div>
  );
}
