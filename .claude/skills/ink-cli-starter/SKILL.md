---
name: ink-cli-starter
description: >-
  Build, customize, and maintain applications copied from the ink-cli-starter
  GitHub template (Ink 8, React 19, TypeScript, Commander, and Vite+). Use for
  project initialization, screens, headless commands, settings, terminal input
  and output, regression testing, or safe upstream template sync.
---

# Work with Ink CLI Starter

This GitHub template contains the application itself, not a generator. Modify
the copied source; do not look for a separate scaffold. Follow the project's
`AGENTS.md` and relevant focused rules. This skill describes workflows and
does not override those instructions.

## Orient and choose the right layer

- Read `README.md`, `docs/architecture.md`, and
  `docs/adding-a-feature.md`. Read `docs/ui-framework.md` before changing
  layout, keyboard behavior, or focus; read `docs/configuration.md` before
  changing settings.
- `src/cli.tsx` owns process lifetime and cancellation.
  `src/lib/program.ts` owns Commander flags and command registration;
  `src/lib/render-app.tsx` lazily starts Ink rendering.
- `src/app.tsx` supplies the default app. `src/screens/index.ts` is the
  screen registry; `src/commands/index.ts` is the headless command registry.
  Inspect `src/ui/core/` and `src/ui/layout/` before replacing the app
  runtime, shell, or navigation model.
- Use local `src/components/`, `src/hooks/`, and `src/theme/` where
  helpful. These are optional primitives, not a mandatory design system.
  Prefer an existing extension point over new framework infrastructure.

## Initialize a fresh template copy

1. Use Node.js 22.12+ and run `npm ci` in a **new copy** of the template.
2. Preview project identity changes:

   ~~~bash
   npm run init:project -- --name my-cli --description "My CLI" --dry-run
   ~~~

   Apply them only after reviewing the preview (remove `--dry-run`).
   Do not reinitialize an already-customized project without inspecting
   package and config identity. See `docs/template/customization.md`.
   Renaming the CLI does not migrate an existing config file.
3. Run `npm run dev` in a real terminal. For a static, scriptable frame use
   `npm run dev -- --plain`; for headless diagnostics use
   `npm run dev -- doctor --json`. `--plain` cannot be combined with a
   subcommand, and `--setup` requires an interactive terminal.

## Add a feature

1. Put shared domain models and operations under `src/features/<feature>/`
   when useful. Keep them independent of React and Ink so screens and
   commands can call the same operation.
2. For a screen, add `src/screens/<Name>.tsx` and register it in
   `src/screens/index.ts`. Registry IDs drive `--screen`, navigation, and
   capture targets. Visible registry order controls tabs and the first nine
   numeric shortcuts. Use `showInNav: false` for a hidden detail screen.
   `layout: 'bare'` removes shell chrome; `globalKeys: false` independently
   disables built-in shortcuts. If global keys are disabled, supply an
   accessible exit or navigation path.
3. For a headless operation, define a typed `defineCommand` (or
   `defineCommandGroup`) with its arguments, options, Zod schema, and
   handler in `src/commands/`, then register it in `src/commands/index.ts`.
   Commander wiring, help, and completions follow the registry. Do not edit
   the CLI entry point just to add a subcommand. Headless code must work
   without a TTY and must not import Ink or require React rendering.
4. In a command handler, use `context.output()` for result data on stdout,
   `context.notice()` for suppressible stderr notices, `context.flags` for
   common options, and `context.signal` for cancellation. Keep JSON stdout
   parseable and do not send diagnostics to it. Read piped stdin only when the
   command explicitly accepts `-`, as the shipped `example` command does.
5. For UI interactions, use scoped `useKeymap` or `useAction` and activate
   only the control that owns input. Use `useInputCapture` for custom
   free-form text editing, then release capture on finish/cancel. Managed
   controls already coordinate input; avoid competing native `useInput`
   handlers. Start async work in events or effects, not during render, and
   handle loading, empty, error, and success with `useAsync`/`ScreenState`.
6. For a new global flag, update the option in `src/lib/program.ts` and
   the parsed `globalOptions` schema in `src/commands/definition.ts`.
   For settings, align `src/config/schema.ts` (`appConfig.fields` and
   validation), runtime overrides, editor behavior, and persistence.
   Registering a config environment variable does not automatically add a
   Commander option. Follow `docs/configuration.md` for versioned migrations,
   explicit save/discard, and invalid-file preservation.

## Preserve terminal and configuration contracts

- Configuration precedence is **defaults < saved file < environment < CLI**.
  Do not persist environment or CLI overrides as user settings. Preserve
  unknown application-specific config keys and leave invalid saved JSON
  untouched rather than silently resetting it.
- `--plain` must produce one meaningful deterministic frame without waiting
  for effects. It is also the default for piped or CI output. Use a headless
  command when results must complete asynchronously before printing.
- Keep result stdout separate from Ink rendering and diagnostics. Preserve
  `--quiet`, `--json`, `--help`, and shell completion behavior.
- Preserve `NO_COLOR` (forces mono, **not** ASCII), `--ascii`, theme
  fallbacks, accessible status text, and usable layouts at approximately 40,
  80, and 120 columns. Test keyboard focus and restoring shortcuts after an
  editor closes.

## Validate the affected behavior

Use this repository's **Vite+** scripts, not ad hoc Vite commands:

~~~bash
npm run check
npm run typecheck
npm test
npm run build
~~~

Add or update focused regression tests under `tests/` when behavior changes.
For CLI, screen, or command changes, smoke-test the real entry points:

~~~bash
npm run dev -- --help
npm run dev -- --plain
npm run dev -- doctor --json
npm run dev -- completion bash
~~~

For input/layout changes, verify an interactive TTY, mono/ASCII modes, and
40/80/120-column rendering; run `npm run test:pty` when native PTY support is
available. Relevant tests include `tests/cli.behavior.test.ts`,
`tests/headless-commands.test.ts`, `tests/keyboard-and-controls.test.tsx`,
and `tests/app-runtime.test.tsx`. For instruction-only edits, application
tests are optional: validate skill frontmatter, paths, example commands, and
the mirrored skill content instead.

## Respect generated instructions and downstream ownership

- AgentsMesh sources live under `.agentsmesh/`. Do not hand-edit generated
  `AGENTS.md`, `CLAUDE.md`, or tool projections. For canonical instruction
  changes, use `agentsmesh lint`, inspect `agentsmesh diff`, then
  `agentsmesh generate` and `agentsmesh check`.
- This skill is maintained directly at
  `.agents/skills/ink-cli-starter/SKILL.md`, **not** by AgentsMesh. Keep its
  Claude discovery mirror at
  `.claude/skills/ink-cli-starter/SKILL.md` identical when editing it.
- Before syncing upstream, read `docs/template/syncing.md` and
  `.templatesyncignore`. Sync is opt-in. Preserve downstream-owned package
  identity, `.gitignore`, application code, agent configuration, and skills.
  Exclude customized or intentionally removed shared paths **before** a
  sync, review added/deleted/renamed files, and inspect every sync PR. Static
  exclusions cannot automatically detect every downstream customization.
