import {Box, Text} from 'ink';
import pkg from '../../package.json';
import {Muted, Panel, ScreenLayout, Stack} from '../components';

export function HomeScreen() {
  return (
    <ScreenLayout title="Home" description="Get started with your application">
      <Stack gap={1}>
        <Panel title={`Welcome to ${pkg.name}`} tone="accent">
          <Text>Your CLI application is ready.</Text>
          <Box marginTop={1}>
            <Muted>Replace this screen with your application's experience.</Muted>
          </Box>
        </Panel>
        <Panel title="Build your app">
          <Text>Add a screen in src/screens/ and register it in src/screens/index.ts.</Text>
          <Text>Add headless commands in src/commands/.</Text>
          <Text>Open Gallery for a list/detail example.</Text>
          <Text>See docs/adding-a-feature.md to adapt it.</Text>
        </Panel>
      </Stack>
    </ScreenLayout>
  );
}
