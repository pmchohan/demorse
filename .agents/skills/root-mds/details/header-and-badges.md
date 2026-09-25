# Header & Badges

## Header

The README begins with an H1 title matching the project name. Optionally follow it with a centered logo or banner image.

### H1 Only (minimal)

```markdown
# Project Name
```

### H1 + Logo

```markdown
# Project Name

<p align="center">
  <img src="./assets/logo.svg" alt="Project Name Logo" width="400">
</p>
```

### H1 + Banner Table (advanced)

Some projects use a table to place the title beside a logo. This works when the logo is small:

```markdown
# Project Name |![Logo](./assets/logo.svg)|
```

### Rules

- H1 must be on the very first line of the file.
- Only one H1 per file.
- If using a logo, center it with `<p align="center">`.
- Keep images under 500px width so they render well on mobile.
- Use SVG for logos when possible (scalable, small file size).

---

## Badges

Badges go on a single line immediately after the header (or logo). Use [shields.io](https://shields.io) for consistency.

### Badge Anatomy

```
![Label](https://img.shields.io/badge/LABEL-VALUE-COLOR?logo=LOGO_NAME&logoColor=white)
```

| Part        | Description                                    | Example          |
| ----------- | ---------------------------------------------- | ---------------- |
| `LABEL`     | Left side text                                 | `Python`         |
| `VALUE`     | Right side text                                | `3.10+`          |
| `COLOR`     | Hex (no `#`) or named color                    | `3776AB`         |
| `logo`      | [Simple Icons](https://simpleicons.org/) slug  | `python`         |
| `logoColor` | Icon color                                     | `white`          |

### Common Badge Recipes

#### Language / Framework

```markdown
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Go](https://img.shields.io/badge/Go-00ADD8?logo=go&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-000000?logo=rust&logoColor=white)
```

#### License

```markdown
![License: MIT](https://img.shields.io/badge/License-MIT-green)
![License](https://img.shields.io/badge/License-Apache%202.0-blue)
![License](https://img.shields.io/badge/License-Proprietary-red)
```

#### CI / Build

```markdown
![CI](https://img.shields.io/github/actions/workflow/status/OWNER/REPO/ci.yml?logo=github)
![Build](https://img.shields.io/github/actions/workflow/status/OWNER/REPO/build.yml?label=build)
```

#### Version / Release

```markdown
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Release](https://img.shields.io/github/v/release/OWNER/REPO)
![npm](https://img.shields.io/npm/v/PACKAGE?logo=npm)
![PyPI](https://img.shields.io/pypi/v/PACKAGE?logo=pypi)
```

#### Infrastructure

```markdown
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=white)
```

#### Documentation / Links

```markdown
[![Docs](https://img.shields.io/badge/docs-view-blue?logo=readthedocs)](./docs/README.md)
[![GitHub](https://img.shields.io/badge/repo-PROJECT-black?logo=github)](https://github.com/OWNER/REPO)
```

### Badge Placement Rules

1. All badges on one continuous line (no line breaks between them).
2. Place after the header/logo, before the description.
3. Order: tech stack -> license -> CI -> version -> links.
4. Minimum: license badge. Maximum: 8 badges (more clutters).
5. Separate badges with a single space.

### Linked vs Static Badges

- **Static** (`![alt](url)`) — display only. Use for tech stack.
- **Linked** (`[![alt](img-url)](link-url)`) — clickable. Use for docs, repo, CI.

---

## Description

One sentence or short paragraph directly after the badge row. No heading — just a plain paragraph.

```markdown
![badges...]

Composable AI agent pipelines with CLI, HTTP, and MCP interfaces.
```

### Rules

- One sentence is ideal. Two sentences maximum.
- Describe WHAT the project does, not HOW.
- No marketing fluff. Be precise and technical.
- No heading for the description — it flows naturally after badges.
