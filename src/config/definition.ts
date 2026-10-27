import type {z} from 'zod';

/** Parsed JSON document for a stored configuration file. */
export interface RawConfig {
  [key: string]: ConfigValue;
}

/** A JSON-compatible configuration value. */
export type ConfigValue = string | number | boolean | null | readonly ConfigValue[] | RawConfig;

/** Values snapshot passed to field visibility callbacks. */
export type FieldValues = RawConfig;

/** Version-to-version migration over the raw document. */
export type Migration = (raw: RawConfig) => RawConfig;

/** Editor metadata is independent of persistence and can be extended by consuming apps. */
export interface ConfigField {
  path: string;
  label: string;
  section: string;
  kind: 'toggle' | 'select' | 'text' | 'number' | 'multi';
  description?: string;
  options?: readonly {value: string; label: string; hint?: string}[];
  defaultValue?: ConfigValue;
  env?: string;
  envAliases?: readonly string[];
  visibleWhen?: (values: FieldValues) => boolean;
}

export interface ConfigDefinition<T extends object> {
  schema: z.ZodType<T>;
  version: number;
  fields: readonly ConfigField[];
  migrations?: Readonly<Record<number, Migration>>;
}

export function defineConfig<T extends object>(definition: ConfigDefinition<T>) {
  return definition;
}

/** Domain-level narrowing over values already decoded as JSON. */
function isObjectConfigValue(value: ConfigValue | undefined): value is RawConfig {
  return value !== undefined && value !== null && value instanceof Object && !Array.isArray(value);
}

export function getAtPath(values: RawConfig, path: string): ConfigValue | undefined {
  let current: ConfigValue | undefined = values;

  for (const part of path.split('.')) {
    if (!isObjectConfigValue(current)) return undefined;

    current = current[part];
  }

  return current;
}

/** Immutable nested update. Paths refer to object keys, never array indices. */
export function setAtPath<T extends object>(values: T, path: string, value: ConfigValue): T {
  const segments = path.split('.');

  if (
    !segments.length ||
    segments.some(
      (segment) =>
        !segment || segment === '__proto__' || segment === 'constructor' || segment === 'prototype',
    )
  ) {
    throw new Error('Invalid configuration path');
  }

  // SAFETY: T extends object; spreading an object type yields a string-keyed record with the same keys.
  const root = {...values} as RawConfig;
  let node = root;

  for (const segment of segments.slice(0, -1)) {
    const old = node[segment];

    const next = isObjectConfigValue(old) ? {...old} : {};

    node[segment] = next;
    node = next;
  }

  node[segments[segments.length - 1]!] = value;

  // SAFETY: same keys as the input T, only the target path replaced.
  return root as T;
}

export function configSections(fields: readonly ConfigField[]): string[] {
  return [...new Set(fields.map((field) => field.section))];
}

/** Remove an override without changing its siblings or retained extension keys. */
export function deleteAtPath<T extends object>(values: T, path: string): T {
  const segments = path.split('.');
  // Validate paths using the same rules as updates.
  setAtPath({}, path, null);
  const root = structuredClone(values);
  // SAFETY: configuration documents contain JSON objects; traversal narrows each child.
  let node = root as RawConfig;
  for (const segment of segments.slice(0, -1)) {
    const child = node[segment];
    if (!isObjectConfigValue(child)) return root;
    node = child;
  }
  delete node[segments.at(-1)!];
  return root;
}
