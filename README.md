# Cosmos Codex Plugin

Cosmos adds a selective orchestration skill, a Git Master skill, and profiles
for exploration, research, design, implementation, publication, and complex
decisions to Codex.

## Marketplace installation

Add this repository as a marketplace using its public URL:

```text
https://github.com/anderson-spider/cosmos-codex-plugin
```

Then install `cosmos@cosmos` through the plugin manager. The equivalent CLI
flow is:

```bash
codex plugin marketplace add https://github.com/anderson-spider/cosmos-codex-plugin
codex plugin add cosmos@cosmos
```

Start a new conversation after installation and invoke
`$cosmos:cosmos-orchestrate` or `$cosmos:git-master`. See
[`plugins/cosmos/README.md`](plugins/cosmos/README.md) for usage details,
available profiles, behavior, and limitations.

## Versions and releases

The manual `Release` workflow uses
[Semantic Release](https://semantic-release.gitbook.io/semantic-release/) to
publish `vX.Y.Z` tags, release notes, and a `cosmos-X.Y.Z.zip` package from the
semantic changes that reached `main`. See the
[releases](https://github.com/anderson-spider/cosmos-codex-plugin/releases) to
compare versions. During publication, the version is written to the manifest
and committed automatically before the tag is created, so the tag and package
contain the same version.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the commit convention and
[RELEASING.md](RELEASING.md) for configuration, recovery, and limitations.
