# Keep your copy in sync with this template

Repositories created from this template include [the template sync workflow](../../.github/workflows/template-sync.yml). It checks `rigerc/ink-cli-starter` for updates on the first day of each month at 03:17 UTC, or when manually started, and opens a pull request with proposed changes. The workflow skips the upstream template repository itself.

**Setup in your generated repository:** The upstream `rigerc/ink-cli-starter` repository is public, so no source access token is needed. The workflow uses the built-in `GITHUB_TOKEN` by default to read the template and open sync pull requests.

1. Under **Settings → Actions → General → Workflow permissions**, enable **Allow GitHub Actions to create and approve pull requests**.
2. **Optional for workflow-file updates:** Add a `TEMPLATE_SYNC_TARGET_TOKEN` secret under **Settings → Secrets and variables → Actions**, using a repository-scoped fine-grained personal access token with **Contents: write**, **Pull requests: write**, and **Workflows: write** permissions for your generated repository. The default `GITHUB_TOKEN` cannot push updates to `.github/workflows/`, so a sync that includes workflow-file changes may fail without this secret.

The workflow automatically uses `TEMPLATE_SYNC_TARGET_TOKEN` when provided and falls back to `GITHUB_TOKEN` otherwise. Go to **Actions → Sync upstream template → Run workflow** to trigger a sync manually. Review any created PR before merging: upstream updates may touch files you have customized. See [actions-template-sync documentation](https://github.com/marketplace/actions/actions-template-sync) for additional authentication or file-exclusion options.

## Files owned by your application

[`.templatesyncignore`](../../.templatesyncignore) protects package metadata, the README, application composition and screens, configuration and branding, related integration tests, and release setup. Reusable components, hooks, utilities, and tooling remain eligible for sync. Review upstream dependency and npm script changes manually because package files are excluded as a whole.

Existing copies must adopt ignore changes manually: the action preserves the downstream ignore file instead of syncing it. Changing the ignore file does not rewrite an existing sync branch; review or regenerate that branch before merging.
