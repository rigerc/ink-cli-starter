import {execFileSync} from 'node:child_process';
import {copyFile, lstat, mkdir} from 'node:fs/promises';
import {dirname, join} from 'node:path';

/** Starter files that scaffolded apps never receive. */
const excludedFiles = new Set([
  'README.md', // Generated apps get their own concise README.
  'bin/ink-cli-starter.mjs',
  'tests/scaffold.test.ts',
]);
const excludedPrefixes = ['.github/', 'src/scaffold/'];
const requiredFiles = ['package.json', 'package-lock.json', 'src/lib/config.ts'];

export function isExcluded(file: string): boolean {
  return excludedFiles.has(file) || excludedPrefixes.some((prefix) => file.startsWith(prefix));
}

/** Tracked files of the starter checkout, minus the scaffolding tooling itself. */
export function trackedFiles(sourceRoot: string): string[] {
  let output: string;
  try {
    output = execFileSync('git', ['ls-files', '--cached', '-z'], {
      cwd: sourceRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    throw new Error(`Git is required: ${sourceRoot} must be a checkout of this starter.`);
  }

  const files = output.split('\0').filter((file) => file.length > 0 && !isExcluded(file));
  for (const file of requiredFiles) {
    if (!files.includes(file)) throw new Error(`Required tracked file missing: ${file}`);
  }
  return files.sort();
}

export async function copyTemplate(
  sourceRoot: string,
  destination: string,
  files: string[],
): Promise<void> {
  for (const file of files) {
    const source = join(sourceRoot, file);
    if (!(await lstat(source)).isFile()) {
      throw new Error(`Tracked path is not a regular file: ${file}`);
    }
    const target = join(destination, file);
    await mkdir(dirname(target), {recursive: true});
    await copyFile(source, target);
  }
}
