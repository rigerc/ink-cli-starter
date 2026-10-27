#!/usr/bin/env node
import {readFileSync, writeFileSync} from 'node:fs';
import {parseArgs} from 'node:util';

const TEMPLATE_NAME = 'ink-kit';

const TEMPLATE_DESCRIPTION =
  'GitHub template for an Ink 8, React 19 and TypeScript terminal application';

const paths = ['package.json', 'package-lock.json'];

function ensureExpected(value, expected, location) {
  if (value !== TEMPLATE_NAME && value !== expected) {
    throw new Error(
      `${location} is already customized (${JSON.stringify(value)}); refusing to overwrite it`,
    );
  }
}

function changeBin(bin, current, target, path) {
  if (!bin || Array.isArray(bin)) {
    throw new Error(`${path}: expected a single CLI binary mapping`);
  }

  const keys = Object.keys(bin);

  if (keys.length !== 1) throw new Error(`${path}: expected a single CLI binary mapping`);
  ensureExpected(keys[0], target, `${path} binary`);
  const entry = bin[keys[0]];

  if (entry !== current) throw new Error(`${path}: unexpected binary entry point`);

  return {[target]: entry};
}

function main() {
  const {values} = parseArgs({
    options: {
      name: {type: 'string'},
      description: {type: 'string'},
      'dry-run': {type: 'boolean', default: false},
      help: {type: 'boolean', short: 'h'},
    },
  });

  if (values.help) {
    console.log(
      'Usage: npm run init:project -- --name my-cli [--description "My CLI"] [--dry-run]',
    );

    return;
  }

  const name = values.name;

  if (
    !name ||
    name === TEMPLATE_NAME ||
    name.length > 214 ||
    !/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/.test(name)
  ) {
    throw new Error(
      'Provide a new lowercase npm package name via --name (e.g. my-cli or @scope/my-cli)',
    );
  }

  if (values.description !== undefined && !values.description.trim()) {
    throw new Error('--description cannot be empty');
  }

  const command = name.split('/').at(-1);
  const originals = paths.map((path) => readFileSync(path, 'utf8'));
  const pkg = JSON.parse(originals[0]);
  const lock = JSON.parse(originals[1]);
  ensureExpected(pkg.name, name, 'package.json name');
  ensureExpected(lock.name, name, 'package-lock.json name');

  if (!lock.packages?.['']) throw new Error('package-lock.json: missing root package metadata');
  ensureExpected(lock.packages[''].name, name, 'package-lock.json root name');

  const description =
    values.description ??
    (pkg.description === TEMPLATE_DESCRIPTION
      ? `${command} command-line application`
      : pkg.description);

  if (
    values.description !== undefined &&
    pkg.description !== TEMPLATE_DESCRIPTION &&
    pkg.description !== description
  ) {
    throw new Error('package.json description is already customized; refusing to overwrite it');
  }

  pkg.name = name;
  pkg.description = description;
  pkg.bin = changeBin(pkg.bin, './dist/cli.js', command, 'package.json');
  lock.name = name;
  lock.packages[''].name = name;
  lock.packages[''].bin = changeBin(
    lock.packages[''].bin,
    'dist/cli.js',
    command,
    'package-lock.json',
  );

  const updates = [JSON.stringify(pkg, null, 2) + '\n', JSON.stringify(lock, null, 2) + '\n'];

  let changed = 0;

  for (const [index, path] of paths.entries()) {
    const content = updates[index];

    if (content === originals[index]) continue;
    changed++;

    if (!values['dry-run']) writeFileSync(path, content);
    console.log(`${values['dry-run'] ? 'Would update' : 'Updated'} ${path}`);
  }

  if (!changed) console.log(`Already initialized as ${name}`);

  if (changed && !values['dry-run']) console.log(`Initialized ${name} (CLI command: ${command})`);
}

try {
  main();
} catch (error) {
  console.error(`Initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
