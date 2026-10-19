// Termcn (MIT) · https://github.com/shadcn-labs/termcn
import { Box, Text } from "ink";
import React, { useState } from "react";

import {
  isActivationKey,
  useInteraction,
} from "../../hooks/use-interaction.js";
import { useTheme } from "../../hooks/use-theme.js";
import { useUnicode } from "../../hooks/use-unicode.js";
import { resolveBorderStyle } from "../../lib/terminal-style.js";
import { resolveTerminalSymbol } from "../../lib/terminal-symbols.js";
import type { BorderStyle } from "./types.js";

export interface ToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: (checked: boolean) => void;
  label?: string;
  onLabel?: string;
  offLabel?: string;
  id?: string;
  autoFocus?: boolean;
  isActive?: boolean;
  "aria-label"?: string;
  disabled?: boolean;
  checkedIcon?: string;
  uncheckedIcon?: string;
  borderStyle?: BorderStyle;
  paddingX?: number;
}

export const Toggle = ({
  checked: controlledChecked,
  defaultChecked = false,
  onCheckedChange,
  onChange,
  label,
  onLabel = "ON",
  offLabel = "OFF",
  id,
  autoFocus = false,
  isActive = true,
  "aria-label": ariaLabel,
  disabled = false,
  checkedIcon,
  uncheckedIcon,
  borderStyle = "round",
  paddingX = 1,
}: ToggleProps) => {
  const unicode = useUnicode();
  const theme = useTheme();
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const checked = controlledChecked ?? internalChecked;

  const { isFocused } = useInteraction(
    (input, key) => {
      if (disabled) {
        return;
      }
      if (isActivationKey(input, key)) {
        const next = !checked;
        const changeHandler = onCheckedChange ?? onChange;
        if (changeHandler) {
          changeHandler(next);
        } else {
          setInternalChecked(next);
        }
      }
    },
    { autoFocus, disabled, id, isActive }
  );

  const trackColor = checked
    ? theme.colors.success
    : theme.colors.mutedForeground;
  const focusColor = isFocused ? theme.colors.focusRing : trackColor;
  const stateLabel = checked ? onLabel : offLabel;
  const resolvedCheckedIcon =
    checkedIcon ?? resolveTerminalSymbol(unicode, "●", "*");
  const resolvedUncheckedIcon =
    uncheckedIcon ?? resolveTerminalSymbol(unicode, "○", "o");

  return (
    <Box
      aria-label={ariaLabel ?? label ?? "Toggle"}
      aria-role="checkbox"
      aria-state={{ checked, disabled }}
      gap={1}
      alignItems="center"
    >
      <Text aria-hidden>{isFocused ? ">" : " "}</Text>
      <Box
        aria-hidden
        borderStyle={resolveBorderStyle(borderStyle, unicode)}
        borderColor={focusColor}
        paddingX={paddingX}
      >
        <Text color={focusColor} bold={checked}>
          {checked ? resolvedCheckedIcon : resolvedUncheckedIcon} {stateLabel}
        </Text>
      </Box>
      {label && (
        <Text
          aria-hidden
          color={
            disabled ? theme.colors.mutedForeground : theme.colors.foreground
          }
        >
          {label}
        </Text>
      )}
    </Box>
  );
};
