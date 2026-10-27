---
'ink-kit': minor
---

**Breaking change:** the `useAsync` callback now receives an `AbortSignal` before the run arguments — `fn(signal, ...args)` instead of `fn(...args)`. Update callbacks to accept the signal and pass it to cancellable I/O.

```tsx
// Before
const jobs = useAsync((query: string) => loadJobs(query));
// After
const jobs = useAsync((signal: AbortSignal, query: string) => loadJobs(query, signal));
```

Run arguments still come from `run(...)`; `refetch()` repeats the last arguments. See the migration snippet in `docs/ui-framework.md`.
