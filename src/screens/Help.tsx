import {Box, Text} from 'ink';
import {useState} from 'react';
import {Kbd, Muted, Panel, ScreenLayout} from '../components';
import {useKeymap, useTerminalSize} from '../hooks';
import {getGlobalKeys, type KeyHint} from '../keys';
import {useTheme} from '../theme/context';
import {navScreens, screenIds} from './index';

const topics = ['Global keys', 'Screens', 'Settings', 'Gallery', 'CLI / output'] as const;

function Shortcuts({hints}: {hints: readonly KeyHint[]}) {
  return (
    <>
      {hints.map((hint) => (
        <Text key={hint.key}>
          <Kbd>{hint.key}</Kbd> {hint.label}
        </Text>
      ))}
    </>
  );
}

export function HelpScreen() {
  const [topic, setTopic] = useState(0);
  const {narrow} = useTerminalSize();
  const theme = useTheme();
  const move = (delta: number) =>
    setTopic((index) => (index + delta + topics.length) % topics.length);
  useKeymap(
    [
      {key: 'up', run: () => move(-1)},
      {key: 'k', run: () => move(-1)},
      {key: 'down', run: () => move(1)},
      {key: 'j', run: () => move(1)},
    ],
    {scope: 'screen'},
  );
  const hintsFor = (id: string) => navScreens.find((screen) => screen.id === id)?.hints ?? [];
  const name = topics[topic] ?? topics[0];

  return (
    <ScreenLayout title="Help" description="Keyboard shortcuts and command-line options">
      <Box flexDirection={narrow ? 'column' : 'row'} gap={1}>
        <Box
          flexDirection={narrow ? 'row' : 'column'}
          width={narrow ? undefined : 22}
          flexShrink={0}
          columnGap={2}
          flexWrap="wrap"
        >
          {topics.map((item, index) => (
            <Text
              key={item}
              bold={topic === index}
              color={topic === index ? theme.color.primary : theme.color.muted}
            >
              {topic === index ? `${theme.symbols.pointer} ${item}` : narrow ? item : `  ${item}`}
            </Text>
          ))}
        </Box>
        <Box flexDirection="column" flexGrow={1} flexShrink={1} minWidth={0}>
          <Panel title={name}>
            {topic === 0 && (
              <>
                <Shortcuts hints={getGlobalKeys(navScreens.length)} />
                <Box marginTop={1} flexDirection="column">
                  <Muted>Text fields and confirmations capture shortcuts.</Muted>
                  <Muted>Run --help for every flag and command.</Muted>
                </Box>
              </>
            )}
            {topic === 1 && (
              <>
                {navScreens.map((screen, index) => (
                  <Text key={screen.id}>{`${index + 1}  ${screen.label}`}</Text>
                ))}
                <Box marginTop={1} flexDirection="column">
                  <Text>Tabs, numeric shortcuts and the command menu follow this registry.</Text>
                  <Muted>Details is hidden from tabs; open it from Gallery with enter.</Muted>
                  <Muted>Use --screen to start on any registered screen.</Muted>
                </Box>
              </>
            )}
            {topic === 2 && (
              <>
                <Shortcuts hints={hintsFor('settings')} />
                <Box marginTop={1} flexDirection="column">
                  <Text>Up/down selects a section; Enter edits it. Escape returns.</Text>
                  <Text>Drafts survive tab changes. Save commits; discard restores the file.</Text>
                  <Muted>Environment variables and CLI flags override saved settings.</Muted>
                  <Muted>NO_COLOR forces mono. --ascii uses ASCII borders and symbols.</Muted>
                </Box>
              </>
            )}
            {topic === 3 && (
              <>
                <Shortcuts hints={hintsFor('gallery')} />
                <Box marginTop={1} flexDirection="column">
                  <Text>Up/down selects an item; Enter opens details; Escape returns.</Text>
                  <Text>
                    f filters statuses; r reloads. e and x preview empty and error states.
                  </Text>
                  <Muted>The list operation is shared with the example command.</Muted>
                </Box>
              </>
            )}
            {topic === 4 && (
              <>
                <Text>--theme dark|light|contrast|mono|auto</Text>
                <Text>{`--screen ${screenIds.join('|')}`}</Text>
                <Text>--setup --config path --plain --json --debug</Text>
                <Text>--quiet --verbose --no-color</Text>
                <Text>--screen-reader --alternate-screen</Text>
                <Box marginTop={1} flexDirection="column">
                  <Text>doctor [--json] Inspect the runtime environment</Text>
                  <Text>config get|set|list|path|reset Manage settings headlessly</Text>
                  <Text>example [input] [--json] List example work items</Text>
                  <Text>completion bash|zsh|fish Generate shell completion</Text>
                </Box>
                <Box marginTop={1} flexDirection="column">
                  <Muted>--plain prints one static frame; piped output never prompts.</Muted>
                  <Muted>
                    --json requires a headless command; --setup needs an interactive terminal.
                  </Muted>
                </Box>
              </>
            )}
          </Panel>
        </Box>
      </Box>
    </ScreenLayout>
  );
}
