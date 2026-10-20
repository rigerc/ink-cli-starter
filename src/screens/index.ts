import type {ComponentType} from 'react';
import {GalleryScreen} from './Gallery';
import {HelpScreen} from './Help';
import {HomeScreen} from './Home';
import {SettingsScreen} from './Settings';
import {TasksScreen} from './Tasks';

export interface ScreenDef {
  id: string;
  label: string;
  Component: ComponentType;
}

/** Order here is tab order and the 1-5 shortcuts. */
export const screens: ScreenDef[] = [
  {id: 'home', label: 'Home', Component: HomeScreen},
  {id: 'tasks', label: 'Tasks', Component: TasksScreen},
  {id: 'gallery', label: 'Gallery', Component: GalleryScreen},
  {id: 'settings', label: 'Settings', Component: SettingsScreen},
  {id: 'help', label: 'Help', Component: HelpScreen},
];

export const screenIds = screens.map((s) => s.id);
export const isScreenId = (id: string) => screenIds.includes(id);
