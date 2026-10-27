---
'ink-kit': patch
---

Hardening fixes across the CLI:

- `example` reads stdin only for the explicit `-` argument; an open stdin no longer hangs the command.
- The interactive PTY suite skips with a logged reason when `node-pty` cannot load (now an optional dependency), while CI keeps it required on Linux Node 24 via `REQUIRE_PTY=1`.
- Failed update checks write a one-hour failure marker so offline launches no longer pay the one-second timeout on every start, and the `--help` environment block lists the opt-in `<PREFIX>_UPDATE_NOTIFIER=1` alongside `NO_UPDATE_NOTIFIER` with columns aligned to the longest name.
- `useRouter` memoizes its typed `push`/`replace` wrappers, keeping the returned object stable between renders.
- The logger redacts `Map` and `Set` values and truncates oversized log lines at UTF-8 boundaries; a bare `config` group invocation now prints help and exits 2 instead of 0.
