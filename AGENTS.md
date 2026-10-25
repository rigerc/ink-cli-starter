# Instructions for this Ink CLI application

This repository is a **GitHub template that directly contains the application**. There is no scaffold generator. Read `README.md`, [architecture](docs/architecture.md), [adding a feature](docs/adding-a-feature.md), and [the UI framework guide](docs/ui-framework.md) before making architectural changes.

- `src/cli.tsx` owns CLI flags and decides between headless commands, `--plain` output and an interactive Ink session. `src/app.tsx` owns the providers, the app shell and global navigation.
- Register screens in `src/screens/index.ts`. `ScreenLayout` and the shared `AppShell` are convenient defaults, not mandatory. Choose `layout: 'bare'` on a screen when it needs its own chrome, or `globalKeys: false` for custom keyboard behavior.
- Keep business operations independent of Ink and React. Register headless commands in `src/commands/index.ts`.
- Reuse `src/components/` and `src/hooks/` when helpful, but native Ink components and custom layout are supported. `Panel`, `Card`, `Stack` and `Row` accept standard Ink Box props. `ScreenLayout` can omit a title and customize spacing.
- `useKeymap` supports scoped shortcuts (control > screen > global) when you want coordinated handling. Native Ink `useInput` is also available; avoid conflicting active listeners and use input capture when editing free-form text.
- Use semantic theme tokens; preserve `NO_COLOR`, ASCII rendering, narrow widths, and deterministic `--plain` output. Do not write to stdout while Ink is rendering.
- The gallery is a developer-only reference available with `npm run gallery`. It is not a visible product tab.
- This project uses **Vite+**, not plain Vite. Prefer the declared npm scripts: `npm run typecheck`, `npm test`, `npm run build`. Run `npm ci` after pulling dependency changes.
- Update documentation and interaction/width regression tests when changing shared framework conventions.
