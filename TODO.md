# Cosmos — prioritized improvements

## Priority criteria

- **P0 — critical:** blocks safe use, releases, or essential functionality.
- **P1 — high:** reduces material risk and should be included in the next iteration.
- **P2 — medium:** improves robustness, maintenance, and user experience.
- **P3 — low:** incremental refinement with no immediate risk.

## P0 — critical

- [ ] No confirmed critical blockers in the current state.

## P1 — high

- [x] Require every delegation to report authorized actions, applicable restrictions, and effects that still require approval.
- [x] Add automated tests for the six TOML profiles: existence, parsing, required fields, names, models, effort, and instructions.
- [x] Validate consistency between TOML profiles, the skill role contracts, and the README in CI.
- [ ] Generate the real package in CI, extract the ZIP, and run plugin and skill validators against the distributable content.
- [ ] Create a versioned behavior matrix for `@Cosmos` activation, explicit invocation, implicit discovery, continuation, and negative requests.
- [ ] Run and record a smoke test of the installed plugin in a new Codex conversation.
- [ ] Run a user-authorized, non-mutating GitHub and GitLab CLI preflight smoke test after installation; fixture coverage does not prove local credential recovery or browser fallback.

## P2 — medium

- [ ] Define the subagent lifecycle when the user interrupts the task, changes scope, or finishes early.
- [ ] Add fallback scenarios for unavailable delegation tools, unavailable models, missing agent selectors, and repeated failures.
- [x] Verify and document the difference between `$cosmos:cosmos-orchestrate` in the manifest and `$cosmos-orchestrate` in `agents/openai.yaml`.
- [ ] Validate the actual marketplace and manifest together: identity, source path, namespace, and layout.
- [ ] Create a compatibility matrix by surface and version using `verified`, `unavailable`, and `not verified` states.
- [ ] State explicitly that `sandbox_mode = "read-only"` is a requested configuration, not a guarantee against session overrides.
- [ ] Test that the Orchestrator does not finish while required work remains in active subagents.

## P3 — low

- [ ] Expand the demo with nested type conflicts: object versus scalar, object versus list, and empty dictionaries.
- [ ] Improve local setup documentation by highlighting `npm ci --ignore-scripts` before `npm test`.
- [ ] Evaluate a safe CI trigger for the automatic version-sync PR to reduce manual work after releases.
- [ ] Record date, Codex version, and environment for every behavior-matrix run.
- [ ] Measure quota, time, and rework only with equivalent task pairs and comparable quality.

## Definition of done for the next iteration

- [ ] All P1 items implemented and reviewed.
- [ ] `npm test` passes after dependency installation.
- [ ] Demo Python tests pass.
- [ ] Plugin and skill validators pass against the generated package.
- [ ] `git diff --check` passes.
- [ ] Installed smoke test recorded with limitations and observed evidence.
