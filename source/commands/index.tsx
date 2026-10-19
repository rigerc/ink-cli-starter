import {Box, Text} from "ink";
import {AppShell} from "../components/app-shell.js";
import {Badge} from "../components/ui/badge.js";
import {Card} from "../components/ui/card.js";
import {StatusMessage} from "../components/ui/status-message.js";

export default function Index() {
  return (
    <AppShell title="Ink CLI Starter">
      <Box gap={1}>
        <Badge variant="success" bordered={false}>READY</Badge>
        <Badge variant="info" bordered={false}>INK 8</Badge>
        <Badge variant="secondary" bordered={false}>PASTEL 4</Badge>
      </Box>
      <Card title="Your CLI starts here" subtitle="Composable, themed terminal UI">
        <StatusMessage variant="success">Design system initialized</StatusMessage>
        <Text>Demo:   ink-starter demo</Text>
        <Text>Check:  ink-starter doctor</Text>
        <Text>Help:   ink-starter --help</Text>
      </Card>
    </AppShell>
  );
}
