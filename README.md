# Ink CLI Starter

A **GitHub template** for interactive terminal applications built with [Ink](https://github.com/vadimdemedes/ink) 8, React 19 and TypeScript. The repository itself is the ready-to-run CLI application: **no scaffold generator or setup script is required**.

## Use this template

1. Select **Use this template → Create a new repository** on GitHub.
2. Clone your new repository and install dependencies (Node.js 22.12+ required).
3. Start the application:

```bash
npm ci
npm run dev
```

The default app provides **Home, Settings and Help** screens. Reusable UI components, hooks, and themes are included for applications built from the template, alongside headless commands and tests.

The UI layer is a **set of defaults, not a required design system**. Screens can opt out of the shared chrome and global shortcuts, and reusable layout components accept native Ink styling properties. You can also use Ink's `Box` and `Text` directly. See [UI flexibility](docs/ui-framework.md#using-only-what-you-need).

## Commands

```bash
npm run dev                     # Interactive app in a terminal
npm run dev -- --plain          # Render one frame for pipes / CI
npm run dev -- --setup          # Interactive configuration editor
npm run dev -- doctor --json    # Headless environment diagnostics
npm run lint                    # Vite+ lint, including anti-slop rules
npm run check                   # Vite+ lint, format and type checks
npm run typecheck
npm test
npm run build
npm start                       # Run dist/cli.js
```

The built executable uses Commander with inferred option types via `@commander-js/extra-typings` and exposes `--help`, `--screen <id>`, `--theme`, `--config`, `--plain`, `--ascii`, and `doctor [--json]`. Headless commands remain usable without a terminal.

## Customize for your application

GitHub templates **do not automatically rename package metadata**. Before publishing the copied application:

1. Change `name`, `description`, and the command key under `bin` in `package.json`.
2. Update the matching root package metadata and bin entry in `package-lock.json` (for example, regenerate the lockfile with `npm install --package-lock-only`).
3. Change `APP_NAME` in `src/lib/config.ts` to the new command name. This controls the user config directory and the `<APP_NAME>_THEME` environment variable.
4. Replace the sample Home content and extend the screen/command registries.

The default package and executable name is `ink-kit` until you change it. The `src/` component library is maintained as source in your own repository, not installed as a separate UI package.

## Keep your copy in sync with this template

Repositories created from this template include [the template sync workflow](.github/workflows/template-sync.yml). It checks `rigerc/ink-cli-starter` for updates on the first day of each month at 03:17 UTC, or when manually started, and opens a pull request with proposed changes. The workflow skips the upstream template repository itself.

**Setup in your generated repository:** The upstream `rigerc/ink-cli-starter` repository is public, so no source access token is needed. The workflow uses the built-in `GITHUB_TOKEN` by default to read the template and open sync pull requests.

1. Under **Settings → Actions → General → Workflow permissions**, enable **Allow GitHub Actions to create and approve pull requests**.
2. **Optional for workflow-file updates:** Add a `TEMPLATE_SYNC_TARGET_TOKEN` secret under **Settings → Secrets and variables → Actions**, using a repository-scoped fine-grained personal access token with **Contents: write**, **Pull requests: write**, and **Workflows: write** permissions for your generated repository. The default `GITHUB_TOKEN` cannot push updates to `.github/workflows/`, so a sync that includes workflow-file changes may fail without this secret.

The workflow automatically uses `TEMPLATE_SYNC_TARGET_TOKEN` when provided and falls back to `GITHUB_TOKEN` otherwise. Go to **Actions → Sync upstream template → Run workflow** to trigger a sync manually. Review any created PR before merging: upstream updates may touch files you have customized. See [actions-template-sync documentation](https://github.com/marketplace/actions/actions-template-sync) for additional authentication or file-exclusion options.

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

The template vendors [anti-slop](https://github.com/dmmulroy/anti-slop) under [`tools/oxlint/anti-slop/`](tools/oxlint/anti-slop/). Its generic Oxlint rules run alongside the existing Vite+ lint rule. The plugin is a source copy (not an npm dependency); see its [`UPSTREAM.md`](tools/oxlint/anti-slop/UPSTREAM.md) for the exact upstream revision and update guidance. Effect-specific rules are not enabled because this starter does not depend on Effect.

Run `npm run lint && npm run check && npm run typecheck && npm test && npm run build` to verify code before opening a PR. Anti-slop lint and formatting checks are blocking CI steps. CI also verifies tests, builds, plain output, headless diagnostics, and the packaged binary. `npm pack` creates an installable CLI tarball; update package metadata and licensing before publishing to npm.

Release automation uses Changesets and is disabled by default. The package ships with `"private": true`. Downstream repositories can opt into version PRs, git tags and GitHub Releases with `RELEASE_ENABLED=true`, and enable npm publishing separately with `NPM_PUBLISH=true`. See the [release guide](docs/releasing.md) for setup, authentication and the publishing checklist. Once enabled, include a changeset with user-facing changes using `npm run changeset`.

Screenshots and recordings are optional and require [VHS](https://github.com/charmbracelet/vhs), ttyd, FFmpeg and Chromium. Use `npm run screenshot -- --dry-run` to inspect generated capture tapes without external tooling.

## License

Choose a license for your new project before distributing it. This template repository does not currently include a `LICENSE` file.
