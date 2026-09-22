"""TF-IDF cosine clustering with a rare-title overlap assist.

Why title + summary, not full body: extracted article HTML is full of shared
chrome and verbs ("said"), which single-link clustering turns into one blob.

Two articles join a cluster when:
- cosine similarity of title-weighted TF-IDF vectors >= 0.48, or
- they share 2+ rare title tokens (document frequency <= 12% of the corpus).

Connected components become clusters. Labels use the highest mean-TF-IDF terms
that are actually shared, falling back to the longest member headline.
"""

from __future__ import annotations

import math
import re
from collections import Counter, defaultdict
from datetime import datetime

from stopwords import STOPWORDS

COSINE_THRESHOLD = 0.48
OVERLAP_MIN = 2
RARE_DF_FRACTION = 0.12
TOKEN_RE = re.compile(r"[a-z][a-z0-9'-]{2,}")


def tokenize(text: str) -> list[str]:
    return [tok for tok in TOKEN_RE.findall(text.lower()) if tok not in STOPWORDS]


def title_tokens(article: dict) -> list[str]:
    return tokenize(article.get("title") or "")


def document_tokens(article: dict) -> list[str]:
    title = title_tokens(article)
    summary = tokenize(article.get("summary") or "")
    return title + title + title + summary


def build_idf(docs: list[list[str]]) -> dict[str, float]:
    n = max(len(docs), 1)
    df: Counter[str] = Counter()
    for doc in docs:
        df.update(set(doc))
    return {term: math.log((1 + n) / (1 + count)) + 1.0 for term, count in df.items()}


def tfidf_vector(tokens: list[str], idf: dict[str, float]) -> dict[str, float]:
    if not tokens:
        return {}
    tf = Counter(tokens)
    total = float(len(tokens))
    vec = {term: (count / total) * idf.get(term, 0.0) for term, count in tf.items()}
    norm = math.sqrt(sum(v * v for v in vec.values())) or 1.0
    return {term: value / norm for term, value in vec.items()}


def cosine(a: dict[str, float], b: dict[str, float]) -> float:
    if len(a) > len(b):
        a, b = b, a
    return sum(weight * b.get(term, 0.0) for term, weight in a.items())


class UnionFind:
    def __init__(self, n: int) -> None:
        self.parent = list(range(n))
        self.rank = [0] * n

    def find(self, x: int) -> int:
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]
            x = self.parent[x]
        return x

    def union(self, a: int, b: int) -> None:
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return
        if self.rank[ra] < self.rank[rb]:
            self.parent[ra] = rb
        elif self.rank[ra] > self.rank[rb]:
            self.parent[rb] = ra
        else:
            self.parent[rb] = ra
            self.rank[ra] += 1


def cluster_articles(articles: list[dict]) -> list[dict]:
    if not articles:
        return []

    n = len(articles)
    docs = [document_tokens(article) for article in articles]
    titles = [set(title_tokens(article)) for article in articles]
    idf = build_idf(docs)
    vectors = [tfidf_vector(doc, idf) for doc in docs]

    title_df: Counter[str] = Counter()
    for title in titles:
        title_df.update(title)
    rare_cap = max(2, int(RARE_DF_FRACTION * n))
    rare = [{tok for tok in title if title_df[tok] <= rare_cap} for title in titles]

    uf = UnionFind(n)
    for i in range(n):
        for j in range(i + 1, n):
            overlap = len(rare[i] & rare[j])
            sim = cosine(vectors[i], vectors[j])
            if sim >= COSINE_THRESHOLD or overlap >= OVERLAP_MIN:
                uf.union(i, j)

    groups: dict[int, list[int]] = defaultdict(list)
    for i in range(n):
        groups[uf.find(i)].append(i)

    clusters = [_describe_cluster(articles, vectors, members) for members in groups.values()]
    clusters.sort(key=lambda c: (-c["article_count"], c["start"] or ""))
    return clusters


def _describe_cluster(articles: list[dict], vectors: list[dict[str, float]], members: list[int]) -> dict:
    mean: Counter[str] = Counter()
    for idx in members:
        for term, weight in vectors[idx].items():
            mean[term] += weight
    for term in list(mean):
        mean[term] /= len(members)
    top_terms = [term for term, _ in mean.most_common(4)]
    label = _label(articles, members, top_terms)
    times = [articles[i].get("published_at") for i in members if articles[i].get("published_at")]
    times.sort()
    start = times[0] if times else None
    end = times[-1] if times else None
    count = len(members)
    return {
        "label": label,
        "top_terms": top_terms,
        "article_indexes": members,
        "article_count": count,
        "start": start,
        "end": end,
        "intensity": _intensity(count, start, end),
    }


def _label(articles: list[dict], members: list[int], top_terms: list[str]) -> str:
    if len(members) == 1:
        title = (articles[members[0]].get("title") or "Untitled").strip()
        return title if len(title) < 78 else title[:75].rstrip() + "..."
    if len(members) == 2:
        # Prefer the more specific headline over a two-word mash.
        titles = sorted((articles[i].get("title") or "" for i in members), key=len, reverse=True)
        title = titles[0].strip()
        return title if len(title) < 78 else title[:75].rstrip() + "..."
    if top_terms:
        return " / ".join(term.replace("-", " ").title() for term in top_terms[:3])
    return "Related coverage"


def _intensity(count: int, start: str | None, end: str | None) -> float:
    if not start or not end or start == end:
        return float(count)
    try:
        a = datetime.fromisoformat(start.replace("Z", "+00:00"))
        b = datetime.fromisoformat(end.replace("Z", "+00:00"))
        hours = max((b - a).total_seconds() / 3600.0, 0.25)
        return round(count / hours, 4)
    except Exception:
        return float(count)
