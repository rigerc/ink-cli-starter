# Application architecture

This repository is the actual CLI application copied by GitHub's **Use this template** action. There is no generator, feature pruning, or separate scaffold tree.

## Entry points

- `src/cli.tsx` parses arguments, invokes noninteractive commands, and chooses interactive or one-frame Ink rendering.
- `src/commands/index.ts` registers headless commands. Commands must not depend on a TTY or import Ink.
- `src/app.tsx` composes the shared terminal shell, application providers, navigation, and global shortcuts.
- `src/screens/index.ts` registers screens. Home, Settings, and Help are visible tabs. The gallery is accessible with `--screen gallery` but is hidden from navigation.
- `src/components/`, `src/hooks/`, and `src/theme/` contain reusable local UI primitives.
- `src/config/` provides validated, versioned JSON configuration.

## New features

Keep application models and operations in `src/features/<feature>/` independent of rendering. Both a screen and a headless command can call the same operation. Add other services only as needed; this template does not impose a database, network client, or state manager.

The default app uses `AppShell`, `ScreenLayout`, `ScreenState`, semantic colors, and scoped `useKeymap` handlers. These are defaults rather than rules. `ScreenDef.layout: 'bare'` renders a screen without application chrome in both interactive and plain modes; `globalKeys: false` turns off the built-in shortcuts on that screen. Existing screens remain unchanged when these properties are omitted.

`Panel`, `Card`, `Stack` and `Row` accept Ink Box props, and `ScreenLayout` supports optional headings and configurable spacing. Import Ink's `Box`, `Text` and `useInput` directly for custom UI. Coordinated `useKeymap` priority is control > screen > global; activate only one free-form text editor at a time to avoid shortcut conflicts.

## Configuration and themes

The config store validates settings with Zod and persists them under the application-specific XDG path. Precedence is defaults < saved JSON < environment < CLI flags. Save/discard is explicit in Settings.

Palettes are in `src/theme/palettes.json`, and the project fallback is in `src/theme/defaults.json`. Preserve `NO_COLOR`, `--ascii`, narrow widths, and noninteractive `--plain` output.

## Checks

Run `npm run typecheck`, `npm test`, and `npm run build`. CI also smoke-tests help, plain output, the doctor command, and the packaged executable.

See [the UI framework guide](ui-framework.md) and [adding a feature](adding-a-feature.md).
