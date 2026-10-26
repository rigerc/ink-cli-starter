# Use this template

This repository is a GitHub template that directly contains the application. There is no scaffold generator or setup script.

1. Select **Use this template → Create a new repository** on GitHub.
2. Clone your new repository and install dependencies (Node.js 22.12+ required).
3. Start the application:

```bash
npm ci
npm run init:project -- --name my-cli --description "My terminal application"
npm run dev
```

The initializer updates the package name, binary, lockfile and config identity. Use `--dry-run` to preview changes. Running it again with the same identity is safe; a conflicting customized identity causes an error.

Dependabot runs weekly for npm dependencies and GitHub Actions. Review its PRs before merging; Dependabot settings are downstream-owned and excluded from upstream template sync.

Next, [customize the application](customization.md), configure [template sync](syncing.md), and review [release setup](releasing.md).
