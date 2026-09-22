import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/layout/site-shell";
import { TimelineExplorer } from "@/components/timeline/timeline-explorer";
import { fetchTimeline } from "@/lib/news/queries";

export const Route = createFileRoute("/")({
  loader: () => fetchTimeline({ data: {} }),
  head: () => ({
    meta: [
      { title: "News Pulse · Topic-clustered news timeline" },
      {
        name: "description",
        content:
          "Watch related stories from BBC, NPR, The Guardian, and Al Jazeera as clusters on a live time axis.",
      },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const data = Route.useLoaderData();
  return (
    <SiteShell>
      <h1 className="sr-only">News Pulse timeline</h1>
      <TimelineExplorer initial={data} />
    </SiteShell>
  );
}
