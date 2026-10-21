import type {ComponentType} from 'react';
import type {KeyHint} from '../keys';
import {GalleryScreen} from './Gallery';
import {HelpScreen} from './Help';
import {HomeScreen} from './Home';
import {SettingsScreen} from './Settings';
import {TasksScreen} from './Tasks';

export interface ScreenDef {
  id: string;
  label: string;
  Component: ComponentType;
  /** Hidden development screens remain addressable via --screen. */
  showInNav?: boolean;
  /** Contextual shortcuts shown before global hints in the footer. */
  hints?: readonly KeyHint[];
}

/** Order here is tab order and the 1-5 shortcuts. */
export const screens: ScreenDef[] = [
  {id: 'home', label: 'Home', Component: HomeScreen},
  {id: 'tasks', label: 'Tasks', Component: TasksScreen, hints: [
    {key: 'r', label: 'retry'},
    {key: 'x', label: 'simulate failure'},
  ]},
  {id: 'gallery', label: 'Gallery', Component: GalleryScreen},
  {id: 'settings', label: 'Settings', Component: SettingsScreen, hints: [
    {key: '↑/↓', label: 'section'},
    {key: 'enter', label: 'edit'},
    {key: 's', label: 'save'},
    {key: 'd', label: 'discard'},
    {key: 'w', label: 'wizard'},
  ]},
  {id: 'help', label: 'Help', Component: HelpScreen},
];

export const navScreens = screens.filter((s) => s.showInNav !== false);
export const screenIds = screens.map((s) => s.id);
export const isScreenId = (id: string) => screenIds.includes(id);
