import {Box, Text} from "ink";
import {AppShell} from "../components/app-shell.js";
import {Card} from "../components/ui/card.js";
import {StatusMessage} from "../components/ui/status-message.js";

export default function Doctor() {
  const supported = Number(process.versions.node.split(".")[0]) >= 22;
  const tty = Boolean(process.stdin.isTTY && process.stdout.isTTY);
  return (
    <AppShell title="Environment doctor">
      <Card title="Runtime diagnostics">
        <StatusMessage variant={supported ? "success" : "error"}>
          Node.js {process.versions.node} ({supported ? "supported" : "requires Node 22+"})
        </StatusMessage>
        <StatusMessage variant={tty ? "success" : "info"}>
          Input: {tty ? "interactive terminal" : "non-interactive stream"}
        </StatusMessage>
        <Box flexDirection="column" marginTop={1}>
          <Text>NO_COLOR:   {process.env.NO_COLOR ? "enabled" : "unset"}</Text>
          <Text>NO_UNICODE: {process.env.NO_UNICODE ? "enabled" : "unset"}</Text>
          <Text>NO_MOTION:  {process.env.NO_MOTION ? "enabled" : "unset"}</Text>
          <Text>CI:         {process.env.CI ? "enabled" : "unset"}</Text>
        </Box>
      </Card>
    </AppShell>
  );
}
