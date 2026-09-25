# Community Files

Community files live in the **repo root** so GitHub auto-detects and surfaces them in the UI.

## Overview

| File                  | Purpose                              | GitHub behavior                    |
| --------------------- | ------------------------------------ | ---------------------------------- |
| `LICENSE`             | Legal terms for using/distributing   | Shown in repo sidebar              |
| `CONTRIBUTING.md`     | How to contribute                    | Linked from issue/PR templates     |
| `CODE_OF_CONDUCT.md`  | Community behavior standards         | Shown in community profile         |
| `SECURITY.md`         | How to report vulnerabilities        | Shown in Security tab              |

**Always ask the user before creating any of these files.** Do not assume license type.

---

## LICENSE

### Choosing a License

Ask the user: "Which license would you like? (MIT, Apache 2.0, GPL 3.0, or proprietary?)"

| License     | Key trait                                        | Good for                    |
| ----------- | ------------------------------------------------ | --------------------------- |
| MIT         | Permissive, short, simple                        | Most open-source projects   |
| Apache 2.0  | Permissive + patent grant                        | Enterprise, libraries       |
| GPL 3.0     | Copyleft — derivatives must also be GPL          | Projects that must stay open|
| Proprietary | All rights reserved                              | Commercial, closed-source   |

### MIT Template

```
MIT License

Copyright (c) [YEAR] [FULL NAME]

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
```

### Proprietary Template

```
Copyright (c) [YEAR] [FULL NAME]. All rights reserved.

No part of this software may be reproduced, distributed, or transmitted in
any form or by any means without the prior written permission of the author.
```

### Rules

- File is named `LICENSE` (no extension) or `LICENSE.md`.
- Replace `[YEAR]` with the current year and `[FULL NAME]` with the copyright holder.
- Do not modify the license text (especially MIT and Apache — they are standardized).

---

## CONTRIBUTING.md

### Template

```markdown
# Contributing

Thank you for considering contributing to [PROJECT NAME].

## Getting Started

1. Fork the repository.
2. Clone your fork: `git clone https://github.com/YOUR_USER/REPO.git`
3. Create a branch: `git checkout -b feature/your-feature`
4. Install dependencies: `[INSTALL_COMMAND]`
5. Make your changes.

## Development

\```bash
[INSTALL_COMMAND]       # install dependencies
[TEST_COMMAND]          # run tests
[LINT_COMMAND]          # run linter
\```

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
```

### Rules

- Include actual install and test commands for the project (not placeholders).
- Mention the code style tool if the project uses one (ESLint, Black, etc.).
- Keep it under 80 lines — brevity encourages contributions.

---

## CODE_OF_CONDUCT.md

### Template (Contributor Covenant)

```markdown
# Code of Conduct

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

Instances of abusive or unacceptable behavior may be reported to the project maintainers at [EMAIL]. All complaints will be reviewed and investigated.

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org/), version 2.1.
```

### Rules

- Replace `[EMAIL]` with an actual contact email.
- Do not remove the attribution line.
- Keep it short — the Contributor Covenant is well-known and trusted.

---

## SECURITY.md

### Template

```markdown
# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT open a public issue.**
2. Email [EMAIL] with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
3. You will receive a response within 48 hours.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | Yes                |
| < 1.0   | No                 |

## Disclosure Policy

We follow responsible disclosure. Once a fix is released, we will publicly acknowledge the reporter (unless they prefer anonymity).
```

### Rules

- Replace `[EMAIL]` with an actual security contact.
- Update the supported versions table to match the project.
- Keep it under 40 lines.

---

## Linking Community Files from README

Reference community files from the README so they are discoverable:

```markdown
## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE) © Author Name
```

There is no need to link CODE_OF_CONDUCT.md or SECURITY.md from the README — GitHub surfaces these automatically. However, you may add them to the table of contents if desired.
