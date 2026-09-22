import { useRef, useState, useMemo } from "react";
import { cn, formatClock } from "@/lib/utils";

export type TimelineItem = {
  id: string;
  label: string;
  start: string;
  end: string;
  articleCount: number;
  intensity: number;
  size: number;
  sources: string[];
  color: string;
};

type Packed = TimelineItem & {
  row: number;
  startMs: number;
  endMs: number;
};

function pack(items: TimelineItem[]): { packed: Packed[]; rows: number; min: number; max: number } {
  const dated = items
    .map((item) => {
      const startMs = Date.parse(item.start);
      const endMs = Math.max(Date.parse(item.end), startMs);
      return { ...item, startMs, endMs, row: 0 };
    })
    .filter((item) => Number.isFinite(item.startMs) && Number.isFinite(item.endMs))
    .sort((a, b) => a.startMs - b.startMs || b.endMs - a.endMs);

  if (!dated.length) return { packed: [], rows: 1, min: Date.now(), max: Date.now() + 3_600_000 };

  const min = Math.min(...dated.map((item) => item.startMs));
  const maxRaw = Math.max(...dated.map((item) => item.endMs));
  const pad = Math.max((maxRaw - min) * 0.04, 20 * 60 * 1000);
  const minMs = min - pad;
  const maxMs = maxRaw + pad;
  const span = Math.max(maxMs - minMs, 45 * 60 * 1000);
  const minVisual = Math.max(span * 0.035, 40 * 60 * 1000);

  const rowEnds: number[] = [];
  for (const item of dated) {
    if (item.endMs - item.startMs < minVisual) item.endMs = item.startMs + minVisual;
    let row = rowEnds.findIndex((end) => item.startMs >= end + span * 0.01);
    if (row === -1) {
      row = rowEnds.length;
      rowEnds.push(item.endMs);
    } else {
      rowEnds[row] = item.endMs;
    }
    item.row = row;
  }
  return { packed: dated, rows: Math.max(rowEnds.length, 1), min: minMs, max: maxMs };
}

function ticks(min: number, max: number): { t: number; label: string }[] {
  const span = max - min;
  const step = span > 48 * 3600_000 ? 12 * 3600_000 : span > 18 * 3600_000 ? 6 * 3600_000 : 3 * 3600_000;
  const first = Math.ceil(min / step) * step;
  const out: { t: number; label: string }[] = [];
  for (let t = first; t < max; t += step) {
    out.push({
      t,
      label: new Intl.DateTimeFormat("en-GB", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      }).format(new Date(t)),
    });
  }
  return out;
}

type TooltipState = {
  id: string;
  x: number;
  y: number;
  label: string;
  articleCount: number;
  start: string;
  end: string;
};

export function NewsTimeline({
  items,
  selectedId,
  onSelect,
}: {
  items: TimelineItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { packed, rows, min, max } = useMemo(() => pack(items), [items]);
  const marks = useMemo(() => ticks(min, max), [min, max]);
  const span = Math.max(max - min, 1);
  const rowH = 52;
  const BAR_H = 32;
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const totalArticles = items.reduce((s, i) => s + i.articleCount, 0);

  if (!packed.length) {
    return (
      <div className="border border-dashed border-rule px-4 py-12 text-center">
        <p className="font-display text-xl text-ink-subtle">No coverage yet</p>
        <p className="mt-2 text-sm text-ink-muted">
          No clusters fall on the time axis for the selected sources.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-ink bg-paper-raised">
      {/* Header */}
      <div className="flex items-baseline justify-between border-b border-rule px-3 py-2.5">
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-lg">Coverage window</h2>
          <span className="text-[11px] tabular-nums text-ink-muted">
            <span className="text-oxblood font-medium">{packed.length}</span> clusters
            {" · "}
            <span className="text-oxblood font-medium">{totalArticles}</span> articles
          </span>
        </div>
        <p className="font-mono text-[10px] text-ink-subtle">
          {formatClock(new Date(min).toISOString())} → {formatClock(new Date(max).toISOString())}
        </p>
      </div>

      {/* Chart canvas */}
      <div className="overflow-x-auto">
        <div
          ref={containerRef}
          className="relative w-full min-w-[320px] px-3 pt-8 pb-4"
          style={{ height: 44 + rows * rowH }}
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Time grid */}
          {marks.map((mark) => {
            const left = ((mark.t - min) / span) * 100;
            return (
              <div
                key={mark.t}
                className="pointer-events-none absolute top-0 bottom-0 border-l border-dashed border-rule/60"
                style={{ left: `${left}%` }}
              >
                <span className="absolute top-0 left-1.5 font-mono text-[9px] tracking-widest text-ink-subtle uppercase">
                  {mark.label}
                </span>
              </div>
            );
          })}

          {/* Baseline rule */}
          <div
            className="pointer-events-none absolute bottom-10 left-3 right-3 border-t border-rule/60"
          />

          {/* Bars */}
          {packed.map((item) => {
            const left = ((item.startMs - min) / span) * 100;
            const width = Math.max(((item.endMs - item.startMs) / span) * 100, 2.4);
            const selected = selectedId === item.id;
            const topOffset = 28 + item.row * rowH + (rowH - BAR_H) / 2;
            const animDelay = item.row * 60;
            const isWide = width > 8;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                onMouseEnter={(e) => {
                  const rect = containerRef.current?.getBoundingClientRect();
                  const btnRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  if (!rect) return;
                  setTooltip({
                    id: item.id,
                    x: btnRect.left - rect.left + btnRect.width / 2,
                    y: btnRect.top - rect.top - 8,
                    label: item.label,
                    articleCount: item.articleCount,
                    start: item.start,
                    end: item.end,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
                className={cn(
                  "absolute overflow-hidden text-left text-[11px] leading-tight text-paper-raised",
                  "transition-[transform,box-shadow] duration-150",
                  selected
                    ? "z-10 shadow-sheet"
                    : "hover:scale-[1.015] hover:shadow-[0_4px_16px_-6px_rgb(28_25_21/0.3)]",
                )}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  top: topOffset,
                  height: BAR_H,
                  background: item.color,
                  opacity: 0.78 + item.intensity * 0.22,
                  backgroundImage:
                    "repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 8px)",
                  outline: selected ? "2px solid var(--color-oxblood)" : "none",
                  outlineOffset: selected ? "2px" : "0",
                  boxShadow: selected
                    ? "inset 0 2px 0 0 rgba(255,255,255,0.35), 0 18px 40px -24px rgb(28 25 21 / 0.45)"
                    : undefined,
                  animation: `bar-in 240ms ease-out ${animDelay}ms both`,
                }}
                aria-pressed={selected}
                aria-label={`${item.label}, ${item.articleCount} articles, ${formatClock(item.start)} to ${formatClock(item.end)}`}
              >
                {/* Label */}
                <span
                  className="block truncate px-2 pt-1.5 font-medium leading-none"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                >
                  {item.label}
                </span>
                {/* Article count badge — only when bar is wide enough */}
                {isWide && (
                  <span
                    className="absolute right-1.5 bottom-1 font-mono text-[9px] opacity-80"
                    aria-hidden="true"
                  >
                    {item.articleCount}
                  </span>
                )}
              </button>
            );
          })}

          {/* Tooltip */}
          {tooltip && (
            <div
              role="tooltip"
              className="pointer-events-none absolute z-20 max-w-[200px] -translate-x-1/2 -translate-y-full border border-ink bg-paper-raised px-2.5 py-2 shadow-sheet"
              style={{ left: tooltip.x, top: tooltip.y }}
            >
              <p className="text-[11px] font-medium leading-snug text-ink">{tooltip.label}</p>
              <p className="mt-0.5 font-mono text-[9px] text-ink-muted">
                {tooltip.articleCount} article{tooltip.articleCount !== 1 ? "s" : ""}
              </p>
              <p className="font-mono text-[9px] text-ink-subtle">
                {formatClock(tooltip.start)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="border-t border-rule px-3 py-2 text-[11px] text-ink-subtle">
        Bar length = time from earliest to latest article in cluster · Thickness follows article count
      </p>
    </div>
  );
}
