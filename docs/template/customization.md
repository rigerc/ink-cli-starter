# Customize for your application

GitHub templates **do not automatically rename package metadata**. Before publishing the copied application:

1. Change `name`, `description`, and the command key under `bin` in `package.json`.
2. Update the matching root package metadata and bin entry in `package-lock.json` (for example, regenerate the lockfile with `npm install --package-lock-only`).
3. Change `APP_NAME` in `src/lib/config.ts` and the `appName` defaults in `src/config/store.ts` to the new command name. This controls the user config directory and the `<APP_NAME>_THEME` environment variable.
4. Replace the sample Home content and extend the screen/command registries.

The default package and executable name is `ink-kit` until you change it. The `src/` component library is maintained as source in your own repository, not installed as a separate UI package.

Run `npm run check:template` to find unchanged package names, command names, the package description, root lockfile metadata, and configuration identity defaults. It also runs as part of `npm run check`, including in CI. Warnings include the file and field to customize and do not fail the check, so the upstream template can keep its defaults. Documentation, examples, test fixtures, and dependency metadata are not scanned. Deleted configuration files and an absent lockfile are skipped.

## License

Choose a license for your new project before distributing it. This template repository does not currently include a `LICENSE` file.

See [releasing](releasing.md) for packaging, versioning, and publishing setup.
