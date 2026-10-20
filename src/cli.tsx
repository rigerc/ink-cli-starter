#!/usr/bin/env node
import {render, renderToString} from 'ink';
import meow from 'meow';
import {App, PlainView, type AppOptions} from './app';
import {loadConfig} from './lib/config';
import {AppError, toAppError} from './lib/errors';
import {logger} from './lib/logger';
import {isInteractive, noColor, supportsUnicode} from './lib/terminal';
import {isScreenId, screenIds} from './screens';
import {resolveThemeName} from './theme/resolve';

const cli = meow(
  `
  Usage
    $ ink-kit [options]

  Options
    --theme <name>   dark | light | contrast | mono
    --screen <id>    ${screenIds.join(' | ')}
    --ascii          Use ASCII symbols and borders
    --plain          Print once and exit (also the default when piped or in CI)
    --debug          Write logs to a file and show stack traces

  Environment
    NO_COLOR=1       Force the mono theme
    INK_KIT_THEME    Default theme
    CLI_ASCII=1      Force ASCII symbols
`,
  {
    importMeta: import.meta,
    flags: {
      theme: {type: 'string'},
      screen: {type: 'string', default: 'home'},
      ascii: {type: 'boolean'},
      plain: {type: 'boolean'},
      debug: {type: 'boolean'},
    },
  },
);

async function main() {
  const {flags} = cli;
  logger.setDebug(Boolean(flags.debug));

  if (!isScreenId(flags.screen)) {
    throw new AppError(`Unknown screen "${flags.screen}"`, {exitCode: 2, hint: `Try one of: ${screenIds.join(', ')}`});
  }

  const {config, error} = loadConfig();
  if (error) logger.error('config:', error);

  const options: AppOptions = {
    theme: resolveThemeName({flag: flags.theme, env: process.env.INK_KIT_THEME, config: config.theme, noColor: noColor()}),
    ascii: flags.ascii ?? config.ascii ?? !supportsUnicode(),
    debug: Boolean(flags.debug),
    screen: flags.screen,
  };
  logger.debug('options', options);

  if (flags.plain || !isInteractive()) {
    console.log(renderToString(<PlainView options={options} />, {columns: process.stdout.columns || 80}));
    return;
  }

  await render(<App options={options} />).waitUntilExit();
}

main().catch((error: unknown) => {
  const err = toAppError(error);
  console.error(`${err.message}${err.hint ? `\n${err.hint}` : ''}`);
  process.exit(err.exitCode);
});
