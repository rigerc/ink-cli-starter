import {randomBytes} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {dirname, isAbsolute, join, resolve} from 'node:path';
import type {ConfigDefinition, ConfigValue, RawConfig} from './definition';
import {toErrorMessage} from '../lib/errors';
import {z} from 'zod';

export interface ConfigRead<T extends object> {
  config: T;
  error?: string;
  path: string;
}

export function configFilePath(override?: string, appName = 'ink-kit'): string {
  if (override) return resolve(override);
  const base = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');

  return join(isAbsolute(base) ? base : resolve(base), appName, 'config.json');
}

/** Patch accepted by `mergeConfig`: nested objects may be partial at any depth. */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends readonly unknown[]
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

/** Validate the complete JSON tree, including preserved extension keys. */
const configValueSchema: z.ZodType<ConfigValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(configValueSchema),
    z.record(z.string(), configValueSchema),
  ]),
);
const rawConfigSchema: z.ZodType<RawConfig> = z.record(z.string(), configValueSchema);

const isObjectConfigValue = (value: ConfigValue | undefined): value is RawConfig =>
  value !== undefined && value !== null && value instanceof Object && !Array.isArray(value);

export function mergeConfig<T extends object>(base: T, patch: DeepPartial<T>): T {
  // SAFETY: T extends object; spreading an object type yields a string-keyed record with the same keys.
  const merged: RawConfig = {...(base as RawConfig)};

  for (const [key, value] of Object.entries(patch)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    // SAFETY: patch values follow the DeepPartial contract over schema-validated JSON data.
    const patchValue = value as ConfigValue;
    // SAFETY: stored entries were written by this store from schema-validated JSON data.
    const current = merged[key] as ConfigValue | undefined;
    merged[key] =
      isObjectConfigValue(patchValue) && isObjectConfigValue(current)
        ? mergeConfig(current, patchValue)
        : patchValue;
  }

  // SAFETY: same keys as the base T, only patched entries replaced.
  return merged as T;
}

export function createConfigStore<T extends object>(
  definition: ConfigDefinition<T>,
  appName = 'ink-kit',
) {
  const pathFor = (override?: string) => configFilePath(override, appName);
  const versionSchema = z.number().int().nonnegative();

  function validate(value: RawConfig): T {
    const result = definition.schema.safeParse(value);

    if (!result.success) {
      throw new Error(
        result.error.issues
          .map((issue) => `${issue.path.join('.') || 'config'}: ${issue.message}`)
          .join('; '),
      );
    }

    return result.data;
  }

  function read(override?: string): ConfigRead<T> {
    const path = pathFor(override);
    let raw: unknown;

    try {
      raw = JSON.parse(readFileSync(path, 'utf8'));
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return {config: validate({}), path};
      }

      // SAFETY: placeholder config is never used by callers when `error` is set.
      return {config: {} as T, path, error: `Could not read ${path}: ${toErrorMessage(error)}`};
    }

    try {
      const decoded = rawConfigSchema.safeParse(raw);

      if (!decoded.success)
        throw new Error('Configuration must be a JSON object containing valid JSON values');

      const document = decoded.data;
      const versionResult =
        document.version === undefined
          ? {success: true, data: 0}
          : versionSchema.safeParse(document.version);

      if (!versionResult.success) throw new Error('Invalid configuration version');
      const version = versionResult.data;

      if (version > definition.version)
        throw new Error(
          `Configuration version ${version} is newer than supported version ${definition.version}`,
        );
      let migrated: RawConfig = document;

      for (let current = version; current < definition.version; current++) {
        migrated = definition.migrations?.[current]?.(migrated) ?? migrated;
      }

      // Migrations are application code; verify their output before accepting extension keys.
      return {config: validate(rawConfigSchema.parse(migrated)), path};
    } catch (error) {
      // SAFETY: placeholder config is never used by callers when `error` is set.
      return {config: {} as T, path, error: toErrorMessage(error)};
    }
  }

  /** Refuses corrupt files; validates the merged document before an atomic replacement. */
  function write(patch: DeepPartial<T>, override?: string): T {
    const {config, error, path} = read(override);

    if (error) throw new Error(error);
    const next = validate({...mergeConfig(config, patch), version: definition.version});
    const directory = dirname(path);
    mkdirSync(directory, {recursive: true});
    const temporary = join(directory, `.${randomBytes(8).toString('hex')}.tmp`);

    try {
      writeFileSync(temporary, JSON.stringify(next, null, 2) + '\n', {
        encoding: 'utf8',
        flag: 'wx',
        mode: 0o600,
      });
      renameSync(temporary, path);
    } finally {
      if (existsSync(temporary)) unlinkSync(temporary);
    }

    return next;
  }

  return {pathFor, read, write, validate, definition};
}
