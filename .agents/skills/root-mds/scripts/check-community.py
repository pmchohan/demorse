#!/usr/bin/env python3
"""
check-community — community file presence rules.

Rules:
    missing-license-file    WARN   no LICENSE file in repo root
    missing-contributing    INFO   no CONTRIBUTING.md
    missing-code-of-conduct INFO   no CODE_OF_CONDUCT.md
    missing-security        INFO   no SECURITY.md
"""

from __future__ import annotations

import os
import sys

from _common import (
    COMMUNITY_FILES,
    Finding,
    has_license_file,
    run_checks,
)


def run(repo_root: str, findings: list[Finding]) -> None:
    for filename, (rule, severity, message) in COMMUNITY_FILES.items():
        if filename == "LICENSE":
            if not has_license_file(repo_root):
                findings.append(Finding(repo_root, 1, severity, rule, message))
        else:
            if not os.path.isfile(os.path.join(repo_root, filename)):
                findings.append(Finding(repo_root, 1, severity, rule, message))


if __name__ == "__main__":
    sys.exit(run_checks(sys.argv, "check-community.py", run))
