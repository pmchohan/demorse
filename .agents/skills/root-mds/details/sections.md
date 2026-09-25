# README Sections

## Section Order

Follow this order for a complete root README. Required sections must always be present. Recommended sections should be included for any non-trivial project.

| #  | Section              | Required | Heading                    |
| -- | -------------------- | -------- | -------------------------- |
| 1  | Header               | Yes      | `# Project Name`          |
| 2  | Badges               | Yes      | (no heading, inline)       |
| 3  | Description          | Yes      | (no heading, paragraph)    |
| 4  | Table of Contents    | Yes      | (collapsible `<details>`)  |
| 5  | Quick Start          | Yes      | `## Quick Start`           |
| 6  | Features             | Rec.     | `## Features`              |
| 7  | Usage                | Rec.     | `## Usage`                 |
| 8  | Project Structure    | Rec.     | `## Project Structure`     |
| 9  | Configuration        | Optional | `## Configuration`         |
| 10 | Documentation        | Rec.     | `## Documentation`         |
| 11 | Contributing         | Rec.     | `## Contributing`          |
| 12 | License              | Yes      | `## License`               |

---

## Collapsible Table of Contents

Always use a collapsible `<details>` block. This keeps the TOC accessible without dominating the page. GitHub renders the caret (triangle toggle) natively.

```html
<details>
<summary>Table of Contents</summary>

- [Quick Start](#quick-start)
- [Features](#features)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

</details>
```

### Rules

- Place after the description, before Quick Start.
- Include only H2 sections (no H3 sub-items unless the README is very long).
- Use `#anchor-links` that match the heading text (lowercase, hyphens for spaces).
- The blank line after `<summary>` and before `</details>` is required for GitHub to render the markdown list correctly.

---

## Quick Start

The most important section after the description. A new user should be able to clone, install, and run the project in 3 commands or fewer.

```markdown
## Quick Start

\```bash
git clone https://github.com/OWNER/REPO.git && cd REPO
pip install -e .          # or: npm install
python main.py            # or: npm run dev
\```
```

### Variants

**Docker-first projects** — show Docker commands first, then local:

```markdown
## Quick Start

### Docker

\```bash
git clone https://github.com/OWNER/REPO.git && cd REPO
cp .env.example .env   # add your API keys
docker compose up -d   # -> http://localhost:8000
\```

### Local

\```bash
pip install -e .
python main.py
\```
```

### Rules

- Maximum 3 commands per variant.
- Show the result (URL, expected output) so the user knows it worked.
- If env vars or config is needed, show `cp .env.example .env` as one of the steps.
- For multiple install methods, use H3 sub-headings (Docker, Local, pip, npm).

---

## Features

A concise bullet list of what the project does. No paragraphs.

```markdown
## Features

- Real-time WebSocket communication
- OAuth2 authentication with Google and GitHub
- Docker Compose deployment with hot reload
- CLI with `project run`, `project test`, `project deploy`
```

### Rules

- 4-8 bullets. More than 10 means the list needs grouping or trimming.
- Each bullet is one line — no multi-line descriptions.
- Start each bullet with a noun or action phrase, not "It supports..." or "You can...".

---

## Usage

Code examples showing how to use the project. More detailed than Quick Start.

```markdown
## Usage

\```python
from mylib import Pipeline

pipeline = Pipeline.from_config("pipeline.yaml")
result = pipeline.run(input="Hello world")
print(result.output)
\```
```

### Rules

- Show the most common use case first.
- Use real, runnable code — not pseudo-code.
- For CLI tools, show actual commands with example output.
- For libraries, show import + usage + expected result.

---

## Project Structure

An ASCII tree showing the key directories. Not every file — just the important ones.

```markdown
## Project Structure

\```
src/
  core/          # Base classes
  agents/        # Agent implementations
  cli/           # CLI commands
  config/        # Configuration
tests/           # Test suite
docs/            # Documentation
scripts/         # Utility scripts
\```
```

### Rules

- Show directories, not individual files (unless a file is critical like `main.py`).
- Add inline comments (`# purpose`) for each directory.
- Keep to 8-15 lines. If the tree is longer, the project needs a `docs/` section.
- Use 2-space indentation for nesting.

---

## Documentation

A one-line link to the docs directory.

```markdown
## Documentation

See [docs/README.md](./docs/README.md) for full documentation.
```

Only include if `docs/` exists.

---

## Contributing

A one-line link to the CONTRIBUTING.md file.

```markdown
## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
```

If no CONTRIBUTING.md exists, use a short inline message:

```markdown
## Contributing

Pull requests are welcome. Please open an issue first to discuss changes.
```

---

## License

One line with the license name, a link to the LICENSE file, and the copyright holder.

```markdown
## License

[MIT](./LICENSE) © Your Name
```

### Variants

```markdown
## License

[Apache 2.0](./LICENSE) © Organization Name

## License

Proprietary. All rights reserved by [Author](https://github.com/author). See [LICENSE](LICENSE).
```

---

## Length Budget

| Project size | Target lines | Rule of thumb                          |
| ------------ | ------------ | -------------------------------------- |
| Small        | 40-80        | Header + badges + quick start + license |
| Medium       | 80-150       | Add features, usage, structure          |
| Large        | 150-300      | Add config, docs link, contributing     |

If the README exceeds 300 lines, move detailed content to `docs/`.
