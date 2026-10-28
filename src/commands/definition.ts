import {Command, Option, type CommandUnknownOpts} from '@commander-js/extra-typings';
import {z} from 'zod';
import {AppError} from '../lib/errors';

export const globalOptions = z.object({
  config: z.string().optional(),
  json: z.boolean().optional(),
  debug: z.boolean().optional(),
  quiet: z.boolean().optional(),
  verbose: z.boolean().optional(),
  color: z.boolean().optional(),
  plain: z.boolean().optional(),
});
export type GlobalOptions = z.infer<typeof globalOptions>;
export interface CommandContext {
  flags: GlobalOptions;
  signal: AbortSignal;
  output: (value: string) => void;
  notice: (value: string) => void;
}
export interface CommandOption {
  flags: string;
  description: string;
  choices?: readonly string[];
}
export interface RegisteredCommand {
  name: string;
  register: (parent: CommandUnknownOpts, context: () => CommandContext) => void;
}

/** Keep typed validation and behavior together; the adapter handles Commander wiring. */
export function defineCommand<const N extends string, S extends z.ZodType>(definition: {
  name: N;
  description: string;
  arguments?: string;
  argumentChoices?: readonly string[];
  options?: readonly CommandOption[];
  schema: S;
  run: (input: {
    args: string[];
    options: z.output<S>;
    context: CommandContext;
    command: CommandUnknownOpts;
  }) => void | Promise<void>;
}): RegisteredCommand & {name: N} {
  return {
    name: definition.name,
    register(parent, context) {
      const command = new Command(definition.name)
        .copyInheritedSettings(parent)
        .description(definition.description)
        .allowExcessArguments(false);
      if (definition.arguments) command.arguments(definition.arguments);
      if (definition.argumentChoices)
        command.registeredArguments[0]?.choices([...definition.argumentChoices]);
      for (const option of definition.options ?? []) {
        const flag = new Option(option.flags, option.description);
        if (option.choices) flag.choices([...option.choices]);
        command.addOption(flag);
      }
      command.action(async () => {
        const options = definition.schema.parse(command.optsWithGlobals());
        await definition.run({args: command.args, options, context: context(), command});
      });
      parent.addCommand(command);
    },
  };
}

export function defineCommandGroup(definition: {
  name: string;
  description: string;
  commands: readonly RegisteredCommand[];
}): RegisteredCommand {
  return {
    name: definition.name,
    register(parent, context) {
      const group = new Command(definition.name)
        .copyInheritedSettings(parent)
        .description(definition.description);
      for (const child of definition.commands) child.register(group, context);
      group.action(() => {
        // A bare group invocation completes no operation: print help but exit non-zero
        // so scripted consumers cannot mistake a help dump for success.
        group.outputHelp();
        throw new AppError(`Missing ${definition.name} subcommand`, {exitCode: 2});
      });
      parent.addCommand(group);
    },
  };
}
