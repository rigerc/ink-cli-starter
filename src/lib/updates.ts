import {mkdirSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {join} from 'node:path';
import {z} from 'zod';
import {APP_NAME} from './identity';
import {logger} from './logger';

const cacheSchema = z.object({
  checkedAt: z.number(),
  latest: z.string().optional(),
  error: z.boolean().optional(),
});
const releaseSchema = z.object({version: z.string().regex(/^\d+\.\d+\.\d+$/)});
const SUCCESS_RETRY_MS = 24 * 60 * 60 * 1000;
const FAILURE_RETRY_MS = 60 * 60 * 1000;
function stale(cache: z.infer<typeof cacheSchema> | undefined, now: number) {
  if (!cache || cache.checkedAt > now) return true;
  return now - cache.checkedAt > (cache.error ? FAILURE_RETRY_MS : SUCCESS_RETRY_MS);
}
function newer(candidate: string, current: string) {
  if (!/^\d+\.\d+\.\d+$/.test(current)) return false;
  const left = candidate.split('.').map(Number);
  const right = current.split('.').map(Number);
  for (let index = 0; index < 3; index++) {
    if (left[index] !== right[index]) return left[index]! > right[index]!;
  }
  return false;
}

/** Opt-in, bounded update checks only for published, interactive downstream applications. */
export async function getUpdateNotice(options: {
  enabled: boolean;
  packageName: string;
  currentVersion: string;
  privatePackage?: boolean;
  signal: AbortSignal;
  env?: NodeJS.ProcessEnv;
  isTTY?: boolean;
  stateDirectory?: string;
  fetcher?: typeof fetch;
}): Promise<string | undefined> {
  const env = options.env ?? process.env;
  if (
    !options.enabled ||
    options.privatePackage ||
    env.NO_UPDATE_NOTIFIER ||
    env.CI ||
    !(options.isTTY ?? process.stdout.isTTY) ||
    options.signal.aborted
  )
    return;
  const directory =
    options.stateDirectory ??
    join(env.XDG_STATE_HOME || join(homedir(), '.local', 'state'), APP_NAME);
  const path = join(directory, 'update.json');
  // Atomic best-effort cache write; persistence failures fall through to the outer handler.
  const persist = (value: z.infer<typeof cacheSchema>) => {
    mkdirSync(directory, {recursive: true});
    const temporary = `${path}.${process.pid}.tmp`;
    writeFileSync(temporary, JSON.stringify(value), {mode: 0o600});
    renameSync(temporary, path);
  };
  try {
    let cache: z.infer<typeof cacheSchema> | undefined;
    try {
      cache = cacheSchema.parse(JSON.parse(readFileSync(path, 'utf8')));
    } catch {
      /* A missing or invalid cache simply triggers a fresh check. */
    }
    if (stale(cache, Date.now())) {
      try {
        const response = await (options.fetcher ?? fetch)(
          `https://registry.npmjs.org/${encodeURIComponent(options.packageName)}/latest`,
          {signal: AbortSignal.any([options.signal, AbortSignal.timeout(1000)]), redirect: 'error'},
        );
        if (!response.ok) throw new Error(`Registry responded with ${response.status}`);
        const declaredSize = Number(response.headers.get('content-length'));
        if (declaredSize > 256 * 1024) return;
        const text = await response.text();
        if (Buffer.byteLength(text) > 256 * 1024) return;
        const release = releaseSchema.parse(JSON.parse(text));
        cache = {checkedAt: Date.now(), latest: release.version};
        persist(cache);
      } catch (error) {
        // An interrupted check says nothing about the registry; record nothing.
        if (options.signal.aborted) return;
        // Offline launches must not pay the one-second timeout on every start.
        // Keep the last known release so a pending update is still announced.
        cache = {checkedAt: Date.now(), latest: cache?.latest, error: true};
        persist(cache);
        logger.debug('Update check failed', error);
      }
    }
    if (cache?.latest && newer(cache.latest, options.currentVersion))
      return `Update available: ${options.packageName} ${options.currentVersion} → ${cache.latest}`;
  } catch (error) {
    logger.debug('Update check skipped', error);
  }
}
