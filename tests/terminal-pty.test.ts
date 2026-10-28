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
  const terminal = spawnPty.spawn(process.execPath, ['--import', 'tsx', 'src/cli.tsx', ...args], {
    name: 'xterm-256color',
    cols: 80,
    rows: 30,
    cwd: process.cwd(),
    env,
  });
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
  it('renders, quits with q, and restores the cursor', async () => {
    const session = start();
    await session.waitFor('Edit src/app.tsx');
    session.terminal.write('q');
    expect((await session.exited).exitCode).toBe(0);
    expect(session.output()).toContain('\u001b[?25h');
  }, 15_000);

  it('closes on raw Ctrl-C and restores the primary screen', async () => {
    const session = start(['--alternate-screen']);
    await session.waitFor('Edit src/app.tsx');
    expect(session.output()).toContain('\u001b[?1049h');
    session.terminal.write('\u0003');
    // Raw terminal input is handled by Ink, which may close with code 0.
    expect([0, 130]).toContain((await session.exited).exitCode);
    expect(session.output()).toContain('\u001b[?1049l');
    expect(session.output()).toContain('\u001b[?25h');
  }, 15_000);

  it.skipIf(process.platform === 'win32')(
    'reports 130 for a process SIGINT',
    async () => {
      const session = start(['--alternate-screen']);
      await session.waitFor('Edit src/app.tsx');
      process.kill(session.terminal.pid, 'SIGINT');
      const result = await session.exited;
      expect(result.signal ? 128 + result.signal : result.exitCode).toBe(130);
      expect(session.output()).toContain('\u001b[?1049l');
      expect(session.output()).toContain('\u001b[?25h');
    },
    15_000,
  );

  it.skipIf(process.platform === 'win32')(
    'handles SIGTERM and terminal cleanup',
    async () => {
      const session = start(['--alternate-screen']);
      await session.waitFor('Edit src/app.tsx');
      process.kill(session.terminal.pid, 'SIGTERM');
      const result = await session.exited;
      expect(result.signal ? 128 + result.signal : result.exitCode).toBe(143);
      expect(session.output()).toContain('\u001b[?1049l');
      expect(session.output()).toContain('\u001b[?25h');
    },
    15_000,
  );

  it('supports Ink screen-reader rendering', async () => {
    const session = start(['--screen-reader']);
    await session.waitFor('Your CLI is ready');
    session.terminal.write('q');
    expect((await session.exited).exitCode).toBe(0);
  }, 15_000);
});
