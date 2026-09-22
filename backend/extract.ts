import { fetchText, stripHtml } from "./rss.ts";

function extractFromHtml(html: string): string {
  const withoutChrome = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");
  const articleMatch = withoutChrome.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
  const source = articleMatch?.[1] ?? withoutChrome;
  const paragraphs = [...source.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => stripHtml(match[1] ?? ""))
    .filter((text) => text.length > 40);
  if (paragraphs.length) return paragraphs.slice(0, 12).join(" ").slice(0, 6000);
  return stripHtml(source).slice(0, 2000);
}

export async function extractBody(url: string): Promise<string> {
  try {
    const html = await fetchText(url, 6_000);
    return extractFromHtml(html);
  } catch {
    return "";
  }
}

export async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      out[index] = await fn(items[index]!);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) || 1 }, () => worker());
  await Promise.all(workers);
  return out;
}
