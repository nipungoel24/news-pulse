import { useMemo } from "react";
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
  const rowH = 44;

  if (!packed.length) {
    return (
      <p className="border border-dashed border-rule px-4 py-10 text-center text-sm text-ink-muted">
        No clusters fall on the time axis for the selected sources.
      </p>
    );
  }

  return (
    <div className="border border-ink bg-paper-raised">
      <div className="flex items-baseline justify-between border-b border-rule px-3 py-2">
        <h2 className="font-display text-lg">Coverage window</h2>
        <p className="font-mono text-[11px] text-ink-muted">
          {formatClock(new Date(min).toISOString())} to {formatClock(new Date(max).toISOString())}
        </p>
      </div>
      <div className="overflow-x-auto">
        <div className="relative w-full min-w-[320px] px-3 pt-8 pb-3" style={{ height: 40 + rows * rowH }}>
          {marks.map((mark) => {
            const left = ((mark.t - min) / span) * 100;
            return (
              <div
                key={mark.t}
                className="pointer-events-none absolute top-0 bottom-0 border-l border-rule/80"
                style={{ left: `${left}%` }}
              >
                <span className="absolute top-0 left-1 font-mono text-[10px] tracking-wide text-ink-subtle uppercase">
                  {mark.label}
                </span>
              </div>
            );
          })}
          {packed.map((item) => {
            const left = ((item.startMs - min) / span) * 100;
            const width = Math.max(((item.endMs - item.startMs) / span) * 100, 2.4);
            const selected = selectedId === item.id;
            const height = 18 + Math.min(item.articleCount, 6) * 3;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  "absolute overflow-hidden px-2 text-left text-[12px] leading-tight text-paper-raised transition-opacity duration-150",
                  selected ? "ring-2 ring-oxblood ring-offset-2 ring-offset-paper-raised" : "hover:opacity-90",
                )}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  top: 28 + item.row * rowH + (rowH - height) / 2,
                  height,
                  background: item.color,
                  opacity: 0.72 + item.intensity * 0.28,
                }}
                aria-pressed={selected}
                aria-label={`${item.label}, ${item.articleCount} articles, ${formatClock(item.start)} to ${formatClock(item.end)}`}
              >
                <span className="block truncate font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <p className="border-t border-rule px-3 py-2 text-xs text-ink-muted">
        Bar length is the time from the earliest to latest article in a cluster.
        Thickness follows article count.
      </p>
    </div>
  );
}
