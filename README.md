# Ink CLI Starter

A **GitHub template** for interactive terminal applications built with [Ink](https://github.com/vadimdemedes/ink) 8, React 19 and TypeScript.

## Getting started

Requires Node.js 22.12 or newer.

```bash
npm ci
npm run dev
```

For a repository created from this template, set its package, executable and config identity with `npm run init:project -- --name my-cli --description "My CLI"`. Use `--dry-run` to preview changes. See [customization](docs/template/customization.md) for details.

The default app provides **Home, Settings and Help** screens. Reusable UI components, hooks, and themes are included for applications built from the template, alongside headless commands and tests.

The UI layer is a **set of defaults, not a required design system**. Screens can opt out of the shared chrome and global shortcuts, and reusable layout components accept native Ink styling properties. You can also use Ink's `Box` and `Text` directly. See [UI flexibility](docs/ui-framework.md#using-only-what-you-need).

## Commands

```bash
npm run dev                     # Interactive app in a terminal
npm run dev -- --plain          # Render one frame for pipes / CI
npm run dev -- --setup          # Interactive configuration editor
npm run dev -- doctor --json    # Headless environment diagnostics
npm run lint                    # Vite+ lint, including anti-slop rules
npm run check                   # Template warnings, Vite+ lint, format and type checks
npm run typecheck
npm test
npm run build
npm start                       # Run dist/cli.js
```

The built executable uses Commander with inferred option types via `@commander-js/extra-typings` and exposes `--help`, `--screen <id>`, `--theme`, `--config`, `--plain`, `--ascii`, and `doctor [--json]`. Headless commands remain usable without a terminal.

## Template guides

- [Create a project](docs/template/getting-started.md)
- [Customize identity and licensing](docs/template/customization.md)
- [Sync upstream changes](docs/template/syncing.md)
- [Set up releases and publishing](docs/template/releasing.md)

## Add functionality

- [Add your first feature](docs/adding-a-feature.md) — a new screen and headless command
- [Architecture](docs/architecture.md) — application boundaries and extension points
- [UI framework guide](docs/ui-framework.md) — components, navigation, focus, themes and tests
- [Recording guide](docs/recording.md) — optional VHS screenshots and terminal video

Add screens under `src/screens/`, register them in `src/screens/index.ts`, and put domain operations in `src/features/` as needed. Register headless operations in `src/commands/index.ts` and avoid coupling them to Ink rendering.

## Themes and settings

Themes (`dark`, `light`, `contrast`, `mono`) use semantic tokens and ASCII fallbacks. Configuration uses Zod-validated JSON stored under the application-specific XDG config path. Precedence: defaults < saved file < environment < CLI flags; `NO_COLOR` overrides theme selection.

```bash
npm run theme:list
npm run theme:token -- dark primary '#ff80aa'
npm run theme:default -- light
npm run theme:default -- auto
```

## Development checks

The template vendors [anti-slop](https://github.com/dmmulroy/anti-slop) under [`tools/oxlint/anti-slop/`](tools/oxlint/anti-slop/). Its generic Oxlint rules run alongside the existing Vite+ lint rule. The plugin is a source copy (not an npm dependency); see its [`UPSTREAM.md`](tools/oxlint/anti-slop/UPSTREAM.md) for the exact upstream revision and update guidance. Effect-specific rules are not enabled because this starter does not depend on Effect.

Run `npm run lint && npm run check && npm run typecheck && npm test && npm run build` to verify code before opening a PR. Anti-slop lint and formatting checks are blocking CI steps. CI also verifies tests, builds, plain output, headless diagnostics, and the packaged binary.

Screenshots and recordings are optional and require [VHS](https://github.com/charmbracelet/vhs), ttyd, FFmpeg and Chromium. Use `npm run screenshot -- --dry-run` to inspect generated capture tapes without external tooling.
