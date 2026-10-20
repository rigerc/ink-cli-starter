# Terminal design system

The starter uses termcn's `Theme` type, `createTheme`, `ThemeProvider`, and `useTheme`. The custom themes in `source/design-system/themes.ts` are `ocean` (cyan/violet on dark slate) and `mono` (monochrome). All upstream termcn Ink theme implementations are also available under `source/lib/terminal-themes/`.

## Tokens

| Domain | Examples | Purpose |
|---|---|---|
| `theme.colors` | primary, accent, border, foreground, success, warning, error, info | Semantic color roles |
| `theme.border` | style, color, focusColor | Container/focus hierarchy |
| `theme.spacing` | 0, 1, 2, 3, 4, 6, 8 | Terminal cell spacing |
| `theme.typography` | bold, sm, base, lg, xl | Text emphasis |

Custom theme colors spread `defaultTheme.colors` before applying overrides, preserving the complete `ColorTokens` contract.

The theme is provided by `source/commands/_app.tsx` and can be locally overridden by wrapping a view in another `ThemeProvider`. The demo exercises this with `--theme mono`.

## Semantic states

`source/design-system/semantic.ts` maps `ready → success`, `running → info`, and `blocked → error` Badge variants. Always pair visual state with a text label; never use color alone to signal meaning.

Use Heading for hierarchy; Card/Panel for grouping; Badge/StatusMessage for states; ProgressBar for known progress and Spinner for indefinite work. Use semantic tokens instead of ad hoc hex literals in UI components.

## Terminal constraints

Review 40-column layouts, no-color mode (`NO_COLOR=1`), ASCII fallback (`NO_UNICODE=1`), and reduced animation (`NO_MOTION=1` or `CI=true`). Not all termcn components implement every fallback identically: verify new features on target terminals.
