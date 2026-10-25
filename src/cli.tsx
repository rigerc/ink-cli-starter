#!/usr/bin/env node
import {render, renderToString} from 'ink';
import {Command} from '@commander-js/extra-typings';
import packageJson from '../package.json' with {type: 'json'};
import {App, PlainView, type AppOptions} from './app';
import {runCommand} from './commands';
import {appConfig, resolveConfig, type Config} from './config';
import {ConfigSetup} from './demos/ConfigSetup';
import {APP_NAME, APP_THEME_ENV, loadConfig} from './lib/config';
import {AppError, toAppError} from './lib/errors';
import {logger} from './lib/logger';
import {isInteractive, noColor, supportsUnicode} from './lib/terminal';
import {isScreenId, screenIds} from './screens';
import {isThemeName, resolveThemeName} from './theme/resolve';

const program = new Command()
  .name(APP_NAME)
  .allowExcessArguments()
  .description('Interactive terminal application with headless diagnostics')
  .version(packageJson.version)
  .option('--theme <name>', 'Theme: dark, light, contrast, mono, or auto')
  .option('--screen <id>', `Initial screen: ${screenIds.join(', ')}`, 'home')
  .option('--ascii', 'Use ASCII symbols and borders')
  .option('--config <path>', 'Read/write a specific JSON configuration file')
  .option('--setup', 'Open the interactive configuration wizard')
  .option('--plain', 'Print once and exit (default when piped or in CI)')
  .option('--json', 'JSON output for headless commands (doctor)')
  .option('--debug', 'Write logs to a file and show stack traces')
  .addHelpText(
    'after',
    `\nEnvironment:
  NO_COLOR=1       Force the mono theme
  ${APP_THEME_ENV}=...  Default theme
  CLI_ASCII=1      Force ASCII symbols\n`,
  );

async function runApp(flags: ReturnType<typeof program.opts>) {
  logger.setDebug(Boolean(flags.debug));

  if (flags.json)
    throw new AppError('--json requires a headless subcommand (e.g. doctor)', {exitCode: 2});

  if (!isScreenId(flags.screen))
    throw new AppError(`Unknown screen "${flags.screen}"`, {
      exitCode: 2,
      hint: `Try one of: ${screenIds.join(', ')}`,
    });

  const {config, error} = loadConfig(flags.config);

  if (error) logger.error('config:', error);

  if (flags.setup && error)
    throw new AppError('Cannot edit invalid configuration', {hint: error, exitCode: 2});

  const configFlags: Partial<Config> = {
    theme: flags.theme === 'auto' || isThemeName(flags.theme) ? flags.theme : undefined,
    ascii: flags.ascii ? true : undefined,
  };

  const resolved = resolveConfig(appConfig.fields, config, {flags: configFlags});

  const options: AppOptions = {
    theme: resolveThemeName({
      flag: flags.theme,
      env: process.env[APP_THEME_ENV],
      config: config.theme,
      noColor: noColor(),
    }),
    ascii: resolved.values.ascii ?? !supportsUnicode(),
    debug: Boolean(flags.debug),
    screen: flags.screen,
    configFile: flags.config,
    configFlags,
  };

  logger.debug('options', options);

  if (flags.setup && (flags.plain || !isInteractive()))
    throw new AppError('Configuration wizard requires an interactive terminal', {
      exitCode: 2,
      hint: `Run ${APP_NAME} --setup in a TTY, or edit the JSON config directly.`,
    });

  if (flags.plain || !isInteractive()) {
    console.log(
      renderToString(<PlainView options={options} />, {
        columns: process.stdout.columns || 80,
      }),
    );

    return;
  }

  await render(
    flags.setup ? <ConfigSetup options={options} /> : <App options={options} />,
  ).waitUntilExit();
}

program
  .command('doctor')
  .allowExcessArguments(false)
  .description('Inspect the runtime environment and configuration')
  .option('--json', 'Print the diagnostic report as JSON')
  .option('--config <path>', 'Use a specific JSON configuration file')
  .action((options) => {
    const flags = program.opts();
    logger.setDebug(Boolean(flags.debug));

    if (flags.setup || flags.plain)
      throw new AppError('Subcommands cannot be combined with --setup or --plain', {exitCode: 2});

    runCommand('doctor', [], {
      configFile: options.config ?? flags.config,
      json: Boolean(options.json || flags.json),
    });
  });

program.action(async () => {
  if (program.args.length > 0)
    throw new AppError(`Unknown command "${program.args[0]}"`, {
      exitCode: 2,
      hint: `Run ${APP_NAME} --help for available commands.`,
    });

  await runApp(program.opts());
});

program.parseAsync(process.argv).catch((cause: unknown) => {
  const err = toAppError(cause);
  console.error(`${err.message}${err.hint ? `\n${err.hint}` : ''}`);
  process.exitCode = err.exitCode;
});
