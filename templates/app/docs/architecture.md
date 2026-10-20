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
`--screen gallery` but hidden from the tab bar. Tab and numeric keys traverse
visible screens only. When a control captures input, global bindings are
paused via `src/hooks/useInputCapture.tsx`.

## Configuration

The configuration store persists versioned JSON and validates it with Zod.
Precedence is defaults, saved file, environment, then CLI flags. Edits in
Settings or the wizard are drafts until Save and are written atomically.
Add new fields in both the schema and the fields registry.

## Quality gates

Run `npm run typecheck`, `npm test`, and `npm run build`. CI in
`.github/workflows/ci.yml` runs these checks plus headless CLI smoke tests.
