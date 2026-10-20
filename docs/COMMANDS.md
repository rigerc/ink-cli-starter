# Commands and demo

| CLI | Purpose |
|---|---|
| `ink-starter` | Default welcome dashboard |
| `ink-starter demo` | Interactive component gallery (or static output without TTY) |
| `ink-starter demo --theme mono` | Demo in monochrome theme |
| `ink-starter doctor` | Node/terminal environment diagnostics |
| `ink-starter --help` | Pastel-generated usage |

**Demo keys:** left/right arrows or h/l navigate, 1/2/3 jump between pages, q/Escape quits.

## Add a command

Create `source/commands/greet.tsx`:

```tsx
import { Text } from "ink";
import { z } from "zod";

export const options = z.object({
  name: z.string().default("world").describe("Name to greet"),
});

export default function Greet({options}: {options: z.infer<typeof options>}) {
  return <Text>Hello, {options.name}</Text>;
}
```

Run `npm run build && node build/cli.js greet --name Ada`. Pastel supports folders for nested commands. See [Pastel](https://github.com/vadimdemedes/pastel).
