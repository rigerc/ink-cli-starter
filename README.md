# ink-kit

**Scaffold terminal applications with Ink 8, React 19, and TypeScript.**

`ink-kit` is a source-first starter for building interactive command-line apps. It includes a reusable terminal UI toolkit, semantic themes, keyboard navigation, configuration editors, tests, and a generator that copies only the features you choose into a new project.

**Requirements:** Node.js 22+ and Git. The starter uses npm by default; generated apps can use npm, pnpm, Yarn, or Bun.

[Quick start](#quick-start) · [Scaffolding options](#scaffolding-options) · [Explore the starter](#explore-the-starter) · [UI framework guide](docs/ui-framework.md)

## Quick start

Create a new app from a Git checkout. Scaffolding does not install dependencies or initialize a Git repository for the new app.

```bash
git clone https://github.com/rigerc/ink-cli-starter.git
cd ink-cli-starter
npm run scaffold -- my-cli --path ../my-cli

cd ../my-cli
npm install
npm run dev
```

You'll get an interactive app with Home, Settings, and Help tabs using the default `standard` preset. The component gallery is available separately, and the generated app has no built-in business domain.

```bash
npm run gallery            # Browse UI components (standard preset)
npm run dev -- --plain     # Print a single frame and exit, suitable for pipes/CI
npm run typecheck
npm test
npm run build
npm start
```

To choose options in a guided terminal flow, run `npm run scaffold` without arguments from the starter checkout. To see all generator flags, run `npm run scaffold -- --help`.

## What's included

- **App shell:** header, tabs, screen layout, status bar, toasts, command menu, and context-aware keyboard hints.
- **Reusable UI:** panels, tables, badges, status messages, selection controls, toggles, paginated lists, and multi-step wizards.
- **Keyboard ownership:** scoped keymaps and input capture to prevent global shortcuts from interfering with active controls.
- **Themes:** `dark`, `light`, `contrast`, and `mono`, with semantic tokens and ASCII fallbacks.
- **Configuration:** Zod-validated JSON settings, an interactive editor, and a setup wizard with explicit save/discard behavior.
- **Testing and captures:** Ink interaction tests, terminal-width checks, and optional VHS screenshots and recordings.

The UI framework lives in each project's `src/` directory. It is **not** a separately published or installed component package.

## Scaffolding options

```bash
# Smallest preset with tests
npm run scaffold -- my-cli --preset minimal

# Choose a package manager and build tool
npm run scaffold -- my-cli --package-manager pnpm --toolchain tsdown

# Select exactly the optional features you need
npm run scaffold -- my-cli --features settings,doctor,tests,ci

# No optional features
npm run scaffold -- my-cli --features none

# Force an interactive review even when supplying a name
npm run scaffold -- my-cli --interactive
```

| Option | Values | Default |
| --- | --- | --- |
| `--path`, `-p` | Destination directory | `./<app-name>` |
| `--preset` | `minimal`, `standard`, `full` | `standard` |
| `--package-manager` | `npm`, `pnpm`, `yarn`, `bun` | `npm` |
| `--toolchain` | `vite-plus`, `tsdown` | `vite-plus` |
| `--features` | Comma-separated feature IDs or `none` | Preset selection |
| `--interactive`, `-i` | Prompt and confirm | Automatic when no name is given in a TTY |

Available features: `settings`, `doctor`, `gallery`, `tests`, `screenshots`, `ci`.

| Preset | Included optional features |
| --- | --- |
| `minimal` | `tests` |
| `standard` | All six features |
| `full` | All six features (currently identical to `standard`) |

`--features` **replaces** the preset's feature list; it does not add to it. The `--path` value is the complete destination directory, and that directory must not exist. Relative paths resolve from the shell's current directory.

**Build tool choices:** `vite-plus` uses Vite+ for builds and tests. `tsdown` uses tsdown for builds and standalone Vitest when tests are selected. The generator removes unselected screens, commands, scripts, test tooling, and CI configuration. Non-default dependency selections omit the starter's npm lockfile; install dependencies in the generated app, then commit its newly generated lockfile.

## Explore the starter

To explore the included screens and demos before generating an app:

```bash
cd ink-cli-starter
npm ci
npm run dev               # Starter UI
npm run gallery           # Interactive component gallery
npm run demo:ui           # Dashboard composed with the shared shell
npm run demo:inline       # Compact wizard in terminal scrollback
npm run dev -- --plain    # Deterministic one-shot rendering
```

The starter checkout includes illustrative Tasks and UI Demo screens. These, along with the inline demo, are intentionally excluded from generated apps. A generated `standard` app starts with Home, Settings, and Help as its visible tabs; the gallery remains accessible using `--screen gallery` when selected.

### Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Tab` / `Shift+Tab` | Move between visible screens |
| Number keys | Open the corresponding visible screen |
| `Ctrl+K` | Search the screen command menu |
| `t` | Cycle themes |
| `?` | Open Help |
| `q` | Quit |

An active input control captures the keys it needs. Screen-specific actions and component interactions are documented in the gallery and [UI framework guide](docs/ui-framework.md).

## Themes and configuration

The four themes use semantic tokens rather than colors embedded in individual components. Inspect and edit built-in palettes from the checkout or a generated app:

```bash
npm run theme:list
npm run theme:token -- dark primary '#ff80aa'
npm run theme:token -- contrast focus cyanBright
npm run theme:default -- light
npm run theme:default -- auto
```

Palettes live in `src/theme/palettes.json`, and the project fallback is in `src/theme/defaults.json`. The `contrast` palette only accepts ANSI color names; `mono` has no color tokens. `--ascii` replaces Unicode glyphs with ASCII equivalents.

To edit application settings interactively in a generated app with the `settings` feature:

```bash
npm run dev -- --setup
npm run dev -- --screen settings
npm run dev -- --config ./custom-config.json
```

The configuration file defaults to `$XDG_CONFIG_HOME/<app-name>/config.json` or `~/.config/<app-name>/config.json`. Settings use the precedence **defaults < saved file < environment < CLI flags**; `NO_COLOR` overrides theme selection. Configuration editors write only after you explicitly save, and `--setup` requires a terminal.

Extend the typed settings model and editor field registry together in `src/config/schema.ts`.

## Build your first feature

After scaffolding, add a screen to your generated project:

1. Create a component under `src/screens/` using `ScreenLayout` and the existing UI components.
2. Register it in the `screens` array in `src/screens/index.ts`.
3. Add optional headless commands in `src/commands/index.ts` and keep reusable business logic outside Ink components.
4. Run `npm run typecheck`, `npm test` (if selected), and `npm run build`.

Registered screens receive a `--screen <id>` option. Screens shown in navigation also receive a tab and number shortcut. For working code and input-focus conventions, follow [Add your first feature](templates/app/docs/adding-a-feature.md) and the [UI framework guide](docs/ui-framework.md).

### Project map

```text
src/
  cli.tsx             CLI flags and plain/interactive rendering
  app.tsx             Providers, shell, navigation, and shortcuts
  screens/            Screen components and registry
  components/         Layout, display, and interactive controls
  hooks/              Keyboard, input capture, async, and terminal hooks
  theme/              Palettes, tokens, and theme resolution
  config/             Validated settings and field metadata
  lib/                Shared configuration and utilities
scripts/              Scaffolder, themes, and capture tooling
docs/                 Framework and recording guides
templates/app/docs/    Feature and architecture guides for generated apps
```

## Screenshots and recordings

The optional `screenshots` feature provides [VHS](https://github.com/charmbracelet/vhs)-based terminal captures. Install **VHS 0.12.1+**, **ttyd**, **FFmpeg**, and **Chromium** as described in the [recording guide](docs/recording.md).

```bash
npm run screenshot -- --screen gallery --theme dark --columns 100
npm run record -- --screen ui-demo --format webm
npm run screenshot -- --dry-run
```

Captures are written locally under the ignored `screenshots/` directory. The repository's [screenshots workflow](.github/workflows/screenshots.yml) is configured to produce images and a demo recording; captured media is not currently checked into this repository, so this README does not embed it.

## Further documentation

- [UI framework guide](docs/ui-framework.md): shell composition, components, keyboard routing, responsive layouts, and testing.
- [Add your first feature](templates/app/docs/adding-a-feature.md): a minimal screen and headless command.
- [Generated app architecture](templates/app/docs/architecture.md): extension points and separation of UI from domain logic.
- [Recording guide](docs/recording.md): VHS requirements, screenshot options, and interaction tapes.

## License

This repository currently has no `LICENSE` file. Check the intended licensing terms with the repository owner before redistributing its code.
