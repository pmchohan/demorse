#!/usr/bin/env python3
"""
check-structure — README.md content and structure rules.

Rules:
    missing-readme      WARN   no README.md in repo root
    missing-h1          WARN   README does not start with an H1 title
    missing-badges      WARN   no shields.io badges found
    missing-toc         WARN   no collapsible <details> table of contents
    missing-description INFO   no description paragraph after header/badges
    missing-license-sec WARN   no ## License section
    missing-quick-start INFO   no Quick Start / Getting Started section
    long-readme         INFO   README exceeds 300 lines
"""

from __future__ import annotations

import sys

from _common import (
    BADGE_PAT,
    DETAILS_PAT,
    H1_PAT,
    LICENSE_SECTION_PAT,
    MAX_README_LINES,
    QUICK_START_PAT,
    Finding,
    find_readme,
    read_lines,
    run_checks,
    strip_fenced_blocks,
)


def run(repo_root: str, findings: list[Finding]) -> None:
    readme_path = find_readme(repo_root)
    if readme_path is None:
        findings.append(Finding(
            repo_root, 1, "WARN", "missing-readme",
            "no README.md in repo root",
        ))
        return

    lines = read_lines(readme_path)
    if lines is None:
        return

    cleaned = strip_fenced_blocks(lines)

    # --- missing-h1 ---
    has_h1 = False
    for _, line in cleaned:
        stripped = line.strip()
        if not stripped:
            continue
        if H1_PAT.match(stripped):
            has_h1 = True
        break
    if not has_h1:
        findings.append(Finding(
            readme_path, 1, "WARN", "missing-h1",
            "README does not start with an H1 title — add '# Project Name' on line 1",
        ))

    # --- missing-badges ---
    has_badges = any(BADGE_PAT.search(line) for _, line in cleaned)
    if not has_badges:
        findings.append(Finding(
            readme_path, 1, "WARN", "missing-badges",
            "no shields.io badges found — add at least a license badge",
        ))

    # --- missing-toc ---
    has_toc = any(DETAILS_PAT.search(line) for _, line in cleaned)
    if not has_toc:
        findings.append(Finding(
            readme_path, 1, "WARN", "missing-toc",
            "no collapsible <details> table of contents — add one after the description",
        ))

    # --- missing-description ---
    # Description is a non-empty paragraph that is not H1, not a badge, not HTML
    # appearing in the first 20 non-blank lines
    has_desc = False
    content_line_count = 0
    for _, line in cleaned:
        stripped = line.strip()
        if not stripped:
            continue
        content_line_count += 1
        if content_line_count > 20:
            break
        if H1_PAT.match(stripped):
            continue
        if BADGE_PAT.search(stripped):
            continue
        if stripped.startswith("<") and not stripped.startswith("<details"):
            continue
        if stripped.startswith("[") and BADGE_PAT.search(line):
            continue
        # Found a text paragraph
        if len(stripped) > 15:
            has_desc = True
            break
    if not has_desc:
        findings.append(Finding(
            readme_path, 1, "INFO", "missing-description",
            "no description paragraph found after header/badges — add a one-sentence project summary",
        ))

    # --- missing-license-sec ---
    has_license_sec = any(LICENSE_SECTION_PAT.match(line) for _, line in cleaned)
    if not has_license_sec:
        findings.append(Finding(
            readme_path, 1, "WARN", "missing-license-sec",
            "no '## License' section — add one at the end of the README",
        ))

    # --- missing-quick-start ---
    has_quick_start = any(QUICK_START_PAT.match(line) for _, line in cleaned)
    if not has_quick_start:
        findings.append(Finding(
            readme_path, 1, "INFO", "missing-quick-start",
            "no Quick Start / Getting Started section — add one so users can run the project fast",
        ))

    # --- long-readme ---
    if len(lines) > MAX_README_LINES:
        findings.append(Finding(
            readme_path, len(lines), "INFO", "long-readme",
            f"README is {len(lines)} lines (max recommended: {MAX_README_LINES}) — move detail to docs/",
        ))


if __name__ == "__main__":
    sys.exit(run_checks(sys.argv, "check-structure.py", run))
