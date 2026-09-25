# Documentation Types

Different content needs different structure. Choose the right doc type for each file.

---

## Overview

| Doc Type    | When to Use                                 | Key Feature                        |
| ----------- | ------------------------------------------- | ---------------------------------- |
| Reference   | Config, env vars, API surfaces, option lists | H2 categories + tables/bullets     |
| Procedural  | Quick-start, setup, how-to                   | Numbered H2 steps + code blocks    |
| Tutorial    | Sequential learning across multiple files    | Numbered files + Next/Prev links   |
| Flow        | Architecture, pipelines, data flow           | ASCII diagrams + annotations       |
| Operations  | Deploy, cron, systemd, troubleshooting       | Commands + config blocks           |

---

## Reference Docs

Reference docs organize factual information by category. Readers look up specific items, not read top-to-bottom.

### Structure

```markdown
# Environment Variables

[Go Back](README.md)

Configuration for the API server.

## Server

- `PORT`: HTTP port. Default `8787`.
- `HOST`: Bind address. Default `127.0.0.1`.

## Database

- `DB_HOST`: PostgreSQL host.
- `DB_PORT`: PostgreSQL port. Default `5432`.
- `DB_NAME`: Database name.

## Queue

| Variable        | Default | Description              |
| --------------- | ------- | ------------------------ |
| `QUEUE_ENABLED` | `true`  | Enable background jobs   |
| `QUEUE_WORKERS` | `2`     | Concurrent job workers   |
```

### Rules

- One H1, multiple H2 categories.
- Use bullet lists for simple key-value items.
- Use tables when items have 3+ attributes.
- Do not mix categories -- one concern per H2.
- Alphabetize within a category when order does not matter.

---

## Procedural Docs

Step-by-step guides for completing a specific task. The reader follows from top to bottom.

### Structure

```markdown
# Quick Start

[Go Back](README.md)

Get the API running locally.

## 1. Install Dependencies

\```bash
npm install
\```

## 2. Configure Environment

\```bash
cp .env.dev .env
\```

Edit `.env` if local database credentials differ.

## 3. Start the Server

\```bash
npm run start:dev
\```

Default URL: `http://127.0.0.1:8787`

## 4. Verify

\```bash
curl http://127.0.0.1:8787/
\```

Expected response:

\```json
{"message": "Welcome"}
\```
```

### Rules

- Number every H2 step: `## 1. Step Name`, `## 2. Step Name`.
- Each step has one action and one code block (when applicable).
- Keep steps atomic -- one command or one config change per step.
- Add expected output after commands when helpful.
- Do not skip steps -- a fresh reader must be able to follow from step 1.

---

## Tutorial Docs

Tutorials teach concepts across multiple files in a fixed reading order. They differ from procedural docs: tutorials explain *why*, not just *how*.

### Structure

Files are numbered with zero-padded prefixes:

```
tutorial/
  AGENTS.md              <- reading order + source paths
  01-FIRST-CONCEPT.md
  02-SECOND-CONCEPT.md
  03-THIRD-CONCEPT.md
  04-EXAMPLES.md
  05-PRODUCTION.md
```

Each tutorial file:

```markdown
# Tutorial Part 1: Jobs and Tasks

## The Building Blocks

Concept explanation with table...

## Detailed Section

Code examples, diagrams...

## Adding a New Job

Procedural steps for extension...

## Next

[Part 2: Engine and Proxies -->](./02-ENGINE-AND-PROXIES.md)
```

### Rules

- Number files with zero-padded prefix: `01-`, `02-`, `03-`.
- Use UPPERCASE filenames with hyphens: `01-JOBS-AND-TASKS.md`.
- End every file (except the last) with a `## Next` section linking forward.
- Optionally start files 2+ with a Previous link.
- Include an `AGENTS.md` in the tutorial directory with the reading order.
- Use real class names and file paths, not pseudocode.
- Each part should stand alone enough to be useful even if the reader stops.

---

## Flow Docs (Pictorial / ASCII Diagrams)

Flow docs use ASCII art to visualize architecture, pipelines, state machines, and data flow. They supplement reference docs with a visual mental model.

### Structure

```markdown
# Architecture Flow

Core pipeline from entry to output.

---

## 1. Top-Level Pipeline

\```
+--------------------------------------------------------------+
|                         CLI ENTRY                             |
|  $ node main.js --worker update                              |
+--------------------------------------------------------------+
                           |
                           v
+--------------------------------------------------------------+
|  main.js                                                      |
|  - Parse CLI flags                                            |
|  - Dispatch to worker                                         |
+--------------------------------------------------------------+
                           |
              +------------+------------+
              v            v            v
        +---------+  +---------+  +---------+
        | update  |  | replace |  | export  |
        +---------+  +---------+  +---------+
\```

---

## 2. Worker Pipeline

\```
+-----------------------------------+
| 1. LOCK ACQUIRE                   |
|    Check PID lock file            |
+-----------------------------------+
         |
         v
+-----------------------------------+
| 2. BOOTSTRAP                      |
|    Run migrations, seed data      |
+-----------------------------------+
         |
         v
+-----------------------------------+
| 3. EXECUTE                        |
|    Run the main job               |
+-----------------------------------+
\```
```

### ASCII Diagram Conventions

| Element                | Characters                    | Example                     |
| ---------------------- | ----------------------------- | --------------------------- |
| Box top/bottom         | `+` corners, `-` horizontal   | `+----------+`              |
| Box sides              | `|` vertical                  | `| content  |`              |
| Vertical flow          | `|` then `v`                  | down arrow                  |
| Horizontal flow        | `-->` or `->>`                | left to right               |
| Branch                 | `+---+---+`                   | fork into paths             |
| Unicode alternative    | `┌─┐ │ └─┘ ▼ →`              | box-drawing characters      |

Either ASCII (`+`, `-`, `|`) or Unicode box-drawing (`┌`, `─`, `┐`, `│`, `└`, `┘`, `▼`, `→`) is fine. Be consistent within a file.

### Rules

- Wrap diagrams in triple-backtick code blocks (no language tag, or use `txt`).
- Number sections when showing progressive detail: `## 1. Overview`, `## 2. Internals`.
- Add short annotations inside boxes explaining what each stage does.
- Include a summary diagram at the end if the flow has 4+ stages.
- Add a `## Related` section linking to related flow or reference docs.
- Do not mix diagrams with long prose -- let the diagram speak; add only brief annotations.

---

## Operations Docs

Runbooks for deployment, scheduling, monitoring, and troubleshooting. Written for someone who needs to act, not learn.

### Structure

```markdown
# Deploy

\```bash
cd project && npm run build
cp .env.prod .env
\```

The build output goes to `dist/`.

## One-Time Setup

\```sql
CREATE DATABASE myapp;
\```

## Environment

\```bash
# Required
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp

# Optional
LOG_LEVEL=info
\```

## Systemd Service

\```ini
[Unit]
Description=MyApp Worker
After=network.target

[Service]
ExecStart=/usr/bin/node /opt/myapp/dist/worker.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
\```

## Troubleshooting

| Symptom              | Likely Cause        | Fix                          |
| -------------------- | ------------------- | ---------------------------- |
| Port already in use  | Stale process       | Kill the old PID             |
| DB connection refused| Wrong credentials   | Check `.env` DB vars         |
```

### Rules

- Lead with the most common command (build, deploy, start).
- Use code blocks for every command, config, and SQL snippet.
- Add language tags: `bash`, `sql`, `ini`, `yaml`, `json`.
- Use a troubleshooting table at the end: Symptom | Cause | Fix.
- Keep explanatory text minimal -- ops docs are action-first.
- Use comments inside code blocks rather than prose above them when possible.
