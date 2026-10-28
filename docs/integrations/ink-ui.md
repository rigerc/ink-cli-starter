# Optional `@rigerc/ink-ui` integration

The starter intentionally uses native Ink 8 and React 19 rather than a bundled
component framework. The published
[`@rigerc/ink-ui` npm package](https://www.npmjs.com/package/@rigerc/ink-ui)
([source](https://github.com/rigerc/ink-ui)) provides ready-made terminal
components when a downstream application needs them. **It is opt-in:** the
starter runs without it, and no dependency or provider is added to the template
by default.

## Install in a downstream application

From your project created with this template, install the published package
from npm:

```sh
npm install @rigerc/ink-ui
```

The package is available on [npm](https://www.npmjs.com/package/@rigerc/ink-ui).
The command records the dependency in your downstream `package.json` and
updates `package-lock.json`; commit both files so subsequent `npm ci`
installs use the locked version. No GitHub source checkout, Git URL or build
step is needed for normal installation.

The template already depends on `ink` and `react`, which satisfy the
library's Ink 7+/React 19+ peer requirements. Do not add another copy of React
or create a second Ink renderer. After installation, consult
`node_modules/@rigerc/ink-ui/AGENTS.md` for the library's composition and
keyboard conventions.

## Use it in the native app

For example, replace `src/app.tsx` with this version to use the library's
presentational `Badge` and `KeyValue` while retaining the starter's public
`App` and `PlainView` exports:

```tsx
import {Badge, KeyValue} from '@rigerc/ink-ui';
import {Box, Text, useApp, useInput} from 'ink';
import pkg from '../package.json' with {type: 'json'};

export interface AppProps {
  label?: string;
}

function Content({label = pkg.name}: AppProps) {
  return (
    <Box flexDirection="column">
      <Text bold>{label}</Text>
      <KeyValue label="Status" value={<Badge variant="success">ready</Badge>} />
      <Text>Press q or Escape to exit.</Text>
    </Box>
  );
}

export function App(props: AppProps) {
  const {exit} = useApp();
  useInput((input, key) => {
    if (input === 'q' || key.escape) exit();
  });

  return <Content {...props} />;
}

export function PlainView(props: AppProps) {
  return <Content {...props} />;
}
```

Run `npm run dev` to try it interactively and
`npm run dev -- --plain` to check the static frame. The headless commands,
configuration handling and CLI lifecycle are unaffected.

## Keyboard and visual conventions

The kit is not a replacement for the starter's Ink root. Its `TextInput`,
`Select`, `MultiSelect`, `useTabs` and `useListCursor` attach native
`useInput` handlers, so multiple active listeners can respond to one key.
For example, if a `TextInput` is active, typing `q` should enter text, not
exit the app. Gate the root handler with `useInput(handler, {isActive: !editing})`
while the editor owns input, and restore it on submit or cancel. Use
`isDisabled` on inactive input/selection components and `isActive: false`
for inactive list/tab hooks. Avoid mixing two active root-level quit/back
handlers, including the library's `useAppKeys`.

Prefer the kit's presentational components when you only need visuals;
introduce its input hooks only for a consciously managed focus state. Keep
domain operations outside Ink so headless commands do not load the UI package.
`PlainView` must render useful data synchronously without requiring keyboard
events or asynchronous effects.

The library uses its own visual tokens (and several Unicode glyphs), not a
theme from the starter. Check accessibility under `NO_COLOR` and narrow
terminals, and supply ASCII alternatives if your application requires them.
Do not rely on color alone to convey state. Verify the actual component APIs
against the library's
[documentation](https://github.com/rigerc/ink-ui/tree/main/docs) and exported
types before adopting additional widgets.

## Validate

```sh
npm run check
npm run typecheck
npm test
npm run build
npm run dev -- --plain
```

Also test the interactive view in a real terminal (including edit/cancel and
quit behavior when adding input controls), and check width constraints around
40, 80 and 120 columns. A downstream application that never opts in keeps
its original `package.json`, rendering and tests unchanged.
