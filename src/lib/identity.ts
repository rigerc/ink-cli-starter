import pkg from '../../package.json' with {type: 'json'};

/** Package metadata is the source of executable, storage, and environment identity. */
export const APP_NAME = Object.keys(pkg.bin)[0] ?? pkg.name.split('/').at(-1) ?? pkg.name;
export const APP_ENV_PREFIX = APP_NAME.replaceAll(/[^a-zA-Z0-9]/g, '_').toUpperCase();
export const APP_THEME_ENV = `${APP_ENV_PREFIX}_THEME`;
export const APP_ASCII_ENV = `${APP_ENV_PREFIX}_ASCII`;
