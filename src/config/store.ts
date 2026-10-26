import Conf from 'conf';
import {homedir} from 'node:os';
import {basename, dirname, extname, isAbsolute, join, resolve} from 'node:path';
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

  /** Keep the old on-disk location and --config filename when switching to conf. */
  function open(path: string): Conf<RawConfig> {
    const extension = extname(path);

    return new Conf<RawConfig>({
      cwd: dirname(path),
      configName: basename(path, extension),
      fileExtension: extension.slice(1),
      accessPropertiesByDotNotation: false,
      clearInvalidConfig: false,
      // Conf normalizes non-object JSON roots into store objects. Validate the
      // original document first so files such as [] cannot be overwritten.
      deserialize: (text) => {
        const decoded = rawConfigSchema.safeParse(JSON.parse(text));

        if (!decoded.success)
          throw new Error('Configuration must be a JSON object containing valid JSON values');

        return decoded.data;
      },
      configFileMode: 0o600,
    });
  }

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

    try {
      // Conf handles missing files and JSON decoding; Zod retains the existing
      // application schema, migration and extension-key validation contracts.
      const decoded = rawConfigSchema.safeParse(open(path).store);

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
      return {config: {} as T, path, error: `Could not read ${path}: ${toErrorMessage(error)}`};
    }
  }

  /** Refuses corrupt files; conf performs the atomic replacement after validation. */
  function write(patch: DeepPartial<T>, override?: string): T {
    const {config, error, path} = read(override);

    if (error) throw new Error(error);
    const next = validate({...mergeConfig(config, patch), version: definition.version});

    // A whole-store assignment is one atomic write, including nested patches and
    // preserved application-specific keys; never clear malformed configuration.
    open(path).store = next as RawConfig;

    return next;
  }

  return {pathFor, read, write, validate, definition};
}
