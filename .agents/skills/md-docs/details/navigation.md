# Navigation

Rules for linking docs into a browsable tree.

---

## Link Types

| Link Type | Format                               | Placement                        |
| --------- | ------------------------------------ | -------------------------------- |
| Go Back   | `[Go Back](../README.md)`           | After H1 in every file           |
| Contents  | `- [Name](file.md)`                 | In README `## Contents` section  |
| Next      | `[Part N: Title -->](./0N-FILE.md)` | End of tutorial/sequential files |
| Previous  | `[<-- Part N: Title](./0N-FILE.md)` | Start of tutorial part 2+        |
| Related   | `- [File](./FILE.md)`               | `## Related` section at end      |

---

## Go Back Links

Every markdown file in the docs tree gets a Go Back link immediately after the H1 heading.

**Topic files** link to their parent directory's README:
```markdown
# Quick Start

[Go Back](README.md)
```

**README files** link to the parent directory's README:
```markdown
# API Docs

[Go Back](../README.md)
```

**Docs root README** links to the repo root:
```markdown
# Project Docs

[Go Back](../README.md)
```

### Rules

1. Go Back is always the first line after H1.
2. No blank lines between H1 and Go Back.
3. Use relative paths only.
4. Topic files use `README.md` (same directory). README files use `../README.md` (parent directory).

---

## Contents Links (README hubs)

README files list their children in a `## Contents` section:

```markdown
## Contents

- [Quick Start](quick-start.md)
- [Environment](environment.md)
- [API Reference](api/README.md)
```

### Rules

1. Link to `README.md` explicitly for sub-directories: `api/README.md`, not `api/`.
2. Every topic file in the directory must appear in the Contents list.
3. Order by reading priority: start with quick-start or overview, end with troubleshooting.
4. Use the human-readable title, not the filename: `[Quick Start](quick-start.md)`, not `[quick-start.md](quick-start.md)`.

---

## Tutorial Navigation (Next / Previous)

Tutorial files form a sequential reading path. Connect them with Next and Previous links.

### Next Link (end of file)

Every tutorial file except the last ends with:

```markdown
## Next

[Part 2: Engine and Proxies -->](./02-ENGINE-AND-PROXIES.md)
```

### Previous Link (optional, start of file)

Files 2+ may include a Previous link after the Go Back:

```markdown
# Tutorial Part 2: Engine and Proxies

[<-- Part 1: Jobs and Tasks](./01-JOBS-AND-TASKS.md)
```

Or, if you keep Go Back as the primary link, add Previous inside the Next section of the preceding file or as a note at the top.

### Rules

1. Use arrow indicators: `-->` for Next, `<--` for Previous.
2. Include the part number and title in the link text.
3. The last tutorial file omits the Next section.
4. The first tutorial file omits the Previous link.
5. Keep Next/Previous links consistent -- if part 2 links back to part 1, part 1 must link forward to part 2.

---

## Related Links

Reference and flow docs may end with a `## Related` section:

```markdown
## Related

- [Output Modes](./OUTPUT_MODES.md) -- Details on each output consumer
- [Retry and Resume](./RETRY_RESUME.md) -- Checkpoint resume flow
```

### Rules

1. Place at the very end of the file, before any changelog.
2. Use bullet list format with brief descriptions.
3. Only link to closely related docs, not the entire tree.
4. Use relative paths.

---

## Path Conventions

| Convention                                       | Example                              |
| ------------------------------------------------ | ------------------------------------ |
| Always use relative paths                        | `../README.md`, not `/docs/README.md`|
| Include file extension                           | `quick-start.md`, not `quick-start`  |
| Link to README.md explicitly for directories     | `api/README.md`, not `api/`          |
| Use `./` prefix for same-directory sibling links | `./ARCHITECTURE.md`                  |
| Omit `./` for Contents links in README           | `quick-start.md` (either is fine)    |

## Broken Link Prevention

- Before committing, verify every link target exists.
- When renaming a file, search for all links pointing to the old name.
- When deleting a file, remove it from its parent README's Contents list.
- The check script (`scripts/check.py`) flags orphan files and missing link targets.
