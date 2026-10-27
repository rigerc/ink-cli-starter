import {spawnSync} from 'node:child_process';
import {copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';

/** Every filesystem test runs in its own disposable workspace. */
export function withWorkspace<T>(run: (directory: string) => T): T {
  const directory = mkdtempSync(join(tmpdir(), 'ink-starter-test-'));

  try {
    return run(directory);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
}

export function copyFromRepo(directory: string, paths: readonly string[]) {
  for (const path of paths) {
    const destination = join(directory, path);
    mkdirSync(dirname(destination), {recursive: true});
    copyFileSync(new URL('../../' + path, import.meta.url), destination);
  }
}

export function writeFixture(directory: string, path: string, content: string) {
  const destination = join(directory, path);
  mkdirSync(dirname(destination), {recursive: true});
  writeFileSync(destination, content);
}

export function readJson(directory: string, path: string) {
  return JSON.parse(readFileSync(join(directory, path), 'utf8'));
}

export function runNode(
  script: string,
  args: readonly string[] = [],
  options: {cwd?: string; env?: NodeJS.ProcessEnv; input?: string} = {},
) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: options.cwd,
    env: {...process.env, ...options.env},
    input: options.input,
    encoding: 'utf8',
    timeout: 30_000,
  });
}

/** Async variant retains the workspace until all operations have finished. */
export async function withAsyncWorkspace<T>(run: (directory: string) => Promise<T>): Promise<T> {
  const directory = mkdtempSync(join(tmpdir(), 'ink-starter-test-'));
  try {
    return await run(directory);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
}
