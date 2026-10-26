import {Load} from 'config/lib/util.js';
import {rawConfigSchema} from './store';
import type {RawConfig} from './definition';

/**
 * Read node-config deployment layers independently for every load.
 * Using Load avoids the singleton's startup warnings and supports tests and
 * CLI sessions that choose a different NODE_CONFIG_DIR after module import.
 */
export function readNodeConfig(): RawConfig {
  const loader = Load.fromEnvironment();
  loader.scan();

  return rawConfigSchema.parse(loader.config);
}
