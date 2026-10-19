import {Box, Text} from "ink";
import type {ReactNode} from "react";
import {Heading} from "./ui/heading.js";
import {useTheme} from "../hooks/use-theme.js";

export function AppShell({title, children}: {title: string; children: ReactNode}) {
  const theme = useTheme();
  return (
    <Box flexDirection="column" paddingX={1} gap={1}>
      <Heading level={1}>{title}</Heading>
      {children}
      <Text color={theme.colors.mutedForeground}>
        Ink 8 · Pastel 4 · termcn · --help for commands
      </Text>
    </Box>
  );
}
