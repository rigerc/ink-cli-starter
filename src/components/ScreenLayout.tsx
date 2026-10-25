import {Box, type BoxProps} from 'ink';
import type {PropsWithChildren} from 'react';
import {ScreenHeader, type ScreenHeaderProps} from './ScreenHeader';

export type ScreenLayoutProps = PropsWithChildren<ScreenHeaderProps & {
  /** Override default spacing without replacing the screen component. */
  gap?: BoxProps['gap'];
  paddingX?: BoxProps['paddingX'];
}>;

/** Optional heading and adjustable content spacing; regular Ink elements also work. */
export function ScreenLayout({
  title,
  description,
  actions,
  gap = 1,
  paddingX = 1,
  children,
}: ScreenLayoutProps) {
  return (
    <Box flexDirection="column" gap={gap}>
      {(title != null || description != null || actions != null) && (
        <ScreenHeader title={title} description={description} actions={actions} />
      )}
      <Box flexDirection="column" paddingX={paddingX} gap={gap}>
        {children}
      </Box>
    </Box>
  );
}
