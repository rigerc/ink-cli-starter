import {Box, Text} from 'ink';
import {Kbd, Panel, Stack} from '../components';
import {globalKeys} from '../keys';
import {screenIds} from './index';

export function HelpScreen() {
  return (
    <Stack gap={1}>
      <Panel title="Keyboard">
        {globalKeys.map((binding) => (
          <Box key={binding.key} gap={2}>
            <Box width={5}>
              <Kbd>{binding.key}</Kbd>
            </Box>
            <Text>{binding.label}</Text>
          </Box>
        ))}
      </Panel>
      <Panel title="Flags and commands">
        <Text>--theme dark|light|contrast|mono|auto</Text>
        <Text>{`--screen ${screenIds.join('|')}`}</Text>
        <Text>--setup --config path --plain --ascii --debug</Text>
        <Text>doctor [--json]  Environment and configuration checks</Text>
      </Panel>
    </Stack>
  );
}
