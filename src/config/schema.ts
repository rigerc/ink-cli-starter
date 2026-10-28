import {z} from 'zod';
import pkg from '../../package.json' with {type: 'json'};
import {APP_ENV_PREFIX} from '../lib/identity';
import {defineConfig} from './definition';

/** A single example setting; extend the schema only as your CLI needs it. */
export const configSchema = z.looseObject({
  version: z.number().int().positive().optional(),
  label: z.string().min(1).optional(),
});

export type Config = z.infer<typeof configSchema>;

export const appConfig = defineConfig({
  schema: configSchema,
  version: 1,
  fields: [
    {
      path: 'label',
      label: 'Display label',
      section: 'General',
      kind: 'text',
      description: 'Text shown by the Ink application.',
      defaultValue: pkg.name,
      env: `${APP_ENV_PREFIX}_LABEL`,
    },
  ],
});
