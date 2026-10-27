---
'ink-kit': patch
---

`npm run init:project` now renames the package in pending `.changeset/*.md` files, so `changeset version` keeps working in repositories created from the template. The `useAsync` signal change is released as a minor bump while the package is below 1.0.

Update checks no longer record a failure when the user interrupts them, and a failed check keeps the last known release so an available update is still announced offline.
