# Scraper (Python)

Part 1 of News Pulse. Stdlib only.

```bash
cd scraper
python3 pipeline.py --out data/latest.json
```

`--merge data/latest.json` reuses previous articles so the same URL is not treated as new work.

## Feeds
- BBC News `https://feeds.bbci.co.uk/news/rss.xml`
- NPR `https://feeds.npr.org/1001/rss.xml`
- The Guardian `https://www.theguardian.com/world/rss`
- Al Jazeera `https://www.aljazeera.com/xml/rss/all.xml`

## Clustering
TF-IDF cosine on headline (3x) + summary. Merge if cosine >= 0.48 or two rare title tokens are shared. Full body is extracted for reading, not for grouping.

Limitation: single-link clustering can still chain on a repeated proper noun, and extracted HTML is too noisy to use as the vector.
