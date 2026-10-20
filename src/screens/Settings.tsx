import {Panel, Select, Stack, StatusMessage} from '../components';
import {useToast} from '../hooks';
import {saveConfig} from '../lib/config';
import {toAppError} from '../lib/errors';
import {useThemeControls} from '../theme/context';
import {themeNames, type ThemeName} from '../theme/tokens';

const hints: Record<ThemeName, string> = {
  dark: 'for dark terminals',
  light: 'for light terminals',
  contrast: 'ANSI colors, bold borders',
  mono: 'no color, symbols only',
};

export function SettingsScreen() {
  const {theme, setTheme} = useThemeControls();
  const toast = useToast();

  const choose = (name: ThemeName) => {
    setTheme(name);
    try {
      saveConfig({theme: name});
      toast.push(`Theme "${name}" saved`, 'success');
    } catch (error) {
      toast.push(`Could not save: ${toAppError(error).message}`, 'warn');
    }
  };

  return (
    <Stack gap={1}>
      <Panel title="Theme" footer="↑/↓ move    enter save">
        <Select
          items={themeNames.map((value) => ({value, label: value, hint: hints[value]}))}
          initialValue={theme.name}
          current={theme.name}
          onSelect={choose}
        />
      </Panel>
      <StatusMessage tone="info">Set NO_COLOR=1 to force the mono theme.</StatusMessage>
    </Stack>
  );
}
