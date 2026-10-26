import {Box, Text} from 'ink';
import {useManagedInput} from '../hooks/useKeymap';
import {useState} from 'react';
import {useTheme} from '../theme/context';
import {Kbd, Muted} from './typography';

export interface ConfirmProps {
  message: string;
  defaultValue?: boolean;
  onConfirm: (value: boolean) => void;
  isActive?: boolean;
  /** Allow a confirmation control owned by a capturing editor to receive keys. */
  allowWhenCaptured?: boolean;
}

/** Y/N or arrows to choose, Enter to submit; q is left to the host app. */
export function Confirm({
  message,
  defaultValue = false,
  onConfirm,
  isActive = true,
  allowWhenCaptured = false,
}: ConfirmProps) {
  const [value, setValue] = useState(defaultValue);
  const t = useTheme();
  useManagedInput(
    (input, key) => {
      if (key.ctrl || key.meta) return false;

      if (input.toLowerCase() === 'y' || key.leftArrow) {
        setValue(true);
        return true;
      }

      if (input.toLowerCase() === 'n' || key.rightArrow) {
        setValue(false);
        return true;
      }

      if (key.return) {
        onConfirm(value);
        return true;
      }

      return false;
    },
    {isActive, scope: 'control', allowWhenCaptured},
  );

  return (
    <Box flexDirection="column">
      <Text>{message}</Text>
      <Box gap={2}>
        {[true, false].map((option) => (
          <Text
            key={String(option)}
            bold={option === value}
            color={option === value ? t.color.primary : t.color.muted}
          >
            {option === value ? t.symbols.pointer : ' '} {option ? 'Yes' : 'No'}
          </Text>
        ))}
        <Muted>
          <Kbd>y/n</Kbd> choose <Kbd>enter</Kbd> confirm
        </Muted>
      </Box>
    </Box>
  );
}
