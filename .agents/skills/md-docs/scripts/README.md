# md-docs Scripts

## Overview

| Script             | Purpose                                     |
| ------------------ | ------------------------------------------- |
| `check.py`         | Wrapper — runs all check scripts            |
| `check-structure.py` | Directory-level structure rules           |
| `check-content.py` | File-level content and link rules           |
| `init.py`          | Scaffold a new docs directory               |
| `_common.py`       | Shared Finding class, helpers, config       |

---

## check.py (wrapper)

Runs `check-structure.py` + `check-content.py` in one pass. Use this for a full audit.

```bash
python3 check.py docs/
python3 check.py docs/developer/README.md docs/user/quick-start.md
```

---

## check-structure.py

Directory-level structure rules.

```bash
python3 check-structure.py docs/
```

| Rule               | Severity | Checks                                                 |
| ------------------ | -------- | ------------------------------------------------------ |
| missing-readme     | WARN     | Directory with docs content but no README.md            |
| missing-agents     | WARN     | Docs root has no AGENTS.md                              |
| gitkeep-with-readme| INFO     | .gitkeep in a directory that already has README.md      |
| deep-nesting       | INFO     | Directory deeper than 4 levels below root               |
| orphan-file        | WARN     | Markdown file not linked from parent README             |
| unlinked-dir       | INFO     | Sub-directory with README not linked from parent        |

---

## check-content.py

File-level content and link rules.

```bash
python3 check-content.py docs/
python3 check-content.py docs/developer/README.md
```

| Rule               | Severity | Checks                                                 |
| ------------------ | -------- | ------------------------------------------------------ |
| no-h1-title        | WARN     | File does not start with an H1 heading                  |
| multiple-h1        | WARN     | File has more than one H1 heading                       |
| missing-go-back    | WARN     | File has no [Go Back] link near the top                 |
| agents-has-links   | WARN     | AGENTS.md contains markdown links                       |
| broken-link        | WARN     | Markdown link target does not exist                     |
| deep-heading       | INFO     | H4+ heading found — prefer H2/H3 or split              |
| readme-too-long    | INFO     | README exceeds 40 lines                                 |
| agents-too-long    | INFO     | AGENTS.md exceeds 80 lines                              |
| dir-link-no-readme | INFO     | README links to a directory instead of its README.md    |

---

## init.py

Scaffold a new docs directory with README.md and AGENTS.md.

```bash
python3 init.py docs/                       # small (flat)
python3 init.py docs/ --layout medium       # developer/ + user/ split
python3 init.py docs/ --layout large        # adds flow/, tutorial/, operations/
```

Layouts:

| Layout   | Creates                                               |
| -------- | ----------------------------------------------------- |
| `small`  | `docs/README.md` + `docs/AGENTS.md`                  |
| `medium` | + `developer/README.md`, `user/README.md`             |
| `large`  | + `flow/`, `tutorial/`, `operations/` with READMEs    |

---

## Output Format

All check scripts emit:

```
path:line: [SEVERITY] [RULE] message
```

## Exit Codes

| Code | Meaning           |
| ---- | ----------------- |
| 0    | No findings       |
| 1    | Findings emitted  |
| 2    | Bad invocation    |
