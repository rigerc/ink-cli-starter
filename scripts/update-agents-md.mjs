import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const file = (path) => join(root, path);
const begin = '<!-- BEGIN GENERATED REPOSITORY CONTEXT -->';
const end = '<!-- END GENERATED REPOSITORY CONTEXT -->';
const tick = String.fromCharCode(96);
const inline = (value) =>
  String(value).replaceAll('|', '\\|').replaceAll(tick, '\\' + tick).replaceAll('\n', ' ');
const code = (value) => tick + inline(value) + tick;

function generate() {
  const pkg = JSON.parse(readFileSync(file('package.json'), 'utf8'));
  const modules = readdirSync(file('src/commands'), {withFileTypes: true})
    .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
    .map((entry) => entry.name);
  const scripts = Object.entries(pkg.scripts ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, command]) => '| ' + code('npm run ' + name) + ' | ' + code(command) + ' |');

  return [
    begin,
    '',
    '## Live repository reference (generated)',
    '',
    'This section is generated from the current codebase with ' + code('npm run update:agents') + '.',
    'Keep the guidance above human-authored. Regenerate this section after projecting agent rules.',
    '',
    '- **Package:** ' + code(pkg.name) + ' v' + code(pkg.version),
    '- **Runtime:** Node ' + code(pkg.engines?.node ?? 'unspecified') + ', ' +
      (pkg.type === 'module' ? 'ES modules' : 'CommonJS/default modules'),
    '- **CLI binary:** ' + (Object.keys(pkg.bin ?? {}).map(code).join(', ') || 'none'),
    '- **Command modules:** ' + modules.length + ' files in ' + code('src/commands/') + '.',
    '- **Entry points:** ' + ['src/cli.tsx', 'src/app.tsx', 'src/lib/program.ts'].map(code).join(', '),
    '',
    '### Available npm scripts',
    '',
    '| Command | package.json definition |',
    '| --- | --- |',
    ...scripts,
    '',
    end,
  ].join('\n');
}

function replaceGenerated(document, generated) {
  const start = document.indexOf(begin);
  const stop = document.indexOf(end);
  if (
    (start < 0) !== (stop < 0) ||
    (start >= 0 &&
      (start >= stop ||
        document.indexOf(begin, start + begin.length) !== -1 ||
        document.indexOf(end, stop + end.length) !== -1))
  ) {
    throw new Error('Malformed or duplicate generated-context markers');
  }
  if (start < 0) return document.trimEnd() + '\n\n' + generated + '\n';
  return document.slice(0, start) + generated + document.slice(stop + end.length);
}

const mode = process.argv[2] ?? '--write';
if (mode !== '--write' && mode !== '--check') {
  throw new Error('Usage: node scripts/update-agents-md.mjs [--write|--check]');
}
const generated = generate();
for (const path of ['AGENTS.md', 'CLAUDE.md']) {
  const current = readFileSync(file(path), 'utf8');
  const updated = replaceGenerated(current, generated);
  if (mode === '--check' && current !== updated) {
    console.error(path + ' generated context is stale; run npm run update:agents');
    process.exitCode = 1;
  } else if (mode === '--write' && updated !== current) {
    writeFileSync(file(path), updated);
    console.log('Updated ' + path);
  } else {
    console.log(path + ' generated context is current');
  }
}
