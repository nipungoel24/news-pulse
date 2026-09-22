import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { PER_FEED, USER_AGENT } from "./feeds.ts";
import type { Article, NewsSource } from "./types.ts";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  trimValues: true,
  cdataPropName: "__cdata",
});

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function textOf(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.__cdata === "string") return record.__cdata;
    if (typeof record["#text"] === "string") return record["#text"];
    if (typeof record["@_href"] === "string") return record["@_href"];
  }
  return "";
}

export function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&/g, "&")
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseDate(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const parsed = Date.parse(trimmed);
  if (Number.isFinite(parsed)) return new Date(parsed).toISOString().replace(/\.\d{3}Z$/, "Z");
  const iso = trimmed.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
  if (iso) return `${iso[1]}Z`;
  const day = trimmed.match(/(\d{4}-\d{2}-\d{2})/);
  if (day) return `${day[1]}T00:00:00Z`;
  return null;
}

export function articleIdFromUrl(url: string): string {
  const canonical = url.split("?")[0]?.replace(/\/+$/, "") ?? url;
  return createHash("sha1").update(canonical).digest("hex").slice(0, 16);
}

export async function fetchText(url: string, timeoutMs: number): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/rss+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return await response.text();
}

function linkOf(item: Record<string, unknown>): string {
  const link = item.link ?? item.id;
  const fromField = textOf(link);
  if (fromField.startsWith("http")) return fromField;
  for (const candidate of asArray(link)) {
    if (typeof candidate === "string" && candidate.startsWith("http")) return candidate;
    if (candidate && typeof candidate === "object") {
      const rec = candidate as Record<string, unknown>;
      const href = rec["@_href"];
      if (typeof href === "string" && href.startsWith("http")) return href;
    }
  }
  return "";
}

export function parseFeedXml(xml: string, source: NewsSource): Article[] {
  const doc = parser.parse(xml) as Record<string, unknown>;
  const rss = (doc.rss ?? doc.RDF ?? doc) as Record<string, unknown>;
  const channel = (rss.channel ?? rss.feed ?? rss) as Record<string, unknown>;
  const items = [
    ...asArray(channel.item as Record<string, unknown> | undefined),
    ...asArray(channel.entry as Record<string, unknown> | undefined),
    ...asArray(rss.item as Record<string, unknown> | undefined),
    ...asArray(rss.entry as Record<string, unknown> | undefined),
  ];

  const articles: Article[] = [];
  for (const raw of items.slice(0, PER_FEED)) {
    const item = raw as Record<string, unknown>;
    const title = stripHtml(textOf(item.title));
    const url = linkOf(item);
    const summary = stripHtml(
      textOf(item.description) ||
        textOf(item.summary) ||
        textOf(item["content:encoded"]) ||
        textOf(item.content),
    );
    const publishedAt = parseDate(
      textOf(item.pubDate) ||
        textOf(item.published) ||
        textOf(item.updated) ||
        textOf(item["dc:date"]) ||
        textOf(item.date),
    );
    if (!title || !url) continue;
    articles.push({
      id: articleIdFromUrl(url),
      url,
      title,
      summary: summary.slice(0, 1200),
      body: "",
      sourceId: source.id,
      sourceName: source.name,
      publishedAt,
    });
  }
  return articles;
}

export async function ingestFeed(source: NewsSource): Promise<{ articles: Article[]; error: string | null }> {
  try {
    const xml = await fetchText(source.url, 12_000);
    return { articles: parseFeedXml(xml, source), error: null };
  } catch (error) {
    return { articles: [], error: error instanceof Error ? error.message : String(error) };
  }
}
