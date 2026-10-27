import {existsSync, readFileSync, statSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it, vi} from 'vite-plus/test';
import {createLogger, redact} from '../src/lib/logger';
import {getUpdateNotice} from '../src/lib/updates';
import {createProgram} from '../src/lib/program';
import {APP_ASCII_ENV, APP_ENV_PREFIX, APP_THEME_ENV} from '../src/lib/identity';
import {withWorkspace, withAsyncWorkspace, writeFixture} from './helpers/fixtures';

describe('bounded diagnostic logging', () => {
  it('filters levels, redacts nested credentials and error causes, and caps rotation', () =>
    withWorkspace((directory) => {
      const path = join(directory, 'log');
      const logger = createLogger({path: () => path, maxBytes: 512, level: 'error'});
      logger.debug('hidden');
      expect(existsSync(path)).toBe(false);
      logger.error({
        token: 'private-token',
        nested: {password: 'private-password'},
        url: 'https://user:pass@example.com',
        header: 'Bearer abc123',
      });
      expect(readFileSync(path, 'utf8')).not.toMatch(
        /private-token|private-password|user:pass|abc123/,
      );
      const circular: {self?: object} = {};
      circular.self = circular;
      expect(() => logger.error(circular)).not.toThrow();
      for (let i = 0; i < 10; i++) logger.error('x'.repeat(1024));
      logger.close();
      expect(statSync(path).size).toBeLessThanOrEqual(512);
      expect(statSync(`${path}.1`).size).toBeLessThanOrEqual(512);
      expect(redact(new Error('token=secret', {cause: {apiKey: 'secret'}}))).toMatchObject({
        message: 'token=[REDACTED]',
        cause: {apiKey: '[REDACTED]'},
      });
      expect(
        redact(
          new Map<unknown, unknown>([
            ['token', 'private-secret'],
            ['plain', 'visible'],
          ]),
        ),
      ).toEqual(
        new Map([
          ['token', '[REDACTED]'],
          ['plain', 'visible'],
        ]),
      );
      expect(redact(new Set(['token=abc', 'plain']))).toEqual(
        new Set(['token=[REDACTED]', 'plain']),
      );
    }));

  it('truncates oversized lines at UTF-8 boundaries and writes valid UTF-8', () =>
    withWorkspace((directory) => {
      const path = join(directory, 'log');
      const logger = createLogger({path: () => path, maxBytes: 256, level: 'error'});
      // With the fixed prefix, the byte cap lands inside the 4-byte emoji so a
      // naive byte cut would produce replacement characters.
      logger.error(`${'x'.repeat(221)}\u{1F389}${'y'.repeat(100)}`);
      logger.close();
      const stored = readFileSync(path, 'utf8');
      // Node decodes without replacement characters, so the line round-trips.
      expect(stored).not.toContain('\uFFFD');
      const line = stored.replace(/\n$/, '');
      expect(Buffer.from(`${line}\n`, 'utf8').length).toBeLessThanOrEqual(256);
    }));
});

describe('optional update notification', () => {
  it('skips network calls for opt-out, CI, private packages, and pipes', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const options = {
      enabled: true,
      packageName: 'example-cli',
      currentVersion: '1.0.0',
      signal: new AbortController().signal,
      env: {},
      isTTY: true,
      fetcher,
    };
    for (const overrides of [
      {enabled: false},
      {env: {NO_UPDATE_NOTIFIER: '1'}},
      {env: {CI: '1'}},
      {isTTY: false},
      {privatePackage: true},
    ]) {
      expect(await getUpdateNotice({...options, ...overrides})).toBeUndefined();
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('caches successful checks, announces newer releases, and tolerates offline requests', async () =>
    withAsyncWorkspace(async (directory) => {
      const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"version":"1.2.0"}'));
      const options = {
        enabled: true,
        packageName: '@acme/example',
        currentVersion: '1.0.0',
        signal: new AbortController().signal,
        env: {},
        isTTY: true,
        stateDirectory: directory,
        fetcher,
      };
      expect(await getUpdateNotice(options)).toContain('1.0.0 → 1.2.0');
      expect(await getUpdateNotice(options)).toContain('1.2.0');
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(fetcher.mock.calls[0]![0]).toContain('%40acme%2Fexample');
      expect(await getUpdateNotice({...options, currentVersion: '2.0.0'})).toBeUndefined();
      fetcher.mockRejectedValue(new Error('offline'));
      expect(
        await getUpdateNotice({...options, stateDirectory: join(directory, 'offline')}),
      ).toBeUndefined();
    }));

  it('caches a failed check and retries only after an hour', async () =>
    withAsyncWorkspace(async (directory) => {
      const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('offline'));
      const options = {
        enabled: true,
        packageName: '@acme/example',
        currentVersion: '1.0.0',
        signal: new AbortController().signal,
        env: {},
        isTTY: true,
        stateDirectory: directory,
        fetcher,
      };
      expect(await getUpdateNotice(options)).toBeUndefined();
      expect(fetcher).toHaveBeenCalledTimes(1);
      // The failure marker prevents an immediate second fetch on the next launch.
      expect(await getUpdateNotice(options)).toBeUndefined();
      expect(fetcher).toHaveBeenCalledTimes(1);
      const marker = JSON.parse(readFileSync(join(directory, 'update.json'), 'utf8'));
      expect(marker.error).toBe(true);
      // After the failure marker ages past the one-hour retry window, the check retries.
      writeFixture(
        directory,
        'update.json',
        JSON.stringify({checkedAt: Date.now() - 2 * 60 * 60 * 1000, error: true}),
      );
      fetcher.mockResolvedValue(new Response('{"version":"1.2.0"}'));
      expect(await getUpdateNotice(options)).toContain('1.0.0 → 1.2.0');
      expect(fetcher).toHaveBeenCalledTimes(2);
      expect(JSON.parse(readFileSync(join(directory, 'update.json'), 'utf8'))).toMatchObject({
        latest: '1.2.0',
      });
    }));
});

describe('documented environment help', () => {
  it('lists opt-in and opt-out update variables with columns padded from the longest name', () => {
    const program = createProgram(new AbortController().signal);
    let help = '';
    const write = vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      help += chunk.toString();
      return true;
    });
    try {
      program.outputHelp();
    } finally {
      write.mockRestore();
    }
    const optIn = `${APP_ENV_PREFIX}_UPDATE_NOTIFIER`;
    for (const name of [
      'NO_COLOR',
      APP_THEME_ENV,
      APP_ASCII_ENV,
      'INK_SCREEN_READER',
      optIn,
      'NO_UPDATE_NOTIFIER',
    ])
      expect(help).toContain(name);
    // Columns align on the longest name; assert the pad width rather than a snapshot.
    const longest = Math.max(
      'NO_COLOR'.length,
      APP_THEME_ENV.length,
      APP_ASCII_ENV.length,
      'INK_SCREEN_READER'.length,
      optIn.length,
      'NO_UPDATE_NOTIFIER'.length,
    );
    expect(help).toMatch(
      new RegExp(`NO_COLOR {${longest - 'NO_COLOR'.length + 2}}Force the mono theme`),
    );
    expect(help).toMatch(new RegExp(`${optIn} {2}Set to 1 to opt in to update checks`));
    expect(help).toMatch(
      new RegExp(
        `NO_UPDATE_NOTIFIER {${longest - 'NO_UPDATE_NOTIFIER'.length + 2}}Opt out of update checks`,
      ),
    );
  });
});
