# Add a feature

The starter deliberately provides no reusable UI framework. Implement your
own app structure using Ink and React, starting at `src/app.tsx`.

## Add an interactive view

Native Ink gives you layout, text and keyboard input without a custom shell:

```tsx
import {Box, Text, useInput} from 'ink';
import {useState} from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  useInput((input) => {
    if (input === '+') setCount((n) => n + 1);
  });

  return (
    <Box flexDirection="column">
      <Text>Count: {count}</Text>
      <Text dimColor>Press + to increment</Text>
    </Box>
  );
}
```

Import this component in `src/app.tsx` to render it. There is no registration
step, custom component library, or theme API. For larger applications, add
your own files and abstractions as needed.

If a task also needs headless operation, put its model and operation under
`src/features/` and have both Ink and the command call it.

## Add a command

Define the command using the existing Commander/Zod adapter:

```ts
import {z} from 'zod';
import {defineCommand} from './definition';

export const greetCommand = defineCommand({
  name: 'greet',
  description: 'Print a greeting',
  schema: z.object({}),
  run: ({context}) => context.output('Hello'),
});
```

Add `greetCommand` to the `commands` array in
`src/commands/index.ts`. The command tree and shell completion scripts then
include it. The `example` command in `src/commands/example.ts` shows typed
options and explicit JSON input from stdin.

The sample `label` configuration field lives in `src/config/schema.ts`.
Remove it or extend the schema only when the application needs settings.
See [configuration](configuration.md) for persistence and precedence.

Run `npm run typecheck && npm test && npm run build` before committing.
