// Refresh only factual references. The skill's authored instructions are not rewritten.
import {existsSync, readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const file = (path) => join(root, path);
const read = (path) => readFileSync(file(path), 'utf8');
const tick = String.fromCharCode(96);
const inline = (value) =>
  String(value).replaceAll('|', '\\|').replaceAll(tick, '\\' + tick).replaceAll('\n', ' ');
const code = (value) => tick + inline(value) + tick;
const link = (path) => '[' + code(path) + '](../../../../' + path + ')';
const generatedPaths = [
  '.agents/skills/ink-cli-starter/references/generated-api.md',
  '.claude/skills/ink-cli-starter/references/generated-api.md',
];
const sourcePaths = [
  'src/cli.tsx',
  'src/app.tsx',
  'src/lib/program.ts',
  'src/config/schema.ts',
  'src/config/definition.ts',
  'src/commands/definition.ts',
];

function render() {
  const pkg = JSON.parse(read('package.json'));
  const modules = readdirSync(file('src/commands'), {withFileTypes: true})
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
    .map((entry) => 'src/commands/' + entry.name)
    .sort();
  const exports = [...read('src/commands/definition.ts').matchAll(
    /^export\s+(?:async\s+)?(?:function|const|type|interface|class)\s+([A-Za-z_$][\w$]*)/gm,
  )].map((match) => match[1]).sort();
  if (!exports.length) throw new Error('No command extension exports found');
  const deps = ['ink', 'react', 'zod', '@commander-js/extra-typings']
    .filter((name) => pkg.dependencies?.[name])
    .map((name) => code(name + ' ' + pkg.dependencies[name])).join(', ');
  const scripts = Object.entries(pkg.scripts ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, command]) => '| ' + code('npm run ' + name) + ' | ' + code(command) + ' |');

  for (const path of [...modules, ...sourcePaths]) {
    if (!existsSync(file(path))) throw new Error('Missing source: ' + path);
  }

  return [
    '# Generated Ink CLI starter reference',
    '',
    '> Automatically derived from source by ' + code('npm run update:skill') + '. Do not edit manually.',
    '> The workflow recommendations in ' + code('SKILL.md') + ' remain human-maintained.',
    '',
    '**Package:** ' + code(pkg.name) + ' · **Version:** ' + code(pkg.version) +
      ' · **Node:** ' + code(pkg.engines?.node ?? 'unspecified'),
    '',
    '**Runtime dependencies:** ' + deps,
    '',
    '## Command extension exports',
    '',
    '| Export | Defined in |',
    '| --- | --- |',
    ...exports.map((name) => '| ' + code(name) + ' | ' + link('src/commands/definition.ts') + ' |'),
    '',
    '## Command modules',
    '',
    '| File |',
    '| --- |',
    ...modules.map((path) => '| ' + link(path) + ' |'),
    '',
    '## Application entry points',
    '',
    '| File |',
    '| --- |',
    ...sourcePaths.map((path) => '| ' + link(path) + ' |'),
    '',
    '## Available npm scripts',
    '',
    '| Command | package.json definition |',
    '| --- | --- |',
    ...scripts,
    '',
    'This reference describes current source availability, not required architecture for downstream applications.',
    '',
  ].join('\n');
}

const mode = process.argv[2] ?? '--check';
if (!['--write', '--check', '--check-generated'].includes(mode)) {
  throw new Error('Usage: node scripts/sync-skill.mjs [--write|--check|--check-generated]');
}
const generated = render();
for (const path of generatedPaths) {
  const current = existsSync(file(path)) ? read(path) : '';
  if (mode === '--write') {
    if (current !== generated) {
      writeFileSync(file(path), generated);
      console.log('Updated ' + path);
    } else {
      console.log(path + ' is current');
    }
  } else if (current !== generated) {
    console.error(path + ' is stale; run npm run update:skill');
    process.exitCode = 1;
  }
}
if (mode !== '--write' &&
  read(generatedPaths[0]) !== read(generatedPaths[1])) {
  console.error('Generated skill reference mirrors differ');
  process.exitCode = 1;
}
