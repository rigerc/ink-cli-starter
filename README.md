# Ink CLI Starter

**Ink 8 + Pastel 4 + the complete termcn Ink component library**, with a semantic terminal design system, demo app, tests and documentation.

Node.js **22+** and npm are required. A real TTY is only needed to navigate the interactive demo.

## Get started

```bash
git clone https://github.com/rigerc/ink-cli-starter.git
cd ink-cli-starter
npm install
npm run check
npm run demo
```

```bash
npm run build
node build/cli.js --help
node build/cli.js
node build/cli.js demo
node build/cli.js demo --theme mono
node build/cli.js doctor
```

After `npm link`, invoke commands as `ink-starter demo` from anywhere.

## What is included

| Folder | Purpose |
|---|---|
| `source/commands/` | Pastel routes: default, demo, doctor, `_app` theme shell |
| `source/components/ui/` | **All 123** upstream termcn Ink UI files, source-owned |
| `source/components/` | App-level compositions, including `AppShell` |
| `source/design-system/` | Ocean/mono themes, semantic status variants and helpers |
| `source/hooks/` | All 10 termcn Ink hooks |
| `source/providers/` | Theme, motion and Unicode providers |
| `source/lib/` | All termcn terminal rendering utilities |
| `source/lib/terminal-themes/` | Upstream termcn theme library (40 themes plus index) |
| `source/demo/` | Demo data |
| `test/` | Node test runner + Ink string-render test |
| `docs/` | Architecture, design system, components, commands, accessibility, third-party licenses |

**The full Ink registry includes** layout, typography, input, selection, data displays, feedback, navigation, overlays, forms, utilities, charts and AI/chat components. The demo intentionally showcases only a manageable subset.

termcn follows the [shadcn source ownership model](https://termcn.dev/docs/registry). There is **no termcn runtime npm package**; components live in this repository and are imported from `source/components/ui/`.

## Demo controls

The demo includes Overview, Components and Tokens screens. In an interactive terminal, navigate with left/right arrows or h/l; jump with 1, 2 or 3; exit with q/Escape. Without an interactive terminal, the demo shows a static preview.

## Add or refresh components

The registry is available through `components.json`:

```bash
npx shadcn@latest add @termcn/ink/alert
```

The copied components are already adapted to relative NodeNext `.js` ESM imports. Review generated files before overwriting them: a fresh shadcn install might use TS path aliases, which Node ESM does not resolve at runtime. Do not install OpenTUI components in an Ink app.

## Developer commands

```bash
npm run typecheck
npm test
npm run build
npm run check
```

CI runs on Node 22. To make installs reproducible, run `npm install` and commit the generated `package-lock.json`; then switch the CI install step to `npm ci`.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Design system and themes](docs/DESIGN_SYSTEM.md)
- [Commands and demo](docs/COMMANDS.md)
- [Full component catalog and source ownership](docs/COMPONENTS.md)
- [Accessibility](docs/ACCESSIBILITY.md)
- [Third-party licensing](docs/THIRD_PARTY.md)
- [Contribution guide](CONTRIBUTING.md)

Upstreams: [Ink](https://github.com/vadimdemedes/ink) · [Pastel](https://github.com/vadimdemedes/pastel) · [termcn](https://github.com/shadcn-labs/termcn).
