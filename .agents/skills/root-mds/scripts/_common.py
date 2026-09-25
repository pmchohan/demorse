#!/usr/bin/env python3
"""Shared helpers for root-mds check scripts."""

from __future__ import annotations

import os
import re
import sys

# -------
# Config
# -------

MAX_README_LINES = 300

BADGE_PAT = re.compile(r"!\[[^\]]*\]\(https?://img\.shields\.io/")
H1_PAT = re.compile(r"^#\s+")
H2_PAT = re.compile(r"^##\s+")
DETAILS_PAT = re.compile(r"<details>", re.IGNORECASE)
DETAILS_SUMMARY_PAT = re.compile(r"<summary>", re.IGNORECASE)
LICENSE_SECTION_PAT = re.compile(r"^##\s+License", re.IGNORECASE)
QUICK_START_PAT = re.compile(r"^##\s+(Quick\s+Start|Getting\s+Started|Run|Installation)", re.IGNORECASE)

COMMUNITY_FILES = {
    "LICENSE": ("missing-license-file", "WARN", "no LICENSE file — add one for legal clarity"),
    "CONTRIBUTING.md": ("missing-contributing", "INFO", "no CONTRIBUTING.md — add contributor guidelines"),
    "CODE_OF_CONDUCT.md": ("missing-code-of-conduct", "INFO", "no CODE_OF_CONDUCT.md — add community standards"),
    "SECURITY.md": ("missing-security", "INFO", "no SECURITY.md — add vulnerability reporting instructions"),
}

# Also accept these variants for LICENSE
LICENSE_VARIANTS = {"LICENSE", "LICENSE.md", "LICENSE.txt"}

FENCE_PAT = re.compile(r"^(`{3,}|~{3,})")

# -------
# Helpers
# -------

class Finding:
    __slots__ = ("path", "line", "severity", "rule", "message")

    def __init__(self, path: str, line: int, severity: str, rule: str, message: str):
        self.path = path
        self.line = line
        self.severity = severity
        self.rule = rule
        self.message = message

    def emit(self) -> str:
        return f"{self.path}:{self.line}: [{self.severity}] [{self.rule}] {self.message}"


def read_lines(path: str) -> list[str] | None:
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            return f.read().splitlines()
    except OSError:
        return None


def strip_fenced_blocks(lines: list[str]) -> list[tuple[int, str]]:
    """Return (1-based line number, line) pairs, skipping fenced code blocks."""
    result: list[tuple[int, str]] = []
    in_fence = False
    fence_marker = ""
    for i, line in enumerate(lines):
        stripped = line.strip()
        m = FENCE_PAT.match(stripped)
        if m:
            marker_char = m.group(1)[0]
            marker_len = len(m.group(1))
            if not in_fence:
                in_fence = True
                fence_marker = marker_char * marker_len
                result.append((i + 1, ""))
            elif stripped.startswith(fence_marker) and len(stripped.replace(marker_char, "").strip()) == 0:
                in_fence = False
                fence_marker = ""
                result.append((i + 1, ""))
            else:
                result.append((i + 1, ""))
        elif in_fence:
            result.append((i + 1, ""))
        else:
            result.append((i + 1, line))
    return result


def find_readme(repo_root: str) -> str | None:
    """Find README.md in the given directory."""
    readme = os.path.join(repo_root, "README.md")
    if os.path.isfile(readme):
        return readme
    # Case-insensitive fallback
    for f in os.listdir(repo_root):
        if f.lower() == "readme.md":
            return os.path.join(repo_root, f)
    return None


def has_license_file(repo_root: str) -> bool:
    """Check if any LICENSE variant exists."""
    for variant in LICENSE_VARIANTS:
        if os.path.isfile(os.path.join(repo_root, variant)):
            return True
    return False


def run_checks(argv: list[str], script_name: str, check_fn) -> int:
    if len(argv) < 2:
        sys.stderr.write(f"usage: {script_name} REPO_ROOT\n")
        return 2

    repo_root = argv[1]
    if not os.path.isdir(repo_root):
        sys.stderr.write(f"error: {repo_root} is not a directory\n")
        return 2

    findings: list[Finding] = []
    check_fn(repo_root, findings)

    if not findings:
        print(f"OK: no {script_name.replace('.py', '').replace('check-', '')} issues found")
        return 0

    findings.sort(key=lambda f: (f.path, f.line, f.rule))
    for f in findings:
        print(f.emit())

    n_warn = sum(1 for f in findings if f.severity == "WARN")
    n_info = sum(1 for f in findings if f.severity == "INFO")
    print(f"\nSummary: {len(findings)} finding(s) — WARN={n_warn}, INFO={n_info}")
    return 1
