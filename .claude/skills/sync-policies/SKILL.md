---
name: sync-policies
description: Sync RHAM policy tiddlers with the live website. Fetches the current policy list, diffs it against the last snapshot, downloads changed PDFs, converts them to tiddlers, and removes tiddlers for deleted policies.
---

# Sync RHAM Policies with Live Website

This skill fetches the current RHAM policy list, identifies what has changed since the last snapshot, converts any new or modified policies to tiddlers, and removes tiddlers for deleted policies.

All scripts live in `.claude/policy-sync/`. Run all commands from the repo root.

---

## Step 1: Fetch the current policy list

```bash
node .claude/policy-sync/fetch_latest.mjs
```

This uses Playwright to scrape the RHAM website and saves a dated JSON snapshot to `RawData/Policies_YYYY-MM-DD.json`. It prints `OUTPUT_FILE:<path>` on its last line.

If Playwright fails (network error, site structure changed), stop and report the error. Do not proceed.

---

## Step 2: Diff against the baseline

```bash
python .claude/policy-sync/diff_policies.py
```

This auto-finds the two most recent `RawData/Policies_*.json` files and diffs them. It saves a report to `RawData/diff_report_YYYY-MM-DD.json` and prints `OUTPUT_FILE:<path>`.

**Exit codes:**
- `0` = no changes found (nothing to do — report this and stop)
- `1` = changes exist (continue to steps below)

Parse the output to identify:
- **ADDED** policies: new numbers that didn't exist before
- **DELETED** policies: numbers that no longer appear on the site
- **MODIFIED** policies: same number, but PDF URL changed (= PDF was replaced)

Name-only changes (URL same) do NOT require re-conversion — just note them.

---

## Step 3: Handle DELETED policies

For each deleted policy, remove its tiddler files:

```bash
python .claude/policy-sync/cleanup_tiddlers.py <policy_number>
```

Example: `python .claude/policy-sync/cleanup_tiddlers.py 9314`

This removes all `tiddlers/Policy{NUMBER}*.tid` files. Confirm how many files were removed for each policy.

---

## Step 4: Handle ADDED and MODIFIED policies

For each added or modified policy, follow this sub-process:

### 4a. Download the PDF

```bash
python .claude/policy-sync/download_pdf.py "<url>" "pdfs/<number> - <name>.pdf"
```

Use the URL from the diff report. Build the filename as `<number> - <name>.pdf` (same convention as existing files in `pdfs/`).

### 4b. Check for existing skeleton tiddler (added policies only)

For ADDED policies, check if `tiddlers/Policy<NUMBER>.tid` exists. If not, create a minimal skeleton:

```
caption: <NUMBER> - <Name>
created: <timestamp>
description: <Name>
modified: <timestamp>
pdf-url: <url>
policy-nbr: <NUMBER>
display-style: plain
tags: Policy
title: Policy<NUMBER>
type: text/vnd.tiddlywiki

```

For MODIFIED policies, the skeleton already exists — read it to get the existing `pdf-url` and `policy-nbr`, then remove all existing tiddler files for that policy number before re-converting:

```bash
python .claude/policy-sync/cleanup_tiddlers.py <policy_number>
```

### 4c. Convert the PDF to tiddlers

Follow the full `convert-policy` skill instructions for this policy number. Read the downloaded PDF using:

```python
import fitz
doc = fitz.open('pdfs/<filename>.pdf')
for i, page in enumerate(doc):
    print(f'--- Page {i+1} ---')
    print(page.get_text())
```

Then create all necessary tiddler files following the convert-policy conventions:
- Timestamps: current date in `YYYYMMDDHHmmssmmm` format
- Only convert Board Policy sections (skip Administrative Regulations)
- Choose `display-style` to match the PDF structure
- Create section tiddlers, legal tiddler, history tiddler

---

## Step 5: Update the baseline

After all changes are handled, the new `RawData/Policies_YYYY-MM-DD.json` automatically becomes the baseline for future syncs (it is the most recent file and `diff_policies.py` uses the two most recent).

No manual step needed.

---

## Step 6: Commit and push

Stage all changed tiddlers and the new RawData files:

```bash
git add tiddlers/ RawData/
git commit -m "Sync policies from RHAM website YYYY-MM-DD

Added: <list>
Modified: <list>
Deleted: <list>"
git push
```

---

## Handling edge cases

**Policy number format changes**: If a policy was at number `9314` and is now at `9314a`, it will appear as a deletion + addition. Treat it as a rename: clean up the old tiddlers and convert the new one fresh.

**Site unreachable**: If `fetch_latest.mjs` fails, stop and report. Do not run the diff.

**PDF download fails**: Try once more. If it fails again, skip that policy, note it in the commit message, and continue with others.

**New policy series**: If an entirely new series appears (e.g., a 7000 series), it will show as multiple additions. Convert them one by one using the same process.

**Name-only changes** (URL unchanged): These don't need re-conversion. Just note them in the commit message.
