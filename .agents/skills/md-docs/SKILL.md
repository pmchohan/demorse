---
name: md-docs
description: Creates and maintains directory-based Markdown documentation with README hubs, AGENTS.md context files, Go Back links, navigation, and doc-type conventions (reference, tutorial, flow, operations).
version: 1.0.0
author: MAbdullahAhmad
tags: [docs, markdown, documentation, readme, agents, navigation]
triggers:
  - "write docs for this project"
  - "set up a docs directory"
  - "add documentation"
  - "create README files"
  - "write an AGENTS.md"
  - "document this feature"
  - "organize project docs"
---

# SKILL: Markdown Documentation

## When to Use This Skill

Activate when the user asks to:
- Create or restructure a `docs/` directory for a project.
- Write README.md hub files for documentation directories.
- Write an AGENTS.md context file for LLM agents.
- Add reference, tutorial, flow, or operations documentation.
- Fix missing navigation links, Go Back links, or broken doc structure.

Do NOT activate when:
- The user wants API endpoint docs auto-generated from code annotations (e.g. Swagger/OpenAPI).
- The change is about in-code comments or docstrings only -> use `programming-style`.
- The user is asking about a README at the repo root that is not part of a `docs/` tree.

---

## Phase 1 -- Audit Existing Docs

Run the check script on the docs directory (or any directory tree containing `.md` files). It prints `path:line: [SEVERITY] [RULE] message`.

```bash
python3 skills/md-docs/scripts/check.py docs/
python3 skills/md-docs/scripts/check.py docs/developer/api/
```

Pick the right script for the job:

| Script               | When to use                                          |
| -------------------- | ---------------------------------------------------- |
| `check.py`           | Full audit — runs all checks                         |
| `check-structure.py` | Directory tree only (missing READMEs, orphan files)  |
| `check-content.py`   | File content only (headings, links, AGENTS.md)       |

See `scripts/README.md` for the full rule list.

---

## Phase 2 -- Plan the Directory Tree

Before writing any content, plan the full directory tree. Every documentation directory must have a `README.md`. The root `docs/` directory also gets an `AGENTS.md`.

For a new project, use `init.py` to scaffold the structure:

```bash
python3 skills/md-docs/scripts/init.py docs/                   # small (flat)
python3 skills/md-docs/scripts/init.py docs/ --layout medium   # developer/ + user/
python3 skills/md-docs/scripts/init.py docs/ --layout large    # + flow/, tutorial/, operations/
```

Decide which **doc types** each section needs based on complexity:

| Project Complexity | Recommended Sections                                   |
| ------------------ | ------------------------------------------------------ |
| Small (1-3 devs)   | `docs/README.md` + `AGENTS.md` + flat topic files      |
| Medium              | `developer/`, `user/` split; topic files per area       |
| Large               | Add `flow/` (ASCII diagrams), `tutorial/`, `operations/`|

For detailed directory layout rules, read `details/directory-structure.md`.

---

## Phase 3 -- Write README Hub Files

Every directory gets a `README.md` that serves as a navigational hub:

```markdown
# Section Title

[Go Back](../README.md)

One-line description of what this section covers.

## Contents

- [Topic Name](topic-file.md)
- [Sub-section](sub-dir/README.md)
```

Rules for README files:
1. Keep them concise and navigational -- no detailed content.
2. Always include a `[Go Back](../README.md)` link (except `docs/README.md` which links to repo root).
3. Link to `README.md` explicitly when pointing to sub-directories.
4. Use a `## Contents` section with a bullet list of links.

For deeper rules, read `details/readme-files.md`.

---

## Phase 4 -- Write AGENTS.md

The `docs/AGENTS.md` file is standalone context for LLM agents. It must:
- Be self-contained: no links to other files.
- Describe the docs map (directory layout) in compact bullet form.
- List docs rules (conventions agents must follow).
- Optionally list programming conventions if relevant.

For the template and full rules, read `details/agents-file.md`.

---

## Phase 5 -- Write Topic Files

Topic files contain the actual documentation. Choose the right doc type:

| Doc Type     | Structure                          | Use When                                      |
| ------------ | ---------------------------------- | --------------------------------------------- |
| Reference    | H2 categories + bullets/tables     | Environment vars, config, API surface          |
| Procedural   | Numbered H2 steps + code blocks    | Quick-start, setup, how-to guides              |
| Tutorial     | Numbered files, Next/Previous links| Sequential learning path across multiple files |
| Flow         | ASCII diagrams + annotations       | Architecture, pipelines, data flow             |
| Operations   | Commands + config blocks           | Deploy, cron, systemd, troubleshooting         |

Every topic file starts with:
```markdown
# Title

[Go Back](README.md)
```

For detailed conventions per doc type, read `details/doc-types.md`.

---

## Phase 6 -- Add Navigation

Navigation links connect docs into a browsable tree:

| Link Type   | Format                                             | Where                          |
| ----------- | -------------------------------------------------- | ------------------------------ |
| Go Back     | `[Go Back](../README.md)`                          | Every file except repo root    |
| Contents    | `- [Name](file.md)`                                | README hub files               |
| Next        | `[Part N: Title -->](./0N-FILE.md)`                | End of tutorial/sequential docs|
| Previous    | `[<-- Part N: Title](./0N-FILE.md)`                | Start of tutorial part 2+      |
| Related     | `## Related` section with bullet links             | End of reference/flow docs     |

For full navigation rules, read `details/navigation.md`.

---

## Phase 7 -- Verify

1. Re-run `scripts/check.py` on the docs tree -- fix all WARN findings.
2. Confirm every directory has a `README.md`.
3. Confirm `docs/AGENTS.md` exists and contains no links.
4. Confirm all README files have a Go Back link.
5. Confirm all topic files start with H1 + Go Back link.
6. Walk the navigation tree manually: every link target must exist.

---

## Quick Reference

### Required Files

| File              | Location          | Purpose                                |
| ----------------- | ----------------- | -------------------------------------- |
| `README.md`       | Every docs dir    | Navigational hub                       |
| `AGENTS.md`       | `docs/` root only | Standalone LLM context                 |

### Directory Layout (medium project)

```
docs/
  README.md
  AGENTS.md
  developer/
    README.md
    project/
      README.md
      ...topic files...
    programming/
      README.md
      ...topic files...
  user/
    README.md
    admin/
      README.md
    client/
      README.md
```

### Heading Hierarchy

| Level | Use                               |
| ----- | --------------------------------- |
| H1    | Document title (one per file)     |
| H2    | Major sections                    |
| H3    | Subsections (use sparingly)       |
| H4+   | Avoid -- flatten instead          |

### Content Preferences

| Prefer         | Over                              |
| -------------- | --------------------------------- |
| Tables         | Long prose lists                  |
| Bullet lists   | Paragraphs for enumerations       |
| Code blocks    | Inline descriptions of commands   |
| Short bullets  | Verbose explanations              |
| ASCII diagrams | No visual at all                  |

---

## Common Mistakes to Avoid

| Anti-pattern                                          | Correct approach                                                  |
| ----------------------------------------------------- | ----------------------------------------------------------------- |
| Directory without `README.md`                         | Every docs directory must have a `README.md`                      |
| README with detailed content                          | Keep README navigational; move detail to topic files              |
| Missing Go Back link                                  | Every file gets `[Go Back](../README.md)` or `[Go Back](README.md)` |
| `AGENTS.md` with clickable links                      | AGENTS.md must be standalone and link-free                        |
| `.gitkeep` in dirs that have a README                 | Remove `.gitkeep` once README exists                              |
| Deeply nested headings (H4, H5, H6)                  | Flatten to H2/H3 or split into separate files                    |
| Tutorial files without Next/Previous links            | Add `[Part N: Title -->]` at end of each tutorial part           |
| Topic file missing H1 title                           | Every `.md` file starts with `# Title`                           |
| Prose paragraphs where a table works                  | Use tables for mappings, comparisons, option lists                |
| Orphan files not linked from any README               | Every file must be reachable from its parent README               |

---

## Quality Checklist

- [ ] `scripts/check.py` returns no WARN findings on the docs tree.
- [ ] Every directory under `docs/` has a `README.md`.
- [ ] `docs/AGENTS.md` exists, is standalone, and contains no markdown links.
- [ ] All README files include a Go Back link.
- [ ] All topic files start with H1 + Go Back link.
- [ ] README files are concise (under ~20 lines for navigation hubs).
- [ ] No `.gitkeep` files in directories that already have a README.
- [ ] Tutorial/sequential docs have Next (and optionally Previous) links.
- [ ] Every topic file is linked from its parent README.
- [ ] No heading deeper than H3 is used; prefer splitting files instead.

---

## Changelog

| Version | Date       | Change          |
| ------- | ---------- | --------------- |
| 1.0.0   | 2026-05-21 | Initial release |
