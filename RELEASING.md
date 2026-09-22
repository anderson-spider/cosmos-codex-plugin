# Cosmos releases

## Workflow

1. The author uses Conventional Commits and a semantic PR title.
2. CI validates commits, the title, and tests.
3. A maintainer opens **Actions → Release → Run workflow** on `main`.
4. The workflow tests the code and runs Semantic Release. `fix`/`perf` commits
   produce a patch, `feat` produces a minor release, and breaking changes produce
   a major release. Without relevant commits, there is no release.
5. During `prepare`, the calculated version is written only to the manifest in
   `cosmos-X.Y.Z.zip`. The package preserves the marketplace layout, including
   `.agents/plugins/marketplace.json`, and the checkout remains unchanged.
6. Semantic Release tags the tested `main` commit and publishes the release with
   notes and the package.
7. A following job verifies the latest stable release and pushes a commit with
   only the synchronized source manifest directly to `main`. It opens no PR.

The trigger is exclusively manual and nothing is published to npm. The tag and
GitHub-generated source archive identify the tested commit and may contain the
previous source-manifest version; the attached Cosmos ZIP is the versioned plugin
artifact. The workflow serializes publications and processes the latest `main`.
If synchronization fails, the published release remains available, but the
workflow reports a failed job. Running the workflow again reconciles the latest
published stable release even when Semantic Release has no new version to publish.

## First release

The repository had `0.1.0` in the manifest but no SemVer tag when this automation
was introduced. By default, the first Semantic Release publication will be
`1.0.0`. Old history remains intact and does not need conversion. Published tags
become the version calculation reference afterward.

## GitHub configuration

GitHub Actions must be enabled. The workflow uses `GITHUB_TOKEN` with
`contents: write` for the tag, release, and manifest-only push to `main`.
Semantic Release may perform a non-mutating push dry run while verifying
authentication. The synchronization push is a normal fast-forward push; it does
not force-update `main`. If `main` advances while the job is running, the push
fails and a new manual run can reconcile it. Active branch protection or rulesets
must permit the GitHub Actions token to push the manifest commit, or the
synchronization job will fail.

GitHub does not start a new `push` workflow when a workflow pushes with its
`GITHUB_TOKEN`. The release job runs tests before publication; the manifest-only
commit does not receive a separate `Validate` run from that push.

In **Settings → Rules → Rulesets**, make the `Validate` check required for
contributor PRs to `main` and require an up-to-date branch. If a rule also
restricts direct updates, configure an explicit bypass for the release automation
or the requested manifest synchronization cannot push. Prefer squash with the PR
title; preserve the semantic type and breaking-change marker when editing the
final message. Workflow files do not apply these administrative settings.

## Recovery

Fix the configuration or failure and run the manual workflow again. Semantic Release
checks existing tags and does not republish a completed version. Confirm that the
latest release and ZIP are correct before retrying a failed manifest push.

A failure between tag creation and GitHub publication requires inspection:
Semantic Release may consider the tag already released on a new run. Do not
delete or move tags automatically. Check logs, the tagged commit, and existing
assets before manually recovering an incomplete release.

## Evidence and references

Local tests use the real analyzer and Commitlint, temporary files, and mocked
APIs. They do not perform remote publication. The first merge is required to
validate complete publication with the GitHub Actions token.

- [Semantic Release configuration](https://semantic-release.gitbook.io/semantic-release/usage/configuration)
- [GitHub publication and permissions](https://github.com/semantic-release/github)
- [GitHub Actions token workflow triggers](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow)
- [Commitlint in CI](https://commitlint.js.org/guides/ci-setup.html)
