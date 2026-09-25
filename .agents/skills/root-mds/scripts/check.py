#!/usr/bin/env python3
"""
root-mds check — runs ALL check scripts in one pass.

For targeted checks, use individual scripts:
    check-structure.py, check-community.py

Usage:
    python3 check.py REPO_ROOT

Exit codes:
    0  No findings
    1  Findings emitted
    2  Bad invocation
"""

from __future__ import annotations

import importlib.util
import os
import sys

from _common import Finding, run_checks

_SCRIPTS = [
    "check-structure",
    "check-community",
]


def _load_runners() -> list:
    runners = []
    script_dir = os.path.dirname(os.path.abspath(__file__))
    for name in _SCRIPTS:
        mod_name = name.replace("-", "_")
        spec = importlib.util.spec_from_file_location(
            mod_name, os.path.join(script_dir, f"{name}.py")
        )
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        runners.append(mod.run)
    return runners


def run(repo_root: str, findings: list[Finding]) -> None:
    for runner in _load_runners():
        runner(repo_root, findings)


if __name__ == "__main__":
    sys.exit(run_checks(sys.argv, "check.py", run))
