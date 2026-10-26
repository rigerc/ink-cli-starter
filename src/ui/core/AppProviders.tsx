import type {ReactNode} from 'react';
import type {Config} from '../../config';
import {ConfigRuntimeProvider} from '../../config/context';
import {ErrorBoundary} from '../../components/ErrorPanel';
import {
  InputCaptureProvider,
  KeymapProvider,
  RouterProvider,
  ToastProvider,
} from '../../hooks';
import {ThemeProvider} from '../../theme/context';
import type {ThemeName} from '../../theme/tokens';

export interface AppOptions {
  theme: ThemeName;
  ascii: boolean;
  debug: boolean;
  screen: string;
  configFile?: string;
  configFlags?: Partial<Config>;
}

/** Providers are usable without any built-in shell or navigation components. */
export function AppProviders({options, children}: {options: AppOptions; children: ReactNode}) {
  return (
    <ConfigRuntimeProvider path={options.configFile} flags={options.configFlags}>
      <ThemeProvider name={options.theme} ascii={options.ascii}>
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
