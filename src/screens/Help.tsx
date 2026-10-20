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
        <Text>{'--plain  --ascii  --debug  --demo  --data PATH'}</Text>
        <Text>{'--json (headless commands)'}</Text>
      </Panel>
      <Panel title="Commands">
        <Text>tasks list | add TITLE | show ID | rename ID TITLE</Text>
        <Text>tasks complete ID | reopen ID | remove ID</Text>
        <Text>doctor | config path</Text>
      </Panel>
    </Stack>
  );
}
