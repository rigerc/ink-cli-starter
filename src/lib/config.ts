import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {dirname, join} from 'node:path';
import {z} from 'zod';
import {themeNames} from '../theme/tokens';

export const APP_NAME = 'ink-kit';

const schema = z.object({
  theme: z.enum(themeNames).optional(),
  ascii: z.boolean().optional(),
});
export type Config = z.infer<typeof schema>;

export const configPath = (): string =>
  join(process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config'), APP_NAME, 'config.json');

export function loadConfig(): {config: Config; error?: string} {
  try {
    const parsed = schema.safeParse(JSON.parse(readFileSync(configPath(), 'utf8')));
    if (parsed.success) return {config: parsed.data};
    const error = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return {config: {}, error};
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {config: {}};
    return {config: {}, error: (error as Error).message};
  }
}

export function saveConfig(patch: Config): void {
  const next = {...loadConfig().config, ...patch};
  mkdirSync(dirname(configPath()), {recursive: true});
  writeFileSync(configPath(), JSON.stringify(next, null, 2) + '\n');
}
