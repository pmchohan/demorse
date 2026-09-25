#!/usr/bin/env python3
"""
check-content — file-level documentation content rules.

Rules:
    no-h1-title         WARN   file does not start with an H1 heading
    multiple-h1         WARN   file has more than one H1 heading
    missing-go-back     WARN   file has no [Go Back] link near the top
    deep-heading        INFO   H4+ heading found
    readme-too-long     INFO   README exceeds 40 lines
    agents-has-links    WARN   AGENTS.md contains markdown links
    agents-too-long     INFO   AGENTS.md exceeds 80 lines
    broken-link         WARN   markdown link target does not exist
    dir-link-no-readme  INFO   README links to a directory instead of its README.md
"""

from __future__ import annotations

import os
import re
import sys

from _common import (
    GO_BACK_PAT,
    H1_PAT,
    H4_PLUS_PAT,
    MAX_AGENTS_LINES,
    MAX_README_LINES,
    MD_LINK_PAT,
    Finding,
    read_lines,
    strip_fenced_blocks,
    run_checks,
)


def check_h1_first_line(path: str, lines: list[str], findings: list[Finding]) -> None:
    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped:
            continue
        if not H1_PAT.match(stripped):
            findings.append(Finding(
                path, i + 1, "WARN", "no-h1-title",
                "file does not start with an H1 heading",
            ))
        break


def check_single_h1(path: str, lines: list[str], findings: list[Finding]) -> None:
    stripped = strip_fenced_blocks(lines)
    h1_lines = [ln for ln, text in stripped if H1_PAT.match(text.strip())]
    if len(h1_lines) > 1:
        for ln in h1_lines[1:]:
            findings.append(Finding(
                path, ln, "WARN", "multiple-h1",
                "file has more than one H1 heading — use H2 instead",
            ))


def check_go_back_link(path: str, lines: list[str], findings: list[Finding]) -> None:
    base = os.path.basename(path)
    if base == "AGENTS.md":
        return
    checked = 0
    for line in lines:
        if not line.strip():
            continue
        if GO_BACK_PAT.search(line):
            return
        checked += 1
        if checked >= 5:
            break
    findings.append(Finding(
        path, 1, "WARN", "missing-go-back",
        "no [Go Back] link found near the top of the file",
    ))


def check_deep_headings(path: str, lines: list[str], findings: list[Finding]) -> None:
    stripped = strip_fenced_blocks(lines)
    for ln, text in stripped:
        if H4_PLUS_PAT.match(text.strip()):
            findings.append(Finding(
                path, ln, "INFO", "deep-heading",
                "heading is H4 or deeper — prefer H2/H3 or split into separate files",
            ))


def check_readme_length(path: str, lines: list[str], findings: list[Finding]) -> None:
    base = os.path.basename(path)
    if base != "README.md":
        return
    n = len(lines)
    if n > MAX_README_LINES:
        findings.append(Finding(
            path, n, "INFO", "readme-too-long",
            f"README has {n} lines (>{MAX_README_LINES}) — keep it navigational; move detail to topic files",
        ))


def check_agents_no_links(path: str, lines: list[str], findings: list[Finding]) -> None:
    base = os.path.basename(path)
    if base != "AGENTS.md":
        return
    parent_dir = os.path.basename(os.path.dirname(path))
    if parent_dir == "tutorial":
        return
    stripped = strip_fenced_blocks(lines)
    for ln, text in stripped:
        if MD_LINK_PAT.search(text):
            findings.append(Finding(
                path, ln, "WARN", "agents-has-links",
                "AGENTS.md should be standalone — use backtick paths instead of markdown links",
            ))


def check_agents_length(path: str, lines: list[str], findings: list[Finding]) -> None:
    base = os.path.basename(path)
    if base != "AGENTS.md":
        return
    n = len(lines)
    if n > MAX_AGENTS_LINES:
        findings.append(Finding(
            path, n, "INFO", "agents-too-long",
            f"AGENTS.md has {n} lines (>{MAX_AGENTS_LINES}) — keep it compact and essential",
        ))


def check_broken_local_links(path: str, lines: list[str], findings: list[Finding]) -> None:
    dirpath = os.path.dirname(path)
    stripped = strip_fenced_blocks(lines)
    for ln, text in stripped:
        for m in MD_LINK_PAT.finditer(text):
            target = m.group(2)
            if target.startswith(("http://", "https://", "#", "mailto:")):
                continue
            target_path = target.split("#")[0]
            if not target_path:
                continue
            full = os.path.normpath(os.path.join(dirpath, target_path))
            if not os.path.exists(full):
                findings.append(Finding(
                    path, ln, "WARN", "broken-link",
                    f"link target does not exist: {target}",
                ))


def check_dir_link_explicit(path: str, lines: list[str], findings: list[Finding]) -> None:
    base = os.path.basename(path)
    if base != "README.md":
        return
    dirpath = os.path.dirname(path)
    stripped = strip_fenced_blocks(lines)
    for ln, text in stripped:
        for m in MD_LINK_PAT.finditer(text):
            target = m.group(2).split("#")[0]
            if target.startswith(("http://", "https://")):
                continue
            if not target:
                continue
            full = os.path.normpath(os.path.join(dirpath, target))
            if os.path.isdir(full):
                findings.append(Finding(
                    path, ln, "INFO", "dir-link-no-readme",
                    f"link points to directory '{target}' — link to '{target}README.md' instead",
                ))


def run(args: list[str], paths: list[str], findings: list[Finding]) -> None:
    for path in paths:
        if not os.path.isfile(path):
            continue
        lines = read_lines(path)
        if lines is None:
            continue
        check_h1_first_line(path, lines, findings)
        check_single_h1(path, lines, findings)
        check_go_back_link(path, lines, findings)
        check_deep_headings(path, lines, findings)
        check_readme_length(path, lines, findings)
        check_agents_no_links(path, lines, findings)
        check_agents_length(path, lines, findings)
        check_broken_local_links(path, lines, findings)
        check_dir_link_explicit(path, lines, findings)


if __name__ == "__main__":
    sys.exit(run_checks(sys.argv, "check-content.py", run))
