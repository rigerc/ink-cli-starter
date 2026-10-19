# Ink CLI Starter

Ink 8 + Pastel 4 + copy-owned termcn components, a terminal design system, tests, docs and a component demo.

Node.js 22+ required.

~~~sh
git clone https://github.com/rigerc/ink-cli-starter.git
cd ink-cli-starter
npm install
npm run check
npm run demo
~~~

Commands: ink-starter, ink-starter demo, ink-starter demo --theme mono, ink-starter doctor, ink-starter --help.

See docs/ARCHITECTURE.md, docs/DESIGN_SYSTEM.md, docs/COMMANDS.md, docs/COMPONENTS.md and docs/ACCESSIBILITY.md.

termcn is a copy-owned shadcn source registry, not an npm runtime package. Configure @termcn in components.json, and run: npx shadcn@latest add @termcn/ink/alert.

Upstreams: https://github.com/vadimdemedes/ink · https://github.com/vadimdemedes/pastel · https://github.com/shadcn-labs/termcn.
