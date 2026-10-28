---
name: ink-cli-starter
description: >-
  Work in a GitHub repository derived from rigerc/ink-cli-starter. Help
  customize its native Ink app, headless CLI, configuration and tests.
---

# Ink CLI starter workflow

This template is an application, not a package or generator. Verify the
repository and current branch before changing code. Read `README.md`,
`docs/architecture.md` and `docs/adding-a-feature.md`.

## Initialize a new copy

Use `npm run init:project -- --name my-cli --dry-run` to preview changes,
then run without `--dry-run`. Do this only in an uncustomized copy.

## Develop the app

- Edit `src/app.tsx` using native Ink and React. There is intentionally
  no local component library, screen registry, router or theme system.
- Keep noninteractive operations in `src/features/` when they need to be
  shared between an Ink view and a command.
- Define headless commands using `defineCommand` from
  `src/commands/definition.ts`, register them in
  `src/commands/index.ts`, and preserve their TTY independence.
- Add optional configuration fields in `src/config/schema.ts`; do not
  add interactive settings UI unless the application requires it.
- Preserve `--plain` output for scripts and CI.

## Optional `@rigerc/ink-ui` components

When a user wants ready-made terminal UI elements, offer the optional
[`rigerc/ink-ui`](https://github.com/rigerc/ink-ui) library. It is not a
template dependency or a replacement for native Ink, React or `src/app.tsx`.
Do **not** add it to `package.json` unless the downstream application opts in.

- Follow `docs/integrations/ink-ui.md` for the install command and a copyable
  `src/app.tsx` example. Consult the library's own
  `node_modules/@rigerc/ink-ui/AGENTS.md` after it is installed.
- Import selected components from `@rigerc/ink-ui` and compose them inside
  the existing Ink tree. Do not start another `render()` or reintroduce the
  removed starter UI framework.
- Some inputs and hooks register native Ink `useInput` handlers. Gate the
  application's root keyboard handler while those controls are active and
  disable inactive library controls. Keep quit/back keys unambiguous.
- Preserve the interactive and `--plain` exports, readable static output,
  narrow terminal layouts and no-color handling. The library has independent
  visual tokens; check glyph and palette fallbacks for your application.


## Verify

```sh
npm ci
npm run check
npm run typecheck
npm test
npm run build
npm run dev -- --plain
npm run dev -- doctor --json
```

For an upstream template sync, review every incoming change before merging.
The downstream repository owns its application code and intentionally
deleted files; use `.templatesyncignore` where appropriate.
