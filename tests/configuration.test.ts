import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vite-plus/test';
import {z} from 'zod';
import {
  appConfig,
  configFilePath,
  createConfigStore,
  defineConfig,
  getAtPath,
  mergeConfig,
  resolveConfig,
  setAtPath,
} from '../src/config';
import {withWorkspace, writeFixture} from './helpers/fixtures';

describe('configuration values and precedence', () => {
  it('resolves field values in flag > env > file > default order', () => {
    const fields = [
      {
        path: 'settings.level',
        label: 'Level',
        section: 'General',
        kind: 'number' as const,
        env: 'LEVEL',
        defaultValue: 1,
      },
    ];
    const file = {settings: {level: 2}};
    expect(resolveConfig(fields, file, {env: {LEVEL: '3'}})).toEqual({
      values: {settings: {level: 3}},
      sources: {'settings.level': 'environment'},
    });
    expect(
      resolveConfig(fields, file, {env: {LEVEL: '3'}, flags: {settings: {level: 4}}}).values,
    ).toEqual({
      settings: {level: 4},
    });
    expect(resolveConfig(fields, file, {env: {}}).sources['settings.level']).toBe('file');
    expect(resolveConfig(fields, {}, {env: {}}).values).toEqual({settings: {level: 1}});
    expect(resolveConfig(fields, file, {env: {LEVEL: 'not-a-number'}}).values).toEqual(file);
  });

  it('updates nested fields immutably and rejects unsafe paths', () => {
    const base = {settings: {level: 1, enabled: true}};
    const updated = setAtPath(base, 'settings.level', 7);
    expect(getAtPath(updated, 'settings.level')).toBe(7);
    expect(base.settings.level).toBe(1);
    for (const path of ['__proto__.polluted', 'settings.constructor', 'settings..level'])
      expect(() => setAtPath(base, path, 1)).toThrow('Invalid configuration path');
    expect(mergeConfig(base, {settings: {enabled: false}})).toEqual({
      settings: {level: 1, enabled: false},
    });
  });
});

describe('configuration persistence with isolated files', () => {
  it('leaves a missing file absent until explicitly saved', () =>
    withWorkspace((directory) => {
      const path = join(directory, 'settings.json');
      const store = createConfigStore(appConfig);
      expect(store.read(path).config).toEqual({});
      expect(store.write({label: 'Hello'}, path)).toMatchObject({version: 1, ascii: true});
      expect(JSON.parse(readFileSync(path, 'utf8'))).toMatchObject({version: 1, ascii: true});
      expect(configFilePath(path)).toBe(path);
    }));

  it('preserves extension keys and merges new fields into saved data', () =>
    withWorkspace((directory) => {
      const path = join(directory, 'custom.settings.json');
      const store = createConfigStore(appConfig);
      writeFixture(
        directory,
        'custom.settings.json',
        JSON.stringify({label: 'Saved', plugin: {cache: true, retries: 2}}),
      );
      store.write({label: 'Hello'}, path);
      expect(store.read(path).config).toMatchObject({
        label: 'Hello',
        plugin: {cache: true, retries: 2},
      });
    }));

  it.each([
    '{broken json',
    '[]',
    '{"label":17}',
    '{"version":999}',
    '{"plugin":{"value":1e400}}',
  ])('never overwrites invalid configuration: %s', (contents) =>
    withWorkspace((directory) => {
      const path = join(directory, 'settings.json');
      writeFixture(directory, 'settings.json', contents);
      const store = createConfigStore(appConfig);
      expect(store.read(path).error).toBeTruthy();
      expect(() => store.write({label: 'Hello'}, path)).toThrow();
      expect(readFileSync(path, 'utf8')).toBe(contents);
    }),
  );

  it('applies migrations in memory and persists the new version only on save', () =>
    withWorkspace((directory) => {
      const path = join(directory, 'settings.json');
      const store = createConfigStore(
        defineConfig({
          version: 2,
          schema: z.looseObject({version: z.number().optional(), name: z.string().optional()}),
          fields: [],
          migrations: {
            0: (raw) => ({...raw, name: typeof raw.legacy === 'string' ? raw.legacy : ''}),
            1: (raw) => raw,
          },
        }),
      );
      const original = JSON.stringify({legacy: 'old'});
      writeFixture(directory, 'settings.json', original);
      expect(store.read(path).config.name).toBe('old');
      expect(readFileSync(path, 'utf8')).toBe(original);
      store.write({name: 'new'}, path);
      expect(JSON.parse(readFileSync(path, 'utf8'))).toMatchObject({version: 2, name: 'new'});
    }));
});
