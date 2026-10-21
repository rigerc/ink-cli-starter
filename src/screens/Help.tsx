import {Box, Text} from 'ink';
import {ScreenLayout, Kbd, Panel, Stack} from '../components';
import {getGlobalKeys} from '../keys';
import {navScreens} from './index';

export function HelpScreen() {
  return (
    <ScreenLayout title="Help" description="Keyboard shortcuts and command-line options">
      <Stack gap={1}>
        <Panel title="Keyboard">
          {getGlobalKeys(navScreens.length).map((k) => (
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
          <Text>{'--plain  --ascii  --debug  --demo'}</Text>
        </Panel>
      </Stack>
    </ScreenLayout>
  );
}
