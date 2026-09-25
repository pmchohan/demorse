# Directory Structure

Rules for organizing a `docs/` tree.

---

## Root Layout

Every project that needs documentation gets a `docs/` directory at the repo root. The minimum viable docs directory contains:

```
docs/
  README.md       <- navigational hub; links to sections
  AGENTS.md       <- standalone LLM context; no links
```

## Scaling by Complexity

### Small Project (1-3 devs, single service)

Flat topic files alongside the root README:

```
docs/
  README.md
  AGENTS.md
  quick-start.md
  environment.md
  commands.md
  troubleshooting.md
```

### Medium Project (team, multiple areas)

Split into audience-based or area-based directories:

```
docs/
  README.md
  AGENTS.md
  developer/
    README.md
    project/
      README.md
      api/
        README.md
        endpoints/
          README.md
          ...one file per endpoint group...
      frontend/
        README.md
    programming/
      README.md
      code-splitting/
        README.md
        ...one file per layer...
      testing/
        README.md
  user/
    README.md
    admin/
      README.md
    client/
      README.md
```

### Large Project (multiple modules, ops team)

Add specialized directories for visual docs, tutorials, and operations:

```
docs/
  README.md
  AGENTS.md
  flow/
    README.md
    ARCHITECTURE.md
    ...ASCII flowchart files...
  tutorial/
    AGENTS.md           <- reading-order guide for this section
    01-FIRST-TOPIC.md
    02-SECOND-TOPIC.md
    03-THIRD-TOPIC.md
  operations/
    README.md
    deploy.md
    cron.md
    systemd.md
    troubleshooting.md
  developer/
    README.md
    ...
  user/
    README.md
    ...
```

## Rules

1. **Every directory gets a `README.md`** -- no exceptions. If a directory exists, it has a README.
2. **`AGENTS.md` goes in `docs/` root** -- one per docs tree. Tutorial directories may also have their own `AGENTS.md` for reading-order guidance.
3. **No `.gitkeep`** in directories that have a README.
4. **Directory names are lowercase**, hyphen-separated: `code-splitting/`, not `CodeSplitting/` or `code_splitting/`.
5. **Topic file names are lowercase** with hyphens: `quick-start.md`, `environment.md`. Exception: tutorial files use numbered prefixes: `01-JOBS-AND-TASKS.md`.
6. **One concern per directory** -- do not mix user guides and developer internals in the same folder.
7. **Depth limit**: aim for no more than 4 levels below `docs/`. If you need deeper, flatten or merge.
8. **Reference docs** (one file per class, endpoint, or service) go under a named sub-directory: `endpoints/`, `controllers/`, not loose in the parent.
9. **Split by audience first**, then by topic: `developer/` vs `user/` at the top level, then `project/`, `programming/`, `admin/`, `client/` below.

## Anti-patterns

| Problem                                      | Fix                                             |
| -------------------------------------------- | ----------------------------------------------- |
| `docs/` with 30 flat files                   | Group into `developer/`, `user/`, `operations/` |
| Sub-directory without README.md              | Add a README immediately                        |
| Directory named `stuff/` or `misc/`          | Rename by responsibility                        |
| Mixing deploy guides with API reference      | Separate into `operations/` and `developer/`    |
| 5+ levels of nesting                         | Flatten or merge intermediate directories       |
| `.gitkeep` next to a README.md               | Delete the `.gitkeep`                           |
