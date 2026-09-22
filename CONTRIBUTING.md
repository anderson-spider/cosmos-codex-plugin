# Contributing

## Commits and pull requests

Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) for
commits and PR titles:

```text
fix(orchestrate): preserve specialist context
feat(plugin): add a new specialist
docs: explain local installation
feat(plugin)!: replace the orchestration interface
```

The parenthesized scope is optional. Use a short, concrete description in
English. Breaking changes use `!` or a `BREAKING CHANGE: description` footer.

| Type | Effect on the next release |
| --- | --- |
| `fix:` | Patch, for example `1.0.0` → `1.0.1` |
| `perf:` | Patch |
| `feat:` | Minor, for example `1.0.0` → `1.1.0` |
| `!` or `BREAKING CHANGE:` | Major, for example `1.0.0` → `2.0.0` |
| `docs:`, `chore:`, `test:`, `ci:`, and other accepted types | No release unless the change is breaking |

Semantic Release uses the largest increment among unpublished commits when a
maintainer manually runs the `Release` workflow. Do not increment versions
manually. Prefer **Squash and merge**, preserving the semantic PR title and any
breaking-change footers. A regular merge also works with semantic commits; the
automatic merge message is ignored. Preserve the convention when editing the
title or final message on GitHub.

The `Validate` job checks the title and commits introduced by the PR. Manual
changes to the manifest version require a corresponding existing tag and cannot
lower the base version. Semantic Release versions the attached plugin package;
the release workflow commits the source manifest directly to `main` after
publication. To require validation of contributor changes, configure a `main`
protection rule for PRs with an up-to-date `Validate` check. Such a rule must
allow the release automation's direct manifest push, or synchronization will fail.
Do not rewrite old history to conform to the convention.

## Local validation

Use Node.js 24.10 or later and Python 3.12:

```bash
npm ci --ignore-scripts
npm test
printf '%s\n' 'feat(plugin): add a new specialist' | npm run lint:commits
npm run lint:commits -- --from origin/main --to HEAD --verbose
python3 -m unittest discover -s demo-cosmos -v
```

For plugin changes, also run the authoring validators described in `AGENTS.md`.
Node dependencies belong only to this repository's automation; the installed
plugin does not require Node.js or npm.
