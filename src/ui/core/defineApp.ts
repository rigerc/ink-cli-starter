import type {ComponentType} from 'react';
import type {AppShellProps} from '../../components/AppShell';
import type {KeyHint} from '../../keys';

/** The terminal view may use the shared shell or render without chrome. */
export type ScreenLayoutMode = 'shell' | 'bare';

export interface ScreenChrome {
  header?: boolean;
  nav?: boolean;
  footer?: boolean;
  toasts?: boolean;
}

export interface ScreenDef {
  id: string;
  label: string;
  Component: ComponentType;
  layout?: ScreenLayoutMode;
  /** Hide individual shell regions without replacing the entire shell. */
  chrome?: ScreenChrome;
  /** Disable default application shortcuts, retaining screen/control bindings. */
  globalKeys?: boolean;
  /** A hidden screen is still addressable by the CLI or router. */
  showInNav?: boolean;
  hints?: readonly KeyHint[];
}

export interface UIAppDefinition {
  readonly screens: readonly ScreenDef[];
  readonly initialScreen: string;
  readonly shell?: ComponentType<AppShellProps>;
  readonly brand?: {title: string; version: string};
  readonly navScreens: ScreenDef[];
  findScreen: (id: string) => ScreenDef | undefined;
}

export interface UIAppOptions {
  screens: readonly ScreenDef[];
  initialScreen: string;
  /** Optional replacement for the standard five-region app shell. */
  shell?: ComponentType<AppShellProps>;
  brand?: {title: string; version: string};
}

/** Construct a reusable application definition without mounting React providers. */
export function defineApp(options: UIAppOptions): UIAppDefinition {
  if (options.screens.length === 0) throw new Error('At least one screen is required');

  const ids = new Set<string>();

  for (const screen of options.screens) {
    if (!screen.id || ids.has(screen.id)) throw new Error(`Duplicate or empty screen id: ${screen.id}`);
    ids.add(screen.id);
  }

  if (!ids.has(options.initialScreen))
    throw new Error(`Unknown initial screen: ${options.initialScreen}`);

  return {
    screens: options.screens,
    initialScreen: options.initialScreen,
    shell: options.shell,
    brand: options.brand,
    get navScreens() {
      return options.screens.filter((screen) => screen.showInNav !== false);
    },
    findScreen: (id) => options.screens.find((screen) => screen.id === id),
  };
}
