# Scroll of Taiwu — Wiki Scraper: Setup Guide for Beginners

This guide walks you through downloading the entire Scroll of Taiwu wiki to
your computer as readable text files, so an AI can answer your questions about
the game based on the real wiki content.

---

## What you need before starting

| Tool | Why | Do you already have it? |
|------|-----|------------------------|
| **Python 3.10+** | Runs the script | Check: open a terminal and type `python3 --version` |
| **git** | To download this project | Check: `git --version` |
| **Internet connection** | To reach the wiki | — |

---

## Step 1 — Install Python (skip if already installed)

### Windows
1. Go to [python.org/downloads](https://www.python.org/downloads/)
2. Click the big yellow **Download Python 3.x.x** button
3. Run the installer — **tick "Add Python to PATH"** before clicking Install
4. Restart your terminal after installing

### macOS
Open **Terminal** (press `Cmd + Space`, type `Terminal`, press Enter):
```bash
brew install python3
```
If you don't have Homebrew yet, first run:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Linux (Debian / Ubuntu)
```bash
sudo apt update && sudo apt install -y python3 python3-pip
```

**Verify it worked:**
```bash
python3 --version
# Should print: Python 3.10.x  (or higher)
```

---

## Step 2 — Get the project files

Open a terminal and run these commands one by one:

```bash
# Download the project to your computer
git clone https://github.com/Liutasil501/bewerbradar-copilot.git

# Go into the project folder
cd bewerbradar-copilot

# Switch to the branch that has the scraper
git checkout claude/taiwu-wiki-scraper-dl0bf2
```

---

## Step 3 — Install the required Python libraries

Still inside the `bewerbradar-copilot` folder:

```bash
pip3 install requests beautifulsoup4 lxml markdownify
```

> **Windows note:** use `pip` instead of `pip3` if `pip3` says "not found":
> ```
> pip install requests beautifulsoup4 lxml markdownify
> ```

You should see lines ending with `Successfully installed …`. That's it.

---

## Step 4 — Set the correct wiki URL

Open the script file in any text editor (Notepad, TextEdit, VS Code, …):

```
scripts/taiwu_wiki_scraper.py
```

Find this line near the top (around line 40):

```python
WIKI_BASE = "https://scrolloftaiwu.fandom.com"
```

**You need to confirm this URL is correct.** Open your browser and try:

- `https://scrolloftaiwu.fandom.com` — if the Taiwu wiki loads here, you're done
- If that's a 404, try `https://taiwu.fandom.com`

Once you find the right one, update the line in the script to match, then save
the file.

---

## Step 5 — Run the scraper

Make sure you are in the `bewerbradar-copilot` folder in your terminal, then:

### First-time full download (downloads everything)
```bash
python3 scripts/taiwu_wiki_scraper.py
```
This can take **10–60 minutes** depending on how large the wiki is.
You'll see lines like:
```
[1/842] Combat System … saved → wiki_output/Gameplay/Combat System.md
[2/842] Cultivation … saved → wiki_output/Skills/Cultivation.md
…
```

### Weekly refresh (only download what changed in the last 7 days)
```bash
python3 scripts/taiwu_wiki_scraper.py --refresh
```
This is fast — usually done in under a minute.

### Download a single page (for testing)
```bash
python3 scripts/taiwu_wiki_scraper.py --page "Combat"
```
Replace `Combat` with the exact page title from the wiki URL
(e.g. for `…/wiki/Inner_Cultivation` use `"Inner Cultivation"`).

### Custom number of days for refresh
```bash
# Only pages changed in the last 3 days
python3 scripts/taiwu_wiki_scraper.py --refresh --days 3

# Last 14 days
python3 scripts/taiwu_wiki_scraper.py --refresh --days 14
```

---

## Step 6 — Where are the files?

After the script finishes, look inside:

```
bewerbradar-copilot/
└── wiki_output/
    ├── INDEX.md              ← master list of ALL pages
    ├── Gameplay/
    │   ├── Combat System.md
    │   └── Cultivation.md
    ├── Characters/
    │   └── …
    └── …
```

Each `.md` file looks like this at the top:

```
---
title: "Combat System"
url: https://scrolloftaiwu.fandom.com/wiki/Combat_System
last_modified: 2025-03-10T14:22:00Z
categories: ["Gameplay"]
---

# Combat System

## Overview
…
```

The `---` block is metadata the script uses to track what needs updating.
The rest is clean text you can paste straight into an AI chat.

---

## Step 7 — Use it with an AI (cheapest method)

**Option A — Paste a single page**

1. Open `wiki_output/INDEX.md` in any text editor
2. Find the topic you want, e.g. `Inner Cultivation`
3. Open that file, copy everything, paste into your AI chat
4. Ask your question

**Option B — Let the AI navigate the index**

Paste `INDEX.md` into the AI chat first and say:

> "This is the index of the Scroll of Taiwu wiki I have saved locally.
>  Based on my question, tell me which pages I should give you."

Then paste only the pages the AI asks for. This keeps costs low.

---

## Step 8 — Schedule a weekly auto-refresh (optional)

### macOS / Linux (cron)

Open the cron editor:
```bash
crontab -e
```
Add this line (runs every Monday at 06:00):
```
0 6 * * 1 cd /full/path/to/bewerbradar-copilot && python3 scripts/taiwu_wiki_scraper.py --refresh >> /tmp/taiwu_refresh.log 2>&1
```
Replace `/full/path/to/bewerbradar-copilot` with the actual path.
To find it, run `pwd` inside the project folder.

### Windows (Task Scheduler)

1. Press `Win + S`, search for **Task Scheduler**, open it
2. Click **Create Basic Task…**
3. Name it `Taiwu Wiki Refresh`
4. Trigger: **Weekly**, pick a day and time
5. Action: **Start a program**
   - Program: `python`
   - Arguments: `scripts\taiwu_wiki_scraper.py --refresh`
   - Start in: `C:\full\path\to\bewerbradar-copilot`
6. Finish

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `python3: command not found` | Install Python (Step 1) or use `python` instead of `python3` on Windows |
| `pip3: command not found` | Use `pip` or `python3 -m pip install …` |
| `ModuleNotFoundError: No module named 'bs4'` | Run the `pip3 install …` command from Step 3 again |
| Script runs but saves 0 pages | The `WIKI_BASE` URL is wrong — check Step 4 |
| `403 Forbidden` from the wiki | The wiki blocks automated access; try adding a longer delay: open the script and change `REQUEST_DELAY = 0.5` to `REQUEST_DELAY = 2` |
| Terminal closes immediately (Windows) | Run it from inside a terminal window, not by double-clicking the file |

---

## Glossary (terms used in this guide)

| Term | What it means |
|------|---------------|
| **Terminal** | The text-based window where you type commands (called "Command Prompt" or "PowerShell" on Windows, "Terminal" on Mac/Linux) |
| **`cd`** | "Change Directory" — moves you into a folder |
| **`pip`** | Python's package installer — downloads and installs libraries |
| **Markdown (`.md`)** | A plain-text format that uses `#` for headings and `-` for lists. Very readable as raw text and understood by all AI models |
| **YAML frontmatter** | The `--- … ---` block at the top of each file that stores metadata |
| **`--refresh` flag** | An option you add to the command that switches the script into "only download changes" mode |
| **cron** | A built-in scheduler on Mac/Linux that runs commands automatically at set times |
