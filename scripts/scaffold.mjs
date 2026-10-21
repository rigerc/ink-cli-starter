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
  'src/screens/Tasks.tsx',
  'src/screens/UiDemo.tsx',
  'tests/ui-demo.test.tsx',
  'src/demos/InlineDemo.tsx',
]);
const templatePrefix = 'templates/app/';

function usage() {
  console.log(`Usage: npm run scaffold -- <app-name> [options]

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
  const tracked = output.split('\0').filter(Boolean);
  const overlays = tracked.filter((file) => file.startsWith(templatePrefix));
  const files = tracked.filter(
    (file) =>
      !file.startsWith('.github/') && !file.startsWith(templatePrefix) && !excluded.has(file),
  );
  for (const required of ['package.json', 'package-lock.json', 'src/lib/config.ts']) {
    if (!files.includes(required)) throw new Error(`Required tracked file missing: ${required}`);
  }
  return {files, overlays};
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
  delete pkg.scripts?.['demo:inline'];
  delete pkg.scripts?.['demo:ui'];
  pkg.description = 'An extensible Ink terminal application';
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
    `# ${name}

A domain-agnostic terminal application built with Ink 8, React 19, and TypeScript. Requires Node.js 22+.

## Getting started

\`\`\`bash
npm install
npm run dev             # Interactive terminal UI
npm run dev -- --plain  # One-shot output for CI/pipes
npm run build
npm start
\`\`\`

## Commands

\`\`\`bash
${name} --help
${name} --screen settings
${name} --setup          # Interactive configuration wizard
${name} doctor           # Environment and config diagnostics
${name} doctor --json    # Machine-readable diagnostics
${name} --screen gallery # Optional component gallery
\`\`\`

## Extend your app

- Create screens in \`src/screens/\` and register them in \`src/screens/index.ts\`.
- Register noninteractive commands in \`src/commands/index.ts\`.
- Add feature modules under \`src/features/\` only when needed.
- Extend \`src/config/schema.ts\` for validated application settings.
- Reuse \`src/components/\`, \`src/hooks/\`, and \`src/theme/\`.
- See \`docs/architecture.md\` and \`docs/adding-a-feature.md\`.

Home, Settings, and Help are the only navigation tabs. The component gallery is
accessible by flag but is not part of your app's product functionality. No
business domain, fake task runner, or data backend is included.

## Checks

\`\`\`bash
npm run typecheck
npm test
npm run build
npm run screenshot  # Requires Playwright Chromium
\`\`\`

GitHub Actions CI is included in \`.github/workflows/ci.yml\`.
`,
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

  const {files, overlays} = trackedFiles();
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
    // Overlays replace showcase files with a clean, domain-agnostic application.
    for (const file of overlays) {
      const source = join(sourceRoot, file);
      if (!(await lstat(source)).isFile()) {
        throw new Error(`Tracked path is not a regular file: ${file}`);
      }
      const target = join(destination, file.slice(templatePrefix.length));
      await mkdir(dirname(target), {recursive: true});
      await copyFile(source, target);
    }
    await renameApp(destination, name);
  } catch (error) {
    await rm(destination, {recursive: true, force: true});
    throw error;
  }

  console.log(
    `Created ${destination}\n\nNext steps:\n  cd "${destination}"\n  npm install\n  npm run dev`,
  );
}

main().catch((error) => {
  console.error(`Scaffold failed: ${error.message}`);
  process.exitCode = 1;
});
