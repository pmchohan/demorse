#!/usr/bin/env python3
"""
check-structure — directory-level documentation structure rules.

Rules:
    missing-readme      WARN   directory with docs content but no README.md
    missing-agents      WARN   docs root has no AGENTS.md
    gitkeep-with-readme INFO   .gitkeep in a directory that already has README.md
    deep-nesting        INFO   directory deeper than 4 levels below root
    orphan-file         WARN   markdown file not linked from parent README
    unlinked-dir        INFO   sub-directory with README not linked from parent
"""

from __future__ import annotations

import os
import sys

from _common import (
    GITKEEP_NAME,
    MAX_DEPTH,
    MD_LINK_PAT,
    SKIP_README_DIRS,
    Finding,
    is_md,
    read_lines,
    run_checks,
)


def check_dir_has_readme(root: str, findings: list[Finding]) -> None:
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_README_DIRS and not d.startswith(".")]
        if not dirnames and not filenames:
            continue
        has_md = any(f.lower().endswith(".md") for f in filenames)
        has_readme = "README.md" in filenames
        has_subdirs = bool(dirnames)
        if (has_md or has_subdirs) and not has_readme:
            findings.append(Finding(
                dirpath, 1, "WARN", "missing-readme",
                "directory has docs content but no README.md",
            ))


def check_gitkeep_with_readme(root: str, findings: list[Finding]) -> None:
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_README_DIRS and not d.startswith(".")]
        if GITKEEP_NAME in filenames and "README.md" in filenames:
            findings.append(Finding(
                os.path.join(dirpath, GITKEEP_NAME), 1, "INFO", "gitkeep-with-readme",
                ".gitkeep is unnecessary — directory already has README.md",
            ))


def check_depth(root: str, findings: list[Finding]) -> None:
    root_depth = root.rstrip(os.sep).count(os.sep)
    for dirpath, dirnames, _ in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_README_DIRS and not d.startswith(".")]
        depth = dirpath.rstrip(os.sep).count(os.sep) - root_depth
        if depth > MAX_DEPTH:
            findings.append(Finding(
                dirpath, 1, "INFO", "deep-nesting",
                f"directory is {depth} levels deep (max recommended: {MAX_DEPTH}) — consider flattening",
            ))


def check_agents_exists(root: str, findings: list[Finding]) -> None:
    agents_path = os.path.join(root, "AGENTS.md")
    if not os.path.isfile(agents_path):
        findings.append(Finding(
            root, 1, "WARN", "missing-agents",
            "docs root has no AGENTS.md — add one for LLM context",
        ))


def check_orphan_files(root: str, findings: list[Finding]) -> None:
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_README_DIRS and not d.startswith(".")]
        readme_path = os.path.join(dirpath, "README.md")
        if not os.path.isfile(readme_path):
            continue
        readme_lines = read_lines(readme_path)
        if readme_lines is None:
            continue
        readme_text = "\n".join(readme_lines)

        link_targets = set()
        for m in MD_LINK_PAT.finditer(readme_text):
            target = m.group(2).split("#")[0]
            if target:
                link_targets.add(target)

        for f in filenames:
            if not is_md(f) or f == "README.md" or f == "AGENTS.md":
                continue
            referenced = f in link_targets or f"./{f}" in link_targets
            if not referenced:
                findings.append(Finding(
                    os.path.join(dirpath, f), 1, "WARN", "orphan-file",
                    f"not linked from {os.path.join(dirpath, 'README.md')} — add to Contents",
                ))

        for d in dirnames:
            readme_ref = f"{d}/README.md"
            dir_ref = f"{d}/"
            dir_ref_dot = f"./{d}/"
            readme_ref_dot = f"./{d}/README.md"
            referenced = (
                readme_ref in link_targets
                or dir_ref in link_targets
                or dir_ref_dot in link_targets
                or readme_ref_dot in link_targets
            )
            if not referenced and os.path.isfile(os.path.join(dirpath, d, "README.md")):
                findings.append(Finding(
                    os.path.join(dirpath, d), 1, "INFO", "unlinked-dir",
                    "sub-directory not linked from parent README",
                ))


def run(args: list[str], paths: list[str], findings: list[Finding]) -> None:
    for arg in args:
        if os.path.isdir(arg):
            check_dir_has_readme(arg, findings)
            check_gitkeep_with_readme(arg, findings)
            check_depth(arg, findings)
            check_agents_exists(arg, findings)
            check_orphan_files(arg, findings)


if __name__ == "__main__":
    sys.exit(run_checks(sys.argv, "check-structure.py", run))
