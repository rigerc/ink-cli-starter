import {appConfig, createConfigStore, type Config} from '../config';

export type {Config} from '../config';

import {APP_NAME} from './identity';
export {APP_NAME, APP_THEME_ENV, APP_ASCII_ENV} from './identity';

export const configStore = createConfigStore(appConfig, APP_NAME);

/** Compatibility facade: callers can optionally provide an explicit JSON file path. */
export const configPath = (override?: string): string => configStore.pathFor(override);
export const loadConfig = (override?: string) => configStore.read(override);

export function saveConfig(patch: Config, override?: string): void {
  configStore.write(patch, override);
}
