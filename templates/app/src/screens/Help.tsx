import {Box, Text} from 'ink';
import {ScreenLayout, Kbd, Panel, Stack} from '../components';
import {getGlobalKeys} from '../keys';
import {navScreens, screenIds} from './index';

export function HelpScreen() {
  return (
    <ScreenLayout title="Help" description="Keyboard shortcuts and command-line options">
      <Stack gap={1}>
        <Panel title="Keyboard">
          {getGlobalKeys(navScreens.length).map((binding) => (
            <Box key={binding.key} gap={2}>
              <Box width={12}>
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
          <Text>doctor [--json] Environment and configuration checks</Text>
        </Panel>
      </Stack>
    </ScreenLayout>
  );
}
