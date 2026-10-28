import pkg from '../../package.json' with {type: 'json'};

/** Package metadata controls CLI executable, config directory and environment prefix. */
export const APP_NAME = Object.keys(pkg.bin)[0] ?? pkg.name.split('/').at(-1) ?? pkg.name;
export const APP_ENV_PREFIX = APP_NAME.replaceAll(/[^a-zA-Z0-9]/g, '_').toUpperCase();
