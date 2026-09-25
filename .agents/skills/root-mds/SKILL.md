---
name: root-mds
description: Writes or reviews a project's root README.md — header, badges, collapsible TOC, sections, quick-start — and scaffolds community files (LICENSE, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY).
version: 1.0.0
author: MAbdullahAhmad
tags: [readme, badges, license, contributing, community, root, markdown]
triggers:
  - "write a README for this project"
  - "improve my README"
  - "add badges to README"
  - "add a license"
  - "create contributing guidelines"
  - "set up community files"
---

# SKILL: Root README & Community Files

## When to Use This Skill

Activate when the user asks to:
- Write, rewrite, or review a project's root `README.md`.
- Add shields.io badges, a collapsible table of contents, or a project header.
- Add a license file (MIT or other) to the repo.
- Create community files: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`.
- Audit a repo's root-level documentation for completeness.

Do NOT activate when:
- The work is a `docs/` directory tree with multiple README hubs -> use `md-docs`.
- The work is only in-code comments or docstrings -> use `programming-style`.
- The work is API endpoint documentation -> use `api-dev`.

---

## Phase 1 -- Audit Existing State

Run the check script on the repo root. It prints `path:line: [SEVERITY] [RULE] message`.

```bash
python3 skills/root-mds/scripts/check.py .
```

Pick the right script for the job:

| Script              | When to use                                   |
| ------------------- | --------------------------------------------- |
| `check.py`          | Full audit -- runs all checks                 |
| `check-structure.py`| README.md content only (header, badges, TOC)  |
| `check-community.py`| Community files only (LICENSE, CONTRIBUTING)   |

See `scripts/README.md` for the full rule list.

---

## Phase 2 -- Write or Fix README.md

Follow this section order. Every root README should include all required sections and optionally the recommended ones.

### Section Order

| #  | Section              | Required | Notes                                    |
| -- | -------------------- | -------- | ---------------------------------------- |
| 1  | Header               | Yes      | H1 + optional logo/banner                |
| 2  | Badges               | Yes      | One row of shields.io badges             |
| 3  | Description          | Yes      | One sentence or short paragraph          |
| 4  | Table of Contents    | Yes      | Collapsible `<details>` block            |
| 5  | Quick Start          | Yes      | Clone + install + run in 3 commands      |
| 6  | Features             | Rec.     | Bullet list or short sub-sections        |
| 7  | Usage                | Rec.     | Code examples, CLI commands              |
| 8  | Project Structure    | Rec.     | ASCII tree of key directories            |
| 9  | Configuration        | Optional | Env vars, config files                   |
| 10 | Documentation        | Rec.     | Link to `docs/README.md` if it exists    |
| 11 | Contributing         | Rec.     | Link to `CONTRIBUTING.md`                |
| 12 | License              | Yes      | One line + link to `LICENSE`             |

For detailed content guidelines per section, read `details/sections.md`.

### Header Pattern

```markdown
# Project Name

<p align="center">
  <img src="./assets/logo.svg" alt="Project Logo" width="400">
</p>
```

The logo/banner is optional. If no logo exists, just the H1 is fine.

### Badge Row

Place badges on a single line directly after the H1 (or after the logo). Common badges:

| Badge          | Example                                                            |
| -------------- | ------------------------------------------------------------------ |
| Tech stack     | `![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)` |
| License        | `![License](https://img.shields.io/badge/License-MIT-green)`      |
| Build/CI       | `![CI](https://img.shields.io/github/actions/workflow/status/...)` |
| Version        | `![Version](https://img.shields.io/badge/version-1.0.0-blue)`     |

For the full badge catalog, read `details/header-and-badges.md`.

### Collapsible Table of Contents

Always use a collapsible `<details>` block so the TOC does not dominate the page:

```markdown
<details>
<summary>Table of Contents</summary>

- [Quick Start](#quick-start)
- [Features](#features)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

</details>
```

---

## Phase 3 -- Scaffold Community Files

Ask the user before creating each file. Do not assume license type.

| File                  | Purpose                                       | Ask user          |
| --------------------- | --------------------------------------------- | ----------------- |
| `LICENSE`             | Legal terms for the project                   | Which license?    |
| `CONTRIBUTING.md`     | How to contribute (PRs, issues, code style)   | Create it?        |
| `CODE_OF_CONDUCT.md`  | Community behavior standards                  | Create it?        |
| `SECURITY.md`         | How to report vulnerabilities                 | Create it?        |

For templates and content guidelines, read `details/community-files.md`.

Use `init.py` to scaffold all community files at once:

```bash
python3 skills/root-mds/scripts/init.py . --license mit
python3 skills/root-mds/scripts/init.py . --license mit --all   # includes CONTRIBUTING, CODE_OF_CONDUCT, SECURITY
```

---

## Phase 4 -- Verify

1. Re-run `scripts/check.py .` -- fix all WARN findings.
2. Confirm README.md has: H1, badges, description, collapsible TOC, Quick Start, License section.
3. Confirm LICENSE file exists and matches the chosen license.
4. Confirm community files are linked from README.md where applicable.
5. Read through the README as a first-time visitor -- can you understand the project in 30 seconds?

---

## Quick Reference

### Collapsible TOC Template

```html
<details>
<summary>Table of Contents</summary>

- [Quick Start](#quick-start)
- [Features](#features)
- [License](#license)

</details>
```

### Minimum Badges

| Project type | Minimum badges                            |
| ------------ | ----------------------------------------- |
| Any          | License                                   |
| Library      | License + Language + Version              |
| App          | License + Tech stack (1-3)                |
| Open source  | License + CI + Version + Contributors     |

### License One-liner

```markdown
## License

[MIT](./LICENSE) © Your Name
```

### Community File Locations

All community files live in the **repo root** so GitHub auto-detects them:

| File                  | GitHub auto-detects | Shows in              |
| --------------------- | ------------------- | --------------------- |
| `LICENSE`             | Yes                 | Repo sidebar          |
| `CONTRIBUTING.md`     | Yes                 | Issue/PR templates    |
| `CODE_OF_CONDUCT.md`  | Yes                 | Community profile     |
| `SECURITY.md`         | Yes                 | Security tab          |

---

## Common Mistakes to Avoid

| Anti-pattern                                 | Correct approach                                        |
| -------------------------------------------- | ------------------------------------------------------- |
| Wall of text with no headings                | Use H2 sections, keep paragraphs short                  |
| No badges at all                             | At least a license badge                                |
| TOC that takes up half the screen            | Use collapsible `<details>` block                       |
| Quick Start with 10+ steps                   | 3 commands max: clone, install, run                     |
| `License: MIT` with no LICENSE file          | Always create the actual LICENSE file                   |
| README over 300 lines                        | Move deep content to `docs/`                            |
| No description after the title               | One sentence explaining what the project does           |
| Badges on separate lines                     | Keep all badges on one continuous line                  |
| Missing project structure for large projects | Add an ASCII tree of key directories                    |
| CONTRIBUTING.md says "just open a PR"        | Include setup steps, code style, PR checklist           |

---

## Quality Checklist

- [ ] `scripts/check.py` returns no WARN findings.
- [ ] README.md starts with H1 project name.
- [ ] At least one shields.io badge is present (license at minimum).
- [ ] Collapsible `<details>` table of contents is present.
- [ ] One-sentence description is present after badges.
- [ ] Quick Start section exists with 3 or fewer commands.
- [ ] License section exists and links to LICENSE file.
- [ ] LICENSE file exists in repo root.
- [ ] README is under 300 lines (deep content in `docs/`).
- [ ] Community files (if created) are linked from README.

---

## Changelog

| Version | Date       | Change          |
| ------- | ---------- | --------------- |
| 1.0.0   | 2026-05-21 | Initial release |
