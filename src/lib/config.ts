import {appConfig, createConfigStore, type Config} from '../config';
import {APP_NAME} from './identity';

export type {Config} from '../config';
export {APP_NAME} from './identity';

export const configStore = createConfigStore(appConfig, APP_NAME);
export const configPath = (override?: string): string => configStore.pathFor(override);
export const loadConfig = (override?: string) => configStore.read(override);

export function saveConfig(patch: Config, override?: string): void {
  configStore.write(patch, override);
}
