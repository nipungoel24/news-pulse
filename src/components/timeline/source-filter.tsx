import { cn } from "@/lib/utils";

export function SourceFilter({
  sources,
  enabled,
  onToggle,
}: {
  sources: { id: string; name: string }[];
  enabled: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[11px] tracking-[0.18em] text-ink-muted uppercase">Sources</legend>
      <div className="mt-2 flex flex-wrap gap-1">
        {sources.map((source) => {
          const on = enabled.has(source.id);
          return (
            <button
              key={source.id}
              type="button"
              data-on={on}
              aria-pressed={on}
              onClick={() => onToggle(source.id)}
              className={cn(
                "h-11 border px-3 text-sm",
                on
                  ? "border-ink bg-ink text-paper"
                  : "border-rule bg-paper-raised text-ink-muted hover:border-ink hover:text-ink",
              )}
            >
              {source.name}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
