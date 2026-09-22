import { Link, useRouterState } from "@tanstack/react-router";
import { formatMastheadDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Timeline" },
  { to: "/about", label: "Method" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
] as const;

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <header className="border-b border-rule bg-paper/90 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="font-display text-lg tracking-tight text-ink">
          News Pulse
        </Link>
        <p className="hidden text-xs tracking-[0.14em] text-ink-muted uppercase sm:block">
          {formatMastheadDate()}
        </p>
      </div>
      <div className="border-y border-ink">
        <div className="mx-auto max-w-6xl px-4 py-5 text-center sm:py-7">
          <p className="text-[11px] tracking-[0.28em] text-ink-muted uppercase">
            Topic-clustered coverage
          </p>
          <p className="font-display mt-1 text-4xl leading-none tracking-tight sm:text-6xl">
            News Pulse
          </p>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ink-muted">
            Live headlines from BBC, NPR, The Guardian, and Al Jazeera, grouped
            into stories and plotted across time.
          </p>
        </div>
      </div>
      <nav aria-label="Primary" className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2 py-2">
        {NAV.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "shrink-0 px-3 py-2 text-sm",
                active ? "border-b-2 border-oxblood font-medium text-ink" : "text-ink-muted hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
