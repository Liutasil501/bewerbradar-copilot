#!/usr/bin/env python3
"""
taiwu_wiki_scraper.py
---------------------
Scrapes the Scroll of Taiwu wiki and saves every page as clean Markdown,
optimised for use as AI context (compact, no HTML noise, flat structure).

Usage:
  python3 taiwu_wiki_scraper.py             # full scrape (first run)
  python3 taiwu_wiki_scraper.py --refresh   # only pages changed in last 7 days
  python3 taiwu_wiki_scraper.py --page "Combat"  # single page by title

Requirements:
  pip install requests beautifulsoup4 lxml markdownify

Output:
  wiki_output/
    INDEX.md          <- master list with summaries
    <Category>/
      <PageTitle>.md  <- one file per wiki page

Each .md file has a YAML frontmatter block:
  ---
  title: Page Title
  url: https://...
  last_modified: 2025-01-15T12:00:00Z
  categories: [Category1, Category2]
  ---
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import quote, urljoin

import requests
from bs4 import BeautifulSoup
from markdownify import markdownify as md

# ---------------------------------------------------------------------------
# CONFIG — change these to match the actual wiki
# ---------------------------------------------------------------------------

# Fandom/MediaWiki base URL (no trailing slash).
# Common candidates for Scroll of Taiwu:
#   https://scrolloftaiwu.fandom.com
#   https://taiwu.fandom.com
WIKI_BASE = "https://scrolloftaiwu.fandom.com"

# MediaWiki API endpoint (usually <base>/api.php for Fandom, /w/api.php for others)
API_URL = f"{WIKI_BASE}/api.php"

# Where to save output
OUTPUT_DIR = Path("wiki_output")

# Seconds to wait between API requests (be polite to the server)
REQUEST_DELAY = 0.5

# How many days back to consider "recent" in --refresh mode
REFRESH_DAYS = 7

# Namespaces to scrape (0 = main/article pages; expand as needed)
NAMESPACES = [0]

# HTML elements to strip before Markdown conversion (navigation noise)
STRIP_SELECTORS = [
    ".page-header__categories",
    ".portable-infobox",      # keep infobox text but strip table chrome? change to remove if too noisy
    ".toc",                   # table of contents (redundant in flat MD)
    "aside",
    ".WikiaArticleFooter",
    ".page-footer",
    "#toc",
    ".mw-editsection",        # [edit] links
    "[data-nosnippet]",
    "script",
    "style",
    ".printfooter",
    ".catlinks",
    ".navbox",
    "sup.reference",          # citation superscripts
]

# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": "TaiwuWikiScraper/1.0 (educational AI context builder; contact via GitHub)"
})


def api_get(params: dict, retries: int = 4) -> dict:
    """GET the MediaWiki API with retry + exponential back-off."""
    params.setdefault("format", "json")
    params.setdefault("formatversion", "2")
    delay = 2
    for attempt in range(retries):
        try:
            resp = SESSION.get(API_URL, params=params, timeout=20)
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException as exc:
            if attempt == retries - 1:
                raise
            print(f"  [warn] request failed ({exc}), retrying in {delay}s …")
            time.sleep(delay)
            delay *= 2
    return {}


# ---------------------------------------------------------------------------
# Page discovery
# ---------------------------------------------------------------------------

def all_page_titles(namespaces: list[int] = NAMESPACES) -> list[str]:
    """Return every page title via MediaWiki's allpages API (handles continuation)."""
    titles = []
    for ns in namespaces:
        params = {
            "action": "query",
            "list": "allpages",
            "apnamespace": ns,
            "aplimit": "500",
        }
        while True:
            data = api_get(params)
            pages = data.get("query", {}).get("allpages", [])
            titles.extend(p["title"] for p in pages)
            cont = data.get("continue", {})
            if not cont:
                break
            params.update(cont)
            time.sleep(REQUEST_DELAY)
    return titles


def recently_changed_titles(days: int = REFRESH_DAYS) -> list[str]:
    """Return titles changed within the last `days` days via recentchanges API."""
    since = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%SZ")
    params = {
        "action": "query",
        "list": "recentchanges",
        "rcend": since,
        "rcnamespace": "|".join(str(n) for n in NAMESPACES),
        "rcprop": "title|timestamp",
        "rclimit": "500",
        "rctype": "edit|new",
    }
    seen: set[str] = set()
    while True:
        data = api_get(params)
        changes = data.get("query", {}).get("recentchanges", [])
        for c in changes:
            seen.add(c["title"])
        cont = data.get("continue", {})
        if not cont:
            break
        params.update(cont)
        time.sleep(REQUEST_DELAY)
    return list(seen)


# ---------------------------------------------------------------------------
# Page fetching + conversion
# ---------------------------------------------------------------------------

def fetch_page_data(title: str) -> dict | None:
    """
    Fetch parsed HTML + metadata for a single page via the MediaWiki parse API.
    Returns a dict with keys: title, url, last_modified, categories, html.
    """
    # Step 1: get parsed HTML
    parse_data = api_get({
        "action": "parse",
        "page": title,
        "prop": "text|categories|revid",
        "disableeditsection": "1",
        "disabletoc": "1",
    })
    if "error" in parse_data:
        print(f"  [skip] {title}: {parse_data['error'].get('info','unknown error')}")
        return None
    parsed = parse_data.get("parse", {})

    # Step 2: get last-modified timestamp
    rev_data = api_get({
        "action": "query",
        "titles": title,
        "prop": "revisions",
        "rvprop": "timestamp",
        "rvlimit": "1",
    })
    pages = rev_data.get("query", {}).get("pages", [])
    last_modified = ""
    if pages:
        revs = pages[0].get("revisions", [])
        if revs:
            last_modified = revs[0].get("timestamp", "")

    categories = [c["category"] for c in parsed.get("categories", [])]
    html = parsed.get("text", "")
    url = f"{WIKI_BASE}/wiki/{quote(title.replace(' ', '_'))}"

    return {
        "title": title,
        "url": url,
        "last_modified": last_modified,
        "categories": categories,
        "html": html,
    }


def html_to_markdown(html: str, page_url: str) -> str:
    """Strip wiki chrome from HTML and convert to clean Markdown."""
    soup = BeautifulSoup(html, "lxml")

    # Remove noise elements
    for sel in STRIP_SELECTORS:
        for el in soup.select(sel):
            el.decompose()

    # Make relative links absolute so AI has context
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.startswith("/"):
            a["href"] = urljoin(WIKI_BASE, href)

    # Remove empty tags that clutter MD output
    for tag in soup.find_all(["span", "div"]):
        if not tag.get_text(strip=True):
            tag.decompose()

    cleaned_html = str(soup)

    text = md(
        cleaned_html,
        heading_style="ATX",         # # H1, ## H2, …
        bullets="-",
        strip=["img"],               # skip images (binary, not useful as text)
        convert=["a", "b", "strong", "i", "em", "h1", "h2", "h3",
                 "h4", "h5", "h6", "p", "ul", "ol", "li", "br",
                 "table", "thead", "tbody", "tr", "th", "td",
                 "code", "pre", "blockquote", "hr"],
    )

    # Post-process: collapse 3+ blank lines to 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Remove spurious leading/trailing whitespace on each line
    text = "\n".join(line.rstrip() for line in text.splitlines())
    return text.strip()


def build_frontmatter(page: dict) -> str:
    cats = json.dumps(page["categories"])
    return (
        f"---\n"
        f"title: {json.dumps(page['title'])}\n"
        f"url: {page['url']}\n"
        f"last_modified: {page['last_modified']}\n"
        f"categories: {cats}\n"
        f"---\n\n"
    )


# ---------------------------------------------------------------------------
# File I/O
# ---------------------------------------------------------------------------

def safe_filename(title: str) -> str:
    """Convert a wiki page title to a safe filename."""
    return re.sub(r'[<>:"/\\|?*]', "_", title).strip()


def category_dir(categories: list[str]) -> Path:
    """Pick the first meaningful category as the subfolder name."""
    ignored = {"stub", "articles", "pages", "candidates for deletion"}
    for cat in categories:
        if cat.lower() not in ignored:
            return OUTPUT_DIR / safe_filename(cat)
    return OUTPUT_DIR / "Uncategorised"


def save_page(page: dict, markdown: str) -> Path:
    folder = category_dir(page["categories"])
    folder.mkdir(parents=True, exist_ok=True)
    filepath = folder / f"{safe_filename(page['title'])}.md"
    content = build_frontmatter(page) + f"# {page['title']}\n\n{markdown}"
    filepath.write_text(content, encoding="utf-8")
    return filepath


def needs_update(page: dict) -> bool:
    """Return True if the local file is missing or older than wiki's last_modified."""
    folder = category_dir(page["categories"])
    filepath = folder / f"{safe_filename(page['title'])}.md"
    if not filepath.exists():
        return True
    try:
        # Read frontmatter last_modified from existing file
        text = filepath.read_text(encoding="utf-8")
        m = re.search(r"^last_modified:\s*(.+)$", text, re.MULTILINE)
        if not m:
            return True
        local_ts = m.group(1).strip()
        return local_ts != page["last_modified"]
    except Exception:
        return True


# ---------------------------------------------------------------------------
# Index generation
# ---------------------------------------------------------------------------

def build_index(output_dir: Path) -> None:
    """Regenerate INDEX.md from all saved .md files."""
    index_lines = [
        "# Scroll of Taiwu — Wiki Index",
        f"\n_Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}_\n",
        "---\n",
    ]
    by_cat: dict[str, list[str]] = {}

    for md_file in sorted(output_dir.rglob("*.md")):
        if md_file.name == "INDEX.md":
            continue
        text = md_file.read_text(encoding="utf-8")
        m_title = re.search(r'^title:\s*"(.+)"', text, re.MULTILINE)
        m_url = re.search(r"^url:\s*(\S+)", text, re.MULTILINE)
        title = m_title.group(1) if m_title else md_file.stem
        url = m_url.group(1) if m_url else ""
        rel_path = md_file.relative_to(output_dir)
        cat = rel_path.parts[0] if len(rel_path.parts) > 1 else "Uncategorised"
        by_cat.setdefault(cat, []).append(f"- [{title}]({rel_path}) — [wiki]({url})")

    for cat in sorted(by_cat):
        index_lines.append(f"\n## {cat}\n")
        index_lines.extend(sorted(by_cat[cat]))

    (output_dir / "INDEX.md").write_text("\n".join(index_lines), encoding="utf-8")
    print(f"  [index] wrote {output_dir / 'INDEX.md'}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def scrape_titles(titles: list[str], label: str) -> None:
    total = len(titles)
    saved = skipped = errors = 0

    for i, title in enumerate(titles, 1):
        print(f"  [{i}/{total}] {title}", end=" … ", flush=True)
        try:
            page = fetch_page_data(title)
            if page is None:
                errors += 1
                continue

            # In refresh mode skip unchanged pages even if they appear in recentchanges
            if not needs_update(page):
                print("up-to-date")
                skipped += 1
                time.sleep(REQUEST_DELAY)
                continue

            markdown = html_to_markdown(page["html"], page["url"])
            path = save_page(page, markdown)
            print(f"saved → {path.relative_to(OUTPUT_DIR.parent)}")
            saved += 1
        except Exception as exc:
            print(f"ERROR: {exc}")
            errors += 1
        time.sleep(REQUEST_DELAY)

    print(f"\n{label}: {saved} saved, {skipped} up-to-date, {errors} errors")


def main() -> None:
    parser = argparse.ArgumentParser(description="Scroll of Taiwu wiki → Markdown")
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--refresh", action="store_true",
                      help=f"Only update pages changed in the last {REFRESH_DAYS} days")
    mode.add_argument("--page", metavar="TITLE",
                      help="Fetch a single page by exact title")
    parser.add_argument("--days", type=int, default=REFRESH_DAYS,
                        help="Days to look back in --refresh mode (default: 7)")
    parser.add_argument("--output", default=str(OUTPUT_DIR),
                        help="Output directory (default: wiki_output)")
    args = parser.parse_args()

    global OUTPUT_DIR, REFRESH_DAYS
    OUTPUT_DIR = Path(args.output)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    REFRESH_DAYS = args.days

    print(f"Wiki: {WIKI_BASE}")
    print(f"API:  {API_URL}")
    print(f"Out:  {OUTPUT_DIR.resolve()}\n")

    if args.page:
        titles = [args.page]
        label = "Single page"
    elif args.refresh:
        print(f"Fetching pages changed in the last {REFRESH_DAYS} days …")
        titles = recently_changed_titles(REFRESH_DAYS)
        print(f"Found {len(titles)} changed page(s)\n")
        label = "Refresh"
    else:
        print("Fetching full page list …")
        titles = all_page_titles()
        print(f"Found {len(titles)} page(s)\n")
        label = "Full scrape"

    if not titles:
        print("Nothing to do.")
        return

    scrape_titles(titles, label)
    build_index(OUTPUT_DIR)
    print("\nDone.")


if __name__ == "__main__":
    main()
