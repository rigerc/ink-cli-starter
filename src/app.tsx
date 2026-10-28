import {Box, Text, useApp, useInput} from 'ink';
import pkg from '../package.json' with {type: 'json'};

export interface AppProps {
  label?: string;
}

/** A single native Ink view. Add your own components only when you need them. */
function Content({label = pkg.name}: AppProps) {
  return (
    <Box flexDirection="column">
      <Text bold>{label}</Text>
      <Text>Your CLI is ready. Edit src/app.tsx to build your application.</Text>
    </Box>
  );
}

/** Interactive application: no custom component library, shell, or providers. */
export function App(props: AppProps) {
  const {exit} = useApp();
  useInput((input, key) => {
    if (input === 'q' || key.escape) exit();
  });
  return <Content {...props} />;
}

/** Static, side-effect-free frame for pipes and CI. */
export function PlainView(props: AppProps) {
  return <Content {...props} />;
}
