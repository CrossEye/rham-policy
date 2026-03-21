---
name: convert-policy
description: Convert a Board Policy PDF into TiddlyWiki .tid files. Given a 4-digit policy number, reads the PDF from pdfs/, reads the existing skeleton tiddler, and creates all necessary tiddler files to represent the policy content.
argument-hint: <policy-number>
---

# Convert Board Policy PDF to TiddlyWiki Tiddlers

Given a 4-digit policy number (e.g., `3432`), convert the corresponding PDF from `pdfs/` into a set of `.tid` tiddler files in `tiddlers/`.

## Step 1: Gather inputs

1. Read the existing skeleton tiddler at `tiddlers/Policy$ARGUMENTS.tid` to get the `caption`, `description`, `pdf-url`, and `policy-nbr` fields.
2. Find and read the PDF from `pdfs/` whose filename starts with `$ARGUMENTS` (e.g., `pdfs/3432 - Reserve Fund for Educational Expenditures.pdf`).
3. If the PDF contains both a **Board Policy** section and an **Administrative Regulation** section, convert **only the Board Policy** portion. Skip administrative regulations entirely.

## Step 2: Analyze PDF structure

Study the Board Policy content and identify:

- **Body text**: The main policy paragraphs
- **Numbered sections** (1, 2, 3...): Items with numbers in the original
- **Lettered sections** (A, B, C... or a, b, c...): Items with letters
- **Roman numeral sections** (I, II, III...): Major divisions
- **Named/headed sections**: Sections identified by descriptive headings rather than numbers
- **Legal references**: Connecticut General Statutes citations and other legal refs
- **History**: ADOPTED/APPROVED/REVISED dates at the bottom
- **Formatting**: Bold, underlined, or uppercase text in the original

## Step 3: Choose structure types

The `structure` field on a parent tiddler controls how its `<<sections>>` children render. Choose based on matching the PDF's visual appearance as closely as possible:

### Available structure types

| Structure | Renders as | Use when PDF shows |
|-----------|-----------|-------------------|
| `plain` | Block content only; no heading/marker for children | Simple paragraphs with no sub-structure, or when body text is inline |
| `list` | Marker number + ". " then block content | Numbered items (1., 2., 3.) where the number IS the label |
| `heading2` | `<h2>` caption heading + block content | Major sections with prominent headings |
| `heading3-upper` | `<h3 class="upper">` caption + block | Sections with ALL-CAPS headings |
| `heading3-underline` | `<h3 class="underline">` caption + block | Sections with underlined descriptive headings |
| `outline` | Marker + ". " + caption as heading line, block below | Roman numerals or letters where each has a titled heading (e.g., "I. General") |
| `outline-block` | Marker only as label, block content beside it | Lettered/numbered items where the marker labels a block of content (e.g., "(a) The ability...") |
| `definition` | Marker + ". " + caption + ": " then block content | Definition-style lists (term: definition) |
| `definition-inline` | Same as definition but without the colon | Definition-style without colon |
| `definition-quoted` | Marker + '. "caption": ' then block content | Quoted definition terms |
| `definition-prequoted` | Caption only (no marker), then block content | Pre-quoted definitions |

### Matching PDF formatting to structure type

The goal is to reproduce the PDF's visual hierarchy as closely as possible in the web version. While exact PDF replication isn't expected (web is a different medium), preserve:

- **Bold text**: Use `''bold''` in TiddlyWiki markup
- **Underlined text**: Use `__underline__` in TiddlyWiki markup
- **Uppercase headings**: Use `heading3-upper` structure type
- **Underlined headings**: Use `heading3-underline` structure type
- **Numbered lists within a section**: Use TiddlyWiki `#` ordered list syntax inline (don't create sub-tiddlers for every small numbered item)
- **Bullet lists**: Use `*` or `@@.plain` wrapper for plain bullet lists (see Policy3110(s1) for the `@@.plain` pattern)
- **Tables**: Use TiddlyWiki table syntax `|cell|cell|`

### Decision guide for tiddler decomposition

- **Each numbered/lettered/Roman-numeral item that has a heading or substantial body** should be its own tiddler
- **Short numbered items within a section** (like an inline enumerated list) can stay as `#` ordered list items within the parent tiddler body -- don't over-decompose
- **Sections with children** get `<<sections>>` in their body (optionally with intro/closing text around it)
- **Items with sub-items** need their own `structure` field and `<<sections>>`

## Step 4: Create tiddler files

### Main policy tiddler: `Policy{NNNN}.tid`

Update the existing skeleton:

```
caption: {NNNN} - {Title}
created: {timestamp}
description: {Title}
modified: {timestamp}
pdf-url: {from skeleton}
policy-nbr: {NNNN}
structure: {chosen structure}
tags: Policy
title: Policy{NNNN}
type: text/vnd.tiddlywiki

{body text if any}

<<sections>>
```

- Use the existing `pdf-url` from the skeleton
- Set `created` and `modified` to current timestamp in TiddlyWiki format (`YYYYMMDDHHmmssmmm`)
- If the policy body text is simple paragraphs with no sub-structure, use `structure: plain` and put the text directly in the body followed by `<<sections>>`
- If the body is only sub-sections with no introductory text, use the appropriate structure and just `<<sections>>`

### Section tiddlers: naming conventions

Tiddler titles encode the hierarchy. The marker (number/letter) displayed is extracted from the last parenthetical in the title via regex `.*\(([^\(\)]+)\)$`.

| PDF structure | Tiddler title pattern | Example |
|--------------|----------------------|---------|
| Numbered items (1, 2, 3) | `Policy{NNNN}(1)`, `(2)`, `(3)` | `Policy3432(1)` |
| Named sections | `Policy{NNNN}(s1)`, `(s2)`, `(s3)` | `Policy3165(s1)` |
| Roman numerals | `Policy{NNNN}(I)`, `(II)`, `(III)` | `Policy3210(I)` |
| Lettered items | `Policy{NNNN}(A)`, `(B)`, `(C)` | `Policy3524(A)` |
| Nested items | Append to parent | `Policy3330(s1)(6)(a)` |
| Named sub-sections | Use `(sN)` under parent | `Policy1520(s2)(1)` |

**When to use `(sN)` vs `(N)`**: Use `(sN)` when sections have descriptive heading captions (like "Planning the Budget"). Use `(N)` or `(A)` etc. when items are identified by their number/letter marker in the original PDF.

### Section tiddler format

```
caption: {Section heading or parent caption}
created: {timestamp}
modified: {timestamp}
title: Policy{NNNN}({marker})
type: text/vnd.tiddlywiki

{content}
```

- **caption**: Use the section's own heading if it has one. For sub-items that don't have distinct headings, use the same caption as the parent section.
- **structure**: Only include if this tiddler has children that use `<<sections>>`
- **tags**: Omit (leave empty or don't include the field) for section tiddlers. Only the main policy tiddler gets `tags: Policy`.

### Legal references tiddler: `Policy{NNNN}(legal).tid`

```
caption: Legal References
created: {timestamp}
modified: {timestamp}
title: Policy{NNNN}(legal)
type: text/vnd.tiddlywiki

Connecticut General Statutes <<cgs {section-number}>>
```

- Use the `<<cgs>>` macro for each Connecticut General Statute reference
- First parameter: the section number used for linking (e.g., `10-51d`)
- Second parameter (optional): display text, used when the PDF cites a specific subsection (e.g., `<<cgs 10-51d 10-51d(2)>>` to display "10-51d(2)" while linking to section 10-51d)
- Separate multiple references with commas: `<<cgs 10-220>>, <<cgs 10-231g>>`
- For non-CGS references (federal law, public acts), just use plain text

### History tiddler: `Policy{NNNN}(history).tid`

```
caption: History
created: {timestamp}
modified: {timestamp}
title: Policy{NNNN}(history)
type: text/vnd.tiddlywiki

<<ADOPTED: {date}>>
<<REVISED: {date}>>
```

- Use `<<ADOPTED: {date}>>` or `<<APPROVED: {date}>>` matching the PDF's terminology
- Use `<<REVISED: {date}>>` for each revision
- Preserve the date format from the PDF (e.g., "October, 1998" or "January 2025")
- Both `<<ADOPTED>>` and `<<ADOPTED:>>` (with colon) work identically; prefer the colon variant for consistency

## Step 5: Verify

After creating all files, list the complete set of files created and their hierarchy so the user can review.

## Reference examples

These completed policies demonstrate the patterns:

| Policy | Pattern | Key files to study |
|--------|---------|-------------------|
| Policy3525 | Simple plain text, no sub-tiddlers | `Policy3525.tid` |
| Policy3432 | Numbered list items as child tiddlers | `Policy3432.tid`, `Policy3432(1).tid` |
| Policy3165 | Descriptive headed sections | `Policy3165.tid`, `Policy3165(s1).tid` |
| Policy3330 | Complex nested: heading sections → numbered lists → lettered sub-items | `Policy3330.tid`, `Policy3330(s1).tid`, `Policy3330(s1)(6)(a).tid` |
| Policy3110 | Headed sections with mixed content | `Policy3110.tid`, `Policy3110(1).tid` |
| Policy1350 | Heading2 sections with definition sub-sections | `Policy1350.tid`, `Policy1350(s5).tid` |
| Policy3265 | Outline with Roman numerals | `Policy3265.tid`, `Policy3265(I).tid` |

When in doubt about a structural choice, read the relevant reference example to see how it was handled.
