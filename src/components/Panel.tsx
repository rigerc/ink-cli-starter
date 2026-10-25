import {Box, Text, type BoxProps} from 'ink';
import type {ReactNode} from 'react';
import {useTheme, useTone} from '../theme/context';
import type {Tone} from '../theme/tokens';
import {Muted} from './typography';

export interface PanelProps extends Omit<BoxProps, 'children' | 'title'> {
  title?: ReactNode;
  footer?: ReactNode;
  /** Default theme tone of the title; Box props may override border styles. */
  tone?: Tone;
  focused?: boolean;
  children: ReactNode;
}

/** Bordered container. Ink has no border titles, so the title is the first row. */
export function Panel({
  title,
  footer,
  tone = 'primary',
  focused = false,
  children,
  ...boxProps
}: PanelProps) {
  const t = useTheme();
  const titleStyle = useTone(tone);
  return (
    <Box
      flexDirection="column"
      borderStyle={focused ? t.border.focus : t.border.base}
      borderColor={focused ? t.color.focus : t.color.border}
      paddingX={1}
      {...boxProps}
    >
      {title && (
        <Text bold wrap="truncate-end" {...titleStyle}>
          {title}
        </Text>
      )}
      {children}
      {footer && (
        <Box marginTop={1}>{typeof footer === 'string' ? <Muted>{footer}</Muted> : footer}</Box>
      )}
    </Box>
  );
}

/** Lightweight alternative to Panel: a colored accent bar on the left. */
export type CardProps = Omit<BoxProps, 'children'> & {tone?: Tone; children: ReactNode};

export function Card({tone = 'primary', children, ...boxProps}: CardProps) {
  const t = useTheme();
  return (
    <Box
      flexDirection="column"
      borderStyle={t.mono ? 'single' : 'bold'}
      borderColor={t.color[tone]}
      borderTop={false}
      borderRight={false}
      borderBottom={false}
      paddingLeft={1}
      {...boxProps}
    >
      {children}
    </Box>
  );
}
