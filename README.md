# Ink CLI Starter

A **GitHub template** for interactive terminal applications built with [Ink](https://github.com/vadimdemedes/ink) 8, React 19 and TypeScript.

## Getting started

Requires Node.js 22.12 or newer.

```bash
npm ci
npm run dev
```

For a repository created from this template, set its package, executable and config identity with `npm run init:project -- --name my-cli --description "My CLI"`. Use `--dry-run` to preview changes. See [customization](docs/template/customization.md) for details.

The default app provides **Home, Settings, Help and Gallery** screens. Gallery is a removable list/detail example sharing its domain operation with a headless command. Reusable UI components, hooks, and themes are included for applications built from the template, alongside headless commands and tests.

The UI layer is a **set of defaults, not a required design system**. `defineApp` and `AppRuntime` now allow an application to replace the screen registry and shell without changing the runtime; screens can also selectively hide chrome regions. Built-in input controls share the scoped keyboard dispatcher. Screen shortcuts use `useKeymap`, while `ScreenDef.hints` describes the footer labels. Downstream applications may remove unused screens, components, hooks, and providers; exclude customized or deleted shared files before opting into upstream sync. Screens can opt out of the shared chrome and global shortcuts, and reusable layout components accept native Ink styling properties. You can also use Ink's `Box` and `Text` directly. See [UI flexibility](docs/ui-framework.md#using-only-what-you-need).

## Commands

```bash
npm run dev                     # Interactive app in a terminal
npm run dev -- --plain          # Render one frame for pipes / CI
npm run dev -- --setup          # Configuration wizard (interactive TTY only)
npm run dev -- doctor --json    # Headless environment diagnostics
npm run dev -- config list --json
npm run dev -- config set theme light
npm run dev -- --screen gallery # Local list/detail example
npm run dev -- example --status ready --json
npm run dev -- completion bash  # Also zsh and fish
npm run test:coverage           # Coverage with enforced thresholds
npm run test:pty                # Real interactive terminal tests
npm run lint                    # Core Vite+ lint and high-confidence anti-slop rules
npm run check                   # Template warnings, Vite+ lint, format and type checks
npm run typecheck
npm test
npm run build
npm start                       # Run dist/cli.js
```

The built executable uses Commander with inferred option types via `@commander-js/extra-typings` and exposes `--help`, `--screen <id>`, `--theme`, `--config`, `--plain`, `--ascii`, `--no-color`, `--quiet`, `--verbose`, `--debug`, `--screen-reader`, and `--alternate-screen`. Headless commands include `doctor`, `config get|set|list|path|reset`, `example`, and `completion bash|zsh|fish`. Shared options work before or after subcommands. Headless commands remain usable without a terminal.

## Template guides

- [Create a project](docs/template/getting-started.md)
- [Customize identity and licensing](docs/template/customization.md)
- [Sync upstream changes](docs/template/syncing.md)
- [Set up releases and publishing](docs/template/releasing.md)

## Add functionality

- [Add your first feature](docs/adding-a-feature.md) — a new screen and headless command
- [Architecture](docs/architecture.md) — application boundaries and extension points
- [Configuration guide](docs/configuration.md) — paths, precedence, Settings, migrations and recovery
- [UI framework guide](docs/ui-framework.md) — components, navigation, focus, themes and tests
- [Recording guide](docs/recording.md) — optional VHS screenshots and terminal video

Add screens under `src/screens/`, register them in `src/screens/index.ts`, and put domain operations in `src/features/` as needed. Define headless operations with `defineCommand` in `src/commands/` and add them to the registry in `src/commands/index.ts`; Commander registration and completions follow automatically. Keep domain operations independent of Ink rendering.

## Themes and settings

Themes (`dark`, `light`, `contrast`, `mono`) use semantic tokens and ASCII
fallbacks. Configuration uses [`conf`](https://www.npmjs.com/package/conf) for
atomic JSON persistence with Zod validation. By default, settings are stored at
`~/.config/ink-kit/config.json`, or under `XDG_CONFIG_HOME` when it is set. This
`ink-kit` path applies before running `init:project`; renaming the CLI changes
the config directory but does not move an existing file. Existing files at the
selected path remain compatible, and `--config <path>` selects a specific JSON
file. Invalid files are preserved rather than reset. See the [configuration guide](docs/configuration.md) for setup, migration, troubleshooting and extending fields. Precedence: defaults <
saved file < environment < CLI flags; `NO_COLOR` overrides theme selection.

```bash
npm run theme:list
npm run theme:token -- dark primary '#ff80aa'
npm run theme:default -- light
npm run theme:default -- auto
```

## Development checks

Agent instructions are managed with [AgentsMesh](https://github.com/sampleXbro/agentsmesh) 0.42.0 for Claude Code, Codex CLI, Pi, and OpenCode. Only rules and hooks are enabled. Edit the canonical files in [`.agentsmesh/rules/`](.agentsmesh/rules/) or `.agentsmesh/hooks.yaml`, then run `agentsmesh lint`, `agentsmesh diff`, `agentsmesh generate`, and `agentsmesh check`. Commit the canonical files, generated instructions, and `.agentsmesh/.lock` together. Personal overrides belong in the gitignored `agentsmesh.local.yaml`.

The always-on `_root.md` covers project-wide guidance; focused rules cover CLI architecture, terminal UI, configuration, and template sync ownership. Claude receives path-scoped rule files. Codex emits nested `AGENTS.md` instructions, Pi embeds rules in the shared root `AGENTS.md`, and OpenCode loads `.opencode/rules/*.md` through `opencode.json`. These projections do not enforce identical file-glob activation; each focused rule states when it applies.

Vite+ formats the canonical sources. Generated `AGENTS.md`, `CLAUDE.md`, and `opencode.json` are excluded from formatting so regeneration preserves the AgentsMesh lock checksums.

A session-start hook runs `agentsmesh generate` in Claude Code and Codex CLI; the AgentsMesh CLI must be available on `PATH`. AgentsMesh 0.42.0 does not generate OpenCode plugins or Pi extensions, so their startup hooks require manual native configuration. `.agentsmesh/hooks.yaml` also contains an optional lint example. Check `agentsmesh matrix` and lint warnings before enabling other events or prompt hooks. The canonical configuration and generated agent directories are excluded from template sync to preserve downstream instructions.

The repository-local [`ink-cli-starter` skill](.agents/skills/ink-cli-starter/SKILL.md) provides on-demand guidance for initializing, extending, testing, and syncing applications built from this template. The skill is maintained directly (not generated by AgentsMesh), and downstream copies own `.agents/` during template sync.

Skills live under [`.agents/skills/`](.agents/skills/) and are mirrored into `.claude/skills/` for Claude Code discovery. [`skills-lock.json`](skills-lock.json) tracks only skills installed from the external `rigerc/my-skills` repository. Vendored in-repo skills (such as [`ink-cli-starter`](.agents/skills/ink-cli-starter/SKILL.md) and [`vhs-cli`](.agents/skills/vhs-cli/SKILL.md)) are intentionally absent from the lock because they are maintained directly in this repository and would have no meaningful external source entry.

The template vendors [anti-slop](https://github.com/dmmulroy/anti-slop) under [`tools/oxlint/anti-slop/`](tools/oxlint/anti-slop/). By default, Vite+ enables only high-confidence anti-slop rules. **Additional strict conventions are opt-in:** set `INK_STRICT_LINT=1` when running `npm run lint` or `npm run check` to enable all other generic anti-slop rules (including bans on runtime `typeof`, `unknown` parameters, and module mocking). In PowerShell, set `$env:INK_STRICT_LINT='1'` first. The plugin is a source copy, not an npm dependency; see its [`UPSTREAM.md`](tools/oxlint/anti-slop/UPSTREAM.md) for the exact upstream revision. Effect-specific rules are not enabled because this starter does not depend on Effect.

Run `npm run lint && npm run check && npm run typecheck && npm test && npm run build` to verify code before opening a PR. Core lint and formatting checks are blocking CI steps; optional strict lint rules are not required by CI. Independent quality and test jobs provide feedback without a serial job chain. Tests, builds, plain output, headless diagnostics and packed executable checks run on Linux, macOS and Windows with Node 22 and 24. CI enforces coverage thresholds; dependency auditing and CodeQL run separately. Native PTY tests create their own terminal and need a working `node-pty` installation; when it cannot load, the PTY suite is skipped with a logged reason, and CI keeps it required on Linux Node 24 via `REQUIRE_PTY=1`.

Screenshots and recordings are optional and require [VHS](https://github.com/charmbracelet/vhs), ttyd, FFmpeg and Chromium. `npm run screenshot` captures one default PNG; add `--all` to capture every screen or `--live` for asynchronously rendered content. `npm run record` creates an MP4 demo, and `--dry-run` generates tapes without VHS. The [capture workflow](.github/workflows/screenshots.yml) uploads artifacts by default; video and Git commits are opt-in. See the [recording guide](docs/recording.md) for static versus live capture, readiness checks, naming, and troubleshooting.

## Scripting and terminal modes

Use `config get theme --stored --json` to distinguish saved overrides from
effective settings. Changes are Zod-validated and atomic; reset preserves custom
extension keys and refuses invalid files. `config set ascii -` reads a piped
value. `example - --json` accepts a JSON array of work items; bare `example`
also accepts piped input. Both cap stdin at 1 MiB.

`--quiet` suppresses notices while retaining results and errors. `--verbose`
writes diagnostics to stderr; `--debug` adds stack traces and file diagnostics.
`--no-color` and any nonempty `NO_COLOR` force the mono theme. ASCII uses
`<PREFIX>_ASCII`, with `CLI_ASCII` retained as a lower-priority alias.

`--screen-reader` enables Ink's accessible interactive renderer;
`INK_SCREEN_READER=true` also works. `--alternate-screen` opts into a full-screen
buffer that restores the terminal on exit. Ordinary quit exits with zero,
Ctrl-C with 130, and SIGTERM with 143. Unsaved Settings changes offer
Save/Discard/Cancel on ordinary navigation and quit.

Generate completion scripts from the built executable and load them with your
shell's normal startup configuration:

```bash
ink-kit completion bash > ~/.ink-kit-completion.bash
source ~/.ink-kit-completion.bash
ink-kit completion zsh > ~/.ink-kit-completion.zsh
ink-kit completion fish > ~/.config/fish/completions/ink-kit.fish
```

For Zsh, run `autoload -Uz compinit; compinit` before sourcing the generated file.
Completion generation writes scripts only; it does not edit shell settings.

Update checks are disabled by default. Published downstream apps can opt in with
`<PREFIX>_UPDATE_NOTIFIER=1`. `NO_UPDATE_NOTIFIER`, CI, private packages and piped
output disable checks. See [architecture](docs/architecture.md) for logging,
process lifecycle, and update-cache details.

## License

[Apache-2.0](LICENSE). Copyright 2026 rigerc. See [NOTICE](NOTICE).
