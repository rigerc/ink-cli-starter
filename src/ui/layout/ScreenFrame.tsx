import type {ComponentType, ReactNode} from 'react';
import {AppShell, type AppShellProps} from '../../components/AppShell';
import type {ScreenChrome, ScreenLayoutMode} from '../core/defineApp';

export interface ScreenFrameProps {
  layout?: ScreenLayoutMode;
  chrome?: ScreenChrome;
  shell?: ComponentType<AppShellProps>;
  header?: ReactNode;
  nav?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

/** Compose individual chrome regions or bypass the shell entirely. */
export function ScreenFrame({
  layout = 'shell',
  chrome,
  shell: Shell = AppShell,
  header,
  nav,
  footer,
  children,
}: ScreenFrameProps) {
  if (layout === 'bare') return <>{children}</>;

  return (
    <Shell
      header={chrome?.header === false ? undefined : header}
      nav={chrome?.nav === false ? undefined : nav}
      footer={chrome?.footer === false ? undefined : footer}
      showToasts={chrome?.toasts !== false}
    >
      {children}
    </Shell>
  );
}
