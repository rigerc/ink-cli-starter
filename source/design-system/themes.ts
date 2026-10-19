import { createTheme } from "../providers/theme-provider.js";
import { defaultTheme } from "../lib/terminal-themes/default.js";

export const oceanTheme = createTheme({
  name: "ocean",
  colors: {
    ...defaultTheme.colors,
    primary: "#67E8F9",
    primaryForeground: "#082F49",
    secondary: "#94A3B8",
    accent: "#A78BFA",
    accentForeground: "#0F172A",
    foreground: "#F8FAFC",
    mutedForeground: "#CBD5E1",
    border: "#64748B",
    focusRing: "#67E8F9",
    selection: "#164E63",
    selectionForeground: "#FFFFFF",
    success: "#4ADE80",
    warning: "#FACC15",
    error: "#FB7185",
    info: "#7DD3FC",
    background: "#0B1220",
  },
  border: {style: "round", color: "#64748B", focusColor: "#67E8F9"},
});

export const monoTheme = createTheme({
  name: "mono",
  colors: {
    ...defaultTheme.colors,
    primary: "#FFFFFF",
    primaryForeground: "#000000",
    secondary: "#BBBBBB",
    accent: "#FFFFFF",
    accentForeground: "#000000",
    foreground: "#FFFFFF",
    mutedForeground: "#DDDDDD",
    border: "#CCCCCC",
    focusRing: "#FFFFFF",
    selection: "#333333",
    selectionForeground: "#FFFFFF",
    success: "#FFFFFF",
    warning: "#FFFFFF",
    error: "#FFFFFF",
    info: "#FFFFFF",
    background: "#000000",
  },
  border: {style: "single", color: "#CCCCCC", focusColor: "#FFFFFF"},
});
export const themes = {ocean: oceanTheme, mono: monoTheme} as const;
export type ThemeName = keyof typeof themes;
