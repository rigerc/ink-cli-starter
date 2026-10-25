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
npm run lint                    # Vite+ lint, including anti-slop rules
npm run check                   # Vite+ lint, format and type checks
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

## Keep your copy in sync with this template

Repositories created from this template include [the template sync workflow](.github/workflows/template-sync.yml). It checks `rigerc/ink-cli-starter` for updates on the first day of each month at 03:17 UTC, or when manually started, and opens a pull request with proposed changes. The workflow skips the upstream template repository itself.

**Setup in your generated repository:** This upstream template is private, so the generated repository's default `GITHUB_TOKEN` cannot read it. Add the following secrets under **Settings → Secrets and variables → Actions**:

- `TEMPLATE_SYNC_SOURCE_TOKEN`: a token with **Contents: read** access to the private `rigerc/ink-cli-starter` repository (and **Metadata: read**, granted automatically for fine-grained PATs).
- `TEMPLATE_SYNC_TARGET_TOKEN`: a token with **Contents: write** and **Pull requests: write** access to your generated repository. Also allow workflow-file updates (e.g. **Workflows: write** for a fine-grained token) so changes under `.github/workflows/` can be synced.

Prefer separate, repository-scoped fine-grained personal access tokens; the account creating the source token must have access to the private upstream repository. For private-source sync using PATs, the action's documentation requires the target repository to be private as well.

After adding the secrets, go to **Actions → Sync upstream template → Run workflow** in the generated repository. Review any automatically created PR before merging: upstream updates may touch files you have customized. See [actions-template-sync documentation](https://github.com/marketplace/actions/actions-template-sync) for additional authentication or file-exclusion options.

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
