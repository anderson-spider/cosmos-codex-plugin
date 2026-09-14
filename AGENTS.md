# Repository Guidelines

## Project Structure & Module Organization

`plugins/cosmos/` is the distributable Codex plugin. Its manifest lives at
`plugins/cosmos/.codex-plugin/plugin.json`, while `plugins/cosmos/skills/cosmos-orchestrate/`
contains the skill instructions, UI metadata, and specialist profiles under
`references/agents/`. Keep plugin-facing documentation in `plugins/cosmos/README.md`
and validation evidence in `plugins/cosmos/VALIDATION.md`. The repository marketplace
manifest is `.agents/plugins/marketplace.json`.

`demo-cosmos/` is a small Python example used to exercise the orchestration
workflow. `settings.py` is the implementation, `test_settings.py` is its test
suite, and `settings.before.txt` preserves the intentionally flawed baseline.

## Build, Test, and Development Commands

The distributed plugin has no runtime dependencies. Release tooling uses
Node.js 24.10+ and Python 3.12. Install tooling with `npm ci --ignore-scripts`.
Use the locally installed Codex authoring skills for plugin validation:

```bash
python3 -m unittest discover -s demo-cosmos -v
npm test
npm run lint:commits -- --from origin/main --to HEAD --verbose
python3 /path/to/plugin-creator/scripts/validate_plugin.py plugins/cosmos
python3 /path/to/skill-creator/scripts/quick_validate.py \
  plugins/cosmos/skills/cosmos-orchestrate
```

Run the demo tests, release-tooling tests, commit lint, and both authoring
validators before submitting plugin changes. Replace `/path/to/` with the
relevant local skill location. `npm test` uses local fixtures and mocked APIs;
it must not publish releases or contact production services.

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
free of network or production access. Update `plugins/cosmos/VALIDATION.md` only when
the recorded evidence or limitations materially change.

## Commit & Pull Request Guidelines

Use Conventional Commits for new commits and PR titles, such as
`feat(plugin): add semantic release automation`. Follow `CONTRIBUTING.md`;
do not rewrite historical commits. Keep one purpose per commit and avoid
bundling unrelated cleanup. Pull requests should explain the user
impact, list changed plugin components, and include exact validation commands
and results. Link related issues when available. Screenshots are required only
for visible Codex UI or marketplace presentation changes.

## Security & Configuration

Never commit credentials, local marketplace state, absolute machine paths, or
installed plugin caches. Publishing, installing, or changing global Codex
configuration is outside a source-only change unless explicitly requested.
