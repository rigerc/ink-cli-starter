# Use this template

This repository is a GitHub template that directly contains the application.
There is no scaffold generator: GitHub copies the application source, and the
optional `init:project` script renames its package, executable and configuration
identity.

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

Next, [customize the application](customization.md). Consult [configuration](../configuration.md) for user settings, [UI](../ui-framework.md) for screens, and [recording](../recording.md) for screenshots. Optionally [run upstream template sync](syncing.md) or [configure releases](releasing.md); neither runs automatically by default.
