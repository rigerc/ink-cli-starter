# ink-kit

A skeleton for polished terminal apps on **Ink 8** (React 19, Node 22+): theme system,
hooks, helpers and a component library, with a gallery and tests.

```bash
npm install
npm run dev                 # interactive app
npm run gallery             # jump straight to the component gallery
npm run dev -- --plain      # one-shot static render (what pipes/CI get)
npm test                    # every screen × 4 themes × 2 widths, checks nothing overflows
npm run build && npm start
```

Keys: `tab` / `1-5` switch screens, `t` cycles themes, `?` help, `q` quit.

## Layout

```
src/
  cli.tsx            flags, config, theme resolution, interactive vs plain
  app.tsx            providers, shell, global keymap, PlainView
  keys.ts            global key list (status bar + Help)
  theme/             tokens, 4 themes, resolve order, ThemeProvider/useTheme/useTone
  components/        Stack Row Panel Card Badge StatusMessage Alert Spinner ProgressBar
                     KeyValue Table TaskList Select Tabs EmptyState ErrorPanel
                     Header StatusBar ToastHost AppShell + typography (Heading, Label,
                     Muted, Code, Kbd, Icon, Divider)
  hooks/             useKeymap useRouter useAsync useToast useElapsed useInterval
                     useExit useTerminalSize
  lib/               format, gradient, terminal, config (zod), logger, errors
  screens/           Home Tasks Gallery Settings Help  (+ registry in index.ts)
tests/
```

## Theming

Themes are semantic tokens (`primary accent success warn danger info muted` + `text border focus onTone`).
Components never hardcode colors; use `useTheme()` / `useTone(tone)`.

Resolution order: `NO_COLOR` > `--theme` > `INK_KIT_THEME` > config file > light/dark autodetect.
Themes: `dark`, `light`, `contrast` (ANSI names only), `mono` (no color; weight and symbols).
`--ascii` / `CLI_ASCII=1` swaps all glyphs and borders for ASCII.

To add a theme: add a name in `theme/tokens.ts`, a palette in `theme/themes.ts`. The gallery and tests pick it up.

## Add a screen

Create `src/screens/Foo.tsx`, add one line to the `screens` array in `src/screens/index.ts`.
It gets a tab, a number shortcut, a `--screen foo` flag value, and test coverage.

## Notes

- Never `console.log` while Ink is rendering; use `logger` (writes a file with `--debug`).
- Ink has no border titles, so `Panel` draws its title as the first row.
- Status is never color-only: every tone pairs with a symbol.
- Config lives at `$XDG_CONFIG_HOME/ink-kit/config.json` (default `~/.config/ink-kit/`).
- Rename the package: search/replace `ink-kit` (package.json, `APP_NAME` in `lib/config.ts`, header).
