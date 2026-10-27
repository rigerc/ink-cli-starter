import {existsSync, readFileSync, statSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it, vi} from 'vite-plus/test';
import {createLogger, redact} from '../src/lib/logger';
import {getUpdateNotice} from '../src/lib/updates';
import {withWorkspace, withAsyncWorkspace} from './helpers/fixtures';

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
});
