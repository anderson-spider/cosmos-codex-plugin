# Repository Guidelines

## Project Structure & Module Organization

`cosmos/` is the distributable Codex plugin. Its manifest lives at
`cosmos/.codex-plugin/plugin.json`, while `cosmos/skills/cosmos-orchestrate/`
contains the skill instructions, UI metadata, and specialist profiles under
`references/agents/`. Keep plugin-facing documentation in `cosmos/README.md`
and validation evidence in `cosmos/VALIDATION.md`.

`demo-cosmos/` is a small Python example used to exercise the orchestration
workflow. `settings.py` is the implementation, `test_settings.py` is its test
suite, and `settings.before.txt` preserves the intentionally flawed baseline.

## Build, Test, and Development Commands

This repository has no build step or runtime dependencies. Use Python 3 for
the demo and the locally installed Codex authoring skills for validation:

```bash
python3 -m unittest discover -s demo-cosmos -v
python3 /path/to/plugin-creator/scripts/validate_plugin.py cosmos
python3 /path/to/skill-creator/scripts/quick_validate.py \
  cosmos/skills/cosmos-orchestrate
```

The first command runs all demo tests. The other commands validate the plugin
manifest and skill metadata; replace `/path/to/` with the relevant local skill
location. Run all three before submitting plugin changes.

## Coding Style & Naming Conventions

Use four-space indentation and standard-library-only Python in the demo. Name
tests `test_<behavior>` and keep functions in `snake_case`. Write Markdown in
short, actionable sections. Plugin and skill identifiers use lowercase
hyphen-case (`cosmos-orchestrate`); specialist profiles follow
`cosmos-<role>.toml`. Keep JSON and YAML indented with two spaces and TOML keys
in `snake_case`. Do not add generated caches or machine-specific paths.

## Testing Guidelines

Tests use Python's `unittest`; no coverage threshold is configured. Add focused
regression tests for every behavior change, including falsy values, nested
structures, and mutation isolation when relevant. Keep tests deterministic and
free of network or production access. Update `cosmos/VALIDATION.md` only when
the recorded evidence or limitations materially change.

## Commit & Pull Request Guidelines

The history currently uses concise, imperative summaries such as
`Initial public release of Cosmos plugin`. Continue with one purpose per commit
and avoid bundling unrelated cleanup. Pull requests should explain the user
impact, list changed plugin components, and include exact validation commands
and results. Link related issues when available. Screenshots are required only
for visible Codex UI or marketplace presentation changes.

## Security & Configuration

Never commit credentials, local marketplace state, absolute machine paths, or
installed plugin caches. Publishing, installing, or changing global Codex
configuration is outside a source-only change unless explicitly requested.
