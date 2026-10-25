# Add your first feature

The template has no predefined business domain. Add only the pieces needed by
your application. Read [the UI framework guide](ui-framework.md) before adding interactive
controls; it explains provider ownership, component selection, input capture,
semantic styling and async states.

1. Create `src/features/example/` for pure models and operations if needed.
2. Add `src/screens/Example.tsx` and register the screen in `src/screens/index.ts`.
3. If required, add a noninteractive subcommand to `src/commands/index.ts`.
4. Add typed configuration in `src/config/schema.ts` only when necessary.
5. Write tests under `tests/` and run `npm run typecheck`, `npm test`, and `npm run build`.

## Minimal screen

```tsx
// src/screens/Example.tsx
import {Text} from 'ink';
import {Panel, ScreenLayout} from '../components';

export function ExampleScreen() {
  return (
    <ScreenLayout title="Example" description="An example feature">
      <Panel title="Overview">
        <Text>Your content goes here.</Text>
      </Panel>
    </ScreenLayout>
  );
}
```

Import and register it in `src/screens/index.ts`:

```ts
import {ExampleScreen} from './Example';

// Add to the exported screens array:
{id: 'example', label: 'Example', Component: ExampleScreen},
```

The screen now has a tab, numeric shortcut, and `--screen example`. The
footer and Help derive the numeric shortcut range from the screen registry;
no edits to `src/keys.ts` are needed. Add optional `hints` to the `ScreenDef`
when a screen has local actions, and use `ScreenState` for async states.

## Full-control screen (optional)

For a screen that supplies its own layout and keyboard behavior, register it with:

```ts
{id: 'custom', label: 'Custom', Component: CustomScreen, layout: 'bare', globalKeys: false},
```

A `bare` screen bypasses the app header, tabs, toasts and footer (including in `--plain` output), but still receives the theme, router, config, and keymap providers. `globalKeys: false` is independent of the layout choice; omit it to retain the default app shortcuts. Use Ink `Box`, `Text`, or `useInput` directly. When disabling global shortcuts, provide your own exit/navigation keys if needed.

## Minimal headless command

In `runCommand()` of `src/commands/index.ts`:

```ts
if (name === 'example') {
  if (args.length) throw new AppError('example takes no arguments', {exitCode: 2});
  console.log('Example command');
  return true;
}
```

Also register the subcommand in `src/cli.tsx` so Commander recognizes it and lists it in `--help`:

```ts
program.command('example').description('Run the example').action(() => {
  runCommand('example', [], {});
});
```

A real command should call a pure feature operation. Import that same operation
from an Ink screen when interactive access is useful. Do not couple business
logic to React hooks or terminal rendering.

## UI conventions for features

- The default shared `AppShell` supplies header, tabs, toasts, command palette and footer. Use `ScreenLayout` for convenient heading/spacing, or opt out with `layout: 'bare'` and compose native Ink elements directly.
- Use `useKeymap([{key: 'r', run: refresh}], {scope: 'screen'})` for screen actions. Add corresponding footer `hints` to the screen registry. Don't wire a second global keyboard handler.
- Interactive `Select`, `MultiSelect`, `Toggle` and `PaginatedList` controls accept `isActive={false}` when another control owns input. `SearchSelect` captures text input while active; deactivate or unmount it on selection/cancel.
- Use `useAsync` and `ScreenState` for loading, empty, error and success results; call your domain operation from events/effects rather than render.
- Use `useTheme` / `useTone` for colors and `useTerminalSize` for responsive layouts. Test `--plain`, mono/ASCII and narrow widths.

See [the UI framework guide](ui-framework.md) for runnable screen, focus and async examples.
