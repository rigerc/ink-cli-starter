# Keep your copy in sync with this template

Repositories created from this template include [the template sync workflow](../../.github/workflows/template-sync.yml), but syncing is **manual by default**. Run it when you want to check `rigerc/ink-cli-starter` for updates and open a reviewable pull request. The workflow skips the upstream template repository itself.

To opt into automatic monthly checks, add this trigger alongside `workflow_dispatch` in your downstream `.github/workflows/template-sync.yml`:

```yaml
  schedule:
    - cron: '17 3 1 * *'
```

Workflow files are downstream-owned, so this setting is not overwritten by template sync.

**Setup in your generated repository:** The upstream `rigerc/ink-cli-starter` repository is public, so no source access token is needed. The workflow uses the built-in `GITHUB_TOKEN` by default to read the template and open sync pull requests.

1. Under **Settings → Actions → General → Workflow permissions**, enable **Allow GitHub Actions to create and approve pull requests**.
2. **Optional token:** Add a `TEMPLATE_SYNC_TARGET_TOKEN` secret under **Settings → Secrets and variables → Actions** if you need to use your own token. Workflow files are excluded by default and should be updated manually. If you deliberately allow workflow-file sync, the token needs **Contents: write**, **Pull requests: write**, and **Workflows: write** permissions; the default `GITHUB_TOKEN` cannot push those changes.

The workflow automatically uses `TEMPLATE_SYNC_TARGET_TOKEN` when provided and falls back to `GITHUB_TOKEN` otherwise. Go to **Actions → Sync upstream template → Run workflow** to trigger a sync manually. Review any created PR before merging: upstream updates may touch files you have customized. See [actions-template-sync documentation](https://github.com/marketplace/actions/actions-template-sync) for additional authentication or file-exclusion options.

## Changelogs in sync pull requests

After the action creates a PR, [the changelog helper](../../scripts/template-sync-changelog.mjs) updates its description with:

- **Applied changes:** files added, modified, deleted, or renamed in the guarded sync commit, after downstream exclusions have been restored. The Files changed tab remains the complete diff.
- **Upstream changelog:** linked commit subjects since the last accepted upstream revision. This includes upstream changes to excluded files; it describes upstream context, not just changes applied to your application.
- **Manual adoption:** reminders to review excluded dependency, script, workflow, release, and application changes separately.

The helper uses the action's documented [`pr_number`, `pr_branch`, and `template_git_hash` outputs](https://github.com/AndreasAugustin/actions-template-sync/tree/v2#action-outputs). It runs only when a PR was created. No changes or an already-existing sync branch normally produce no PR number, so rerunning the workflow does not refresh an existing PR's description.

Each enriched PR records the full upstream commit SHA in a hidden `<!-- template-sync:rigerc/ink-cli-starter@SHA -->` marker. Keep this marker in the description: subsequent runs look through closed PRs for the latest merged sync PR with a matching source marker, target branch, and downstream repository. Its merge commit must be an ancestor of the downstream commit saved before pulling. This works with squash merges and unrelated template history; it does not use upstream commits as downstream ancestors. Checkout uses full history for this check.

On the first run, or when no accepted marker is available, the description says that a commit range cannot be established and records the current upstream revision for future syncs. Older PRs without a marker are not guessed from titles or branch names. Deleted upstream revisions and diverged or backward-moving history are reported with a comparison link instead of an unreliable commit list.

Descriptions show at most 50 files and 50 commits, with additional size limits and links to the full diff and upstream comparison. Long filenames and subjects are shortened. Authentication, API, or description-update failures fail the changelog step; the already-created PR retains its initial description and the guarded sync commit remains available for review. After correcting the problem, regenerate the sync PR to retry enrichment because the action normally skips an existing branch.

To adopt this in an existing repository, copy `scripts/template-sync-changelog.mjs` and manually update `.github/workflows/template-sync.yml`, including full-history checkout, the helper copy into `RUNNER_TEMP`, the action step ID and initial `pr_body`, and the follow-up changelog step. Use the same target token as the sync action. No new dependencies, permissions, or ownership exclusions are needed. The helper is saved before pulling so incoming template changes cannot replace the code used to update the current PR.

## Files owned by your application

[`.templatesyncignore`](../../.templatesyncignore) protects package metadata, the README, `.gitignore`, application composition and screens, configuration and branding, related integration tests, and release setup. Downstream ignore rules are preserved even when upstream changes conflict. Reusable components, hooks, utilities, and tooling remain eligible for sync. Review upstream dependency and npm script changes manually because package files are excluded as a whole.

Existing copies must adopt ignore changes manually: the action preserves the downstream ignore file instead of syncing it. Changing the ignore file does not rewrite an existing sync branch; review or regenerate that branch before merging.

## Conflict and commit guards

The workflow uses the action's [lifecycle hooks](https://github.com/AndreasAugustin/actions-template-sync#lifecycle-hooks) with [a local guard](../../scripts/template-sync-guard.mjs):

1. Before pulling, save the clean downstream commit, exclusions, and a copy of the guard in `RUNNER_TEMP`, outside the checkout. Incoming changes cannot replace the guard or its saved exclusions during that run.
2. Merge without the action's default `-X theirs` option. The action continues after pull failures, so this option change alone is insufficient to stop conflicts.
3. In `precommit`, before the action stages files, restore excluded paths to their downstream state, including downstream deletions. Stop if shared files remain unmerged or the merge leaves unexpected untracked files. A detected rename involving a protected source or destination stops the sync for manual review.
4. In `prepush`, require a single sync commit on top of the saved downstream commit, a clean checkout, and no changes to excluded paths. If verification fails, nothing is pushed and no PR is opened.

These checks preserve declared exclusions and stop unresolved conflicts. They do not identify every downstream customization: Git can merge nonconflicting changes into a customized shared file. Add that file to `.templatesyncignore` if it should be maintained entirely by your application. Review each sync PR before merging.

Repositories created with GitHub's template feature can have unrelated history. Without a common ancestor, Git may report an add/add conflict even for an upstream update to a shared file you never customized. The guard stops those conflicts too; apply the desired update manually instead of restoring `-X theirs` to bypass the check.

To adopt the guards in an existing repository, copy `scripts/template-sync-guard.mjs`, manually update `.github/workflows/template-sync.yml`, and update your downstream exclusions. Both workflow files and the ignore file are protected from automatic updates. Review or regenerate any existing sync branch; the action does not replace it by default.
