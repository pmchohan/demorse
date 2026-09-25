#!/usr/bin/env python3
"""
init — scaffold community files for a project.

Usage:
    python3 init.py REPO_ROOT --license mit
    python3 init.py REPO_ROOT --license mit --all
    python3 init.py REPO_ROOT --license mit --author "Your Name"

Options:
    --license LICENSE   License type: mit, apache2, gpl3, proprietary (required)
    --author  NAME      Copyright holder name (default: from git config)
    --all               Also create CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md
    --dry-run           Print what would be created without writing

Exit codes:
    0  Success
    2  Bad invocation
"""

from __future__ import annotations

import argparse
import datetime
import os
import subprocess
import sys


def _git_user(repo_root: str) -> str:
    """Try to get the git user name."""
    try:
        result = subprocess.run(
            ["git", "-C", repo_root, "config", "user.name"],
            capture_output=True, text=True,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except FileNotFoundError:
        pass
    return "Your Name"


def _year() -> str:
    return str(datetime.date.today().year)


# -------
# Templates
# -------

def mit_license(author: str, year: str) -> str:
    return f"""MIT License

Copyright (c) {year} {author}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"""


def apache2_license(author: str, year: str) -> str:
    return f"""                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

Copyright {year} {author}

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""


def gpl3_license(author: str, year: str) -> str:
    return f"""Copyright (c) {year} {author}

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
"""


def proprietary_license(author: str, year: str) -> str:
    return f"""Copyright (c) {year} {author}. All rights reserved.

No part of this software may be reproduced, distributed, or transmitted in
any form or by any means without the prior written permission of the author.
"""


LICENSE_TEMPLATES = {
    "mit": mit_license,
    "apache2": apache2_license,
    "gpl3": gpl3_license,
    "proprietary": proprietary_license,
}


def contributing_md(project_name: str) -> str:
    return f"""# Contributing

Thank you for considering contributing to {project_name}.

## Getting Started

1. Fork the repository.
2. Clone your fork: `git clone https://github.com/YOUR_USER/{project_name}.git`
3. Create a branch: `git checkout -b feature/your-feature`
4. Install dependencies.
5. Make your changes.

## Pull Request Process

1. Update documentation if you changed public APIs.
2. Add tests for new functionality.
3. Ensure all tests pass before submitting.
4. Use clear, descriptive commit messages.
5. Reference related issues in your PR description.

## Code Style

- Follow the existing code conventions in the project.
- Keep functions small and focused.
- Write descriptive variable and function names.

## Reporting Issues

- Use GitHub Issues for bug reports and feature requests.
- Include steps to reproduce for bugs.
- Include expected vs actual behavior.
"""


def code_of_conduct_md() -> str:
    return """# Code of Conduct

## Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity, level of experience, nationality, personal appearance, race, religion, or sexual orientation.

## Our Standards

Examples of behavior that contributes to a positive environment:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Accepting constructive criticism gracefully
- Focusing on what is best for the community

Examples of unacceptable behavior:

- Trolling, insulting, or derogatory comments
- Public or private harassment
- Publishing others' private information without permission
- Other conduct that could reasonably be considered inappropriate

## Enforcement

Instances of abusive or unacceptable behavior may be reported to the project maintainers. All complaints will be reviewed and investigated.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org/), version 2.1.
"""


def security_md(project_name: str) -> str:
    return f"""# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in {project_name}, please report it responsibly:

1. **Do NOT open a public issue.**
2. Email the maintainers with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
3. You will receive a response within 48 hours.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| latest  | Yes       |

## Disclosure Policy

We follow responsible disclosure. Once a fix is released, we will publicly acknowledge the reporter (unless they prefer anonymity).
"""


def _write_file(path: str, content: str, dry_run: bool) -> None:
    if os.path.isfile(path):
        print(f"  skip {path} (already exists)")
        return
    if dry_run:
        print(f"  would create {path}")
    else:
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  created {path}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Scaffold community files for a project.")
    parser.add_argument("repo_root", help="Path to the repo root directory")
    parser.add_argument("--license", required=True, choices=list(LICENSE_TEMPLATES.keys()),
                        help="License type")
    parser.add_argument("--author", default=None, help="Copyright holder name")
    parser.add_argument("--all", action="store_true", dest="create_all",
                        help="Also create CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be created")
    args = parser.parse_args()

    repo_root = args.repo_root
    if not os.path.isdir(repo_root):
        sys.stderr.write(f"error: {repo_root} is not a directory\n")
        return 2

    author = args.author or _git_user(repo_root)
    year = _year()
    project_name = os.path.basename(os.path.abspath(repo_root))

    print(f"Scaffolding community files in {repo_root}")
    print(f"  author: {author}")
    print(f"  license: {args.license}")
    print()

    # LICENSE
    license_content = LICENSE_TEMPLATES[args.license](author, year)
    _write_file(os.path.join(repo_root, "LICENSE"), license_content, args.dry_run)

    # Community files (with --all)
    if args.create_all:
        _write_file(
            os.path.join(repo_root, "CONTRIBUTING.md"),
            contributing_md(project_name),
            args.dry_run,
        )
        _write_file(
            os.path.join(repo_root, "CODE_OF_CONDUCT.md"),
            code_of_conduct_md(),
            args.dry_run,
        )
        _write_file(
            os.path.join(repo_root, "SECURITY.md"),
            security_md(project_name),
            args.dry_run,
        )

    print("\nDone.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
