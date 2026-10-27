import {mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach, describe, expect, it} from 'vite-plus/test';

/**
 * node-pty ships prebuilt bindings that can be missing on some machines, so the
 * module is loaded dynamically and its absence skips the suite instead of
 * failing it. `REQUIRE_PTY=1` (set in CI on Linux Node 24) turns a skip into a
 * hard failure so a silent skip cannot hide a regression.
 */
type PtyModule = typeof import('node-pty');
let pty: PtyModule | undefined;
let skipReason: string | undefined;
try {
  pty = await import('node-pty');
} catch (error) {
  skipReason = `node-pty could not be loaded: ${error instanceof Error ? error.message : String(error)}`;
}
if (!skipReason && process.platform === 'win32')
  skipReason = 'node-pty interactive tests are not supported on Windows';
if (skipReason) {
  if (process.env.REQUIRE_PTY === '1')
    throw new Error(`PTY tests are required (REQUIRE_PTY=1): ${skipReason}`);
  console.warn(`Skipping interactive PTY tests: ${skipReason}`);
}

const sessions: {terminal: import('node-pty').IPty; directory: string}[] = [];
// SAFETY: the suite below is skipped entirely when node-pty could not be loaded.
const spawnPty = pty!;
afterEach(() => {
  for (const {terminal, directory} of sessions.splice(0)) {
    try {
      terminal.kill();
    } catch {
      /* Already exited. */
    }
    rmSync(directory, {recursive: true, force: true});
  }
});
function start(args: string[] = []) {
  const directory = mkdtempSync(join(tmpdir(), 'ink-pty-'));
  const env = Object.fromEntries(
    Object.entries({
      ...process.env,
      CI: undefined,
      NO_COLOR: '1',
      FORCE_COLOR: undefined,
      NODE_OPTIONS: '',
      XDG_CONFIG_HOME: directory,
      XDG_STATE_HOME: directory,
      NO_UPDATE_NOTIFIER: '1',
      TERM: 'xterm-256color',
    }).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
  const terminal = spawnPty.spawn(
    process.execPath,
    ['--import', 'tsx', 'src/cli.tsx', '--ascii', ...args],
    {name: 'xterm-256color', cols: 80, rows: 30, cwd: process.cwd(), env},
  );
  sessions.push({terminal, directory});
  let output = '';
  const listeners = new Set<() => void>();
  terminal.onData((chunk) => {
    output += chunk;
    for (const listener of listeners) listener();
  });
  const exited = new Promise<{exitCode: number; signal?: number}>((resolve) =>
    terminal.onExit(resolve),
  );
  const waitFor = (text: string) =>
    new Promise<void>((resolve, reject) => {
      const check = () => {
        if (output.includes(text)) {
          clearTimeout(timeout);
          listeners.delete(check);
          resolve();
        }
      };
      const timeout = setTimeout(() => {
        listeners.delete(check);
        reject(new Error(`No ${JSON.stringify(text)} in PTY output: ${output}`));
      }, 8000);
      listeners.add(check);
      check();
    });
  return {terminal, exited, waitFor, output: () => output};
}

describe.skipIf(Boolean(skipReason))('real interactive terminal', () => {
  it('starts, navigates, quits, and restores the cursor', async () => {
    const session = start();
    await session.waitFor('Build your app');
    session.terminal.write('4');
    await session.waitFor('Example work items');
    session.terminal.write('\r');
    await session.waitFor('Compile the application');
    session.terminal.write('q');
    expect((await session.exited).exitCode).toBe(0);
    expect(session.output()).toContain('\u001b[?25h');
  }, 15_000);

  it('exits with 130 on raw Ctrl-C and restores the primary screen', async () => {
    const session = start(['--alternate-screen']);
    await session.waitFor('Build your app');
    expect(session.output()).toContain('\u001b[?1049h');
    session.terminal.write('3');
    await session.waitFor('Keyboard shortcuts');
    session.terminal.write('\u0003');
    expect((await session.exited).exitCode).toBe(130);
    expect(session.output()).toContain('\u001b[?1049l');
    expect(session.output()).toContain('\u001b[?25h');
  }, 15_000);

  it.skipIf(process.platform === 'win32')(
    'handles SIGTERM with exit 143 and terminal cleanup',
    async () => {
      const session = start(['--alternate-screen']);
      await session.waitFor('Build your app');
      process.kill(session.terminal.pid, 'SIGTERM');
      const result = await session.exited;
      // atomically's process cleanup re-raises real Unix signals; shells report 128 + signal.
      expect(result.signal ? 128 + result.signal : result.exitCode).toBe(143);
      expect(session.output()).toContain('\u001b[?1049l');
      expect(session.output()).toContain('\u001b[?25h');
    },
    15_000,
  );

  it('supports screen-reader output in the real renderer', async () => {
    const session = start(['--screen-reader', '--screen', 'gallery']);
    await session.waitFor('Build package, ready, selected');
    session.terminal.write('q');
    expect((await session.exited).exitCode).toBe(0);
  }, 15_000);
});
