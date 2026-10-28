#!/usr/bin/env node
import {CommanderError} from '@commander-js/extra-typings';
import {z} from 'zod';
import {createProgram} from './lib/program';
import {APP_NAME} from './lib/identity';
import {AppError, toAppError} from './lib/errors';
import {logger} from './lib/logger';

const controller = new AbortController();
let signalExitCode: 130 | 143 | undefined;
const interrupt = () => {
  logger.debug('Received SIGINT');
  signalExitCode = 130;
  process.exitCode = 130;
  controller.abort();
};
const terminate = () => {
  logger.debug('Received SIGTERM');
  signalExitCode = 143;
  process.exitCode = 143;
  controller.abort();
};
process.on('SIGINT', interrupt);
process.on('SIGTERM', terminate);
const program = createProgram(controller.signal);
program.action(async () => {
  if (program.args.length)
    throw new AppError(`Unknown command "${program.args[0]}"`, {
      exitCode: 2,
      hint: `Run ${APP_NAME} --help for available commands.`,
    });
  const {runApp} = await import('./lib/render-app');
  await runApp(program.opts(), controller.signal, interrupt);
});
try {
  await program.parseAsync(process.argv);
} catch (cause: unknown) {
  if (cause instanceof CommanderError) {
    // A Commander exit must not overwrite SIGINT/SIGTERM's conventional exit status.
    if (!controller.signal.aborted) process.exitCode = cause.exitCode === 0 ? 0 : 2;
  } else if (!controller.signal.aborted) {
    const error =
      cause instanceof z.ZodError
        ? new AppError(
            cause.issues
              .map((issue) => `${issue.path.join('.') || 'value'}: ${issue.message}`)
              .join('; '),
            {exitCode: 2, cause},
          )
        : toAppError(cause);
    logger.error(cause);
    console.error(
      `${program.opts().debug ? (error.stack ?? error.message) : error.message}${error.hint ? `\n${error.hint}` : ''}`,
    );
    process.exitCode = error.exitCode;
  }
} finally {
  process.off('SIGINT', interrupt);
  process.off('SIGTERM', terminate);
  // Ink or Commander may finish with exit code zero during signal cleanup.
  // A delivered process interrupt must retain its conventional shell status.
  if (signalExitCode !== undefined) process.exitCode = signalExitCode;
  logger.debug('Exit', process.exitCode);
  logger.close();
}
