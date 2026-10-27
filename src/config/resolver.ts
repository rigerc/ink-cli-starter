import {
  getAtPath,
  setAtPath,
  type ConfigField,
  type ConfigValue,
  type RawConfig,
} from './definition';

/** Where a resolved configuration value came from. */
export type ConfigSource = 'default' | 'file' | 'environment' | 'flag';

export interface ResolvedConfig<T extends object> {
  values: T;
  sources: Record<string, ConfigSource>;
}

function fromEnvironment(field: ConfigField, env: NodeJS.ProcessEnv): ConfigValue | undefined {
  const raw = [field.env, ...(field.envAliases ?? [])]
    .map((name) => (name ? env[name] : undefined))
    .find((value) => value !== undefined && value !== '');

  if (raw === undefined || raw === '') return undefined;

  if (field.kind === 'toggle') {
    if (/^(1|true|yes|on)$/i.test(raw)) return true;

    if (/^(0|false|no|off)$/i.test(raw)) return false;

    return undefined;
  }

  if (field.kind === 'number') {
    const number = Number(raw);

    return Number.isFinite(number) ? number : undefined;
  }

  if (field.kind === 'multi')
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  return raw;
}

/** Resolve registered fields without writing CLI/environment overrides to disk. */
export function resolveConfig<T extends object>(
  fields: readonly ConfigField[],
  stored: T,
  options: {env?: NodeJS.ProcessEnv; flags?: Partial<T>} = {},
): ResolvedConfig<T> {
  // SAFETY: starts empty; every write goes through setAtPath which returns T.
  let values = {} as T;
  const sources: ResolvedConfig<T>['sources'] = {};

  for (const field of fields) {
    // SAFETY: T extends object; the stored config is schema-validated and treated as a RawConfig document.
    const fromFile = getAtPath(stored as RawConfig, field.path);
    const fromEnv = fromEnvironment(field, options.env ?? process.env);
    // SAFETY: Partial<T> keys align with T; read-only lookup by dotted field path.
    const fromFlag = options.flags ? getAtPath(options.flags as RawConfig, field.path) : undefined;

    const source: ConfigSource =
      fromFlag !== undefined
        ? 'flag'
        : fromEnv !== undefined
          ? 'environment'
          : fromFile !== undefined
            ? 'file'
            : 'default';

    const value = fromFlag ?? fromEnv ?? fromFile ?? field.defaultValue;

    if (value !== undefined) values = setAtPath(values, field.path, value);
    sources[field.path] = source;
  }

  return {values, sources};
}
