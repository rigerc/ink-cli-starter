#!/usr/bin/env node
import {render, renderToString} from 'ink';
import {executeCommand} from './commands';
import meow from 'meow';
import {App, PlainView, type AppOptions} from './app';
import {appConfig, resolveConfig, type Config} from './config';
import {ConfigSetup} from './demos/ConfigSetup';
import {InlineDemo} from './demos/InlineDemo';
import {APP_NAME, APP_THEME_ENV, loadConfig} from './lib/config';
import {AppError, toAppError} from './lib/errors';
import {logger} from './lib/logger';
import {isInteractive, noColor, supportsUnicode} from './lib/terminal';
import {isScreenId, screenIds} from './screens';
import {resolveThemeName} from './theme/resolve';

const cli = meow(
  `
  Usage
    $ ${APP_NAME} [options]
    $ ${APP_NAME} --setup [--config path]
    $ ${APP_NAME} tasks list [--json]
    $ ${APP_NAME} tasks add <title>
    $ ${APP_NAME} tasks complete <id>
    $ ${APP_NAME} doctor

  Options
    --theme <name>   dark | light | contrast | mono | auto
    --screen <id>    ${screenIds.join(' | ')}
    --ascii          Use ASCII symbols and borders
    --config <path>  Read/write a specific JSON configuration file
    --setup          Open the interactive configuration wizard
    --plain          Print once and exit (also the default when piped or in CI)
    --demo           Run the compact inline setup demo
    --debug          Write logs to a file and show stack traces
    --json           Emit machine-readable JSON for commands
    --data <path>    Override the tasks data file

  Environment
    NO_COLOR=1       Force the mono theme
    ${APP_THEME_ENV}    Default theme
    CLI_ASCII=1      Force ASCII symbols
`,
  {
    importMeta: import.meta,
    flags: {
      theme: {type: 'string'},
      screen: {type: 'string', default: 'home'},
      ascii: {type: 'boolean'},
      config: {type: 'string'},
      setup: {type: 'boolean'},
      plain: {type: 'boolean'},
      demo: {type: 'boolean'},
      debug: {type: 'boolean'},
      json: {type: 'boolean'},
      data: {type: 'string'},
    },
  },
);

async function main() {
  const {flags} = cli;
  logger.setDebug(Boolean(flags.debug));

  if (flags.setup && flags.demo)
    throw new AppError('--setup and --demo cannot be used together', {exitCode: 2});
  if (!isScreenId(flags.screen))
    throw new AppError(`Unknown screen "${flags.screen}"`, {
      exitCode: 2,
      hint: `Try one of: ${screenIds.join(', ')}`,
    });

  if (cli.input.length > 0) {
    if (flags.setup || flags.demo) throw new AppError('Commands cannot be combined with --setup or --demo', {exitCode: 2});
    executeCommand(cli.input, {json: Boolean(flags.json), dataFile: flags.data});
    return;
  }

  const {config, error} = loadConfig(flags.config);
  if (error) logger.error('config:', error);
  if (flags.setup && error)
    throw new AppError('Cannot edit invalid configuration', {hint: error, exitCode: 2});

  const configFlags: Partial<Config> = {
    theme: flags.theme && appConfig.fields[0]?.options?.some((item) => item.value === flags.theme)
      ? flags.theme as Config['theme']
      : undefined,
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
    dataFile: flags.data,
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
      renderToString(
        flags.demo ? <InlineDemo options={options} /> : <PlainView options={options} />,
        {columns: process.stdout.columns || 80},
      ),
    );
    return;
  }

  await render(
    flags.setup
      ? <ConfigSetup options={options} />
      : flags.demo
        ? <InlineDemo options={options} interactive />
        : <App options={options} />,
  ).waitUntilExit();
}

main().catch((error: unknown) => {
  const err = toAppError(error);
  console.error(`${err.message}${err.hint ? `\n${err.hint}` : ''}`);
  process.exit(err.exitCode);
});
