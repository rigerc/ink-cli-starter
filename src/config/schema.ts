import {z} from 'zod';
import {themeNames} from '../theme/tokens';
import {defineConfig} from './definition';

/** Loose parsing retains application-specific extension keys during edits. */
export const configSchema = z.looseObject({
  version: z.number().int().positive().optional(),
  theme: z.enum(['auto', ...themeNames]).optional(),
  ascii: z.boolean().optional(),
});

export type Config = z.infer<typeof configSchema>;

export const appConfig = defineConfig({
  schema: configSchema,
  version: 1,
  fields: [
    {
      path: 'theme',
      label: 'Terminal theme',
      section: 'Appearance',
      kind: 'select',
      description: 'Auto detects light/dark; NO_COLOR always forces mono.',
      defaultValue: 'auto',
      env: 'INK_KIT_THEME',
      options: [
        {value: 'auto', label: 'Auto (terminal default)'},
        ...themeNames.map((value) => ({value, label: value})),
      ],
    },
    {
      path: 'ascii',
      label: 'ASCII symbols',
      section: 'Appearance',
      kind: 'toggle',
      description: 'Use ASCII-only symbols and borders.',
      defaultValue: false,
      env: 'CLI_ASCII',
    },
  ],
});
