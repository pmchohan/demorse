# AGENTS.md File

Rules for writing standalone LLM context files.

---

## Purpose

`AGENTS.md` is a **standalone reference** for AI agents and LLMs. It gives an agent enough context to work with the docs tree (or codebase) without clicking through links. It is not a navigation file -- that is the README's job.

## Where It Goes

- **Required**: `docs/AGENTS.md` -- one per docs tree.
- **Optional**: `tutorial/AGENTS.md` -- when a tutorial section needs a reading-order guide with source path references.
- Do not put AGENTS.md in every directory. It is not a README replacement.

## Template

```markdown
# Project Docs Agent Notes

Brief context sentence for the agent.

## Docs Map

- Root docs: `README.md`, `AGENTS.md`, `developer/`, `user/`.
- Root `README.md`: short intro and table of contents only.
- Developer docs: `project/`, `api/`, `programming/`.
- User docs: `admin/`, `client/`, written simply and task-first.

## Docs Rules

- Every docs directory gets a `README.md`.
- README files include a clickable `Go Back` link.
- README files stay concise and navigational.
- Detailed content belongs in topic files.
- Use short practical bullets; add prose only when it prevents confusion.
- `AGENTS.md` stays compact, standalone, and link-free.

## Programming Conventions

- (Optional section -- include when agents need codebase context.)
- Naming: classes use CapitalCase; functions use snake_case.
- ...
```

## Rules

1. **No markdown links** -- AGENTS.md must not contain `[text](url)` links. Use backtick paths instead: `` `developer/README.md` ``.
2. **Self-contained** -- an agent reading only this file should understand the docs layout and conventions. It must not depend on reading other files first.
3. **Compact** -- aim for 30-60 lines. Use terse bullet points, not paragraphs.
4. **Three standard sections**:
   - `## Docs Map` -- describes the directory hierarchy in compact bullets.
   - `## Docs Rules` -- lists conventions that docs must follow.
   - `## Programming Conventions` -- optional; lists codebase conventions relevant to documentation.
5. **Use backtick paths** to reference directories and files: `` `developer/` ``, `` `README.md` ``.
6. **No H3+ headings** -- keep the structure flat: H1 title, H2 sections, bullet lists.
7. **Update when structure changes** -- if a new top-level directory is added to docs, update the Docs Map.

## Tutorial AGENTS.md

A tutorial directory may have its own AGENTS.md with:
- A numbered reading order for the tutorial files.
- Key source paths relevant to the tutorial.
- Editorial guidelines for maintaining the tutorial.

Example:

```markdown
# Tutorial -- Agent Instructions

Read these files in order when learning the codebase.

## Reading Order

1. `01-JOBS-AND-TASKS.md` -- Core concepts
2. `02-ENGINE-AND-PROXIES.md` -- HTTP and proxy system
3. `03-CONSUMERS.md` -- Output consumers

## Key Source Paths

- Jobs: `src/jobs/`
- Tasks: `src/tasks/`
- Consumers: `src/consumers/`

## When Editing

- Keep examples concrete with real class names.
- Do not reference deprecated class names.
```

Note: tutorial AGENTS.md files **may** contain markdown links for the reading order since they serve as a guided index. This is the only exception to the no-links rule.

## Anti-patterns

| Problem                                | Fix                                              |
| -------------------------------------- | ------------------------------------------------ |
| AGENTS.md with `[Go Back](...)` links  | Remove all markdown links; use backtick paths    |
| AGENTS.md over 80 lines               | Trim to essential info; move details elsewhere   |
| AGENTS.md that duplicates README       | Different purpose: README navigates, AGENTS contextualizes |
| Missing Docs Map section              | Always include -- agents need the directory layout |
| AGENTS.md in every sub-directory      | Only in `docs/` root and optionally `tutorial/`  |
