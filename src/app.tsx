import pkg from '../package.json';
import {AppRuntime, PlainRuntime} from './ui/core/AppRuntime';
import {defineApp} from './ui/core/defineApp';
import {screens} from './screens';
import type {AppOptions} from './ui/core/AppProviders';

export {AppProviders, type AppOptions} from './ui/core/AppProviders';
export {ScreenFrame} from './ui/layout/ScreenFrame';
export {defineApp, type ScreenChrome, type ScreenDef, type UIAppDefinition} from './ui/core/defineApp';
export {AppRuntime, PlainRuntime} from './ui/core/AppRuntime';

/** Defaults only; downstream applications may provide their own definition. */
export const defaultApp = defineApp({
  screens,
  initialScreen: 'home',
  brand: {title: pkg.name, version: pkg.version},
});

export const App = ({options}: {options: AppOptions}) => (
  <AppRuntime definition={defaultApp} options={options} />
);

export const PlainView = ({options}: {options: AppOptions}) => (
  <PlainRuntime definition={defaultApp} options={options} />
);
