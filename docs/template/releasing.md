# Releasing

Release automation uses [Changesets](https://github.com/changesets/changesets). It ships **switched off**:
the template itself never releases, and a copied repository must opt in.

## Modes

| `RELEASE_ENABLED` | `NPM_PUBLISH` | Result on merge to `main`                                             |
| ----------------- | ------------- | --------------------------------------------------------------------- |
| unset             | any           | Nothing runs.                                                         |
| `true`            | unset         | "Version packages" PR, then git tag + GitHub Release. No npm publish. |
| `true`            | `true`        | Same, plus `npm publish`.                                             |

Set both under **Settings -> Secrets and variables -> Actions -> Variables**.

## Included setup

The template includes Changesets v3, its configuration, and these scripts:

| Command                    | Purpose                                           |
| -------------------------- | ------------------------------------------------- |
| `npm run changeset`        | Describe a change and choose its version bump.    |
| `npm run version-packages` | Apply pending changesets and update the lockfile. |
| `npm run release`          | Build and publish unpublished versions to npm.    |
| `npm run release:tag`      | Create local git tags without publishing to npm.  |

`@changesets/cli` v3 is paired with `changesets/action@v2`, which requires kebab-case inputs (`version-script`, `publish-script`, etc.) and an explicit `github-token` input for custom tokens. See the [v2 action documentation](https://github.com/changesets/action/blob/main/README.md). The tag-only script uses `changeset git-tag` (renamed from `changeset tag`).

`"private": true` makes accidental publishing impossible until a downstream project removes it.
The scripts are not named `version`, which would collide with npm's `version` lifecycle hook.

## Day to day

```bash
npm run changeset   # describe the change, pick patch/minor/major
```

Commit the generated `.changeset/*.md` with your PR.

## Downstream checklist: versioning and tags only

1. Set the variable `RELEASE_ENABLED=true`.
2. Enable **Allow GitHub Actions to create and approve pull requests** (Settings -> Actions -> General).

## Downstream checklist: also publish to npm

1. Rename the package, `bin`, `APP_NAME` and the lockfile entries; add a `repository` field.
2. Remove `"private": true`.
3. Build and publish the first version manually (`npm run build && npm publish`). npm needs the package to exist before you can attach a trusted publisher.
4. On npmjs.com -> package -> Settings -> Trusted Publisher: add GitHub Actions, your repo, workflow file `release.yml`.
5. Set the variable `NPM_PUBLISH=true`.

`scripts/release-preflight.mjs` fails the run with a clear message if the package is still private, still named `ink-kit`, or has no `repository`.

### Token fallback

For token authentication, add an `NPM_TOKEN` secret containing a granular access token with publishing permissions. When the secret exists the workflow configures it; otherwise it uses OIDC. Trusted publishing also supports private repositories, but provenance requires a public repository and public package. See [npm's trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/).

## Gotchas

- PRs opened with the default `GITHUB_TOKEN` do not trigger other workflows, so CI will not run on the version PR. Use a GitHub App or PAT token if you need that: pass it as the `github-token` input on `changesets/action@v2` (the environment variable alone is ignored).
- `changesets/action@v2` no longer writes `~/.npmrc` automatically. The workflow points npm at a dedicated userconfig to keep token fallback separate from OIDC.
- Hardening for later: the action's v2 README recommends its individual sub-actions (version, publish) when using trusted publishing, so the publish job alone gets `id-token: write`. Verify both tag-only and npm-publish flows in a downstream opt-in repository; upstream template CI intentionally skips releases.
- Merge the version PR through your normal review and branch-protection process. The workflow does not enable automatic merging.
- Trusted publishing requires npm >= 11.5.1 and Node >= 22.14.0. The release job uses Node 24 and updates npm; regular CI stays on Node 22.
- `.templatesyncignore` excludes `release.yml` and `.changeset/config.json` from template-sync updates so downstream customization is preserved. See the [template-sync ignore documentation](https://github.com/AndreasAugustin/actions-template-sync#templatesyncignore).
- To get PR links in the changelog, switch `changelog` in `.changeset/config.json` to `["@changesets/changelog-github", {"repo": "OWNER/REPO"}]` and install that package.

## Packaging

`npm pack` creates an installable CLI tarball. Complete the [customization and licensing checklist](customization.md) before publishing to npm.
