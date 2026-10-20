# Accessibility and terminal support

- The demo supports arrows, h/l, numeric shortcuts and q/Escape. `useInput` activates only when both input and output are TTYs.
- Default and doctor commands work without raw terminal mode. Demo prints a static preview in CI or pipes.
- Preserve termcn/Ink `aria-label`, `aria-role` and `aria-state` where applicable. Status colors always have readable text labels.
- Check 40-column output and avoid very long labels inside cards.
- Test `NO_COLOR=1` and the monochrome theme; do not communicate state through hue alone.
- `NO_UNICODE=1` uses supported ASCII fallbacks in termcn's hooks and glyph helpers.
- `NO_MOTION=1` and `CI=true` reduce animation; unmount timed components cleanly.
- Do not log directly from frequently rerendered Ink components.

String-render tests are smoke tests, not a substitute for manual keyboard and screen-reader review.
