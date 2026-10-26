---
description: Ink layout, keyboard ownership, async states, themes, and terminal regressions
globs:
  - 'src/app.tsx'
  - 'src/cli.tsx'
  - 'src/keys.ts'
  - 'src/components/**'
  - 'src/hooks/**'
  - 'src/screens/**'
  - 'src/demos/**'
  - 'src/theme/**'
  - 'src/lib/terminal.ts'
  - 'tests/collections.test.tsx'
  - 'tests/consistent-ui.test.tsx'
  - 'tests/keymap-routing.test.tsx'
  - 'tests/keys.test.ts'
  - 'tests/screens.test.tsx'
  - 'tests/stepper.test.tsx'
  - 'tests/theme.test.ts'
  - 'docs/ui-framework.md'
---

# Terminal UI

When changing terminal presentation or interaction, consult `docs/ui-framework.md` (relative to the repository root).

- Reuse `src/components/` and `src/hooks/` when helpful. Native Ink `Box`, `Text`, and `useInput` and custom layouts are supported; shared primitives and the app shell are optional defaults.
- `ScreenLayout` can omit a title and customize spacing. `Panel`, `Card`, `Stack`, and `Row` accept standard Ink Box props. Preserve this flexibility when changing shared components.
- Choose `layout: 'bare'` for a screen with its own chrome, or `globalKeys: false` for custom keyboard behavior. These options are independent; a bare screen still receives providers. When disabling navigation or quit shortcuts, provide a way to leave the screen or document Ctrl+C.
- `useKeymap` routes one matching shortcut with priority control > screen > global. Set `isActive` on controls according to focus. Native `useInput` listeners are separate from keymap routing; avoid competing active listeners.
- Capture input with `useInputCapture(isEditing)` while a custom free-form editor is active, then release it on completion or cancellation. `SearchSelect` already captures input while active; deactivate or unmount it when closed. Keep one free-form text editor active at a time.
- If a child field owns Enter/Escape inside a `Stepper`, disable the stepper's keyboard navigation while that field owns input. Footer `hints` describe shortcuts; register their handlers separately.
- Start async operations from events or effects, never during render. When async work is present, show intentional loading, empty, error, and success states and ignore results superseded by newer requests or unmounts. `useAsync` and `ScreenState` provide reusable defaults.
- Use semantic theme tokens and theme-provided symbols. Preserve `NO_COLOR`, mono themes, and ASCII glyph and border fallbacks. Communicate status through text or symbols as well as color.
- Use flexible Ink layouts and `useTerminalSize()` for narrow terminals. Wrap or truncate unbounded text, including long paths and wide Unicode. For layout changes, check relevant views around 40, 80, and 120 columns and under mono/ASCII settings.
- For keyboard changes, use interaction tests to verify input capture pauses global shortcuts, closing an editor restores them, inactive controls ignore input, and one keypress triggers one action. For layout changes, use deterministic width-specific rendering tests. Preserve meaningful `--plain` output alongside interactive behavior.
