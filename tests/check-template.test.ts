import {spawnSync} from 'node:child_process';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {expect, it} from 'vite-plus/test';

const description = 'GitHub template for an Ink 8, React 19 and TypeScript terminal application';

const defaults: [string, string][] = [
  [
    'package.json',
    JSON.stringify({name: 'ink-kit', description, bin: {'ink-kit': './dist/cli.js'}}),
  ],
  [
    'package-lock.json',
    JSON.stringify({
      name: 'ink-kit',
      packages: {'': {name: 'ink-kit', bin: {'ink-kit': 'dist/cli.js'}}},
    }),
  ],
  ['src/lib/config.ts', "export const APP_NAME = 'ink-kit';"],
  [
    'src/config/store.ts',
    "export function configFilePath(appName = 'ink-kit') {}\n" +
      'export function createConfigStore(appName = "ink-kit") {}',
  ],
];

const customized: [string, string][] = defaults.map(([path, content]) => [
  path,
  content.replaceAll('ink-kit', 'my-cli').replace(description, 'My application'),
]);

function checkTemplate(files: [string, string][]) {
  const root = mkdtempSync(join(tmpdir(), 'check-template-'));

  try {
    for (const [path, content] of files) {
      const destination = join(root, path);
      mkdirSync(dirname(destination), {recursive: true});
      writeFileSync(destination, content);
    }

    return spawnSync(
      process.execPath,
      [fileURLToPath(new URL('../scripts/check-template.mjs', import.meta.url))],
      {cwd: root, encoding: 'utf8'},
    );
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
}

it('warns about every untouched identity field without failing', () => {
  const result = checkTemplate(defaults);
  expect(result.status, result.stderr).toBe(0);
  expect(result.stderr).toContain('package.json: name');
  expect(result.stderr).toContain('package.json: bin');
  expect(result.stderr).toContain('package.json: description');
  expect(result.stderr).toContain('package-lock.json: name');
  expect(result.stderr).toContain('package-lock.json: packages[""].name');
  expect(result.stderr).toContain('package-lock.json: packages[""].bin');
  expect(result.stderr).toContain('src/lib/config.ts:1: APP_NAME');
  expect(result.stderr).toContain('src/config/store.ts:1: appName');
  expect(result.stderr).toContain('src/config/store.ts:2: appName');
  expect(result.stderr).toContain('Template warnings do not fail this check');
});

it('is quiet after all identity fields are customized', () => {
  const result = checkTemplate(customized);
  expect(result.status, result.stderr).toBe(0);
  expect(result.stderr).toBe('');
});

it('warns when only the lockfile still contains defaults', () => {
  const result = checkTemplate([
    ...customized,
    ['package-lock.json', JSON.stringify({name: 'ink-kit'})],
  ]);

  expect(result.status, result.stderr).toBe(0);
  expect(result.stderr).toContain('package-lock.json: name');
});

it('ignores comments, other fields, dependencies, documentation and test fixtures', () => {
  const result = checkTemplate([
    ...customized,
    ['README.md', 'ink-kit'],
    ['tests/example.test.ts', "const APP_NAME = 'ink-kit';"],
    [
      'src/lib/config.ts',
      '// const APP_NAME = "ink-kit";\n/* const APP_NAME = "ink-kit"; */\n' +
        'export const APP_NAME = "my-cli"; const example = "ink-kit";',
    ],
    [
      'package-lock.json',
      JSON.stringify({
        name: 'my-cli',
        packages: {'node_modules/ink-kit': {name: 'ink-kit', bin: {'ink-kit': 'cli.js'}}},
      }),
    ],
  ]);

  expect(result.status, result.stderr).toBe(0);
  expect(result.stderr).toBe('');
});

it('recognizes typed multiline defaults and template literals', () => {
  const result = checkTemplate([
    ...customized,
    ['src/lib/config.ts', 'export const APP_NAME: string =\n  `ink-kit`;'],
    ['src/config/store.ts', "function store(\n appName: string =\n 'ink-kit'\n) {}"],
  ]);

  expect(result.status, result.stderr).toBe(0);
  expect(result.stderr).toContain('src/lib/config.ts');
  expect(result.stderr).toContain('src/config/store.ts');
});

it('allows removed configuration files and an absent lockfile', () => {
  const result = checkTemplate([['package.json', JSON.stringify({name: 'my-cli'})]]);
  expect(result.status, result.stderr).toBe(0);
  expect(result.stderr).toBe('');
});

it('fails for unreadable metadata rather than silently passing', () => {
  const result = checkTemplate([['package.json', '{invalid json']]);
  expect(result.status).not.toBe(0);
});
