import {homedir} from 'node:os';
import {isAbsolute, join, resolve} from 'node:path';
import pkg from '../../package.json';

/** XDG data storage is separate from user-editable configuration. */
export function dataFilePath(override?: string, appName = pkg.name): string {
  if (override) return resolve(override);
  const xdg = process.env.XDG_DATA_HOME;
  const base = xdg ? (isAbsolute(xdg) ? xdg : resolve(xdg)) : join(homedir(), '.local', 'share');
  return join(base, appName, 'tasks.json');
}
