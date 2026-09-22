#!/usr/bin/env python3
"""News Pulse RSS ingest + topic clustering.

Stdlib only. Re-runnable: identical URLs are skipped when a previous JSON
snapshot is passed with --merge. Writes a normalized article/cluster document
to stdout or --out.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from xml.etree import ElementTree as ET

from cluster import cluster_articles

USER_AGENT = (
    "Mozilla/5.0 (compatible; NewsPulse/1.0; educational research; "
    "+https://github.com/nipungoel24/agent-forge)"
)
TIMEOUT = 12
BODY_TIMEOUT = 6
PER_FEED = 12

FEEDS = [
    {
        "id": "bbc",
        "name": "BBC News",
        "url": "https://feeds.bbci.co.uk/news/rss.xml",
    },
    {
        "id": "npr",
        "name": "NPR",
        "url": "https://feeds.npr.org/1001/rss.xml",
    },
    {
        "id": "guardian",
        "name": "The Guardian",
        "url": "https://www.theguardian.com/world/rss",
    },
    {
        "id": "aljazeera",
        "name": "Al Jazeera",
        "url": "https://www.aljazeera.com/xml/rss/all.xml",
    },
]


def local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1].lower()


def child_text(node: ET.Element, names: set[str]) -> str:
    for child in list(node):
        if local_name(child.tag) in names:
            text = "".join(child.itertext()).strip()
            if text:
                return text
    return ""


def first_link(node: ET.Element) -> str:
    for child in list(node):
        if local_name(child.tag) == "link":
            href = (child.attrib.get("href") or "").strip()
            text = (child.text or "").strip()
            return href or text
    return ""


def parse_date(raw: str | None) -> str | None:
    if not raw:
        return None
    raw = raw.strip()
    try:
        dt = parsedate_to_datetime(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    except Exception:
        pass
    iso = re.match(r"(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})", raw)
    if iso:
        return iso.group(1) + "Z"
    day = re.match(r"(\d{4}-\d{2}-\d{2})", raw)
    if day:
        return day.group(1) + "T00:00:00Z"
    return None


def strip_html(value: str) -> str:
    text = re.sub(r"(?is)<script[^>]*>.*?</script>", " ", value)
    text = re.sub(r"(?is)<style[^>]*>.*?</style>", " ", text)
    text = re.sub(r"(?s)<[^>]+>", " ", text)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


class BodyExtractor(HTMLParser):
    SKIP = {"script", "style", "noscript", "svg", "nav", "footer", "form", "aside"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._skip = 0
        self._in_article = 0
        self._chunks: list[str] = []
        self._article_chunks: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in self.SKIP:
            self._skip += 1
            return
        if tag == "article":
            self._in_article += 1

    def handle_endtag(self, tag: str) -> None:
        if tag in self.SKIP and self._skip:
            self._skip -= 1
            return
        if tag == "article" and self._in_article:
            self._in_article -= 1

    def handle_data(self, data: str) -> None:
        if self._skip:
            return
        text = re.sub(r"\s+", " ", data).strip()
        if len(text) < 40:
            return
        self._chunks.append(text)
        if self._in_article:
            self._article_chunks.append(text)

    def body(self) -> str:
        parts = self._article_chunks or sorted(self._chunks, key=len, reverse=True)[:8]
        return re.sub(r"\s+", " ", " ".join(parts))[:6000]


def fetch(url: str, timeout: int = TIMEOUT) -> bytes:
    req = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/rss+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.8"})
    with urlopen(req, timeout=timeout) as response:
        return response.read()


def parse_feed(xml_bytes: bytes, source: dict) -> list[dict]:
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError:
        return []
    nodes = [el for el in root.iter() if local_name(el.tag) in {"item", "entry"}]
    articles: list[dict] = []
    for node in nodes[:PER_FEED]:
        title = strip_html(child_text(node, {"title"}))
        link = first_link(node)
        summary = strip_html(
            child_text(node, {"description", "summary", "encoded", "content"})
        )
        published = parse_date(
            child_text(node, {"pubdate", "published", "updated", "date", "dc:date"})
            or child_text(node, {"date"})
        )
        if not published:
            for child in list(node):
                if local_name(child.tag) in {"pubdate", "published", "updated", "date"}:
                    published = parse_date("".join(child.itertext()))
                    break
        if not title or not link:
            continue
        url = link.split("?")[0].rstrip("/")
        article_id = hashlib.sha1(url.encode("utf-8")).hexdigest()[:16]
        articles.append(
            {
                "id": article_id,
                "url": link,
                "title": title,
                "summary": summary[:1200],
                "body": "",
                "source_id": source["id"],
                "source_name": source["name"],
                "published_at": published,
            }
        )
    return articles


def extract_body(url: str) -> str:
    try:
        raw = fetch(url, timeout=BODY_TIMEOUT)
    except (HTTPError, URLError, TimeoutError, Exception):
        return ""
    try:
        html_text = raw.decode("utf-8", errors="ignore")
    except Exception:
        return ""
    parser = BodyExtractor()
    try:
        parser.feed(html_text)
        parser.close()
    except Exception:
        return strip_html(html_text)[:2000]
    return parser.body()


def ingest_source(source: dict) -> tuple[dict, list[dict], str | None]:
    try:
        xml_bytes = fetch(source["url"])
    except Exception as exc:
        return source, [], str(exc)
    articles = parse_feed(xml_bytes, source)
    return source, articles, None


def article_id_from_url(url: str) -> str:
    canonical = url.split("?")[0].rstrip("/")
    return hashlib.sha1(canonical.encode("utf-8")).hexdigest()[:16]


def run(merge_path: Path | None = None) -> dict:
    existing: dict[str, dict] = {}
    if merge_path and merge_path.exists():
        try:
            prev = json.loads(merge_path.read_text(encoding="utf-8"))
            for article in prev.get("articles") or []:
                existing[article["id"]] = article
        except Exception:
            existing = {}

    seen: dict[str, dict] = dict(existing)
    errors: list[dict] = []
    fetched: list[dict] = []

    for source in FEEDS:
        _src, articles, error = ingest_source(source)
        if error:
            errors.append({"source": source["id"], "error": error})
            continue
        fetched.extend(articles)
        for article in articles:
            seen.setdefault(article["id"], article)

    # Extract bodies only for newly seen URLs missing body text.
    need_body = [a for a in seen.values() if not a.get("body")]
    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = {pool.submit(extract_body, article["url"]): article for article in need_body}
        for future in as_completed(futures):
            article = futures[future]
            try:
                body = future.result()
            except Exception:
                body = ""
            article["body"] = body

    articles = list(seen.values())
    articles.sort(key=lambda a: a.get("published_at") or "", reverse=True)
    clusters_raw = cluster_articles(articles)
    clusters = []
    for cluster in clusters_raw:
        members = [articles[i] for i in cluster["article_indexes"]]
        member_ids = [a["id"] for a in members]
        cid = "c_" + hashlib.sha1("|".join(sorted(member_ids)).encode("utf-8")).hexdigest()[:12]
        clusters.append(
            {
                "id": cid,
                "label": cluster["label"],
                "top_terms": cluster["top_terms"],
                "article_ids": member_ids,
                "article_count": cluster["article_count"],
                "start": cluster["start"],
                "end": cluster["end"],
                "intensity": cluster["intensity"],
                "sources": sorted({a["source_id"] for a in members}),
            }
        )

    return {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "approach": {
            "name": "tfidf-cosine",
            "cosine_threshold": 0.48,
            "overlap_min": 2,
        },
        "sources": FEEDS,
        "errors": errors,
        "articles": articles,
        "clusters": clusters,
        "stats": {
            "fetched": len(fetched),
            "stored": len(articles),
            "new": max(len(articles) - len(existing), 0),
            "clusters": len(clusters),
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="News Pulse RSS ingest + clustering")
    parser.add_argument("--out", type=Path, help="Write JSON to this path")
    parser.add_argument("--merge", type=Path, help="Previous snapshot to merge (dedupe by URL id)")
    parser.add_argument("--stdout", action="store_true", help="Print JSON to stdout")
    args = parser.parse_args()
    started = time.time()
    doc = run(merge_path=args.merge)
    doc["stats"]["elapsed_s"] = round(time.time() - started, 2)
    text = json.dumps(doc, ensure_ascii=False, indent=2)
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(text, encoding="utf-8")
    if args.stdout or not args.out:
        sys.stdout.write(text)
        sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
