import {
  appConfig,
  createConfigStore,
  mergeConfig,
  rawConfigSchema,
  type Config,
  type ConfigRead,
} from '../config';
import {readNodeConfig} from '../config/node-config';
import {toErrorMessage} from './errors';

export type {Config} from '../config';

export const APP_NAME = 'ink-kit';
export const APP_THEME_ENV = `${APP_NAME.replaceAll('-', '_').toUpperCase()}_THEME`;

export const configStore = createConfigStore(appConfig, APP_NAME);

/** The writable XDG JSON document stays separate from node-config's deployment files. */
export const configPath = (override?: string): string => configStore.pathFor(override);

export function loadConfig(override?: string): ConfigRead<Config> {
  const saved = configStore.read(override);

  // An explicit --config file is authoritative, preserving the existing CLI contract.
  if (saved.error || override) return saved;

  try {
    // node-config applies default/deployment/host/local layering within NODE_CONFIG_DIR.
    // User-edited XDG settings take precedence over deployment files.
    const fromFiles = mergeConfig(readNodeConfig(), rawConfigSchema.parse(saved.config));

    // node-config's NODE_CONFIG JSON override takes precedence over saved settings.
    const fromEnvironment = process.env.NODE_CONFIG
      ? rawConfigSchema.parse(JSON.parse(process.env.NODE_CONFIG))
      : {};

    const config = configStore.validate(mergeConfig(fromFiles, fromEnvironment));

    return {...saved, config};
  } catch (cause) {
    return {...saved, error: `Could not resolve node-config settings: ${toErrorMessage(cause)}`};
  }
}

export function saveConfig(patch: Config, override?: string): void {
  configStore.write(patch, override);
}
