import {useState} from 'react';
import {appConfig, getAtPath, setAtPath, type ConfigValue, type RawConfig} from '../config';
import {configStore, loadConfig, type Config} from '../lib/config';
import {toErrorMessage} from '../lib/errors';

/** Reusable transactional draft: no file changes until save(). */
export function useConfigDraft(path?: string) {
  const [loaded, setLoaded] = useState(() => loadConfig(path));
  const [draft, setDraft] = useState<Config>(loaded.config);
  const [error, setError] = useState(loaded.error);

  const update = (fieldPath: string, value: ConfigValue) => {
    setDraft((current) => setAtPath(current, fieldPath, value));
    setError(undefined);
  };

  const discard = () => {
    setDraft(loaded.config);
    setError(loaded.error);
  };

  const save = () => {
    if (loaded.error) throw new Error(loaded.error);

    try {
      // Only edited fields are persisted; project/deployment config stays read-only.
      let patch: Config = {};

      for (const field of appConfig.fields) {
        const before = getAtPath(loaded.config as RawConfig, field.path);
        const after = getAtPath(draft as RawConfig, field.path);

        if (after !== undefined && JSON.stringify(before) !== JSON.stringify(after)) {
          patch = setAtPath(patch, field.path, after);
        }
      }

      configStore.write(patch, path);
      const result = loadConfig(path);

      if (result.error) throw new Error(result.error);
      setLoaded(result);
      setDraft(result.config);
      setError(undefined);

      return result.config;
    } catch (cause) {
      setError(toErrorMessage(cause));
      throw cause;
    }
  };

  const changed = JSON.stringify(draft) !== JSON.stringify(loaded.config);

  return {
    draft,
    update,
    discard,
    save,
    changed,
    error,
    path: loaded.path,
    get: (field: string) => {
      // SAFETY: the schema-validated draft is treated as a RawConfig document for path lookups.
      return getAtPath(draft as RawConfig, field);
    },
  };
}
