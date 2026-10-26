# Use this template

This repository is a GitHub template that directly contains the application. There is no scaffold generator or setup script.

1. Select **Use this template → Create a new repository** on GitHub.
2. Clone your new repository (Node.js 22.12+ required).
3. Install dependencies and initialize the copied application's identity:

```bash
npm ci
npm run init:project -- --name my-cli --description "My terminal application"
```

   The initializer updates the package name, binary command, lockfile and configuration identity. It refuses to overwrite pre-existing custom names and can be run repeatedly with the same options. Use `--dry-run` to preview changes.
4. Start the application:

```bash
npm run dev
```

Next, [customize the application](customization.md), configure [template sync](syncing.md), and review [release setup](releasing.md).
