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

Install the local validation dependencies with `npm ci --ignore-scripts` before
running `npm test`. The ignored lifecycle scripts keep setup from invoking
release behavior.

## Agents and recommended models

| Agent | Model | Effort |
|---|---|---|
| Orchestrator | gpt-6-sol | medium |
| Oracle | gpt-6-astra | medium |
| Librarian | gpt-6-luna | medium |
| Explorer | gpt-6-luna | low |
| Designer | gpt-6-sol | medium |
| Implementer | gpt-6-luna | high |
| 3D Modeler | gpt-6-sol | medium |
| Reviewer | gpt-6-sol | high |
| Git Master | gpt-6-luna | low |

The eight specialist presets come from their TOML profiles. **gpt-6-sol / medium**
is only a recommendation for the Orchestrator; its effective model and effort
are selected in the chat. Shipping the TOML files does not register the
specialists automatically.

When Cosmos is active, the Orchestrator routes non-trivial work to the relevant
specialists and integrates their results. It handles one isolated, clear,
low-risk action directly only when delegation overhead exceeds the action.
Unavailable native delegation or a required preset is reported as a fallback.

## Versions and releases

The manual `Release` workflow uses
[Semantic Release](https://semantic-release.gitbook.io/semantic-release/) to
publish `vX.Y.Z` tags, release notes, and a `cosmos-X.Y.Z.zip` package from the
semantic changes that reached `main`. See the
[releases](https://github.com/anderson-spider/cosmos-codex-plugin/releases) to
compare versions. During publication, the calculated version is written only
to the manifest inside the release package. The tag points to the tested `main`
commit; a following job commits only the source manifest version and pushes it
directly to `main`. If that push fails, the release remains published but the
workflow reports the synchronization failure.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the commit convention and
[RELEASING.md](RELEASING.md) for configuration, recovery, and limitations.
