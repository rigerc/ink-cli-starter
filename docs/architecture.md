# Application architecture

This repository is the actual CLI application copied by GitHub's **Use this template** action. There is no generator, feature pruning, or separate scaffold tree.

## Entry points

- `src/cli.tsx` owns cancellation and error handling; `src/lib/program.ts` builds the Commander tree, and `src/lib/render-app.tsx` is loaded only for interactive/one-frame rendering.
- `src/commands/index.ts` contains typed headless definitions with schemas, options and handlers; one adapter registers them with Commander. Commands must not depend on a TTY or import Ink.
- `src/app.tsx` defines the default application and preserves the `App` / `PlainView` compatibility entry points.
- `src/ui/core/` provides `defineApp`, `AppProviders`, `AppRuntime` and `PlainRuntime`; `src/ui/layout/` composes optional shell regions and per-screen chrome.
- `src/screens/index.ts` registers the default Home, Settings and Help screens; this registry also determines valid `--screen` values.
- `src/components/`, `src/hooks/`, and `src/theme/` contain reusable local UI primitives.
- `src/config/` provides `conf`-backed, Zod-validated, versioned JSON configuration.

## New features

Keep application models and operations in `src/features/<feature>/` independent of rendering. Both a screen and a headless command can call the same operation. Add other services only as needed; this template does not impose a database, network client, or state manager.

The default app uses `AppShell`, `ScreenLayout`, `ScreenState`, semantic colors, and scoped `useKeymap` handlers. Application policies now live in `defineApp` rather than inside the reusable runtime. Built-in text and composite inputs use `useManagedInput` so keyboard arbitration remains consistent with `useKeymap`. Screen shortcuts use `useKeymap`, and `ScreenDef.hints` supplies their contextual footer labels. These are defaults rather than rules. `ScreenDef.layout: 'bare'` renders a screen without application chrome in both interactive and plain modes; `globalKeys: false` turns off the built-in shortcuts on that screen. Existing screens remain unchanged when these properties are omitted.

`Panel`, `Card`, `Stack` and `Row` accept Ink Box props, and `ScreenLayout` supports optional headings and configurable spacing. Import Ink's `Box`, `Text` and `useInput` directly for custom UI. Coordinated `useKeymap` priority is control > screen > global; activate only one free-form text editor at a time to avoid shortcut conflicts.

## Configuration and themes

The config store validates settings with Zod and persists them atomically with
[`conf`](https://www.npmjs.com/package/conf). For the unmodified `ink-kit`
identity, the application-specific XDG path (`~/.config/ink-kit/config.json`
by default, or `$XDG_CONFIG_HOME/ink-kit/config.json`) and `--config <path>`
overrides remain unchanged, so existing settings at that path work without
data migration. Running `init:project` changes the default config directory
to the new executable name; it does not move a pre-existing config file.
Legacy numeric configuration versions and custom migrations remain handled by
the application, not `conf`’s semver migrations. Invalid files are never
automatically cleared. Precedence is defaults < saved JSON < environment < CLI
flags. Save/discard is explicit in Settings.

Palettes are in `src/theme/palettes.json`, and the project fallback is in `src/theme/defaults.json`. Preserve `NO_COLOR`, `--ascii`, narrow widths, and noninteractive `--plain` output.

## Checks

Run `npm run typecheck`, `npm test`, and `npm run build`. CI also smoke-tests help, plain output, the doctor command, and the packaged executable.

See [the configuration guide](configuration.md) for file locations, precedence, validation and migrations; [the recording guide](recording.md) for screen capture; [the UI framework guide](ui-framework.md) for layout and focus; and [adding a feature](adding-a-feature.md) for implementation examples.

## Process and output contracts

Shared flags live on the root Commander command and work before or after nested
subcommands. Results go to stdout; diagnostics and notices go to stderr.
`--quiet` suppresses notices, `--verbose` enables informational diagnostics, and
`--debug` enables debug logging and stack traces. Quiet and verbose are mutually
exclusive. These flags do not suppress errors or corrupt JSON output.

SIGINT/SIGTERM abort the shared command signal and unmount any Ink session. Unix dependencies may re-raise real signals after cleanup; the shell still reports the conventional 128 + signal status.
Raw Ctrl-C uses the same cancellation path. Ordinary `q` exits with zero, Ctrl-C
with 130, and SIGTERM with 143. Signal handling is scoped to the executable;
reusable providers do not install process-wide listeners.

The file logger defaults to errors, opens its descriptor lazily, redacts common
credential fields/strings, and retains at most two 1 MiB files under the XDG
state directory. `createLogger` allows downstream level/path/size configuration.
Redaction is a fallback: applications should avoid logging secrets.

Update checks are disabled by default. Published downstream apps can opt in with
`<PREFIX>_UPDATE_NOTIFIER=1`; private packages, CI, non-TTY output and
`NO_UPDATE_NOTIFIER` skip checks. Checks have a one-second timeout, a 24-hour
state-directory cache and a one-hour failure marker, so offline launches do not
repeat the timeout on every start. Notifications are printed before rendering
and never modify command results.
