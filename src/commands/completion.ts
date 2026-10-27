import {z} from 'zod';
import {generateCompletion} from '../lib/completion';
import {defineCommand} from './definition';

export const completionCommand = defineCommand({
  name: 'completion',
  description: 'Generate a Bash, Zsh, or Fish completion script',
  arguments: '<shell>',
  argumentChoices: ['bash', 'zsh', 'fish'],
  schema: z.object({}),
  run: ({args, context, command}) => {
    const shell = z.enum(['bash', 'zsh', 'fish']).parse(args[0]);
    let root = command;
    while (root.parent) root = root.parent;
    const script = generateCompletion(root, shell);
    context.output(context.flags.json ? JSON.stringify({shell, script}) : script);
  },
});
