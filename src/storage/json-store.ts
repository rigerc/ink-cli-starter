import {randomBytes} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import type {z} from 'zod';
import {AppError} from '../lib/errors';

export interface StoreOptions<T extends {version: number}> {
  path: string;
  version: number;
  schema: z.ZodType<T>;
  empty: () => T;
  migrations?: Readonly<Record<number, (value: Record<string, unknown>) => Record<string, unknown>>>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * A versioned JSON document store. Writes are atomic (same-directory rename)
 * and never replace a corrupt, unreadable or unsupported document.
 * Callers requiring multiple concurrent writers should provide a locking backend.
 */
export function createJsonStore<T extends {version: number}>(options: StoreOptions<T>) {
  function validate(value: unknown): T {
    const result = options.schema.safeParse(value);
    if (!result.success)
      throw new AppError('Invalid application data', {
        exitCode: 2,
        hint: result.error.issues.map((issue) => issue.path.join('.') + ': ' + issue.message).join('; '),
      });
    return result.data;
  }

  function read(): T {
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(options.path, 'utf8'));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return validate(options.empty());
      throw new AppError('Cannot read application data', {
        exitCode: 2,
        hint: `${options.path}: ${(error as Error).message}`,
      });
    }
    if (!isRecord(raw) || !Number.isInteger(raw.version) || (raw.version as number) < 0)
      throw new AppError('Invalid application data version', {exitCode: 2});
    if ((raw.version as number) > options.version)
      throw new AppError('Application data was written by a newer version', {exitCode: 2});
    let value = raw;
    for (let version = raw.version as number; version < options.version; version++) {
      const migration = options.migrations?.[version];
      if (!migration) throw new AppError(`Missing data migration from version ${version}`, {exitCode: 2});
      value = migration(value);
    }
    return validate(value);
  }

  function write(value: T): T {
    // Never overwrite invalid existing data, including data from a future version.
    read();
    const next = validate(value);
    if (next.version !== options.version)
      throw new AppError('Invalid application data version for write', {exitCode: 2});
    const directory = dirname(options.path);
    mkdirSync(directory, {recursive: true});
    const temporary = join(directory, `.${randomBytes(8).toString('hex')}.tmp`);
    try {
      writeFileSync(temporary, JSON.stringify(next, null, 2) + '\n', {
        encoding: 'utf8', flag: 'wx', mode: 0o600,
      });
      renameSync(temporary, options.path);
    } finally {
      if (existsSync(temporary)) unlinkSync(temporary);
    }
    return next;
  }

  function update(transform: (current: T) => T): T {
    return write(transform(read()));
  }

  return {path: options.path, read, write, update};
}
