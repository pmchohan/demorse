# README Files

Rules for writing `README.md` hub files in a docs tree.

---

## Purpose

A README is a **navigational hub**. It tells the reader what this directory contains and links them to the right file. It does not hold detailed content.

## Template

```markdown
# Section Title

[Go Back](../README.md)

One-line description of this section.

## Contents

- [Topic Name](topic-file.md)
- [Another Topic](another-topic.md)
- [Sub-section](sub-dir/README.md)
```

## Rules

1. **Keep it short** -- aim for 10-20 lines. A README that scrolls is doing too much.
2. **One H1 heading** -- the section title. No second H1.
3. **Go Back link immediately after H1** -- `[Go Back](../README.md)`. The docs root README links to the repo root instead: `[Go Back](../README.md)`.
4. **One-line description** -- a single sentence explaining what this section covers. Not a paragraph.
5. **`## Contents` section** -- a bullet list of links. This is the main body.
6. **Link to `README.md` explicitly** when pointing to a sub-directory: `[API](api/README.md)`, not `[API](api/)`.
7. **No detailed content** -- if you need more than a sentence of explanation for a topic, it belongs in a topic file, not the README.
8. **No code blocks** in README hubs. Code examples belong in topic files.
9. **Consistent link format** -- use relative paths: `./file.md` or `file.md`, not absolute paths.

## Docs Root README

The `docs/README.md` is special:
- Its Go Back link points to the repo root: `[Go Back](../README.md)`.
- It has a brief project description (1-2 sentences).
- Its Contents section links to the top-level directories: `developer/README.md`, `user/README.md`, etc.

Example:

```markdown
# Project Docs

[Go Back](../README.md)

Documentation for the Foo project.

## Contents

- [Developer Docs](developer/README.md)
- [User Docs](user/README.md)
```

## Sub-directory README

A README inside a sub-directory follows the standard template. It links back to its parent directory's README:

```markdown
# Developer Docs

[Go Back](../README.md)

Internal documentation for developers.

## Contents

- [Project](project/README.md)
- [Programming](programming/README.md)
```

## Leaf Directory README

A leaf directory (one with topic files but no sub-directories) lists its topic files:

```markdown
# API Developer Guide

[Go Back](../README.md)

Run, test, build, and operate the API.

## Contents

- [Quick Start](quick-start.md)
- [Environment](environment.md)
- [Commands](commands.md)
- [Testing](testing.md)
- [Troubleshooting](troubleshooting.md)
```

## Anti-patterns

| Problem                                    | Fix                                              |
| ------------------------------------------ | ------------------------------------------------ |
| README with 100+ lines of content          | Extract to topic files; keep README navigational |
| README with code blocks                    | Move code to a topic file                        |
| Missing Go Back link                       | Add it immediately after H1                      |
| Links to directories without `/README.md`  | Always link to the explicit `README.md`          |
| README that duplicates topic file content  | Remove duplication; link instead                 |
| Multiple H1 headings                       | One H1 per file                                  |
