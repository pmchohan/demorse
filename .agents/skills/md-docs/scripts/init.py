#!/usr/bin/env python3
"""
init.py — scaffold a new docs directory with README.md and AGENTS.md.

Creates a minimal docs/ structure based on project complexity:

Usage:
    python3 init.py docs/                       # small (flat)
    python3 init.py docs/ --layout medium       # developer/ + user/ split
    python3 init.py docs/ --layout large        # adds flow/, tutorial/, operations/

Exit codes:
    0  Scaffold created (or already exists)
    2  Bad invocation
"""

from __future__ import annotations

import os
import sys

LAYOUTS = {
    "small": [],
    "medium": ["developer", "user"],
    "large": ["developer", "user", "flow", "tutorial", "operations"],
}

AGENTS_TEMPLATE = """\
# {project} — Agent Notes

{project} docs. This file is standalone context for LLM agents.

## Docs Map

- Root: `README.md`, `AGENTS.md`{extra_dirs}

## Docs Rules

- Every docs directory gets a `README.md`.
- README files include a `[Go Back](../README.md)` link (except root).
- README files stay concise and navigational.
- Detailed content belongs in topic files, not README hubs.
- `AGENTS.md` stays compact, standalone, and link-free.
"""

ROOT_README_TEMPLATE = """\
# {project} Documentation

## Contents

{links}
"""

DIR_README_TEMPLATE = """\
# {title}

[Go Back](../README.md)

Overview of {title_lower} documentation.

## Contents

(add topic file links here)
"""


def slugify(name: str) -> str:
    return name.replace("-", " ").replace("_", " ").title()


def create_file(path: str, content: str) -> bool:
    if os.path.exists(path):
        print(f"  skip {path} (already exists)")
        return False
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  create {path}")
    return True


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        sys.stderr.write("usage: init.py DOCS_DIR [--layout small|medium|large]\n")
        return 2

    docs_dir = argv[1]
    layout = "small"
    if "--layout" in argv:
        idx = argv.index("--layout")
        if idx + 1 < len(argv) and argv[idx + 1] in LAYOUTS:
            layout = argv[idx + 1]
        else:
            sys.stderr.write(f"error: --layout must be one of {list(LAYOUTS.keys())}\n")
            return 2

    project = slugify(os.path.basename(os.path.abspath(os.path.join(docs_dir, ".."))))
    subdirs = LAYOUTS[layout]

    print(f"Scaffolding docs at {docs_dir} (layout={layout})")

    os.makedirs(docs_dir, exist_ok=True)

    # Root README
    if subdirs:
        links = "\n".join(f"- [{slugify(d)}]({d}/README.md)" for d in subdirs)
    else:
        links = "(add topic file links here)"

    create_file(
        os.path.join(docs_dir, "README.md"),
        ROOT_README_TEMPLATE.format(project=project, links=links),
    )

    # AGENTS.md
    if subdirs:
        extra = ", " + ", ".join(f"`{d}/`" for d in subdirs)
    else:
        extra = ""
    create_file(
        os.path.join(docs_dir, "AGENTS.md"),
        AGENTS_TEMPLATE.format(project=project, extra_dirs=extra),
    )

    # Sub-directories
    for d in subdirs:
        dirpath = os.path.join(docs_dir, d)
        os.makedirs(dirpath, exist_ok=True)
        create_file(
            os.path.join(dirpath, "README.md"),
            DIR_README_TEMPLATE.format(
                title=slugify(d),
                title_lower=slugify(d).lower(),
            ),
        )

    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
