// Termcn (MIT) · https://github.com/shadcn-labs/termcn
import { BASE_NAMES } from "@/registry/bases";
import type { BaseName } from "@/registry/bases";
import type { Theme as InkTheme } from "../../components/ui/types.js";

import { amoledTheme } from "./amoled.js";
import { auraTheme } from "./aura.js";
import { ayuTheme } from "./ayu.js";
import { carbonfoxTheme } from "./carbonfox.js";
import { catppuccinTheme } from "./catppuccin.js";
import { catppuccinFrappeTheme } from "./catppuccin-frappe.js";
import { catppuccinMacchiatoTheme } from "./catppuccin-macchiato.js";
import { cobalt2Theme } from "./cobalt2.js";
import { cursorTheme } from "./cursor.js";
import { defaultTheme } from "./default.js";
import { draculaTheme } from "./dracula.js";
import { everforestTheme } from "./everforest.js";
import { flexokiTheme } from "./flexoki.js";
import { githubTheme } from "./github.js";
import { gruvboxTheme } from "./gruvbox.js";
import { highContrastTheme } from "./high-contrast.js";
import { highContrastLightTheme } from "./high-contrast-light.js";
import { kanagawaTheme } from "./kanagawa.js";
import { lucentOrngTheme } from "./lucent-orng.js";
import { materialTheme } from "./material.js";
import { matrixTheme } from "./matrix.js";
import { mercuryTheme } from "./mercury.js";
import { monokaiTheme } from "./monokai.js";
import { nightowlTheme } from "./nightowl.js";
import { nordTheme } from "./nord.js";
import { oc2Theme } from "./oc-2.js";
import { oneDarkTheme } from "./one-dark.js";
import { onedarkproTheme } from "./onedarkpro.js";
import { opencodeTheme } from "./opencode.js";
import { orngTheme } from "./orng.js";
import { osakaJadeTheme } from "./osaka-jade.js";
import { palenightTheme } from "./palenight.js";
import { rosepineTheme } from "./rosepine.js";
import { shadesofpurpleTheme } from "./shadesofpurple.js";
import { solarizedTheme } from "./solarized.js";
import { synthwave84Theme } from "./synthwave84.js";
import { tokyoNightTheme } from "./tokyo-night.js";
import { vercelTheme } from "./vercel.js";
import { vesperTheme } from "./vesper.js";
import { zenburnTheme } from "./zenburn.js";

export interface RegistryThemeDefinition {
  bases: readonly BaseName[];
  description: string;
  name: string;
  theme: InkTheme;
  title: string;
  type: "registry:theme";
}

export const THEMES = [
  {
    bases: BASE_NAMES,
    description: "The default termcn dark theme.",
    name: "default",
    theme: defaultTheme,
    title: "Default",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "A soft pastel Catppuccin palette for terminal UIs.",
    name: "catppuccin",
    theme: catppuccinTheme,
    title: "Catppuccin",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Dracula-inspired purple-forward theme.",
    name: "dracula",
    theme: draculaTheme,
    title: "Dracula",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "WCAG-friendly dark high-contrast theme.",
    name: "high-contrast",
    theme: highContrastTheme,
    title: "High Contrast",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "WCAG-friendly light high-contrast theme.",
    name: "high-contrast-light",
    theme: highContrastLightTheme,
    title: "High Contrast Light",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Classic Monokai-inspired editor palette.",
    name: "monokai",
    theme: monokaiTheme,
    title: "Monokai",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Nord-inspired cool blue-gray palette.",
    name: "nord",
    theme: nordTheme,
    title: "Nord",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "One Dark-inspired terminal theme.",
    name: "one-dark",
    theme: oneDarkTheme,
    title: "One Dark",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Solarized-inspired balanced low-contrast theme.",
    name: "solarized",
    theme: solarizedTheme,
    title: "Solarized",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Tokyo Night-inspired deep blue palette.",
    name: "tokyo-night",
    theme: tokyoNightTheme,
    title: "Tokyo Night",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "High contrast dark theme with AMOLED-style pure black.",
    name: "amoled",
    theme: amoledTheme,
    title: "AMOLED",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Soft, elegant theme with pastel purple tones.",
    name: "aura",
    theme: auraTheme,
    title: "Aura",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Clean, modern theme inspired by Ayu terminal.",
    name: "ayu",
    theme: ayuTheme,
    title: "Ayu",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Minimal dark theme with carbon tones.",
    name: "carbonfox",
    theme: carbonfoxTheme,
    title: "Carbonfox",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Catppuccin frappe flavor - soothing pastel palette.",
    name: "catppuccin-frappe",
    theme: catppuccinFrappeTheme,
    title: "Catppuccin Frappe",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Catppuccin macchiato flavor - deeper pastel tones.",
    name: "catppuccin-macchiato",
    theme: catppuccinMacchiatoTheme,
    title: "Catppuccin Macchiato",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Vibrant blue and gold theme with deep contrast.",
    name: "cobalt2",
    theme: cobalt2Theme,
    title: "Cobalt2",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Cursor IDE theme - clean and modern dark theme.",
    name: "cursor",
    theme: cursorTheme,
    title: "Cursor",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Warm dark theme with forest green tones.",
    name: "everforest",
    theme: everforestTheme,
    title: "Everforest",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Versatile theme with warm colors and good contrast.",
    name: "flexoki",
    theme: flexokiTheme,
    title: "Flexoki",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "GitHub's official dark theme.",
    name: "github",
    theme: githubTheme,
    title: "GitHub",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Retro-style theme with warm earth tones.",
    name: "gruvbox",
    theme: gruvboxTheme,
    title: "Gruvbox",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Japanese-inspired theme with wave motifs.",
    name: "kanagawa",
    theme: kanagawaTheme,
    title: "Kanagawa",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Warm orange theme with translucent feel.",
    name: "lucent-orng",
    theme: lucentOrngTheme,
    title: "Lucent Orng",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Material Design color palette theme.",
    name: "material",
    theme: materialTheme,
    title: "Material",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Green code rain inspired theme.",
    name: "matrix",
    theme: matrixTheme,
    title: "Matrix",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Clean and minimal dark theme.",
    name: "mercury",
    theme: mercuryTheme,
    title: "Mercury",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Night owl theme optimized for late-night coding.",
    name: "nightowl",
    theme: nightowlTheme,
    title: "Night Owl",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Clean, minimal theme with high contrast.",
    name: "oc-2",
    theme: oc2Theme,
    title: "OC-2",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "One Dark Pro - VS Code theme version.",
    name: "onedarkpro",
    theme: onedarkproTheme,
    title: "One Dark Pro",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "The official OpenCode theme.",
    name: "opencode",
    theme: opencodeTheme,
    title: "OpenCode",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Vibrant orange theme with high contrast.",
    name: "orng",
    theme: orngTheme,
    title: "Orng",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Japanese-inspired theme with jade green tones.",
    name: "osaka-jade",
    theme: osakaJadeTheme,
    title: "Osaka Jade",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Purple-tinted dark theme from React Native.",
    name: "palenight",
    theme: palenightTheme,
    title: "Palenight",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Dark theme with warm rose tones.",
    name: "rosepine",
    theme: rosepineTheme,
    title: "Rose Pine",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Bold purple theme with vibrant accents.",
    name: "shadesofpurple",
    theme: shadesofpurpleTheme,
    title: "Shades of Purple",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Retro-futuristic theme with neon colors.",
    name: "synthwave84",
    theme: synthwave84Theme,
    title: "Synthwave '84",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Vercel's official brand colors.",
    name: "vercel",
    theme: vercelTheme,
    title: "Vercel",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Minimal stark theme with high contrast.",
    name: "vesper",
    theme: vesperTheme,
    title: "Vesper",
    type: "registry:theme",
  },
  {
    bases: BASE_NAMES,
    description: "Low-contrast theme for long coding sessions.",
    name: "zenburn",
    theme: zenburnTheme,
    title: "Zenburn",
    type: "registry:theme",
  },
] as const satisfies readonly RegistryThemeDefinition[];

export type RegistryTheme = (typeof THEMES)[number];
export type RegistryThemeName = RegistryTheme["name"];

export const THEME_NAMES = THEMES.map((theme) => theme.name) as [
  RegistryThemeName,
  ...RegistryThemeName[],
];

export const TERMINAL_THEME_MAP = Object.fromEntries(
  THEMES.map((theme) => [theme.name, theme.theme])
) as Record<RegistryThemeName, InkTheme>;

export const TERMINAL_THEME_OPTIONS = THEMES.map((theme) => ({
  label: theme.title,
  value: theme.name,
}));

export const THEME_PRIMARY_BY_NAME: Record<string, string> = Object.fromEntries(
  THEMES.map((theme) => [theme.name, theme.theme.colors.primary])
);

export const getThemesForBase = (base: BaseName) =>
  THEMES.filter((theme) => theme.bases.includes(base));
