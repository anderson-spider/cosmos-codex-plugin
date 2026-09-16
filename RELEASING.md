# Cosmos releases

## Workflow

1. The author uses Conventional Commits and a semantic PR title.
2. CI validates commits, the title, and tests.
3. A maintainer opens **Actions → Release → Run workflow** on `main`.
4. The workflow tests the code and runs Semantic Release. `fix`/`perf` commits
   produce a patch, `feat` produces a minor release, and breaking changes produce
   a major release. Without relevant commits, there is no release.
5. During `prepare`, the calculated version is written to the source manifest and
   the `cosmos-X.Y.Z.zip` package. The package preserves the marketplace layout,
   including `.agents/plugins/marketplace.json`.
6. `@semantic-release/git` creates and pushes the `chore(release)` commit with the
   manifest. Semantic Release then creates a tag pointing to that commit and
   publishes the release with notes and the package.

The trigger is exclusively manual and nothing is published to npm. The manifest
is updated before the tag because that is the order of the Semantic Release
`prepare` lifecycle; the tag, source code, and ZIP therefore record the same
version. The workflow serializes publications and processes the latest `main`.
The `chore(release)` commit does not produce another increment.

## First release

The repository had `0.1.0` in the manifest but no SemVer tag when this automation
was introduced. By default, the first Semantic Release publication will be
`1.0.0`. Old history remains intact and does not need conversion. Published tags
become the version calculation reference afterward.

## GitHub configuration

GitHub Actions must be enabled. The workflow uses `GITHUB_TOKEN` with
`contents: write` for the commit, tag, and release. A PAT is unnecessary as long
as `main` rules permit this GitHub Actions push. If branch protection blocks the
automatic commit, the run fails before the tag and the rule or authorized actor
must be adjusted.

In **Settings → Rules → Rulesets**, make the `Validate` check required for PRs to
`main` and require an up-to-date branch. Prefer squash with the PR title; preserve
the semantic type and breaking-change marker when editing the final message.
Workflow files do not apply these administrative settings.

## Recovery

Fix the permission or failure and run the manual workflow again. Semantic Release
checks existing tags and does not republish a completed version.

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
- [Commitlint in CI](https://commitlint.js.org/guides/ci-setup.html)
