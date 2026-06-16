# The Complete Beginner's Book: Downloading the Scroll of Taiwu Wiki for AI

> **Who this is for:** Someone who has never used a terminal, never written a line of code,
> and just wants the wiki on their computer so they can ask an AI about the game.
> No experience needed. Every term is explained. Every command is shown in full.

---

## Table of Contents

1. [The Big Picture — What are we actually doing?](#1-the-big-picture)
2. [The Terminal — Your new best friend](#2-the-terminal)
3. [Python — The engine that runs our script](#3-python)
4. [pip — The app store for Python](#4-pip)
5. [git — How we download the script](#5-git)
6. [Let's do it — Step by step](#6-lets-do-it)
7. [What just happened? Reading the output](#7-reading-the-output)
8. [Your files — What they look like and how to use them](#8-your-files)
9. [Using the wiki with an AI](#9-using-with-ai)
10. [The weekly refresh — Staying up to date](#10-weekly-refresh)
11. [When things go wrong — Troubleshooting](#11-troubleshooting)
12. [Glossary — Every term explained](#12-glossary)
13. [Where to learn more](#13-where-to-learn-more)

---

## 1. The Big Picture

### What are we actually doing?

Imagine the Scroll of Taiwu wiki is a library. Right now that library exists
only on the internet — thousands of separate web pages, each about one topic in
the game. To read page 3 you click a link. To read page 47 you click another.
You can't hand the whole library to an AI in one go because it would be like
trying to feed an elephant through a keyhole.

What our script does is walk into that library, photograph every single page,
and save those photographs on your computer — but instead of photos it saves
clean, readable text files. Once you have those files, you can hand one or
several to an AI and say "read this, now answer my question".

```
Internet wiki                  Your computer
─────────────                  ─────────────
📄 Combat page    ──scraper──► wiki_output/Gameplay/Combat.md
📄 Skills page    ──scraper──► wiki_output/Skills/Skills.md
📄 Bosses page    ──scraper──► wiki_output/Bosses/Bosses.md
       …                              …
```

### Why not just copy-paste from the website?

You could — for one page. But the Taiwu wiki has hundreds of pages. Manual
copy-paste would take days. Our script does it in under an hour, automatically,
and can refresh only the pages that changed since last time, which takes about
one minute.

### Why text files and not bookmarks?

- Bookmarks still require internet every time you use them.
- AI models cannot browse the internet for you (usually).
- Text files are instant, offline, and cost nothing to send to an AI.
- The files are formatted in a way AI reads better than raw web pages.

---

## 2. The Terminal

### What is a terminal?

The terminal (also called "command line", "shell", "console", or "command
prompt") is a text window where you type instructions directly to your computer.
Instead of clicking buttons in a graphical app, you type words.

It looks like this:

```
user@computer:~$  _
```

That blinking cursor is waiting for you to type a command.

### Why do we need it?

Our script is a Python program — a plain text file full of instructions. Python
programs don't have a graphical window with buttons. You run them by typing
a short command in the terminal. That's it.

### How to open a terminal

**Windows:**
Press `Win + R`, type `powershell`, press Enter.
Or: press `Win + S`, type `Windows PowerShell`, click it.

**macOS:**
Press `Cmd + Space`, type `Terminal`, press Enter.

**Linux:**
Press `Ctrl + Alt + T`. Or right-click your desktop and look for "Open Terminal".

### The three commands you must know

Before we do anything else, learn these three — they are the building blocks of
everything that follows.

**`pwd` — "where am I?"**
```bash
pwd
```
Prints the folder (directory) you are currently inside.
Example output: `/home/martin/bewerbradar-copilot`

**`ls` — "what's in here?"** (Mac/Linux) / **`dir`** (Windows)
```bash
ls        # Mac and Linux
dir       # Windows
```
Lists the files and folders inside your current location. Like opening a folder
in Explorer/Finder and seeing what's inside.

**`cd` — "go into this folder"**
```bash
cd my-folder-name
```
Moves you into a subfolder. `cd ..` goes one level back up.

> **Analogy:** think of your computer's file system as a building with floors and
> rooms. `pwd` tells you which room you're in. `ls` shows what's in the room.
> `cd` walks you to another room.

### Useful terminal habits

- Press **Tab** to auto-complete a file or folder name. Start typing `sc` and
  press Tab — the terminal fills in `scripts/` for you.
- Press **Up arrow** to repeat the last command you typed.
- If something goes wrong, press **Ctrl + C** to stop whatever is running.

---

## 3. Python

### What is Python?

Python is a programming language. A "programming language" is just a set of
rules for writing instructions that a computer can follow. Python is one of the
most beginner-friendly languages and is used everywhere — by NASA, Instagram,
and now by us to download a game wiki.

Our script (`taiwu_wiki_scraper.py`) is written in Python. The `.py` at the
end of the filename means "this is a Python file".

### Do I need to understand Python?

No. You only need to *run* it, not write it. Think of it like a microwave —
you don't need to understand the electronics to heat your food. You just press
Start.

### Check if Python is already installed

Open your terminal and type:
```bash
python3 --version
```

If you see something like `Python 3.11.4` — great, Python is installed.
If you see `command not found` — you need to install it (see next section).

> **Windows note:** on Windows, type `python --version` (no `3`).
> If it opens the Microsoft Store instead, that means Python isn't installed —
> do not install from the Store, use the official website instead.

### Install Python

Go to: **https://www.python.org/downloads**

Click the yellow Download button. Run the installer.

**Critical step on Windows:** when the installer opens, tick the box that says
**"Add Python to PATH"** *before* clicking Install. If you miss this, commands
won't work and you'll need to reinstall.

After installing, close and reopen your terminal, then run `python3 --version`
again to confirm.

---

## 4. pip

### What is pip?

`pip` is Python's package manager — think of it as the App Store, but for
Python code libraries. A "library" is a bundle of code someone else wrote that
we can use in our own script.

Our script needs four libraries:
- **requests** — for fetching web pages (like a browser, but in code)
- **beautifulsoup4** — for reading and understanding HTML (the language
  websites are written in)
- **lxml** — a fast HTML parser that beautifulsoup uses under the hood
- **markdownify** — converts HTML into clean Markdown text

### Install all four at once

```bash
pip3 install requests beautifulsoup4 lxml markdownify
```

> **Windows:** use `pip` instead of `pip3`:
> ```
> pip install requests beautifulsoup4 lxml markdownify
> ```

You'll see a lot of text scrolling by. That's pip downloading the libraries.
Wait for it to finish. The last line will say `Successfully installed …`.

You only ever need to do this once.

### What is Markdown?

Markdown is a way of writing text that looks clean in a plain text file but
also renders nicely if opened in certain apps. Our script saves every wiki page
as a Markdown file (`.md`).

Example of Markdown:

```
# Combat System          ← big heading (becomes H1)

## Basic Attacks         ← medium heading (becomes H2)

- Left click: light hit
- Right click: heavy hit  ← bullet list

**Stamina** drains with each attack.   ← bold text
```

AI models understand Markdown very well because most of their training data
used it. It's the ideal format for feeding text to an AI.

---

## 5. git

### What is git?

git is a tool for downloading, tracking, and sharing code. When developers
store their code online (for example on GitHub), others can download it with a
single `git clone` command.

Our script lives in a repository (a code project folder) on GitHub.
We'll use git to download that whole folder to your computer.

### Check if git is installed

```bash
git --version
```

Should print something like `git version 2.39.0`.

### Install git if needed

**Windows:** download from **https://git-scm.com/download/win** — run the
installer, click Next through everything, defaults are fine.

**macOS:** if git isn't installed, your Mac will prompt you to install the
Xcode Command Line Tools the first time you type a git command. Just click
Install when it asks.

**Linux:**
```bash
sudo apt install git
```

---

## 6. Let's Do It

Now that you understand the tools, let's actually run everything.
Open your terminal and follow along exactly.

---

### Step 6.1 — Download the project

```bash
git clone https://github.com/Liutasil501/bewerbradar-copilot.git
```

**What this does:** creates a folder called `bewerbradar-copilot` in whatever
directory you are currently in, and downloads all the project files into it.

You'll see output like:
```
Cloning into 'bewerbradar-copilot'...
remote: Enumerating objects: 347, done.
…
Resolving deltas: done.
```

That means it worked.

---

### Step 6.2 — Go into the project folder

```bash
cd bewerbradar-copilot
```

Now you're inside the project. Confirm with:
```bash
pwd
```
You should see something ending in `/bewerbradar-copilot`.

---

### Step 6.3 — Switch to the right branch

Our wiki scraper lives on a specific "branch" (a version of the project).
Think of branches like different shelves in the same bookcase.

```bash
git checkout claude/taiwu-wiki-scraper-dl0bf2
```

You should see: `Switched to branch 'claude/taiwu-wiki-scraper-dl0bf2'`

---

### Step 6.4 — Install the Python libraries

```bash
pip3 install requests beautifulsoup4 lxml markdownify
```

Wait for it to finish. One-time step.

---

### Step 6.5 — Confirm the wiki URL

Before running, you need to verify that the script points to the right website.

Open the file `scripts/taiwu_wiki_scraper.py` in any text editor
(Notepad on Windows, TextEdit on Mac, or any code editor like VS Code).

Find the line that says:
```python
WIKI_BASE = "https://scrolloftaiwu.fandom.com"
```

Open that URL in your browser. If you land on the Taiwu wiki — perfect, leave
it as is. If you get a 404 or the wrong wiki, try:
- `https://taiwu.fandom.com`

Update the line in the script to match whichever URL works, then save the file.

---

### Step 6.6 — Run the scraper (first time)

```bash
python3 scripts/taiwu_wiki_scraper.py
```

This downloads every single wiki page. Go make a coffee. Depending on the
size of the wiki, it takes 15–90 minutes.

---

## 7. Reading the Output

While the script runs, you'll see lines like this:

```
Wiki: https://scrolloftaiwu.fandom.com
API:  https://scrolloftaiwu.fandom.com/api.php
Out:  /home/martin/bewerbradar-copilot/wiki_output

Fetching full page list …
Found 842 page(s)

  [1/842] Combat System … saved → wiki_output/Gameplay/Combat System.md
  [2/842] Cultivation … saved → wiki_output/Skills/Cultivation.md
  [3/842] Ancient Zhang … up-to-date
  [4/842] Bosses … saved → wiki_output/Enemies/Bosses.md
  …
Full scrape: 839 saved, 3 up-to-date, 0 errors
```

| What you see | What it means |
|---|---|
| `[1/842]` | Currently processing page 1 out of 842 total |
| `saved →` | Page was downloaded and saved as a new file |
| `up-to-date` | This page already existed locally and hasn't changed on the wiki |
| `ERROR: …` | Something went wrong for this page (see Troubleshooting) |
| `Full scrape: 839 saved` | Summary when done — 839 files written |

When it finishes you'll see:
```
  [index] wrote wiki_output/INDEX.md

Done.
```

---

## 8. Your Files

### Where are they?

After the script finishes, open your file manager (Explorer on Windows, Finder
on Mac) and navigate to the `bewerbradar-copilot` folder. Inside it you'll
find a new folder called `wiki_output`.

```
bewerbradar-copilot/
└── wiki_output/
    ├── INDEX.md                      ← start here
    ├── Gameplay/
    │   ├── Combat System.md
    │   ├── Movement.md
    │   └── …
    ├── Skills/
    │   ├── Cultivation.md
    │   ├── Inner Arts.md
    │   └── …
    ├── Characters/
    │   └── …
    └── Uncategorised/
        └── …
```

### What's inside each file?

Open any `.md` file. It will look like this:

```
---
title: "Combat System"
url: https://scrolloftaiwu.fandom.com/wiki/Combat_System
last_modified: 2025-03-10T14:22:00Z
categories: ["Gameplay"]
---

# Combat System

## Overview

Combat in Scroll of Taiwu is turn-based…

## Basic Attacks

- Light attack: costs 10 stamina
- Heavy attack: costs 25 stamina

## Stances

| Stance | Bonus | Weakness |
|--------|-------|----------|
| Tiger  | +20% damage | -15% dodge |
…
```

The `---` block at the top is called **frontmatter** — it's just metadata
(information about the file) that the script uses to track whether a page
needs updating. You don't need to touch it.

Everything below the second `---` is the actual wiki content — clean, readable,
no HTML, no ads, no navigation bars.

### What is INDEX.md?

`INDEX.md` is a table of contents for your entire local wiki. It lists every
saved page, which category it belongs to, and links to both the local file and
the original wiki page. Open it first whenever you need to find something.

---

## 9. Using the Wiki with an AI

Now the fun part. Here are three ways to use your files.

---

### Method A — Quick single-page answer

Best for: "I just want to know about one specific thing."

1. Open `wiki_output/INDEX.md`
2. Find the topic you want, e.g. "Inner Arts"
3. Open `wiki_output/Skills/Inner Arts.md`
4. Press `Ctrl + A` to select all, `Ctrl + C` to copy
5. Go to your AI chat (Claude, ChatGPT, etc.)
6. Paste the text and then type your question:

> [paste the file content here]
>
> Based on this wiki page, how do I level up Inner Arts quickly?

---

### Method B — Let the AI pick its sources

Best for: "I have a complex question that might span multiple topics."

1. Open and copy `INDEX.md`
2. Paste it into the AI chat and say:

> This is an index of a Scroll of Taiwu wiki I have saved on my computer.
> I will paste individual pages when you ask for them.
> My question is: what's the best early-game strategy to survive the first winter?
> Which pages do you need me to give you?

3. The AI will tell you which pages to paste. Paste them one by one.

This is the cheapest method because you only send the AI what it actually needs.

---

### Method C — Full context (for many questions)

Best for: "I want to have a long conversation about the game."

Some AI tools (like Claude) let you attach files directly.
Upload multiple `.md` files from your `wiki_output` folder,
or combine several into one paste.

> **Tip:** Don't paste the entire wiki at once — that's hundreds of thousands of
> words and will hit the AI's context limit. Send 3–10 pages at a time based on
> your topic.

---

## 10. The Weekly Refresh

The wiki gets updated by players. New strategies, corrected numbers, new
content patches. Our script tracks this automatically.

### How it works

Every `.md` file has a `last_modified` timestamp in its frontmatter:
```
last_modified: 2025-03-10T14:22:00Z
```

When you run `--refresh`, the script asks the wiki:
"Which pages were edited in the last 7 days?"

The wiki replies with a list. The script then compares the wiki's timestamp
against your local file. If they match → skip (already up to date). If they
differ → download the new version.

### How to run a refresh

```bash
python3 scripts/taiwu_wiki_scraper.py --refresh
```

This usually finishes in under a minute. You'll see:
```
Fetching pages changed in the last 7 days …
Found 12 changed page(s)

  [1/12] Combat System … saved → wiki_output/Gameplay/Combat System.md
  [2/12] Patch Notes … saved → wiki_output/News/Patch Notes.md
  …
Refresh: 12 saved, 0 up-to-date, 0 errors
```

### Automating it so you never have to think about it

**macOS / Linux — cron (runs automatically on a schedule):**

Open the cron editor by typing this in your terminal:
```bash
crontab -e
```

This opens a text editor. Add the following line at the bottom.
Replace `/your/actual/path` with the output of `pwd` when you're inside
the project folder:

```
0 9 * * 1 cd /your/actual/path && python3 scripts/taiwu_wiki_scraper.py --refresh >> /tmp/taiwu_refresh.log 2>&1
```

Save and exit (`Ctrl + X`, then `Y`, then Enter in the nano editor).

What this means, broken down:

| Part | Meaning |
|---|---|
| `0 9 * * 1` | Run at 9:00 AM every Monday |
| `cd /your/actual/path` | Go into the project folder first |
| `python3 scripts/taiwu_wiki_scraper.py --refresh` | Run the refresh |
| `>> /tmp/taiwu_refresh.log 2>&1` | Save any output/errors to a log file |

To check if it ran: `cat /tmp/taiwu_refresh.log`

---

**Windows — Task Scheduler:**

1. Press `Win + S`, search **Task Scheduler**, open it
2. Click **Create Basic Task…** in the right panel
3. **Name:** `Taiwu Wiki Refresh` → Next
4. **Trigger:** Weekly, pick Monday, set time to 9:00 AM → Next
5. **Action:** Start a program → Next
   - **Program/script:** type `python`
   - **Arguments:** `scripts\taiwu_wiki_scraper.py --refresh`
   - **Start in:** paste the full path to your project folder
     (find it with `cd` to the folder then type `cd` on its own in PowerShell)
6. Click Finish

Now every Monday morning your wiki updates itself while you sleep.

---

## 11. Troubleshooting

### "python3: command not found"

Python isn't installed, or wasn't added to PATH.
- Re-read Section 3 and reinstall Python.
- On Windows: make sure you ticked "Add Python to PATH" during install.
- Try `python` (without the `3`) on Windows.

### "pip3: command not found"

Try one of these alternatives:
```bash
pip install requests beautifulsoup4 lxml markdownify
python3 -m pip install requests beautifulsoup4 lxml markdownify
```

### "ModuleNotFoundError: No module named 'bs4'"

The library install didn't work or used a different Python version.
Run this instead:
```bash
python3 -m pip install requests beautifulsoup4 lxml markdownify
```

### Script runs but saves 0 pages

The wiki URL is wrong. Go back to Step 6.5 and verify `WIKI_BASE`.

### "403 Forbidden"

The wiki is blocking the script because it looks like a bot.
Open `scripts/taiwu_wiki_scraper.py` and find:
```python
REQUEST_DELAY = 0.5
```
Change it to:
```python
REQUEST_DELAY = 2
```
Save and try again. More delay makes the script look less like a bot.

### "ConnectionError" or "Timeout"

Check your internet connection. If it's fine, the wiki might be temporarily
down — wait 10 minutes and try again.

### Terminal closes immediately (Windows)

Don't double-click the `.py` file. Always run it from inside PowerShell:
```
python scripts\taiwu_wiki_scraper.py
```

### "git: command not found"

Install git (Section 5) and restart your terminal.

---

## 12. Glossary

| Term | Plain English explanation |
|------|--------------------------|
| **Terminal / Command Line** | A text window where you type instructions to your computer. No clicking required. |
| **Command** | A line of text you type in the terminal that makes the computer do something. |
| **Directory / Folder** | Same thing. A container for files. Called "directory" in terminal-speak. |
| **`cd`** | "Change Directory" — moves you into a different folder in the terminal. |
| **`ls` / `dir`** | Lists the files in your current folder. |
| **`pwd`** | "Print Working Directory" — shows which folder you are currently in. |
| **Python** | A programming language. Easy to read, widely used. Our script is written in it. |
| **`.py` file** | A Python script file. A text file full of Python instructions. |
| **pip** | Python's package installer. Downloads and installs libraries. |
| **Library / Package** | Code someone else wrote that we borrow and use in our script. |
| **requests** | A Python library for fetching web pages from the internet. |
| **BeautifulSoup** | A Python library for reading and parsing HTML (website code). |
| **HTML** | The language websites are written in. Full of tags like `<div>`, `<p>`, etc. |
| **Markdown** | A plain-text format using symbols like `#` for headings and `-` for lists. AI-friendly. |
| **`.md` file** | A Markdown text file. |
| **Frontmatter** | The `---` block at the top of `.md` files containing metadata like title and date. |
| **git** | A tool for downloading and tracking code projects. |
| **Repository ("repo")** | A project stored with git — a folder + its full history. |
| **`git clone`** | Downloads a repository from the internet to your computer. |
| **Branch** | A version of a project. Like a parallel copy with different changes in it. |
| **`git checkout`** | Switches to a different branch. |
| **API** | "Application Programming Interface" — a way for programs to talk to each other. The wiki has an API that lets our script ask for page content directly, without loading the full webpage. |
| **MediaWiki** | The software that powers Wikipedia, Fandom, and most wikis. Has a powerful API. |
| **Scraper** | A program that automatically reads websites and extracts text. |
| **cron** | A scheduler built into Mac/Linux that runs commands automatically at set times. |
| **Context window** | The maximum amount of text an AI can read at once. Sending too much at once fails. |
| **PATH** | A list of folders your computer searches when you type a command. If Python isn't in PATH, typing `python3` gives "command not found" even if Python is installed. |

---

## 13. Where to Learn More

These are free, beginner-friendly resources if you want to understand any of
this more deeply.

### The Terminal
- **"The Command Line Crash Course"** — https://learnpythonthehardway.org/book/appendixa.html
  Free, practical, explains everything from scratch.
- **explainshell.com** — paste any terminal command and it explains every word.

### Python
- **"Automate the Boring Stuff with Python"** — https://automatetheboringstuff.com
  Free online book. Chapter 1–4 covers everything you need.
  Written for people with zero experience.
- **Python.org beginner's guide** — https://wiki.python.org/moin/BeginnersGuide

### git
- **"git - the simple guide"** — https://rogerdudler.github.io/git-guide/
  One page, no fluff, covers exactly what you need.
- **GitHub's own guide** — https://docs.github.com/en/get-started/quickstart/hello-world

### Markdown
- **"Markdown Guide"** — https://www.markdownguide.org/getting-started/
  10-minute read. Everything about Markdown explained with examples.

### How wikis work (MediaWiki API)
- **MediaWiki API docs** — https://www.mediawiki.org/wiki/API:Main_page
  Useful if you ever want to customise what the script downloads.

### AI context / prompting
- **"Prompt engineering guide"** — https://www.promptingguide.ai
  Teaches you how to phrase questions so AI gives better answers.

---

## Quick Reference Card

Cut this out (figuratively) and keep it handy.

```
# First time setup
git clone https://github.com/Liutasil501/bewerbradar-copilot.git
cd bewerbradar-copilot
git checkout claude/taiwu-wiki-scraper-dl0bf2
pip3 install requests beautifulsoup4 lxml markdownify

# Full download (do once, takes 15–90 min)
python3 scripts/taiwu_wiki_scraper.py

# Weekly update (fast, ~1 min)
python3 scripts/taiwu_wiki_scraper.py --refresh

# Download one specific page
python3 scripts/taiwu_wiki_scraper.py --page "Page Title Here"

# If something goes wrong
python3 --version          ← check Python is installed
pip3 list                  ← check libraries are installed
pwd                        ← check you're in the right folder
```
