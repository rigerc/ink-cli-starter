# UI framework guide

This guide explains the local **Ink 8 / React 19** component framework. The UI framework lives in `src/` and is part of this template, not a separately published dependency. Downstream apps may remove unused primitives, providers, or demos. If syncing upstream later, exclude intentionally deleted shared paths in `.templatesyncignore`.

See [architecture](architecture.md) for entry points and [adding a feature](adding-a-feature.md) for a screen and headless command walkthrough. Reusable components remain available under `src/components/`.

## Start here

1. Run `npm run dev` in an interactive terminal; use `--plain` for one-shot output in pipes and CI.
2. Read `src/app.tsx`, `src/screens/Home.tsx` and `src/screens/index.ts` to see the application shell, screen composition and registration.
3. Discover reusable exports in `src/components/index.ts` and `src/hooks/index.ts`; compose these in your app screens as needed.
4. Add domain logic outside the React/Ink layer so noninteractive commands can reuse it.

## Architecture and ownership

| Location                   | Responsibility                                                      |
| -------------------------- | ------------------------------------------------------------------- |
| `src/cli.tsx`              | Parse flags and select interactive or plain rendering               |
| `src/app.tsx`              | Install providers, shared shell, navigation and global shortcuts    |
| `src/screens/index.ts`     | Register screen IDs, labels, tab order and contextual hints         |
| `src/screens/*.tsx`        | Compose reusable UI into screens                                    |
| `src/components/`          | Themed layout, presentation and input controls                      |
| `src/hooks/`               | Router, keys, input capture, async work, toast and terminal helpers |
| `src/theme/`               | Semantic colors, symbols and ASCII compatibility                    |
| `src/features/` (optional) | Domain models and operations independent of Ink                     |

**AppProviders** installs configuration, theme, input capture, keymap, toast, router and error-boundary providers. By default, `App` renders `AppShell` (header, tabs, command menu, toasts, status footer) around a screen. If that structure does not fit your CLI, register a bare screen or compose native Ink UI directly. `ScreenLayout` and `InlineLayout` are optional conveniences.

## Create and register a screen

Add `src/screens/Jobs.tsx`:

```tsx
import {Text} from 'ink';
import {useState} from 'react';
import {Panel, ScreenLayout, Stack, StatusMessage} from '../components';
import {useKeymap, useToast} from '../hooks';

export function JobsScreen() {
  const [refreshes, setRefreshes] = useState(0);
  const toast = useToast();

  useKeymap(
    [
      {
        key: 'r',
        run: () => {
          setRefreshes((count) => count + 1);
          toast.push('View refreshed', 'success');
        },
      },
    ],
    {scope: 'screen'},
  );

  return (
    <ScreenLayout title="Jobs" description="Recent activity">
      <Stack gap={1}>
        <Panel title="Overview">
          <Text>Refreshes: {refreshes}</Text>
        </Panel>
        <StatusMessage tone="info">Press r to refresh.</StatusMessage>
      </Stack>
    </ScreenLayout>
  );
}
```

Import `JobsScreen` in `src/screens/index.ts`, then add to the `screens` array:

```ts
{id: 'jobs', label: 'Jobs', Component: JobsScreen, hints: [
  {key: 'r', label: 'refresh'},
]},
```

A visible screen gets a tab, a numeric shortcut and a `--screen jobs` flag. `showInNav: false` makes a screen addressable through `--screen` without putting it in the tab bar. The `hints` property describes contextual actions in the footer but **does not register key handlers**; use `useKeymap` for those. Global keys are defined in `src/keys.ts`, not copied into each screen.

## Which components to use

| Goal               | Components                                                                              |
| ------------------ | --------------------------------------------------------------------------------------- |
| Layout and spacing | `Stack`, `Row`, Ink `Box`                                                               |
| Screen structure   | `ScreenLayout`, `ScreenHeader`                                                          |
| Grouping           | `Panel`, `Card`, `Divider`                                                              |
| Text and key hints | `Heading`, `Label`, `Muted`, `Code`, `Kbd`, `Icon`                                      |
| Status             | `Badge`, `StatusMessage`, `Alert`, `Spinner`, `ProgressBar`, `EmptyState`, `ErrorPanel` |
| Data               | `KeyValue`, `Table`, `TaskList`, `PaginatedList`                                        |
| Result states      | `ScreenState`                                                                           |
| Input              | `Select`, `MultiSelect`, `SearchSelect`, `Toggle`, `Confirm`                            |
| Wizards            | `Stepper`, `Step`, `StepperProgress`, `StepperNavigation`, `InlineLayout`               |

Import components through `../components` and hooks through `../hooks` when useful. They are a toolkit, not the only supported rendering API: Ink `Box`, `Text`, and `useInput` can be used directly. `Panel` and `Card` accept standard Ink Box props (including border and padding overrides); `Stack` and `Row` accept native gap values. Give selection options unique `value` fields and paginated items stable keys. Use `isActive={false}` to disable an inactive keyboard control.

## Using only what you need

Each screen entry may choose how much framework UI to use. Without extra options, the existing shell, navigation, and shortcuts behave as before:

```ts
// In src/screens/index.ts
{id: 'jobs', label: 'Jobs', Component: JobsScreen},

// Full control of the terminal view, but still inside AppProviders:
{id: 'custom', label: 'Custom', Component: CustomScreen, layout: 'bare', globalKeys: false},
```

`layout: 'bare'` removes the app-provided header, tabs, footer and toast host for that screen, in both interactive and `--plain` rendering. It does **not** remove the providers. `globalKeys: false` is independent of layout: it disables shell shortcuts and their footer hints for that screen, leaving registered screen/control handlers and Ink `useInput` available. If you disable quit/navigation keys, implement your own way to exit or navigate, or use Ctrl+C.

`ScreenLayout` supports a title-free layout with custom spacing:

```tsx
<ScreenLayout paddingX={0} gap={2}>
  <Panel borderStyle="double" paddingX={2} title="Custom panel">
    <Text>Native Ink layout props are supported.</Text>
  </Panel>
</ScreenLayout>
```

`AppShell` can also be used directly with no header and with `showToasts={false}` if you want only part of the shared chrome. These options are additive; existing screens do not need migration.

## Keyboard routing and focus

`AppProviders` installs a `KeymapProvider` and `InputCaptureProvider`. The provider dispatches **one** matching shortcut per keypress, with priority **control > screen > global**. Use `{scope: 'screen'}` for screen shortcuts, `{scope: 'global'}` for shell shortcuts; controls default to `control`. Avoid overlapping shortcuts between simultaneously active controls.

When editing free-form input, avoid conflicting keyboard listeners. `SearchSelect` automatically captures input while active, which pauses regular shortcuts (including Tab, q, t and numeric screen keys). Close or deactivate the search on selection and cancellation:

```tsx
import {Text} from 'ink';
import {useState} from 'react';
import {SearchSelect} from '../components';
import {useKeymap} from '../hooks';

export function PackagePicker() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('none');

  useKeymap([{key: '/', run: () => setOpen(true)}], {scope: 'screen', isActive: !open});

  return open ? (
    <SearchSelect
      items={[
        {value: 'ink', label: 'Ink'},
        {value: 'react', label: 'React'},
      ]}
      onSelect={(value) => {
        setSelected(value);
        setOpen(false);
      }}
      onCancel={() => setOpen(false)}
    />
  ) : (
    <Text>Selected: {selected} (press / to choose)</Text>
  );
}
```

For another text editor, call `useInputCapture(isEditing)` while it owns input and release capture when editing stops. Nested controls owned by a capturing editor may use `allowWhenCaptured` with `Select` or `MultiSelect`. Prefer keeping **one text-input control active** at a time. When a child field owns Enter/Escape in a `Stepper`, set `keyboardNav={false}` and navigate using `useStepper()` or the step render callback.

## Async states and notifications

`useAsync(fn)` returns `run` and a state with `status` (`idle`, `loading`, `success`, `error`); it ignores stale results after unmount or superseding runs. Start operations from an event or effect, **not during render**. `ScreenState` renders loading, empty, error and success views, but the caller determines whether a successful result is empty.

```tsx
// Inside a screen with useEffect, Text, useAsync, ScreenState imported.
// loadJobs is a domain operation returning records with id and name.
const jobs = useAsync(loadJobs);
useEffect(() => {
  void jobs.run();
}, [jobs.run]);

const status =
  jobs.status === 'idle'
    ? 'loading'
    : jobs.status === 'success' && jobs.data.length === 0
      ? 'empty'
      : jobs.status;

return (
  <ScreenState
    status={status}
    error={jobs.status === 'error' ? jobs.error : undefined}
    title={status === 'empty' ? 'No jobs yet' : undefined}
  >
    {jobs.status === 'success' && jobs.data.map((job) => <Text key={job.id}>{job.name}</Text>)}
  </ScreenState>
);
```

Use `useToast().push(message, tone)` for transient messages, and `StatusMessage` or `Alert` for persistent feedback. Headless subcommands belong in `src/commands/` and must not import Ink. `--plain`, pipes and CI render **one frame without input**: do not rely on a keypress or delayed async update for essential plain output.

## Theme, accessibility and width

Use semantic theme tokens instead of hardcoded colors: `primary`, `accent`, `success`, `warn`, `danger`, `info` and `muted`. For custom rendering use `useTheme()` or `useTone(tone)`. Status must not be communicated by color alone. Respect `NO_COLOR`, `mono` and `--ascii`, including glyph and border fallbacks.

`useTerminalSize()` exposes the current column count. Prefer stacking panels at narrow widths and using Ink flex layouts over rigid dimensions. Wrap or truncate unbounded text. Test around 40, 80 and 120 columns.

Semantic palettes live in `src/theme/palettes.json` and the project fallback in `src/theme/defaults.json`. The `theme:list`, `theme:token` and `theme:default` scripts inspect and edit project source. A runtime theme can be overridden by CLI flag, environment or saved config.

## Testing and quality

- Run `npm run typecheck`, `npm test`, and `npm run build`.
- Use `ink-testing-library` for keyboard/focus assertions, and Ink `renderToString()` for deterministic width-specific frames.
- Exercise TTY interactions, `--plain` output, loading/error/empty states, long text, narrow widths, mono/ASCII and multiple themes.
- Never call `console.log` while Ink is rendering; use the logger for diagnostics and keep headless output separate.
- When changing a framework convention, update this guide, the feature documentation, and regression tests.

For the next implementation step, consult [adding a feature](adding-a-feature.md).
