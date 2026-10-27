import {z} from 'zod';
import {inspectEnvironment} from './doctor';
import {defineCommand} from './definition';
import {configCommand} from './config';
import {exampleCommand} from './example';
import {completionCommand} from './completion';
export {defineCommand, defineCommandGroup} from './definition';
export type {CommandContext, RegisteredCommand} from './definition';

export const commands = [
  defineCommand({
    name: 'doctor',
    description: 'Inspect the runtime environment and configuration',
    schema: z.object({}),
    run: ({context}) => {
      const report = inspectEnvironment(context.flags.config);
      context.output(
        context.flags.json
          ? JSON.stringify(report, null, 2)
          : report.checks
              .map((check) => `${check.ok ? 'OK' : 'FAIL'}  ${check.name}: ${check.detail}`)
              .join('\n'),
      );
      if (!report.ok) process.exitCode = 1;
    },
  }),
  configCommand,
  exampleCommand,
  completionCommand,
] as const;
