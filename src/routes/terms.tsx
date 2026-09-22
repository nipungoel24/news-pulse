import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/site-shell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms · News Pulse" },
      {
        name: "description",
        content: "Terms for using the News Pulse timeline demo. Third-party headlines remain the publishers' copyright.",
      },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <SiteShell>
      <article className="mx-auto max-w-2xl">
        <p className="text-[11px] tracking-[0.2em] text-ink-muted uppercase">Legal</p>
        <h1 className="font-display mt-2 text-4xl">Terms</h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-muted">
          News Pulse is a demonstration of RSS ingest, topic clustering, and a
          timeline interface. It is not a news organization and does not
          warrant completeness or accuracy of third-party reporting.
        </p>
        <h2 className="font-display mt-8 text-2xl">Copyright</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Headlines, summaries, and article text remain the copyright of their
          publishers (BBC, NPR, Guardian News and Media, Al Jazeera, and any
          other outlet whose public feed is read). Links go to the original
          pages. Do not treat this app as a substitute for those publications.
        </p>
        <h2 className="font-display mt-8 text-2xl">Acceptable use</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Use the refresh control reasonably. The pipeline already caps each
          feed and de-duplicates URLs. Do not use this service to overload
          publisher sites.
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
