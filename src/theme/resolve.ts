import {themeNames, type ThemeName} from './tokens';

export const isThemeName = (value: unknown): value is ThemeName =>
  typeof value === 'string' && (themeNames as readonly string[]).includes(value);

/** Best-effort light/dark detection. COLORFGBG is "fg;bg" in many terminals. */
function detectScheme(): ThemeName {
  const bg = process.env.COLORFGBG?.split(';').pop();
  return bg === '7' || bg === '15' ? 'light' : 'dark';
}

/** Order: NO_COLOR > --theme flag > env var > config file > autodetect. */
export function resolveThemeName(input: {
  flag?: string | undefined;
  env?: string | undefined;
  config?: string | undefined;
  noColor: boolean;
}): ThemeName {
  if (input.noColor) return 'mono';
  for (const candidate of [input.flag, input.env, input.config]) {
    if (isThemeName(candidate)) return candidate;
  }
  return detectScheme();
}
