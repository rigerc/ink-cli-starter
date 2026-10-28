# Use this template

GitHub copies this application directly; there is no generator and no
opinionated UI framework.

1. Select **Use this template → Create a new repository**.
2. Clone your new repository and install dependencies (Node.js 22.12+).
3. Initialize the package identity and run the native Ink app:

```sh
npm ci
npm run init:project -- --name my-cli --description "My terminal application"
npm run dev
npm run dev -- --plain
```

The initializer updates package name, binary name, lockfile, and pending
Changesets references. Use `--dry-run` to preview changes. The default
configuration directory follows the executable name, but existing user config
files are not moved.

Edit `src/app.tsx` to implement your own presentation, using native Ink
and React components. No local design system, screen router or theme provider
needs to be removed.

Optional: add ready-made UI components from
[`@rigerc/ink-ui`](https://github.com/rigerc/ink-ui) to your own application.
The base template deliberately has no dependency on it. See the
[opt-in integration guide](../integrations/ink-ui.md) for installation and
an example compatible with the native Ink entry point.

Next see [architecture](../architecture.md),
[adding a feature](../adding-a-feature.md),
[configuration](../configuration.md),
[customization](customization.md),
[syncing](syncing.md) or [releasing](releasing.md).
