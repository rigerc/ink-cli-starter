# Architecture

This project is intentionally **domain-agnostic**. It includes terminal
infrastructure and a functioning configuration flow, but no product domain.

## Entry points

- `src/cli.tsx` handles command-line arguments and chooses headless or Ink mode.
- `src/commands/index.ts` registers commands. Commands never need a TTY.
- `src/app.tsx` composes providers, navigation, and global keys.
- `src/screens/index.ts` declares screen IDs, visible tab order, and shortcuts.
- `src/screens/Gallery.tsx` is a development-only UI component reference.
- `src/components/`, `src/hooks/`, and `src/theme/` supply reusable UI building blocks.
- `src/config/schema.ts` defines Zod configuration and editor metadata.
- `src/lib/config.ts` defines the app name and versioned configuration store.

## Application features

Create `src/features/<feature>/` when you implement an actual feature. Keep
models and operations independent of React/Ink so a TUI screen and a headless
CLI command can share them. Add `src/services/` or `src/integrations/` if
your application develops a need for cross-feature logic or external adapters.
The skeleton does not impose a database, HTTP client, or state framework.

See [adding-a-feature.md](adding-a-feature.md) for minimal examples.

## Navigation and input

Home, Settings, and Help are visible tabs. The gallery is accessible with
`--screen gallery` but hidden from the tab bar. Tab, shift+tab, and numeric keys
traverse visible screens. Ctrl+K opens a searchable command menu. The global
action registry in `src/keys.ts` drives keyboard handling, Help, and footer hints;
per-screen hints belong on `ScreenDef` in `src/screens/index.ts`.

`AppShell` owns the persistent application header, tabs, toast area, and adaptive
status footer. Use `ScreenLayout` for page titles and content spacing and
`ScreenState` for async loading/empty/error/success states. The normal rendering
mode remains inline, preserving shell scrollback. When a control captures input,
all regular `useKeymap` bindings are paused via `src/hooks/useInputCapture.tsx`.
The shared `KeymapProvider` dispatches at most one matching shortcut: controls
have priority over screen bindings, which have priority over global bindings.
The configuration editor explicitly opts its nested Select/MultiSelect controls
into captured input; other screen handlers remain suspended. Screen shortcuts
should pass `{scope: 'screen'}` to `useKeymap`.

## Configuration

The configuration store persists versioned JSON and validates it with Zod.
Precedence is defaults, saved file, environment, then CLI flags. Edits in
Settings or the wizard are drafts until Save and are written atomically.
Add new fields in both the schema and the fields registry.

## Theme customization

Semantic colors live in `src/theme/palettes.json` and the project fallback in
`src/theme/defaults.json`. Use `npm run theme:token -- <theme> <token> <color>`
to edit a palette value or `npm run theme:default -- <theme|auto>` to change
the built-in default. Inspect the palette with `npm run theme:list`.
The standalone scripts modify project source, not user preferences.
Resolution follows NO_COLOR, CLI flag, environment, saved configuration,
project default, then terminal autodetection for `auto`.

## Quality gates

Run `npm run typecheck`, `npm test`, and `npm run build`. CI in
`.github/workflows/ci.yml` runs these checks plus headless CLI smoke tests.
