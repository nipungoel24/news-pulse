import type { NewsSource } from "./types.ts";

export const FEEDS: NewsSource[] = [
  {
    id: "bbc",
    name: "BBC News",
    url: "https://feeds.bbci.co.uk/news/rss.xml",
  },
  {
    id: "npr",
    name: "NPR",
    url: "https://feeds.npr.org/1001/rss.xml",
  },
  {
    id: "guardian",
    name: "The Guardian",
    url: "https://www.theguardian.com/world/rss",
  },
  {
    id: "aljazeera",
    name: "Al Jazeera",
    url: "https://www.aljazeera.com/xml/rss/all.xml",
  },
];

export const SOURCE_IDS = FEEDS.map((feed) => feed.id);

export const USER_AGENT =
  "Mozilla/5.0 (compatible; NewsPulse/1.0; educational research)";

export const PER_FEED = 12;
