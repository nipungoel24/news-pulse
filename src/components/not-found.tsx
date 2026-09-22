import { Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/site-shell";

export function NotFoundPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-xl py-12">
        <p className="text-[11px] tracking-[0.2em] text-ink-muted uppercase">404</p>
        <h1 className="font-display mt-2 text-4xl">This page is not on the wire</h1>
        <p className="mt-4 text-ink-muted">
          The path you requested is not part of News Pulse. The live timeline is
          on the front page.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex h-11 items-center border border-ink bg-ink px-4 text-sm text-paper"
        >
          Back to the timeline
        </Link>
      </article>
    </SiteShell>
  );
}
