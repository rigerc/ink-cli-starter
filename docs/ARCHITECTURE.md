# Architecture

The entrypoint `source/cli.ts` starts Pastel with `importMeta: import.meta`, `name` and `description`. Pastel dynamically loads compiled command modules from `build/commands/`. The shared Pastel `_app.tsx` layout wraps commands in a termcn `ThemeProvider`.

```text
source/cli.ts -> Pastel
  source/commands/_app.tsx -> ThemeProvider
  source/commands/index.tsx | demo.tsx | doctor.tsx
    source/components/app-shell.tsx
    source/components/ui/ (all 123 termcn Ink UI files)
      source/hooks/ + source/providers/ + source/lib/
    source/design-system/ (tokens and semantic variants)
    source/demo/ (typed example data)
```

Commands export React components. Options use Zod object schemas. `source/commands/demo.tsx` uses Ink `useInput` only in an interactive TTY, avoiding raw-mode errors when stdout is redirected or in CI.

termcn is a source registry, not an npm runtime dependency. Upstream `@/registry/bases/ink/...` paths were rewritten to relative import specifiers ending in `.js`; TypeScript NodeNext emits corresponding JavaScript under `build/`.

`source/lib/terminal-themes/index.ts` is adapted for this Ink-only project: it has a local `BASE_NAMES = ["ink"]` instead of upstream web registry metadata.

Keep business logic outside React components, centralize tokens in `source/design-system/`, and avoid `console.log` during Ink's render loop.
