# Formatting

Rules for Markdown content style inside docs files.

---

## Headings

| Level | Use                            | Example                     |
| ----- | ------------------------------ | --------------------------- |
| H1    | Document title, one per file   | `# Quick Start`            |
| H2    | Major sections                 | `## 1. Install`            |
| H3    | Subsections (use sparingly)    | `### GetSaferPageTask`     |
| H4+   | Avoid                          | Flatten or split files      |

### Rules

1. **One H1 per file** -- always the first line.
2. **Flat hierarchy** -- prefer H2 sections. Use H3 only when a section genuinely has sub-topics (e.g., multiple task types under a Tasks heading).
3. **No H4 or deeper** -- if you reach H4, either flatten or split into a separate file.
4. **Numbered H2s for procedural docs** -- `## 1. Step`, `## 2. Step`.
5. **Unnumbered H2s for reference docs** -- `## Server`, `## Database`.

---

## Tables

Use tables for structured data. Tables are easier to scan than bullet lists when items have multiple attributes.

### When to Use

- Config options with name + default + description.
- Mappings (input -> output, layer -> folder).
- Comparisons (feature A vs feature B).
- Symptom/cause/fix troubleshooting grids.

### When NOT to Use

- Simple key-value pairs with one attribute -- use a bullet list.
- Narrative content -- use paragraphs.
- Nested data -- use nested bullet lists or split into sections.

### Format

```markdown
| Column A   | Column B | Column C           |
| ---------- | -------- | ------------------ |
| value      | value    | longer description |
```

Rules:
- Always include the header row and separator row.
- Left-align columns (default). No need for explicit alignment unless numeric data is right-aligned.
- Keep cell content short -- no multi-line cells.

---

## Bullet Lists

Use bullet lists for enumerations, options, and short items.

```markdown
- First item.
- Second item.
- Third item with `inline code`.
```

Rules:
- Use `-` (dash), not `*` or `+`.
- End items with a period if they are sentences; omit periods for fragments.
- Do not nest deeper than two levels.
- Use numbered lists (`1.`, `2.`) only for ordered steps.

---

## Code Blocks

Wrap commands, configs, and code snippets in fenced code blocks.

````markdown
```bash
npm install
```

```json
{"message": "ok"}
```

```sql
CREATE TABLE users (id SERIAL PRIMARY KEY);
```
````

### Rules

1. **Always tag the language** -- `bash`, `json`, `sql`, `yaml`, `ini`, `typescript`, `python`, `txt`.
2. **One concept per block** -- don't combine unrelated commands.
3. **Keep blocks short** -- under 20 lines. For longer examples, split or reference a separate file.
4. **Use `txt` or no tag** for ASCII diagrams.
5. **Show expected output** after a command block when it helps verification:

````markdown
```bash
curl http://localhost:8787/
```

Expected:

```json
{"message": "Welcome"}
```
````

---

## Prose

Prose has its place, but less is more in technical docs.

### Rules

1. **Short practical bullets over paragraphs** -- a bullet list of 5 items is faster to scan than 5 sentences.
2. **One idea per sentence** -- avoid compound sentences.
3. **No filler words** -- cut "basically", "simply", "just", "please note that", "it should be noted".
4. **Active voice** -- "Run the migration" not "The migration should be run".
5. **Present tense** -- "The server listens on port 8787" not "The server will listen".
6. **Add prose only when it prevents confusion** -- if a bullet list or table is clear enough, skip the paragraph.

---

## Horizontal Rules

Use `---` on its own line to separate major sections:

```markdown
## Section One

Content...

---

## Section Two

Content...
```

Rules:
- Use between top-level H2 sections when the visual break aids readability.
- Do not overuse -- not between every subsection.
- Always have a blank line above and below.

---

## Inline Formatting

| Syntax       | Use For                                    | Example                          |
| ------------ | ------------------------------------------ | -------------------------------- |
| `` `code` `` | Commands, variable names, file paths, keys | `` `npm install` ``, `` `.env` ``|
| `**bold**`   | Important terms on first use               | **Task** is a single-step unit   |
| `*italic*`   | Emphasis (rare)                            | *optional* section               |

Rules:
- Do not bold entire sentences.
- Do not use bold for every keyword -- only on first introduction.
- Use backtick code for anything the reader would type, copy, or look up in code.

---

## File Naming

| Item                | Convention                   | Example                    |
| ------------------- | ---------------------------- | -------------------------- |
| Topic files         | Lowercase, hyphen-separated  | `quick-start.md`          |
| Tutorial files      | Numbered + uppercase         | `01-JOBS-AND-TASKS.md`    |
| README              | Always uppercase             | `README.md`               |
| AGENTS              | Always uppercase             | `AGENTS.md`               |
| Standalone guides   | UPPERCASE with hyphens       | `PRODUCTION.md`           |

Rules:
- No spaces in filenames.
- No underscores -- use hyphens.
- Consistent case within a directory.
