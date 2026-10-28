import type {ReactNode} from 'react';
import type {Config} from '../../config';
import {ConfigRuntimeProvider} from '../../config/context';
import {ErrorBoundary} from '../../components/ErrorPanel';
import {InputCaptureProvider, KeymapProvider, RouterProvider, ToastProvider} from '../../hooks';
import {ThemeProvider} from '../../theme/context';
import type {Theme} from '../../theme/tokens';

export interface AppOptions {
  theme: string;
  ascii: boolean;
  debug: boolean;
  screen: string;
  configFile?: string;
  configFlags?: Partial<Config>;
}

/** Providers are usable without any built-in shell or navigation components. */
export function AppProviders({
  options,
  themes,
  children,
}: {
  options: AppOptions;
  themes?: Readonly<Record<string, Theme>>;
  children: ReactNode;
}) {
  return (
    <ConfigRuntimeProvider path={options.configFile} flags={options.configFlags}>
      <ThemeProvider name={options.theme} ascii={options.ascii} registry={themes}>
        <InputCaptureProvider>
          <KeymapProvider>
            <ToastProvider>
              <RouterProvider initial={options.screen}>
                <ErrorBoundary debug={options.debug}>{children}</ErrorBoundary>
              </RouterProvider>
            </ToastProvider>
          </KeymapProvider>
        </InputCaptureProvider>
      </ThemeProvider>
    </ConfigRuntimeProvider>
  );
}
