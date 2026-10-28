import {z} from 'zod';
import {
  appConfig,
  getAtPath,
  setAtPath,
  resolveConfig,
  type ConfigField,
  type ConfigValue,
  type RawConfig,
} from '../config';
import {configStore} from '../lib/config';
import {AppError} from '../lib/errors';
import {readInput} from '../lib/input';
import {defineCommand, defineCommandGroup, type CommandContext} from './definition';

const readOptions = z.object({stored: z.boolean().optional()});
const emptyOptions = z.object({});
function fieldFor(key: string): ConfigField {
  const field = appConfig.fields.find((entry) => entry.path === key);
  if (!field) throw new AppError(`Unknown configuration key "${key}"`, {exitCode: 2});
  return field;
}
function readStored(context: CommandContext) {
  const result = configStore.read(context.flags.config);
  if (result.error) throw new AppError(result.error, {exitCode: 2});
  return result.config;
}
function readValues(context: CommandContext, stored: boolean) {
  const config = readStored(context);
  if (stored)
    return {
      values: config,
      sources: Object.fromEntries(appConfig.fields.map((field) => [field.path, 'file'])),
    };
  return resolveConfig(appConfig.fields, config);
}
function parseValue(field: ConfigField, raw: string): ConfigValue {
  if (field.kind === 'text' || field.kind === 'select') return raw;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (field.kind === 'toggle') return z.boolean().parse(parsed);
    if (field.kind === 'number') return z.number().finite().parse(parsed);
    return z.array(z.string()).parse(parsed);
  } catch {
    throw new AppError(`Invalid ${field.kind} value for ${field.path}`, {exitCode: 2});
  }
}
export const configCommand = defineCommandGroup({
  name: 'config',
  description: 'Inspect and edit validated settings without a terminal',
  commands: [
    defineCommand({
      name: 'path',
      description: 'Print the selected configuration file path',
      schema: emptyOptions,
      run: ({context}) =>
        context.output(
          context.flags.json
            ? JSON.stringify({path: configStore.pathFor(context.flags.config)})
            : configStore.pathFor(context.flags.config),
        ),
    }),
    defineCommand({
      name: 'get',
      description: 'Read one effective value (or its stored override)',
      arguments: '<key>',
      argumentChoices: appConfig.fields.map((field) => field.path),
      options: [{flags: '--stored', description: 'Read only the saved override'}],
      schema: readOptions,
      run: ({args, options, context}) => {
        const field = fieldFor(args[0]!);
        const {values, sources} = readValues(context, Boolean(options.stored));
        // SAFETY: the store has validated all values as JSON.
        const value = getAtPath(values as RawConfig, field.path);
        context.output(
          context.flags.json
            ? JSON.stringify({
                key: field.path,
                value: value ?? null,
                source: value === undefined ? 'unset' : sources[field.path],
              })
            : value === undefined
              ? ''
              : typeof value === 'string'
                ? value
                : JSON.stringify(value),
        );
      },
    }),
    defineCommand({
      name: 'list',
      description: 'List registered values and their sources',
      options: [{flags: '--stored', description: 'Read only saved overrides'}],
      schema: readOptions,
      run: ({options, context}) => {
        const {values, sources} = readValues(context, Boolean(options.stored));
        const entries = appConfig.fields.map((field) => {
          // SAFETY: the store has validated all values as JSON.
          const value = getAtPath(values as RawConfig, field.path);
          return {
            key: field.path,
            value: value ?? null,
            source: value === undefined ? 'unset' : sources[field.path],
          };
        });
        context.output(
          context.flags.json
            ? JSON.stringify(entries, null, 2)
            : entries
                .map((entry) => `${entry.key} = ${JSON.stringify(entry.value)} (${entry.source})`)
                .join('\n'),
        );
      },
    }),
    defineCommand({
      name: 'set',
      description: 'Validate and save an override; use - for stdin',
      arguments: '<key> <value>',
      argumentChoices: appConfig.fields.map((field) => field.path),
      schema: emptyOptions,
      run: async ({args, context}) => {
        const field = fieldFor(args[0]!);
        const raw = args[1] === '-' ? (await readInput(context.signal)).trimEnd() : args[1]!;
        const value = parseValue(field, raw);
        try {
          configStore.write(setAtPath({}, field.path, value), context.flags.config);
        } catch (cause) {
          throw new AppError(cause instanceof Error ? cause.message : String(cause), {
            exitCode: 2,
            cause,
          });
        }
        if (context.flags.json)
          context.output(
            JSON.stringify({
              key: field.path,
              value,
              path: configStore.pathFor(context.flags.config),
            }),
          );
        else context.notice(`Saved ${field.path}`);
      },
    }),
    defineCommand({
      name: 'reset',
      description: 'Remove one or all registered overrides, preserving extension keys',
      arguments: '[key]',
      argumentChoices: appConfig.fields.map((field) => field.path),
      schema: emptyOptions,
      run: ({args, context}) => {
        const paths = args[0]
          ? [fieldFor(args[0]).path]
          : appConfig.fields.map((field) => field.path);
        try {
          configStore.reset(paths, context.flags.config);
        } catch (cause) {
          throw new AppError(cause instanceof Error ? cause.message : String(cause), {
            exitCode: 2,
            cause,
          });
        }
        if (context.flags.json)
          context.output(
            JSON.stringify({reset: paths, path: configStore.pathFor(context.flags.config)}),
          );
        else context.notice('Configuration overrides reset');
      },
    }),
  ],
});
