export const isCI = (): boolean => Boolean(process.env.CI);
export const isInteractive = (): boolean => Boolean(process.stdout.isTTY) && !isCI();
