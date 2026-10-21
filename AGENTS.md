<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

## ink-kit repository instructions

These instructions apply to work on the **starter and scaffold generator**.
Read `README.md` and `docs/ui-framework.md` before changing shared UI behavior.

- Core runtime: `src/cli.tsx` selects interactive vs. `--plain` rendering; `src/app.tsx` owns providers, the shell, router and global shortcuts. Register screens through `src/screens/index.ts`, and compose screen content with `ScreenLayout`, not an additional `AppShell`.
- Reuse `src/components/` and `src/hooks/`. Prefer `ScreenState` and `useAsync` for async UI and `useToast` for feedback. Keep feature logic separate from React/Ink, and keep headless commands independent of terminal rendering.
- Shared keyboard dispatch prioritizes control over screen over global bindings. Use `{scope: 'screen'}` for screen handlers. When a control edits text, capture input with `useInputCapture` (or use `SearchSelect`) and release capture when it closes; do not leave conflicting controls active.
- Use semantic colors via `useTheme()` / `useTone()`. Preserve mono, `NO_COLOR`, ASCII glyphs, narrow-width rendering and noninteractive output. Do not log to stdout while Ink owns the terminal.
- Scaffolding is driven by `scripts/scaffold.mjs` (Git-tracked files and `templates/app/` overlays) and `scripts/scaffold-options.mjs` (feature pruning and generated files). Generated README, architecture and agent guidance must reflect selected toolchain/features; the reusable `docs/ui-framework.md` must be copied for every preset.
- `templates/app/AGENTS.md` is the generated application's instructions, whereas this file describes starter maintenance. Keep both correct; do not apply Vite+-only instructions to generated tsdown apps.
- Check `package.json` scripts, not assumed Vite+ aliases. For this starter, validate with `npm run typecheck`, `npm test` and `npm run build`. Test scaffold variants via `tests/scaffold.test.ts` and the PR smoke-test workflow.
- Changes to shared UI APIs require updated docs, gallery/examples where applicable, and rendering/input/width regression coverage.
