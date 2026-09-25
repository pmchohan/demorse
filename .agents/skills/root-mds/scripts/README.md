# root-mds Scripts

## Overview

| Script              | Purpose                                        |
| ------------------- | ---------------------------------------------- |
| `check.py`          | Wrapper — runs all check scripts               |
| `check-structure.py`| README.md content rules (H1, badges, TOC, etc.)|
| `check-community.py`| Community file presence (LICENSE, CONTRIBUTING) |
| `init.py`           | Scaffold LICENSE + community files              |
| `_common.py`        | Shared Finding class, helpers, config           |

---

## check.py (wrapper)

Runs all check scripts in one pass.

```bash
python3 check.py .
python3 check.py /path/to/repo
```

---

## check-structure.py

Checks the root README.md for required structure and content.

```bash
python3 check-structure.py .
```

| Rule              | Severity | Checks                                          |
| ----------------- | -------- | ----------------------------------------------- |
| missing-readme    | WARN     | No README.md in repo root                       |
| missing-h1        | WARN     | README does not start with an H1 title           |
| missing-badges    | WARN     | No shields.io badges found                      |
| missing-toc       | WARN     | No collapsible `<details>` table of contents    |
| missing-description| INFO    | No description paragraph after header/badges     |
| missing-license-sec| WARN    | No `## License` section                         |
| missing-quick-start| INFO    | No Quick Start / Getting Started section         |
| long-readme       | INFO     | README exceeds 300 lines                         |

---

## check-community.py

Checks for the presence of community files in the repo root.

```bash
python3 check-community.py .
```

| Rule                  | Severity | Checks                        |
| --------------------- | -------- | ----------------------------- |
| missing-license-file  | WARN     | No LICENSE file                |
| missing-contributing  | INFO     | No CONTRIBUTING.md             |
| missing-code-of-conduct| INFO   | No CODE_OF_CONDUCT.md          |
| missing-security      | INFO     | No SECURITY.md                 |

---

## init.py

Scaffolds community files. Skips files that already exist.

```bash
python3 init.py . --license mit                   # LICENSE only
python3 init.py . --license mit --all              # LICENSE + CONTRIBUTING + CODE_OF_CONDUCT + SECURITY
python3 init.py . --license mit --author "Name"    # custom author
python3 init.py . --license mit --all --dry-run    # preview without writing
```

| License option | Description                |
| -------------- | -------------------------- |
| `mit`          | MIT License                |
| `apache2`      | Apache License 2.0         |
| `gpl3`         | GNU GPL v3                 |
| `proprietary`  | All rights reserved        |

---

## Output Format

All check scripts emit:

```
path:line: [SEVERITY] [RULE] message
```

## Exit Codes

| Code | Meaning          |
| ---- | ---------------- |
| 0    | No findings      |
| 1    | Findings emitted |
| 2    | Bad invocation   |
