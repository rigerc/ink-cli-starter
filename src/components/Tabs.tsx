import {Box, Text} from 'ink';
import {useTone} from '../theme/context';

export function Tabs({items, activeId}: {items: {id: string; label: string}[]; activeId: string}) {
  const primary = useTone('primary');
  const muted = useTone('muted');

  return (
    <Box aria-role="tablist" aria-label="Screens" columnGap={2} paddingX={1} flexWrap="wrap">
      {items.map((item, i) =>
        item.id === activeId ? (
          <Box key={item.id} aria-role="tab" aria-label={item.label} aria-state={{selected: true}}>
            <Text bold underline {...primary}>
              {i + 1} {item.label}
            </Text>
          </Box>
        ) : (
          <Box key={item.id} aria-role="tab" aria-label={item.label} aria-state={{selected: false}}>
            <Text {...muted}>
              {i + 1} {item.label}
            </Text>
          </Box>
        ),
      )}
    </Box>
  );
}
