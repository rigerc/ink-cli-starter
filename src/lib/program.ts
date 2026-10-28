import {Command} from '@commander-js/extra-typings';
import pkg from '../../package.json' with {type: 'json'};
import {commands} from '../commands';
import {globalOptions, type CommandContext} from '../commands/definition';
import {APP_ENV_PREFIX, APP_NAME} from './identity';
import {AppError} from './errors';
import {logger} from './logger';

function environmentHelp(entries: readonly [string, string][]) {
  const width = Math.max(...entries.map(([name]) => name.length));
  return `\nEnvironment:\n${entries.map(([name, description]) => `  ${name.padEnd(width)}  ${description}`).join('\n')}\n`;
}

export function createProgram(signal: AbortSignal) {
  const program = new Command()
    .exitOverride()
    .name(APP_NAME)
    .description(pkg.description)
    .version(pkg.version)
    .allowExcessArguments()
    .option('--config <path>', 'Use a specific JSON configuration file')
    .option('--plain', 'Print one Ink frame and exit (automatic when piped or in CI)')
    .option('--json', 'JSON output for headless commands')
    .option('--debug', 'Write debug logs and show stack traces')
    .option('--quiet', 'Suppress progress and success notices; retain results and errors')
    .option('--verbose', 'Enable diagnostic notices and informational logs')
    .option('--no-color', 'Disable terminal colors')
    .option('--screen-reader', 'Enable Ink screen-reader output')
    .option('--alternate-screen', 'Use the alternate terminal screen buffer')
    .addHelpText(
      'after',
      environmentHelp([
        ['NO_COLOR', 'Disable terminal colors'],
        [`${APP_ENV_PREFIX}_LABEL`, 'Default display label'],
        ['INK_SCREEN_READER', 'Set to true for screen-reader output'],
        [`${APP_ENV_PREFIX}_UPDATE_NOTIFIER`, 'Opt in to update checks'],
        ['NO_UPDATE_NOTIFIER', 'Opt out of update checks'],
      ]),
    );

  const context = (): CommandContext => {
    const flags = globalOptions.parse(program.opts());
    return {
      flags,
      signal,
      output: (value) => process.stdout.write(`${value}\n`),
      notice: (value) => {
        if (!flags.quiet && !flags.json) process.stderr.write(`${value}\n`);
      },
    };
  };

  program.hook('preAction', (_root, action) => {
    const flags = context().flags;
    logger.setLevel(flags.debug ? 'debug' : flags.verbose ? 'info' : 'error');
    if (flags.quiet && flags.verbose)
      throw new AppError('--quiet and --verbose cannot be combined', {exitCode: 2});
    if (flags.color === false) process.env.NO_COLOR = '1';
    if (action !== program && flags.plain)
      throw new AppError('Subcommands cannot be combined with --plain', {exitCode: 2});
    if (flags.verbose) context().notice(`Using ${APP_NAME} ${pkg.version}`);
  });
  for (const command of commands) command.register(program, context);
  return program;
}
