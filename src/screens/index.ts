import type {ScreenDef} from '../ui/core/defineApp';
export type {ScreenDef} from '../ui/core/defineApp';
import {HelpScreen} from './Help';
import {HomeScreen} from './Home';
import {SettingsScreen} from './Settings';

/** Compatibility alias for existing callers. */
export type {ScreenLayoutMode} from '../ui/core/defineApp';

/** Visible order controls tab order and numeric shortcuts. */
export const screens: ScreenDef[] = [
  {id: 'home', label: 'Home', Component: HomeScreen},
  {
    id: 'settings',
    label: 'Settings',
    Component: SettingsScreen,
    hints: [
      {key: '↑/↓', label: 'section'},
      {key: 'enter', label: 'edit'},
      {key: 's', label: 'save'},
      {key: 'd', label: 'discard'},
      {key: 'w', label: 'wizard'},
    ],
  },
  {id: 'help', label: 'Help', Component: HelpScreen},
];

export const navScreens = screens.filter((screen) => screen.showInNav !== false);
export const screenIds = screens.map((screen) => screen.id);
export const isScreenId = (id: string) => screenIds.includes(id);
