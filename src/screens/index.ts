import type {ComponentType} from 'react';
import type {KeyHint} from '../keys';
import {GalleryScreen} from './Gallery';
import {HelpScreen} from './Help';
import {HomeScreen} from './Home';
import {SettingsScreen} from './Settings';

export interface ScreenDef {
  id: string;
  label: string;
  Component: ComponentType;
  /** Hidden development screens remain addressable via --screen. */
  showInNav?: boolean;
  /** Contextual shortcuts shown before global hints in the footer. */
  hints?: readonly KeyHint[];
}

/** Visible order controls tab order and numeric shortcuts. */
export const screens: ScreenDef[] = [
  {id: 'home', label: 'Home', Component: HomeScreen},
  {id: 'settings', label: 'Settings', Component: SettingsScreen, hints: [
    {key: '↑/↓', label: 'section'},
    {key: 'enter', label: 'edit'},
    {key: 's', label: 'save'},
    {key: 'd', label: 'discard'},
    {key: 'w', label: 'wizard'},
  ]},
  {id: 'help', label: 'Help', Component: HelpScreen},
  {id: 'gallery', label: 'Gallery', Component: GalleryScreen, showInNav: false},
];

export const navScreens = screens.filter((screen) => screen.showInNav !== false);
export const screenIds = screens.map((screen) => screen.id);
export const isScreenId = (id: string) => screenIds.includes(id);
