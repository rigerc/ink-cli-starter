#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import {createInterface} from 'node:readline/promises';
import {copyFile, lstat, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const excluded = new Set([
  'README.md', // Generated apps get their own concise README.
  'scripts/scaffold.mjs',
  'tests/scaffold.test.ts',
]);

function usage() {
  console.log(`Usage: npm run scaffold -- [app-name] [options]

Create a new Ink CLI app. With no name in a terminal, prompts for app name and destination.

Options:
  -p, --path <directory>  Full destination directory (default: ./<app-name>)
  -i, --interactive       Prompt for missing options and confirm creation
  -h, --help              Show this help

Examples:
  npm run scaffold
  npm run scaffold -- my-cli
  npm run scaffold -- my-cli --path ../projects/my-cli
  npm run scaffold -- my-cli --interactive`);
}
function trackedFiles() {
  let output;
  try {
    output = execFileSync('git', ['ls-files', '--cached', '-z'], {
      cwd: sourceRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    throw new Error('Git is required: run scaffolding from a checkout of this starter.');
  }
  const files = output.split('\0').filter((file) =>
    file && !file.startsWith('.github/') && !excluded.has(file),
  );
  for (const required of ['package.json', 'package-lock.json', 'src/lib/config.ts']) {
    if (!files.includes(required)) throw new Error(`Required tracked file missing: ${required}`);
  }
  return files;
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function renameBin(bin, previous, next) {
  if (!bin || typeof bin !== 'object' || !Object.hasOwn(bin, previous)) return bin;
  const {[previous]: value, ...otherBins} = bin;
  return {...otherBins, [next]: value};
}

async function renameApp(destination, name) {
  const packagePath = join(destination, 'package.json');
  const pkg = JSON.parse(await readFile(packagePath, 'utf8'));
  const previous = pkg.name;
  if (typeof previous !== 'string' || !previous) throw new Error('Missing starter package name.');
  pkg.name = name;
  pkg.bin = renameBin(pkg.bin, previous, name);
  delete pkg.scripts?.scaffold;
  await writeJson(packagePath, pkg);

  const lockPath = join(destination, 'package-lock.json');
  const lock = JSON.parse(await readFile(lockPath, 'utf8'));
  if (!lock.packages?.['']) throw new Error('Unsupported package-lock.json: no root package.');
  lock.name = name;
  lock.packages[''].name = name;
  lock.packages[''].bin = renameBin(lock.packages[''].bin, previous, name);
  await writeJson(lockPath, lock);

  const configPath = join(destination, 'src/lib/config.ts');
  const config = await readFile(configPath, 'utf8');
  const match = config.match(/^export const APP_NAME\s*=\s*(['"])([^'"]+)\1;/m);
  if (!match || match[2] !== previous) {
    throw new Error('Could not locate the starter APP_NAME constant in src/lib/config.ts.');
  }
  await writeFile(configPath, config.replace(match[0], `export const APP_NAME = '${name}';`));

  await writeFile(
    join(destination, 'README.md'),
    `# ${name}\n\nAn Ink 8 / React CLI application. Requires Node.js 22+.\n\n## Getting started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Commands\n\n\`\`\`bash\nnpm run gallery       # Browse the component gallery\nnpm run demo:inline   # Run the interactive setup demo\nnpm test              # Test the application\nnpm run build         # Build the CLI\nnpm start             # Run the built CLI\n\`\`\`\n\nEdit \`src/screens\` to customize screens, \`src/lib/config.ts\` for configuration,\nand \`src/theme\` for themes.\n`,
  );
}

const validName = (name) => /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name);

async function askName(rl) {
  while (true) {
    const name = (await rl.question('App name (lowercase kebab-case): ')).trim();
    if (validName(name)) return name;
    console.log('Use lowercase letters, numbers, and hyphens (e.g. my-cli).');
  }
}

async function main() {
  const {values, positionals} = parseArgs({
    options: {
      path: {type: 'string', short: 'p'},
      interactive: {type: 'boolean', short: 'i'},
      help: {type: 'boolean', short: 'h'},
    },
    allowPositionals: true,
  });

  if (values.help) {
    usage();
    return;
  }
  if (positionals.length > 1) throw new Error('Expected at most one app name.');
  const interactive = Boolean(
    values.interactive || (positionals.length === 0 && process.stdin.isTTY && process.stdout.isTTY),
  );
  if (!positionals.length && !interactive) {
    throw new Error('Missing app name. Pass a name or run in an interactive terminal.');
  }

  let name = positionals[0];
  if (name && !validName(name)) {
    throw new Error('App name must be lowercase kebab-case (e.g. my-cli).');
  }
  if (values.path !== undefined && !values.path.trim()) {
    throw new Error('--path must specify a non-empty destination.');
  }

  const rl = interactive
    ? createInterface({input: process.stdin, output: process.stdout})
    : undefined;
  let destination;
  try {
    if (!name) name = await askName(rl);
    const defaultPath = join('.', name);
    let targetPath = values.path;
    if (interactive && targetPath === undefined) {
      targetPath = (await rl.question(`Destination path [${defaultPath}]: `)).trim() || defaultPath;
    }
    destination = resolve(process.cwd(), targetPath ?? defaultPath);

    if (interactive) {
      const answer = (await rl.question(`Create "${name}" at "${destination}"? [Y/n]: `))
        .trim()
        .toLowerCase();
      if (!['', 'y', 'yes'].includes(answer)) {
        console.log('Cancelled.');
        return;
      }
    }
  } finally {
    rl?.close();
  }

  const files = trackedFiles();
  // Parent directories can be new; the final directory must not exist.
  await mkdir(dirname(destination), {recursive: true});
  await mkdir(destination);
  try {
    for (const file of files) {
      const source = join(sourceRoot, file);
      if (!(await lstat(source)).isFile()) {
        throw new Error(`Tracked path is not a regular file: ${file}`);
      }
      const target = join(destination, file);
      await mkdir(dirname(target), {recursive: true});
      await copyFile(source, target);
    }
    await renameApp(destination, name);
  } catch (error) {
    await rm(destination, {recursive: true, force: true});
    throw error;
  }

  console.log(`Created ${destination}\n\nNext steps:\n  cd "${destination}"\n  npm install\n  npm run dev`);
}

main().catch((error) => {
  console.error(`Scaffold failed: ${error.message}`);
  process.exitCode = 1;
});
