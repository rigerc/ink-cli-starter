#!/usr/bin/env node
import {cp, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {dirname, extname, join, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  '.gitignore',
  'AGENTS.md',
  'README.md',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'vite.config.ts',
];
const directories = ['.github', '.vite-hooks', 'scripts', 'src', 'tests'];
const textExtensions = new Set(['.js', '.jsx', '.json', '.md', '.mjs', '.ts', '.tsx', '.yml', '.yaml']);

function usage() {
  console.log(`Usage: npm run scaffold -- <app-name>

Create a new Ink CLI app in ./<app-name>.
The name must use lowercase letters, numbers, and hyphens (e.g. my-cli).
The destination must not already exist.`);
}

async function replaceNames(dir, oldName, newName) {
  for (const entry of await readdir(dir, {withFileTypes: true})) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await replaceNames(path, oldName, newName);
    } else if (entry.isFile() && (textExtensions.has(extname(entry.name)) || entry.name === '.gitignore' || entry.name === 'pre-commit')) {
      const original = await readFile(path, 'utf8');
      const updated = original
        .replaceAll(oldName, newName)
        .replaceAll(oldName.toUpperCase().replaceAll('-', '_'), newName.toUpperCase().replaceAll('-', '_'));
      if (updated !== original) await writeFile(path, updated);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) {
    usage();
    return;
  }
  if (args.length !== 1 || !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(args[0])) {
    usage();
    process.exitCode = 1;
    return;
  }

  const name = args[0];
  const destination = resolve(process.cwd(), name);
  // Avoid copying a directory into itself when run from inside the starter source tree.
  if (directories.some((entry) => destination.startsWith(join(sourceRoot, entry) + sep))) {
    throw new Error('Run scaffold outside the starter source directories.');
  }

  // mkdir without `recursive` makes existing directories (even empty ones) a hard error.
  await mkdir(destination);
  try {
    for (const file of files) await cp(join(sourceRoot, file), join(destination, file));
    for (const dir of directories)
      await cp(join(sourceRoot, dir), join(destination, dir), {recursive: true});

    const pkg = JSON.parse(await readFile(join(sourceRoot, 'package.json'), 'utf8'));
    await replaceNames(destination, pkg.name, name);
  } catch (error) {
    await rm(destination, {recursive: true, force: true});
    throw error;
  }

  console.log(`Created ${destination}\n\nNext steps:\n  cd ${name}\n  npm ci\n  npm run dev`);
}

main().catch((error) => {
  console.error(`Scaffold failed: ${error.message}`);
  process.exitCode = 1;
});
