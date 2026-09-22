import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/site-shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Method · News Pulse" },
      {
        name: "description",
        content:
          "How News Pulse pulls public RSS feeds and groups related headlines with TF-IDF cosine similarity.",
      },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does News Pulse group articles?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It turns each headline and summary into a TF-IDF vector, then merges articles whose cosine similarity is at least 0.48 or that share two rare title words. Connected groups become a labeled cluster.",
        },
      },
      {
        "@type": "Question",
        name: "Which news sources are used?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "BBC News, NPR, The Guardian, and Al Jazeera, via their public RSS feeds.",
        },
      },
    ],
  };

  return (
    <SiteShell>
      <article className="prose-news mx-auto max-w-2xl">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
        <p className="text-[11px] tracking-[0.2em] text-ink-muted uppercase">Method</p>
        <h1 className="font-display mt-2 text-4xl">How stories are grouped</h1>
        <p className="mt-4 text-lg text-ink-muted">
          News Pulse is a small ingest-and-cluster pipeline, not a newsroom.
          It reads public RSS feeds, stores each article once, and draws a
          cluster as a bar from its earliest headline to its latest.
        </p>
        <h2 className="font-display mt-10 text-2xl">Sources</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          <li>BBC News, world/home RSS</li>
          <li>NPR, hourly news RSS</li>
          <li>The Guardian, world RSS</li>
          <li>Al Jazeera, all-topics RSS</li>
        </ul>
        <h2 className="font-display mt-10 text-2xl">Grouping</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Each article is a TF-IDF vector over its headline (weighted three
          times) and summary. Two articles join the same cluster when their
          cosine similarity is at least 0.48, or when they share two title
          tokens that are rare in this ingest (document frequency at most 12
          percent). Single-link connected components become clusters. A
          cluster label is the top mean-TF-IDF terms, or the longest headline
          when there are only two members.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Full page text is fetched when the outlet allows it, and stored for
          reading, but it is not used for clustering. Shared page chrome and
          verbs such as "said" otherwise glue unrelated stories into
          one blob. That is a real limitation of overlap methods on news HTML.
        </p>
        <h2 className="font-display mt-10 text-2xl">What this is not</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          It does not claim two outlets reported the same event with certainty.
          Named-entity chains (many headlines mentioning the same president)
          can still over-merge. Thresholds were tuned on a live 46-article
          snapshot so obvious duplicates grouped without collapsing the whole
          set.
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
