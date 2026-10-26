import {createContext, useCallback, useContext, useMemo, useState, type ReactNode} from 'react';
import {supportsUnicode} from '../lib/terminal';
import {applyGlyphs, themes} from './themes';
import {type Theme, type Tone} from './tokens';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (name: string) => void;
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: themes.dark,
  setTheme() {},
  cycleTheme() {},
});

export function ThemeProvider({
  name = 'dark',
  ascii = !supportsUnicode(),
  registry,
  children,
}: {
  name?: string;
  ascii?: boolean;
  /** Extend or override the built-in themes without editing theme source. */
  registry?: Readonly<Record<string, Theme>>;
  children: ReactNode;
}) {
  const available = useMemo(() => ({...themes, ...registry}), [registry]);
  const names = Object.keys(available);
  const [current, setCurrent] = useState(name);
  const theme = useMemo(
    () => applyGlyphs(available[current] ?? themes.dark, ascii),
    [available, current, ascii],
  );

  const cycleTheme = useCallback(
    () => setCurrent((c) => names[(names.indexOf(c) + 1) % names.length]!),
    [names.join('|')],
  );

  const value = useMemo(() => ({theme, setTheme: setCurrent, cycleTheme}), [theme, cycleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = (): Theme => useContext(ThemeContext).theme;
export const useThemeControls = () => useContext(ThemeContext);

/** Text props for a tone. Muted falls back to dim in mono mode. */
export interface ToneStyle {
  color: string | undefined;
  dimColor: boolean;
}

export function useTone(tone: Tone): ToneStyle {
  const t = useTheme();

  return {color: t.color[tone], dimColor: t.mono && tone === 'muted'};
}
