# Customize for your application

GitHub templates **do not automatically rename package metadata**. In a fresh repository generated from this template, initialize the identity with:

```bash
npm run init:project -- --name my-cli --description "My terminal application"
```

This updates `package.json`, the root metadata in `package-lock.json`, from which runtime identity is derived. Scoped package names such as `@example/my-cli` are supported; their executable and config name use `my-cli`. Omit `--description` to use a generated description, or add `--dry-run` to preview changes without writing files. The command is repeatable with the same identity and refuses to replace a different existing identity. It intentionally leaves `"private": true`, the application implementation and documentation untouched.

Alternatively, customize the following fields manually before publishing:

1. Change `name`, `description`, and the command key under `bin` in `package.json`.
2. Update the matching root package metadata and bin entry in `package-lock.json` (for example, regenerate the lockfile with `npm install --package-lock-only`).
3. Runtime identity derives from the executable name through `src/lib/identity.ts`. Config/log paths and the `<PREFIX>_LABEL` environment variable follow it automatically. Package scopes are omitted and punctuation becomes underscores in environment prefixes.
4. Edit the native Ink entry point in `src/app.tsx` and extend the headless command registry when needed.

The default package and executable name is `ink-kit` until you change it. See [configuration](../configuration.md) for the exact saved-file paths, rename migration and override precedence. No UI component library or runtime settings editor is bundled.

Run `npm run check:template` to find unchanged package names, command names, the package description, root lockfile metadata, and configuration identity defaults. It also runs as part of `npm run check`, including in CI. Warnings include the file and field to customize and do not fail the check, so the upstream template can keep its defaults. Documentation, examples, test fixtures, and dependency metadata are not scanned. Deleted configuration files and an absent lockfile are skipped.

## License

This template is licensed under [Apache-2.0](../../LICENSE), copyright 2026 rigerc. Preserve the license and applicable [NOTICE](../../NOTICE) attribution when redistributing template code. Review licensing for your own additions before publishing.

See [releasing](releasing.md) for packaging, versioning, and publishing setup.
