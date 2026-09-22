import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/site-shell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy · News Pulse" },
      {
        name: "description",
        content: "News Pulse stores public RSS headlines only. It does not create user accounts.",
      },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-2xl">
        <p className="text-[11px] tracking-[0.2em] text-ink-muted uppercase">Legal</p>
        <h1 className="font-display mt-2 text-4xl">Privacy</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-muted">
          News Pulse does not offer accounts, profiles, or comments. It does
          not collect names, emails, or other personal identifiers.
        </p>
        <h2 className="font-display mt-8 text-2xl">What is stored</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Public RSS items: headline, summary, source name, publication time,
          canonical URL, and (when a fetch succeeds) extracted article text.
          Ingest job metadata records whether a refresh succeeded.
        </p>
        <h2 className="font-display mt-8 text-2xl">What is requested</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          The app requests RSS documents and article pages from BBC, NPR, The
          Guardian, and Al Jazeera. Those requests use a browser-like user
          agent so feeds that block unnamed crawlers can still be read.
        </p>
        <h2 className="font-display mt-8 text-2xl">Cookies</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          No analytics cookies are set by this app. Source-filter choices live
          only in the current browser session.
        </p>
        <p className="mt-8 text-sm">
          <Link to="/" className="underline underline-offset-4">
            Return to the timeline
          </Link>
        </p>
      </article>
    </SiteShell>
  );
}
