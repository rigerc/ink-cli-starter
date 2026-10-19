import type {AppProps} from "pastel";
import {ThemeProvider} from "../providers/theme-provider.js";
import {oceanTheme} from "../design-system/themes.js";

export default function App({Component, commandProps}: AppProps) {
  return (
    <ThemeProvider theme={oceanTheme}>
      <Component {...commandProps} />
    </ThemeProvider>
  );
}
