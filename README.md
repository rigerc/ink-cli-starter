# Ink CLI Starter

A minimal GitHub template for an Ink 8 / React 19 / TypeScript terminal application.
There is **no bundled UI framework**: no design system, screen router, shell, component
kit, theme manager, or custom input hooks. Use native Ink and React directly.

## Get started

Node.js 22.12+ is required.

```sh
npm ci
npm run dev
npm run dev -- --plain
npm run dev -- doctor --json
```

In a repository created from this template, customize its package and CLI identity:

```sh
npm run init:project -- --name my-cli --description "My CLI"
```

The interactive entry point is `src/app.tsx`. It contains a single Ink
`Box` / `Text` view, with `q` and Escape to exit. Modify it freely;
there are no framework abstractions to opt out of. The CLI renders the same
content once with `--plain` when piping or running in CI.

## Commands

```sh
npm run dev                     # Native interactive Ink app
npm run dev -- --plain          # One-shot text frame
npm run dev -- doctor --json    # Headless diagnostics
npm run dev -- config list      # Example headless configuration
npm run dev -- config set label "My CLI"
npm run dev -- example --status ready --json
npm run dev -- completion bash  # Also zsh and fish
npm run typecheck
npm test
npm run build
```

The base CLI retains Commander for flags/subcommands, a headless configuration
example, optional update notices, logging, JSON output, shell completions and
standard terminal modes. These are independent of Ink's presentation layer.
The CLI supports `--plain`, `--config <path>`, `--no-color`,
`--screen-reader`, `--alternate-screen`, `--quiet`, `--verbose`,
`--debug` and `--json` (headless commands only).

Configuration has one sample field, `label`, which is used for the heading
of the Ink app. The effective label comes from the package name, a saved config
file or `<PREFIX>_LABEL` environment variable. `--config` chooses a specific
JSON file; `config get|set|list|reset|path` work without a TTY.
The `example` command demonstrates validation and explicit piped JSON input.

## Extend the app

Edit `src/app.tsx` for interactive behavior. Use Ink's `Box`, `Text`,
`useInput` or any other Ink/React APIs you want; create your own components
only when the application needs them. Keep operations that also need headless
access outside the React component tree.

- [Architecture](docs/architecture.md)
- [Add functionality](docs/adding-a-feature.md)
- [Configuration](docs/configuration.md)
- [Template setup](docs/template/getting-started.md)
- [Template customization](docs/template/customization.md)
- [Template sync](docs/template/syncing.md)
- [Releasing](docs/template/releasing.md)

## Validation and release

Use `npm run lint && npm run check && npm run typecheck && npm test && npm run build`.
CI exercises plain rendering, the headless CLI and a real interactive PTY.
The repository uses Vite+, Changesets and optional vendored lint tooling.
Template identity warnings are advisory until you configure your own package.

Apache-2.0 licensed. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
