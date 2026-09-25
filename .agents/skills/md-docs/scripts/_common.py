#!/usr/bin/env python3
"""Shared helpers for md-docs check scripts."""

from __future__ import annotations

import os
import re
import sys
from typing import Iterable

# -------
# Config
# -------

MD_EXT = ".md"

SKIP_README_DIRS = {".git", "node_modules", "__pycache__", ".DS_Store"}

MAX_DEPTH = 4
MAX_README_LINES = 40
MAX_AGENTS_LINES = 80

GO_BACK_PAT = re.compile(r"\[Go\s+Back\]\(([^)]+)\)", re.IGNORECASE)
MD_LINK_PAT = re.compile(r"\[([^\]]*)\]\(([^)]+)\)")
H1_PAT = re.compile(r"^#\s+")
H2_PAT = re.compile(r"^##\s+")
H3_PAT = re.compile(r"^###\s+")
H4_PLUS_PAT = re.compile(r"^#{4,}\s+")
GITKEEP_NAME = ".gitkeep"

FENCE_PAT = re.compile(r"^(`{3,}|~{3,})")
INLINE_CODE_PAT = re.compile(r"`[^`]+`")

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


def norm(path: str) -> str:
    return path.replace("\\", "/")


def is_md(path: str) -> bool:
    return path.lower().endswith(MD_EXT)


def strip_fenced_blocks(lines: list[str]) -> list[tuple[int, str]]:
    """Return (1-based line number, line) pairs, skipping fenced code blocks
    and blanking inline code spans."""
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
            cleaned = INLINE_CODE_PAT.sub("", line)
            result.append((i + 1, cleaned))
    return result


def expand_paths(args: Iterable[str]) -> list[str]:
    out: list[str] = []
    for a in args:
        if os.path.isdir(a):
            for root, dirs, files in os.walk(a):
                dirs[:] = [d for d in dirs if d not in SKIP_README_DIRS and not d.startswith(".")]
                for name in files:
                    if is_md(name):
                        out.append(os.path.join(root, name))
        elif is_md(a):
            out.append(a)
    return out


def run_checks(argv: list[str], script_name: str, check_fn) -> int:
    if len(argv) < 2:
        sys.stderr.write(f"usage: {script_name} PATH [PATH ...]\n")
        return 2

    paths = expand_paths(argv[1:])
    findings: list[Finding] = []

    # Pass raw args for directory-level checks
    check_fn(argv[1:], paths, findings)

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
