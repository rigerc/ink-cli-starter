import {themeNames, type ThemeName} from './tokens';
import defaults from './defaults.json';

export const isThemeName = (value: unknown): value is ThemeName =>
  themeNames.some((name) => name === value);

/** Project-level default; 'auto' retains the original terminal detection behavior. */
const requestedDefault = defaults.defaultTheme;

export const defaultTheme: ThemeName | 'auto' =
  requestedDefault === 'auto'
    ? 'auto'
    : isThemeName(requestedDefault)
      ? requestedDefault
      : (() => {
          throw new Error('Invalid theme default in src/theme/defaults.json');
        })();

/** Best-effort light/dark detection. COLORFGBG is "fg;bg" in many terminals. */
function detectScheme(): ThemeName {
  const bg = process.env.COLORFGBG?.split(';').pop();

  return bg === '7' || bg === '15' ? 'light' : 'dark';
}

/** Order: NO_COLOR > --theme flag > env var > config file > project default > autodetect. */
export function resolveThemeName(input: {
  flag?: string | undefined;
  env?: string | undefined;
  config?: string | undefined;
  noColor: boolean;
}): ThemeName {
  if (input.noColor) return 'mono';

  for (const candidate of [input.flag, input.env, input.config]) {
    if (candidate === 'auto') return detectScheme();

    if (isThemeName(candidate)) return candidate;
  }

  return defaultTheme === 'auto' ? detectScheme() : defaultTheme;
}
