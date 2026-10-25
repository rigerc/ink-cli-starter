import {Box, type BoxProps} from 'ink';
import type {PropsWithChildren} from 'react';

type StackProps = PropsWithChildren<
  Omit<BoxProps, 'flexDirection'>
>;

/** Vertical layout with Ink's standard gap and Box properties. */
export const Stack = ({gap = 0, ...rest}: StackProps) => (
  <Box flexDirection="column" gap={gap} {...rest} />
);

/** Horizontal layout with Ink's standard gap and Box properties. */
export const Row = ({gap = 0, ...rest}: StackProps) => (
  <Box flexDirection="row" gap={gap} {...rest} />
);
