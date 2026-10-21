import {mkdir, rm} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {createInterface} from 'node:readline/promises';
import {fileURLToPath} from 'node:url';
import meow from 'meow';
import {copyTemplate, trackedFiles} from './copy';
import {renameApp} from './rename';

/** Default starter checkout: this file lives in `<root>/src/scaffold`. */
const defaultSourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const validName = (name: string): boolean => /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(name);

/** Errors that carry their own exit code: 2 for usage, 1 for anything else. */
class ScaffoldError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode = 1) {
    super(message);
    this.exitCode = exitCode;
  }
}

const usage = `
  Create a new Ink CLI app from this starter checkout.

  Usage
    $ ink-cli-starter <app-name> [options]
    $ ink-cli-starter --interactive [--path <dir>]

  Options
    -p, --path <dir>     Complete destination directory (default: ./<app-name>)
    -i, --interactive    Prompt for the app name, destination and confirmation
    -y, --yes            Skip the confirmation prompt
    --source <dir>       Scaffold from another starter checkout
    --help               Show this help
    --version            Show the version

  Examples
    $ ink-cli-starter my-cli
    $ ink-cli-starter my-cli --path ../apps/my-cli
    $ ink-cli-starter --interactive
`;

async function askName(question: (text: string) => Promise<string>): Promise<string> {
  for (;;) {
    const name = (await question('App name (lowercase kebab-case): ')).trim();
    if (validName(name)) return name;
    console.log('Use lowercase letters, numbers, and hyphens (e.g. my-cli).');
  }
}

async function main(): Promise<void> {
  const cli = meow(usage, {
    importMeta: import.meta,
    flags: {
      path: {type: 'string', shortFlag: 'p'},
      interactive: {type: 'boolean', shortFlag: 'i'},
      yes: {type: 'boolean', shortFlag: 'y'},
      source: {type: 'string'},
    },
  });

  const {flags, input} = cli;
  if (input.length > 1) throw new ScaffoldError('Expected at most one app name.', 2);
  if (flags.path !== undefined && flags.path.trim() === '') {
    throw new ScaffoldError('--path must specify a non-empty destination.', 2);
  }

  const interactive = Boolean(
    flags.interactive || (input.length === 0 && process.stdin.isTTY && process.stdout.isTTY),
  );
  let name = input[0];
  if (name === undefined && !interactive) {
    throw new ScaffoldError('Missing app name. Pass a name or run in an interactive terminal.', 2);
  }
  if (name !== undefined && !validName(name)) {
    throw new ScaffoldError('App name must be lowercase kebab-case (e.g. my-cli).', 2);
  }

  const sourceRoot = resolve(flags.source ?? defaultSourceRoot);
  const rl = interactive
    ? createInterface({input: process.stdin, output: process.stdout})
    : undefined;
  let destination: string;
  try {
    const question = async (text: string) => (rl ? rl.question(text) : '');
    if (name === undefined) name = await askName(question);
    const defaultPath = join('.', name);
    let targetPath = flags.path;
    if (interactive && targetPath === undefined) {
      targetPath = (await question(`Destination path [${defaultPath}]: `)).trim() || defaultPath;
    }
    destination = resolve(process.cwd(), targetPath ?? defaultPath);

    if (interactive && !flags.yes) {
      const answer = (await question(`Create "${name}" at "${destination}"? [Y/n]: `))
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

  const files = trackedFiles(sourceRoot);
  // Parent directories can be new; the final directory must not exist.
  await mkdir(dirname(destination), {recursive: true});
  try {
    await mkdir(destination);
  } catch {
    throw new ScaffoldError(
      `Destination already exists: ${destination}\nExisting directories are never overwritten.`,
    );
  }

  try {
    await copyTemplate(sourceRoot, destination, files);
    await renameApp(destination, name);
  } catch (error) {
    await rm(destination, {recursive: true, force: true});
    throw error;
  }

  console.log(
    `Created ${destination}\n\nNext steps:\n  cd "${destination}"\n  npm install\n  npm run dev`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Scaffold failed: ${message}`);
  process.exit(error instanceof ScaffoldError ? error.exitCode : 1);
});
