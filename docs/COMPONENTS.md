# Full termcn Ink library

This repo vendors the complete upstream **Ink** `ui/` directory from [shadcn-labs/termcn](https://github.com/shadcn-labs/termcn) (123 component and type source files). The corresponding hooks, providers and utility helpers are also copied, along with upstream themes. **OpenTUI is deliberately excluded:** Ink 8 uses a different renderer.

Examples of included families:

| Family | Examples |
|---|---|
| Layout | Box, Stack, Grid, Center, Columns, ScrollView, Divider |
| Typography | Heading, Badge, Tag, BigText, Markdown, Code, Digits |
| Input | TextInput, TextArea, SearchInput, EmailInput, PasswordInput, PathInput |
| Selection | Select, MultiSelect, RadioGroup, CheckboxGroup, TreeSelect |
| Data | Table, DataGrid, KeyValue, JSON, DirectoryTree, GitStatus, DiffView |
| Feedback | Alert, Banner, ProgressBar, ProgressCircle, Spinner, Toast |
| Navigation | Tabs, Sidebar, Breadcrumb, Menu, CommandPalette, Pagination |
| Overlays | Dialog, Modal, Popover, Tooltip, Drawer, NotificationCenter |
| Forms | Form, FormField, Wizard, Confirm, DatePicker, FilePicker |
| Charts | BarChart, LineChart, PieChart, HeatMap, Sparkline, Dither charts |
| AI | ChatMessage, ChatThread, ThinkingBlock, StreamingText, ToolCall, TokenUsage |
| Utility | ErrorBoundary, Clipboard, QRCode, Timer, KeyboardShortcuts, Log |
| Screens | AppShell, SplashScreen, WelcomeScreen, SetupFlow, LoginFlow |

**Actual filenames are kebab-case**, e.g. `source/components/ui/command-palette.tsx` and `source/components/ui/chat-message.tsx`. All public props/types are defined in the individual component source files. Import directly rather than through a giant barrel module.

## Updating through the termcn registry

```bash
npx shadcn@latest add @termcn/ink/select
npx shadcn@latest add @termcn/ink/chat-message
```

The registry alias lives in `components.json`. The project uses TS NodeNext with source `.js` import specifiers; the shadcn CLI may emit `@/` imports that must be normalized before `tsc` and runtime execution.

See https://termcn.dev/docs/components/ink and https://termcn.dev/docs/registry. Check transitive dependencies and upstream MIT attribution whenever updating.
