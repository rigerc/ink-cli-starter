# Ink CLI Starter

A **GitHub template** for interactive terminal applications built with [Ink](https://github.com/vadimdemedes/ink) 8, React 19 and TypeScript. The repository itself is the ready-to-run CLI application: **no scaffold generator or setup script is required**.

## Use this template

1. Select **Use this template → Create a new repository** on GitHub.
2. Clone your new repository and install dependencies (Node.js 22+ required).
3. Start the application:

```bash
npm ci
npm run dev
```

The default app provides **Home, Settings and Help** screens. A component gallery is available separately for development. The source includes a configurable theme system, keyboard/input handling, headless commands, and tests.

The UI layer is a **set of defaults, not a required design system**. Screens can opt out of the shared chrome and global shortcuts, and reusable layout components accept native Ink styling properties. You can also use Ink's `Box` and `Text` directly. See [UI flexibility](docs/ui-framework.md#using-only-what-you-need).

## Commands

```bash
npm run dev                     # Interactive app in a terminal
npm run dev -- --plain          # Render one frame for pipes / CI
npm run gallery                 # Browse UI components and examples
npm run dev -- --setup          # Interactive configuration editor
npm run dev -- doctor --json    # Headless environment diagnostics
npm run typecheck
npm test
npm run build
npm start                       # Run dist/cli.js
```

The built executable exposes `--help`, `--screen <id>`, `--theme`, `--config`, `--plain`, `--ascii`, and `doctor [--json]`. Headless commands remain usable without a terminal.

## Customize for your application

GitHub templates **do not automatically rename package metadata**. Before publishing the copied application:

1. Change `name`, `description`, and the command key under `bin` in `package.json`.
2. Update the matching root package metadata and bin entry in `package-lock.json` (for example, regenerate the lockfile with `npm install --package-lock-only`).
3. Change `APP_NAME` in `src/lib/config.ts` to the new command name. This controls the user config directory and the `<APP_NAME>_THEME` environment variable.
4. Replace the sample Home content and extend the screen/command registries.

The default package and executable name is `ink-kit` until you change it. The `src/` component library is maintained as source in your own repository, not installed as a separate UI package.

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

## Quality and publishing

Run `npm run typecheck && npm test && npm run build`. The CI workflow verifies these commands, plain output, headless diagnostics, and the packaged binary. `npm pack` creates an installable CLI tarball; update package metadata and licensing before publishing to npm.

Screenshots and recordings are optional and require [VHS](https://github.com/charmbracelet/vhs), ttyd, FFmpeg and Chromium. Use `npm run screenshot -- --dry-run` to inspect generated capture tapes without external tooling.

## License

Choose a license for your new project before distributing it. This template repository does not currently include a `LICENSE` file.
