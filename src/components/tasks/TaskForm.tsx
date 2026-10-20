import {Box, Text, useInput} from 'ink';
import {useState} from 'react';
import {Muted} from '../typography';

export function TaskForm({
  initial = '',
  onSubmit,
  onCancel,
}: {
  initial?: string;
  onSubmit: (title: string) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial);
  useInput((input, key) => {
    if (key.escape) return onCancel();
    if (key.return) return onSubmit(title);
    if (key.backspace || key.delete) {
      setTitle((value) => [...value].slice(0, -1).join(''));
      return;
    }
    if (!key.ctrl && !key.meta && input) setTitle((value) => value + input);
  });
  return (
    <Box flexDirection="column">
      <Text wrap="truncate-end">&gt; {title}<Text color="cyan">_</Text></Text>
      <Muted>Type a task title · enter save · esc cancel · maximum 160 characters</Muted>
    </Box>
  );
}
