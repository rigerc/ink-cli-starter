# ink-kit

A skeleton for polished terminal apps on **Ink 8** (React 19, Node 22+): theme system,
hooks, helpers and a component library, with a gallery and tests.

```bash
npm install
npm run dev                 # interactive app
npm run gallery             # jump straight to the component gallery
npm run demo:inline         # compact setup wizard in normal terminal scrollback
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
                     Stepper Step StepperProgress StepperNavigation Confirm InlineLayout
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

## Inline demo

The shell already uses normal terminal output. `npm run demo:inline` (or `ink-kit --demo`)
shows a separate, compact setup wizard without tabs or global shortcuts. It takes only
the rows its content needs, preserves shell scrollback, and exits with its result visible.
Enter starts the wizard, arrows choose a template, and Enter confirms. Escape goes back
or cancels from the first step; Ctrl+C quits. On Review, choose No to cancel or Yes to run
async validation and finish. This demo does not create files or run external commands.

```bash
npm run demo:inline -- --theme contrast
npm run demo:inline -- --plain --ascii --theme mono
npm run build
node dist/cli.js --demo
```

Pipes, CI, and `--plain` print a static preview and exit without waiting for input.
Theme flags, `NO_COLOR`, config, and ASCII glyph handling work as in the main app.
The gallery includes progress variants, a restartable wizard (`r`), a confirmation
preview, and the inline layout.

## Wizard components

The Stepper API is inspired by [archcorsair/ink-stepper](https://github.com/archcorsair/ink-stepper)
(MIT). This is a local implementation using the starter's theme tokens, with no new runtime dependency.

```tsx
import {Text} from 'ink';
import {InlineLayout, Stepper, Step, StepperNavigation} from './components';

<InlineLayout>
  <Stepper onComplete={finish} onCancel={cancel}>
    <Step name="Welcome">
      <Text>Press Enter to begin.</Text>
      <StepperNavigation />
    </Step>
    <Step name="Validate" canProceed={async () => await validate()}>
      {({isValidating}) => (
        <Text>{isValidating ? 'Checking...' : 'Press Enter to finish.'}</Text>
      )}
    </Step>
  </Stepper>
</InlineLayout>
```

`Stepper` accepts direct `Step` children, fragments, and conditional Steps. Give conditional
steps stable keys so inserting another step preserves the active step. Unlike upstream,
custom components wrapping `Step` are not supported; wrap a step's content instead.
Only the active step's content mounts. Empty wizards render nothing.

- `Step`: `name`, `canProceed` (boolean or sync/async function), and content or a render function.
- Render context / `useStepper()`: `goNext`, `goBack`, `goTo`, `cancel`, `currentStep`,
  `totalSteps`, `isFirst`, `isLast`, `isValidating`. Indexes are zero-based.
- `Stepper`: `initialStep`, controlled `step` + `onStepChange`, `onExitStep`, `onEnterStep`,
  `onError`, `keyboardNav`, `showProgress`, and `renderProgress`.
- `StepperProgress`: `steps` (`{id, name}[]`), `currentStep`, and horizontal/vertical `orientation`.
  Labels wrap to terminal width. Set `currentStep` to `steps.length` for all complete.
- `StepperNavigation`: themed Enter/Escape hints inside an active Step.
- `Confirm`: `message`, `defaultValue` (defaults to No), `onConfirm(boolean)`, and `isActive`.
  Y/N or left/right selects an answer; Enter submits it.
- `InlineLayout`: optional `title`, `footer`, and `maxWidth` (defaults to 72 columns).
  Height follows its content and width shrinks with the terminal.

Next checks `canProceed`; back does not. `goTo` clamps its target and skips `canProceed`.
All navigation calls `onExitStep` first (return `false` to block), then `onStepChange`
and `onEnterStep` after a move. Errors block the move, show feedback, and call `onError`
when supplied. Navigation is locked through both async validation and exit hooks;
completion and cancellation fire once per mount. Remount with a new key to restart.

When a child input owns Enter/Escape, set `keyboardNav={false}` on the Stepper for that
step and navigate through the render context or `useStepper()`. See `src/demos/SetupWizard.tsx`
for Select and Confirm integration. Avoid combining the host app's global letter shortcuts
with free-form text entry.

## Notes

- Never `console.log` while Ink is rendering; use `logger` (writes a file with `--debug`).
- Ink has no border titles, so `Panel` draws its title as the first row.
- Status is never color-only: every tone pairs with a symbol.
- Config lives at `$XDG_CONFIG_HOME/ink-kit/config.json` (default `~/.config/ink-kit/`).
- Rename the package: search/replace `ink-kit` (package.json, `APP_NAME` in `lib/config.ts`, header).
