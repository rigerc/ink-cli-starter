// Termcn (MIT) · https://github.com/shadcn-labs/termcn
import { Box, Text } from "ink";
import React, { useState } from "react";
import type { ReactNode } from "react";

import { FocusScope } from "../../hooks/use-interaction.js";
import { useTheme } from "../../hooks/use-theme.js";
import { useUnicode } from "../../hooks/use-unicode.js";
import { resolveBorderStyle } from "../../lib/terminal-style.js";
import type { BorderStyle } from "./types.js";

export interface ModalProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title?: string;
  width?: number;
  children?: ReactNode;
  borderStyle?: BorderStyle;
  borderColor?: string;
  paddingX?: number;
  paddingY?: number;
  titleBorderStyle?: BorderStyle;
  closeHint?: string | false;
  initialFocusId?: string;
  returnFocusId?: string;
  "aria-label"?: string;
}

export const Modal = ({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  onClose,
  title,
  width = 60,
  children,
  borderStyle = "round",
  borderColor,
  paddingX = 1,
  paddingY = 0,
  titleBorderStyle = "single",
  closeHint = "Press Esc to close",
  initialFocusId,
  returnFocusId,
  "aria-label": ariaLabel,
}: ModalProps) => {
  const unicode = useUnicode();
  const theme = useTheme();
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen ?? internalOpen;
  const resolvedBorderColor = borderColor ?? theme.colors.primary;

  const close = () => {
    if (controlledOpen === undefined) {
      setInternalOpen(false);
    }
    onOpenChange?.(false);
    onClose?.();
  };

  if (!open) {
    return null;
  }

  return (
    <FocusScope
      active={open}
      initialFocusId={initialFocusId}
      returnFocusId={returnFocusId}
      onEscapeKey={close}
    >
      <Box
        flexDirection="column"
        borderStyle={resolveBorderStyle(borderStyle, unicode)}
        borderColor={resolvedBorderColor}
        width={width}
        paddingX={paddingX}
        paddingY={paddingY}
      >
        {(title || ariaLabel) && (
          <Box
            marginBottom={1}
            borderStyle={resolveBorderStyle(titleBorderStyle, unicode)}
            borderColor={theme.colors.border}
            paddingX={1}
          >
            <Text
              aria-label={ariaLabel ?? `Modal: ${title}`}
              bold
              color={resolvedBorderColor}
            >
              {title ?? ""}
            </Text>
          </Box>
        )}
        <Box flexDirection="column">{children}</Box>
        {closeHint !== false && (
          <Box aria-hidden marginTop={1}>
            <Text color={theme.colors.mutedForeground} dimColor>
              {closeHint}
            </Text>
          </Box>
        )}
      </Box>
    </FocusScope>
  );
};
