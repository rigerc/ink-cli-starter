import {readFile, writeFile, rm, mkdir, readdir} from 'node:fs/promises';
import {join, dirname} from 'node:path';

export const featureNames = ['settings', 'doctor', 'gallery', 'tests', 'screenshots', 'ci'];
export const presets = {
  minimal: ['tests'],
  standard: [...featureNames],
  full: [...featureNames],
};
export const packageManagers = ['npm', 'pnpm', 'yarn', 'bun'];
export const toolchains = ['vite-plus', 'tsdown'];

export function parseFeatureList(value) {
  if (value === 'none') return [];
  if (!value?.trim()) throw new Error('Features must be a comma-separated list or "none".');
  const names = value.split(',').map((part) => part.trim());
  for (const name of names) {
    if (!featureNames.includes(name)) {
      throw new Error('Unknown feature "' + name + '". Choose: ' + featureNames.join(', '));
    }
  }
  return [...new Set(names)];
}

export function resolveChoices({
  preset = 'standard',
  packageManager = 'npm',
  toolchain = 'vite-plus',
  features,
} = {}) {
  if (!Object.hasOwn(presets, preset)) throw new Error('Unknown preset "' + preset + '".');
  if (!packageManagers.includes(packageManager))
    throw new Error('Unknown package manager "' + packageManager + '".');
  if (!toolchains.includes(toolchain)) throw new Error('Unknown toolchain "' + toolchain + '".');
  return {
    preset,
    packageManager,
    toolchain,
    features: features === undefined ? [...presets[preset]] : parseFeatureList(features),
  };
}

const includes = (choices, feature) => choices.features.includes(feature);
const remove = async (directory, path) => rm(join(directory, path), {recursive: true, force: true});
const put = async (directory, path, content) => {
  const target = join(directory, path);
  await mkdir(dirname(target), {recursive: true});
  await writeFile(target, content);
};
const get = async (directory, path) => readFile(join(directory, path), 'utf8');
const line = (value) => value + '\n';

function screenRegistry(choices) {
  const settings = includes(choices, 'settings');
  const gallery = includes(choices, 'gallery');
  return line(
    [
      "import type {ComponentType} from 'react';",
      "import type {KeyHint} from '../keys';",
      "import {HomeScreen} from './Home';",
      "import {HelpScreen} from './Help';",
      ...(settings ? ["import {SettingsScreen} from './Settings';"] : []),
      ...(gallery ? ["import {GalleryScreen} from './Gallery';"] : []),
      '',
      'export interface ScreenDef {',
      '  id: string;',
      '  label: string;',
      '  Component: ComponentType;',
      '  showInNav?: boolean;',
      '  hints?: readonly KeyHint[];',
      '}',
      '',
      'export const screens: ScreenDef[] = [',
      "  {id: 'home', label: 'Home', Component: HomeScreen},",
      ...(settings
        ? [
            "  {id: 'settings', label: 'Settings', Component: SettingsScreen, hints: [",
            "    {key: '↑/↓', label: 'section'},",
            "    {key: 'enter', label: 'edit'},",
            "    {key: 's', label: 'save'},",
            "    {key: 'd', label: 'discard'},",
            "    {key: 'w', label: 'wizard'},",
            '  ]},',
          ]
        : []),
      "  {id: 'help', label: 'Help', Component: HelpScreen},",
      ...(gallery
        ? ["  {id: 'gallery', label: 'Gallery', Component: GalleryScreen, showInNav: false},"]
        : []),
      '];',
      '',
      'export const navScreens = screens.filter((screen) => screen.showInNav !== false);',
      'export const screenIds = screens.map((screen) => screen.id);',
      'export const isScreenId = (id: string) => screenIds.includes(id);',
    ].join('\n'),
  );
}

function helpScreen(choices) {
  const settings = includes(choices, 'settings');
  const doctor = includes(choices, 'doctor');
  return line(
    [
      "import {Box, Text} from 'ink';",
      "import {ScreenLayout, Kbd, Panel, Stack} from '../components';",
      "import {getGlobalKeys} from '../keys';",
      "import {navScreens, screenIds} from './index';",
      '',
      'export function HelpScreen() {',
      '  return (',
      '    <ScreenLayout title="Help" description="Keyboard shortcuts and command-line options">',
      '      <Stack gap={1}>',
      '        <Panel title="Keyboard">',
      '          {getGlobalKeys(navScreens.length).map((binding) => (',
      '            <Box key={binding.key} gap={2}>',
      '              <Box width={12}><Kbd>{binding.key}</Kbd></Box>',
      '              <Text>{binding.label}</Text>',
      '            </Box>',
      '          ))}',
      '        </Panel>',
      '        <Panel title="Flags and commands">',
      '          <Text>--theme dark|light|contrast|mono|auto</Text>',
      '          <Text>{`--screen ${screenIds.join("|")}`}</Text>',
      '          <Text>--config path --plain --ascii --debug</Text>',
      ...(settings ? ['          <Text>--setup Open configuration wizard</Text>'] : []),
      ...(doctor
        ? ['          <Text>doctor [--json] Environment and configuration checks</Text>']
        : []),
      '        </Panel>',
      '      </Stack>',
      '    </ScreenLayout>',
      '  );',
      '}',
    ].join('\n'),
  );
}

function pruneCli(cli, choices) {
  if (!includes(choices, 'settings')) {
    cli = cli.replace("import {ConfigSetup} from './demos/ConfigSetup';\n", '');
    cli = cli.replace(/^    \$ \${APP_NAME} --setup[^\n]*\n/m, '');
    cli = cli.replace(/^    --setup[^\n]*\n/m, '');
    cli = cli.replace("      setup: {type: 'boolean'},\n", '');
    cli = cli.replace('if (flags.setup || flags.plain)', 'if (flags.plain)');
    cli = cli.replace(
      'Subcommands cannot be combined with --setup or --plain',
      'Subcommands cannot be combined with --plain',
    );
    cli = cli.replace(
      "  if (flags.setup && error)\n    throw new AppError('Cannot edit invalid configuration', {hint: error, exitCode: 2});\n",
      '',
    );
    cli = cli.replace(
      /  if \(flags\.setup && \(flags\.plain \|\| !isInteractive\(\)\)\)\n    throw new AppError\([\s\S]*?\n    \}\);\n/,
      '',
    );
    cli = cli.replace(
      'flags.setup ? <ConfigSetup options={options} /> : <App options={options} />',
      '<App options={options} />',
    );
  }
  if (!includes(choices, 'doctor')) {
    cli = cli.replace(/^    \$ \${APP_NAME} doctor[^\n]*\n/m, '');
    cli = cli.replace(
      'JSON output for headless commands (doctor)',
      'JSON output for headless commands',
    );
    cli = cli.replace(
      '--json requires a headless subcommand (e.g. doctor)',
      '--json requires a headless subcommand',
    );
  }
  return cli;
}

function generatedReadme(name, choices) {
  const pm = choices.packageManager;
  const cli =
    pm === 'npm' ? 'npm run' : pm === 'yarn' ? 'yarn' : pm === 'pnpm' ? 'pnpm run' : 'bun run';
  const text = [
    '# ' + name,
    '',
    'An Ink 8 / React 19 / TypeScript terminal application. Requires Node.js 22+.',
    '',
    'Generated with preset **' + choices.preset + '**, package manager **' + pm + '**,',
    'and toolchain **' + choices.toolchain + '**.',
    '',
    '## Getting started',
    '',
    '`\``bash',
    pm + ' install',
    cli + ' dev',
    cli + ' build',
    cli + ' start',
    '`\``',
    '',
    'Installation creates the package-manager lockfile if one was not included.',
    'Commit that generated lockfile and use frozen installs in deployed environments.',
    '',
    '## Commands and features',
    '',
    '`\``bash',
    name + ' --help',
    name + ' --plain',
    ...(includes(choices, 'settings') ? [name + ' --setup', name + ' --screen settings'] : []),
    ...(includes(choices, 'doctor') ? [name + ' doctor --json'] : []),
    ...(includes(choices, 'gallery') ? [name + ' --screen gallery'] : []),
    '`\``',
    '',
    'Included features: ' + (choices.features.join(', ') || 'none') + '.',
    '',
    '## Theme customization',
    '',
    'Semantic palettes live in \u0060src/theme/palettes.json\u0060; the project default is in \u0060src/theme/defaults.json\u0060.',
    '\u0060\u0060\u0060bash',
    cli + ' theme:list',
    cli + ' theme:token -- dark primary "#ff80aa"',
    cli + ' theme:default -- light',
    cli + ' theme:default -- auto',
    '\u0060\u0060\u0060',
    '',
    '## Extend your app',
    '',
    '- Register screens in `src/screens/index.ts`.',
    '- Register noninteractive commands in `src/commands/index.ts`.',
    '- Keep domain features independent of React/Ink.',
    '- Reuse `src/components/`, `src/hooks/`, and `src/theme/`.',
    '- See [UI framework guide](docs/framework/ui-framework.md), [Architecture](docs/framework/architecture.md), and [Add a feature](docs/framework/adding-a-feature.md).',
    '',
    '## Checks',
    '',
    '`\``bash',
    cli + ' typecheck',
    ...(includes(choices, 'tests') ? [cli + ' test'] : []),
    cli + ' build',
    ...(includes(choices, 'screenshots')
      ? [cli + ' screenshot # First: npx playwright install chromium']
      : []),
    '`\``',
    '',
    ...(includes(choices, 'ci')
      ? ['A GitHub Actions workflow is included in `.github/workflows/ci.yml`.', '']
      : []),
  ];
  return line(text.join('\n'));
}

function ciWorkflow(choices, hasNpmLock) {
  const pm = choices.packageManager;
  const run =
    pm === 'npm' ? 'npm run' : pm === 'pnpm' ? 'pnpm run' : pm === 'yarn' ? 'yarn' : 'bun run';
  const install =
    pm === 'npm'
      ? hasNpmLock
        ? 'npm ci'
        : 'npm install'
      : pm === 'pnpm'
        ? 'pnpm install --no-frozen-lockfile'
        : pm === 'yarn'
          ? 'yarn install'
          : 'bun install';
  const steps = [
    '      - uses: actions/checkout@v4',
    '        with:',
    '          persist-credentials: false',
    '      - uses: actions/setup-node@v4',
    '        with:',
    "          node-version: '22'",
    ...(pm === 'npm' && hasNpmLock ? ['          cache: npm'] : []),
    ...(pm === 'pnpm' || pm === 'yarn' ? ['      - run: corepack enable'] : []),
    ...(pm === 'bun' ? ['      - uses: oven-sh/setup-bun@v2'] : []),
    '      - run: ' + install,
    '      - run: ' + run + ' typecheck',
    ...(includes(choices, 'tests') ? ['      - run: ' + run + ' test'] : []),
    '      - run: ' + run + ' build',
    '      - run: node dist/cli.js --plain',
    ...(includes(choices, 'gallery')
      ? ['      - run: node dist/cli.js --screen gallery --plain']
      : []),
    ...(includes(choices, 'doctor') ? ['      - run: node dist/cli.js doctor --json'] : []),
  ];
  return line(
    [
      'name: CI',
      '',
      'on:',
      '  push:',
      '  pull_request:',
      '',
      'permissions:',
      '  contents: read',
      '',
      'jobs:',
      '  verify:',
      '    runs-on: ubuntu-latest',
      '    steps:',
      ...steps,
    ].join('\n'),
  );
}

function architecture(choices) {
  return line(
    [
      '# Architecture',
      '',
      'The generated application is domain-agnostic and built with Ink 8.',
      '',
      '- `src/cli.tsx` parses CLI arguments and handles plain and interactive rendering.',
      '- `src/app.tsx` composes providers, navigation, and shortcuts.',
      '- `src/screens/index.ts` defines screens and visible navigation order.',
      '- `src/commands/index.ts` registers headless commands.',
      '- `src/components/`, `src/hooks/`, and `src/theme/` supply reusable UI primitives.',
      '- `docs/framework/ui-framework.md` explains composition, input ownership, themes and tests.',
      '- `src/config/` and `src/lib/config.ts` provide versioned, validated config.',
      '',
      'Selected features: ' + (choices.features.join(', ') || 'none') + '.',
      '',
      'The generator removed unselected entry points, scripts, and dependencies.',
      'Add feature modules under `src/features/` when needed.',
      '',
      '## UI framework',
      '',
      'Use [the UI framework guide](ui-framework.md) for shared shell ownership,',
      'screen registration, keymap priority, text input capture, semantic theming,',
      'async states and terminal-width-safe layouts.',
      'The [feature walkthrough](adding-a-feature.md) shows the extension path.',
      '',
      'Run your package manager scripts for typecheck and build' +
        (includes(choices, 'tests') ? ', plus tests' : '') +
        '.',
      '',
    ].join('\n'),
  );
}

function generatedAgentGuide(choices, template) {
  const marker = '<!-- SCAFFOLD_TOOLCHAIN_GUIDANCE -->';
  if (!template.includes(marker))
    throw new Error('Generated AGENTS.md template is missing the toolchain marker.');

  const pm = choices.packageManager;
  const runner =
    pm === 'npm' ? 'npm run' : pm === 'pnpm' ? 'pnpm run' : pm === 'yarn' ? 'yarn' : 'bun run';
  const lines = [
    choices.toolchain === 'vite-plus'
      ? 'This application uses **Vite+** for building and running tests. Run package.json scripts with the chosen package manager. If using the global `vp` CLI, note that `vp <name>` invokes a built-in command whereas `vp run <name>` runs a project script; inspect the scripts first.'
      : 'This application uses **tsdown** for builds and standalone **Vitest** when tests are enabled. Use the package.json scripts and tsdown.config.ts; there is no vite.config.ts.',
    '',
    '- Install dependencies with `' + pm + ' install`.',
    '- Run `' + runner + ' typecheck` and `' + runner + ' build`.',
    ...(includes(choices, 'tests')
      ? ['- Run `' + runner + ' test`; keep interactive and plain-rendering coverage.']
      : [
          '- No test script is installed for this feature selection; do not assume test tooling is present.',
        ]),
    ...(includes(choices, 'screenshots')
      ? [
          '- For screenshot review, install Playwright Chromium and run `' +
            runner +
            ' screenshot`.',
        ]
      : []),
    ...(includes(choices, 'ci')
      ? ['- The generated CI workflow lives in `.github/workflows/ci.yml`.']
      : []),
    '- Confirm `node dist/cli.js --plain` prints output after a build.',
  ];
  return line(template.replace(marker, lines.join('\n')).trimEnd());
}

export async function customizeGeneratedApp(destination, name, choices) {
  const settings = includes(choices, 'settings');
  const doctor = includes(choices, 'doctor');
  const gallery = includes(choices, 'gallery');
  const tests = includes(choices, 'tests');
  const screenshots = includes(choices, 'screenshots');
  const ci = includes(choices, 'ci');
  const tsdown = choices.toolchain === 'tsdown';

  if (!settings) {
    for (const file of [
      'src/screens/Settings.tsx',
      'src/demos/ConfigSetup.tsx',
      'src/components/config',
      'src/hooks/useConfigDraft.ts',
      'tests/config-ui.test.tsx',
    ])
      await remove(destination, file);
  }
  if (!doctor) {
    await remove(destination, 'src/commands/doctor.ts');
    await remove(destination, 'tests/commands.test.ts');
    await put(
      destination,
      'src/commands/index.ts',
      line(
        [
          '/** Register headless commands here without importing React or Ink. */',
          'export interface CommandOptions {configFile?: string; json?: boolean}',
          'export function runCommand(_name: string, _args: string[], _options: CommandOptions): boolean {',
          '  return false;',
          '}',
        ].join('\n'),
      ),
    );
  }
  if (!gallery) {
    await remove(destination, 'src/screens/Gallery.tsx');
    let screens = await get(destination, 'tests/screens.test.tsx');
    screens = screens.replaceAll("render('gallery',", "render('home',");
    await put(destination, 'tests/screens.test.tsx', screens);
    let collections = await get(destination, 'tests/collections.test.tsx');
    const start = collections.indexOf("describe('gallery input ownership',");
    const end = collections.indexOf("describe('collection rendering',");
    if (start < 0 || end < start) throw new Error('Unable to remove gallery-specific tests.');
    await put(
      destination,
      'tests/collections.test.tsx',
      collections.slice(0, start) + collections.slice(end),
    );
  }
  if (!settings) {
    let consistent = await get(destination, 'tests/consistent-ui.test.tsx');
    consistent = consistent.replace("await press(app, 'settings');", "await press(app, 'help');");
    consistent = consistent.replaceAll(
      'Review and configure application preferences',
      'Keyboard shortcuts and command-line options',
    );
    consistent = consistent.replace(
      "expect(app.lastFrame()).toContain('Settings');",
      "expect(app.lastFrame()).toContain('Help');",
    );
    await put(destination, 'tests/consistent-ui.test.tsx', consistent);
  }
  await put(destination, 'src/screens/index.ts', screenRegistry(choices));
  await put(destination, 'src/screens/Help.tsx', helpScreen(choices));
  await put(destination, 'src/cli.tsx', pruneCli(await get(destination, 'src/cli.tsx'), choices));

  const pkg = JSON.parse(await get(destination, 'package.json'));
  delete pkg.scripts.scaffold;
  if (!gallery) delete pkg.scripts.gallery;
  if (!tests) delete pkg.scripts.test;
  if (!screenshots) {
    delete pkg.scripts.screenshot;
    delete pkg.devDependencies.playwright;
    delete pkg.devDependencies['ansi-to-html'];
    await remove(destination, 'scripts/screenshot.tsx');
  }
  if (!tests) {
    await remove(destination, 'tests');
    delete pkg.devDependencies['ink-testing-library'];
    delete pkg.devDependencies.vitest;
  }
  if (!ci) await remove(destination, '.github/workflows/ci.yml');

  if (tsdown) {
    pkg.scripts.build = 'tsdown';
    pkg.scripts.test && (pkg.scripts.test = 'vitest run');
    delete pkg.scripts.prepare;
    delete pkg.devDependencies['vite-plus'];
    pkg.devDependencies.tsdown = '^0.23.1';
    delete pkg.overrides;
    await remove(destination, 'vite.config.ts');
    await put(
      destination,
      'tsdown.config.ts',
      line(
        [
          "import {defineConfig} from 'tsdown';",
          'export default defineConfig({',
          "  entry: ['src/cli.tsx'],",
          "  format: ['esm'],",
          "  platform: 'node',",
          "  target: 'node22',",
          '  dts: false,',
          '  sourcemap: true,',
          '  clean: true,',
          '});',
        ].join('\n'),
      ),
    );
    if (tests) {
      await put(
        destination,
        'vitest.config.ts',
        line(
          [
            "import {defineConfig} from 'vitest/config';",
            'export default defineConfig({',
            "  test: {include: ['tests/**/*.test.{ts,tsx}']},",
            '});',
          ].join('\n'),
        ),
      );
      for (const entry of await readdir(join(destination, 'tests'), {recursive: true})) {
        if (!entry.endsWith('.test.ts') && !entry.endsWith('.test.tsx')) continue;
        const path = join('tests', entry);
        const value = await get(destination, path);
        await put(destination, path, value.replaceAll("from 'vite-plus/test'", "from 'vitest'"));
      }
    }
  }

  // An npm lockfile is only valid when its declared dependency graph matches package.json.
  const lockPath = join(destination, 'package-lock.json');
  let hasNpmLock = choices.packageManager === 'npm' && !tsdown;
  if (hasNpmLock) {
    const lock = JSON.parse(await get(destination, 'package-lock.json'));
    const root = lock.packages[''];
    const equal = (a, b) =>
      JSON.stringify(Object.entries(a ?? {}).sort()) ===
      JSON.stringify(Object.entries(b ?? {}).sort());
    hasNpmLock =
      equal(pkg.dependencies, root.dependencies) &&
      equal(pkg.devDependencies, root.devDependencies);
  }
  if (!hasNpmLock) await rm(lockPath, {force: true});
  if (choices.packageManager !== 'npm') {
    // There is no frozen cross-manager lockfile: create the native one on first install.
    delete pkg.packageManager;
  }
  await put(destination, 'package.json', line(JSON.stringify(pkg, null, 2)));
  await put(destination, 'README.md', generatedReadme(name, choices));
  await put(destination, 'docs/framework/architecture.md', architecture(choices));
  await put(
    destination,
    'AGENTS.md',
    generatedAgentGuide(choices, await get(destination, 'AGENTS.md')),
  );
  if (ci) await put(destination, '.github/workflows/ci.yml', ciWorkflow(choices, hasNpmLock));
}
