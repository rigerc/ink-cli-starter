import {Box, Text} from 'ink';
import {Kbd, Panel, Stack} from '../components';
import {globalKeys} from '../keys';

export function HelpScreen() {
  return (
    <Stack gap={1}>
      <Panel title="Keyboard">
        {globalKeys.map((k) => (
          <Box key={k.key} gap={2}>
            <Box width={5}>
              <Kbd>{k.key}</Kbd>
            </Box>
            <Text>{k.label}</Text>
          </Box>
        ))}
      </Panel>
      <Panel title="Flags">
        <Text>--theme dark|light|contrast|mono</Text>
        <Text>--screen home|tasks|gallery|settings|help</Text>
        <Text>--plain  --ascii  --debug</Text>
      </Panel>
    </Stack>
  );
}
