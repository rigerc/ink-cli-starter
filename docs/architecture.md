# Application architecture

This repository is a GitHub template containing the actual application.
It has no code generator and no local UI framework.

## Entry points

- `src/cli.tsx`: process lifecycle, error reporting and interrupt handling.
- `src/lib/program.ts`: Commander flags, headless command registration and help.
- `src/lib/render-app.tsx`: lazy Ink import, single-frame rendering and TTY lifecycle.
- `src/app.tsx`: one native Ink view. It imports only Ink, React-compatible APIs,
  and package metadata. There is no custom shell, screen registry, router or UI provider.
- `src/commands/`: headless command definitions and typed validation independent of Ink.
- `src/config/`: optional validated JSON settings and persistence.
- `src/features/`: independent operations that commands or Ink components can share.

## Interactive vs headless

Invoking the CLI without a subcommand starts Ink when a real TTY is attached.
`--plain`, CI and piped output render a synchronous static frame and exit.
The bare Ink app uses `useInput` to handle `q`/Escape; the CLI owns Ctrl-C
and termination cleanup. Render essential plain output synchronously.

Commands registered through `defineCommand` do not import Ink or depend on a
TTY. They receive a cancellation signal, typed options, and stdout/stderr
output helpers. `--json` is restricted to these headless commands.

## Customization

Edit `src/app.tsx` directly. Add components, state management, navigation,
styling or keyboard helpers only if your product needs them. The starter
does not impose any of these decisions. Add a headless command to
`src/commands/index.ts` if you need an operation usable from scripts.

Settings are independent of the presentation layer. The example `label`
field is defined in `src/config/schema.ts` and resolved from defaults,
stored JSON and the environment; `--config` selects a file.
Saved configuration is validated before it is updated, and invalid files are
never overwritten automatically.

## Checks

Run `npm run check`, `npm run typecheck`, `npm test`, and
`npm run build`. Tests cover native Ink rendering, CLI subprocesses,
configuration, completions and interactive terminal signals.

See [adding a feature](adding-a-feature.md) and
[configuration](configuration.md).
