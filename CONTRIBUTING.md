# Contributing

1. Use Node.js 22+; install dependencies with `npm install`.
2. Run `npm run check` before submitting changes.
3. Preview `npm run demo` in an interactive terminal.
4. Test 40-column layouts, `NO_COLOR=1`, `NO_UNICODE=1`, and `NO_MOTION=1`.
5. Keep semantic colors in the design system; preserve meaningful labels.
6. Review registry component changes rather than blindly replacing local customizations.
7. Update the documentation for new commands, props or shortcuts, and preserve upstream MIT attribution.

The first successful npm install should generate `package-lock.json`; commit it and switch CI to `npm ci` for repeatable installs.
