# Cosmos — minimal local version

A plugin with two automatically discoverable skills and six internal specialist profiles. It uses native subagent tools available in the session. It has no MCP, hooks, persistent process, ChatGPT Web automation, or session bridge.

## Use without installing

Open the project where you want to work, select **gpt-5.6-sol / low**, and ask Codex:

> Read the skill at the absolute path `<plugin-folder>/skills/cosmos-orchestrate/SKILL.md` and use that workflow for [request].

Replace the path with the location where this package was saved. Explicit reading lets you use the instructions without registering the plugin. The skill does not change the conversation model; select it in the app. Specialists can receive an explicit model and effort when the native tool permits it. If there is a limitation, the agent must report the deviation and work directly.

After installation and the start of a new session, you can invoke the workflow with `@Cosmos` or `$cosmos:cosmos-orchestrate` when those forms are available on the Codex surface in use. The skill can also be discovered automatically when the request mentions Cosmos or explicitly asks for the Cosmos workflow. Ordinary development requests or requests to use subagents are not intended triggers; this boundary must be confirmed by the activation matrix in `VALIDATION.md`. Displayed names and syntax may vary across surfaces and versions, so use the option visible in your environment. Marketplace registration and installation are local user settings and are not part of this repository.

To work directly with commits, branches, pushes, pull requests, merge requests,
or CI, invoke `$cosmos:git-master`. This skill can also be discovered
automatically by requests in its domain. It prepares work without assuming
authorization: commit, push, PR/MR mutation, and CI retry are separate effects.
Merge, approval, auto-merge, tags, releases, and branch deletion are outside its scope.

GitLab operations preserve the configured account boundary: personal projects
use `glab-personal`, work projects use `glab-work`, and the skill does not fall
back to bare `glab` or silently switch aliases. The selected alias, host, project,
and account when required must agree before authenticated reads or mutations.

Git Master is CLI-first for authenticated GitHub and GitLab work. Before those
reads or mutations it validates the executable, authentication, expected account,
host, explicit project, operation, and authorization. Its included read-only
`scripts/git-master-doctor.sh` reports only a safe status; it never prints token
values. A failed CLI recovery pauses for the user to run the documented web/SSH
login command, then repeats the full preflight. Browser or plugin access is only
a blocked-CLI fallback and must retain the same confirmed context.

Interface files intentionally use different names. Plugin manifest prompts use
`$cosmos:cosmos-orchestrate` because `cosmos` is the installed component
namespace; the Git shortcut uses `$cosmos:git-master`. Each `agents/openai.yaml`
uses the local name declared by the skill itself: `$cosmos-orchestrate` or
`$git-master`. Separate tests protect these contracts.

## Optional profiles

The six TOML files are in `skills/cosmos-orchestrate/references/agents/`. They are internal skill roles and optional custom-agent templates: they do not appear in the `@` selector, and including them in the plugin does not register them with Codex. With the skill loaded, the conversation's primary agent acts as Orchestrator using the model selected in the chat; **gpt-5.6-sol / low** is the recommended configuration, not an automatic model change.

| Role | Model | Effort |
|---|---|---|
| Oracle | gpt-6-astra | low |
| Librarian | gpt-5.6-luna | medium |
| Explorer | gpt-5.6-luna | medium |
| Designer | gpt-5.6-terra | medium |
| Executor | gpt-5.6-terra | medium |
| Git Master | gpt-5.6-luna | medium |

Official documentation provides `.codex/agents/` for project profiles and `~/.codex/agents/` for personal profiles. If registered names are desired, a later authorized step can copy the TOML files to the selected project after checking for name and file collisions. This package has no installer and does not modify those destinations. The `cosmos-` prefix prevents accidentally replacing the native `explorer` agent.

Fixed profiles can override the model or effort passed during creation. The skill directs the Orchestrator to use generic creation with the role instructions when increased effort is required. Read permissions in the profiles are defaults; session overrides can prevail. Read-only instructions remain part of the contract without promising rigid isolation.

## Behavior

- Skill loaded: Cosmos is active; it must not claim that there is no linked or actionable skill.
- First update: state "Cosmos is active" and say whether it will proceed directly or delegate.
- Direct execution: only when the entire request is one isolated, clear, already located, low-risk action and delegation overhead exceeds execution.
- Delegation Check: separate discovery, research, decisions, implementation, visual work, and Git or CI effects before substantive work; dispatch independent lanes in parallel and serialize dependencies or overlapping resources.
- Concurrency budget: default to at most two simultaneous specialists and use more only for demonstrably independent lanes whose benefit justifies the quota cost; available slots are not a target.
- Explorer: broad or uncertain local discovery. Librarian: external, current, or version-specific sources. Oracle: consequential architecture, material risk, or persistent diagnosis.
- Implementation: Executor owns bounded non-trivial work; Designer owns visual and interaction judgment, with one owner per file and later mechanical work preserving the design intent.
- Git Master: every requested commit, push, branch publication, PR/MR mutation, or CI correction receives the sibling skill path and the request's exact authorization. A single read-only Git lookup can remain direct.
- Every delegation passes authorized actions, restrictions, and effects still subject to approval; additional decisions return to the Orchestrator.
- Every delegation names the allowed file scope and validation owner. Review remains proportionate; a routine independent review can use a new read-only Executor.
- Implementation, verification, and independent review use distinct contracts. A verifier edits tests only when explicitly authorized, while an independent reviewer remains read-only and reports findings instead of fixing them.
- Completion gate: account for delegate failures, returned decisions, inspected outputs, validation, material review findings, unauthorized effects, skipped phases, and preset deviations before reporting completion.
- Delegate lifecycle: track active, completed, blocked, failed, and cancelled lanes; reconcile scope changes, stop superseded or idle work when supported, and never finish while required work remains active.
- Result integration: accept, correct, or reject every delegated result with evidence; resolve disagreements against actual files or sources before implementation.
- Model or tool failure: record the unavailable supporting capability, avoid identical retries, and take over the work when possible. Do not confuse unavailable native delegation with absence of the skill or silently replace the distribution.

These rules are a tested orchestration contract, not a runtime semantic classifier. The Orchestrator still applies the routing criteria. The TOML profiles remain optional templates rather than automatically registered agents, and session-level configuration can override requested read-only settings.

## Verification and limitations

The published version appears in repository tags and releases. The
`cosmos-X.Y.Z.zip` attachment contains the manifest with that version; the copy
on `main` is synchronized by an automatic PR after publication. See the
[release guide](https://github.com/anderson-spider/cosmos-codex-plugin/blob/main/RELEASING.md)
for the workflow and update limitations.

See `VALIDATION.md` for evidence for this version. The package was inspired by the role division in [oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim); its instructions were written for Codex without copying the OpenCode runtime.

Sources verified on 2026-09-14:

- [Subagents and TOML profiles](https://learn.chatgpt.com/docs/agent-configuration/subagents).
- [Plugins](https://learn.chatgpt.com/docs/plugins).
- [Codex usage and limits](https://learn.chatgpt.com/docs/pricing).

## Compare quota, time, and rework

Run pairs of equivalent tasks from the same initial state: one direct run with Sol low and one with this skill. Use small tasks, a multi-file change, and a diagnosis; alternate the run order. Do not run other work on the account during each measurement if you want to attribute the difference to the test.

Record the effective model and effort, start and end times, five-hour and weekly quota before and after (including reset time), agents used, passing tests, later corrections, and defects found during review. Discard comparisons that cross a reset or mix in other account tasks. Displayed percentages may be rounded; very small differences are inconclusive.

Tokens reported by tools do not directly equal a subscription percentage. Compare **quota per completed task at equivalent quality**, together with time and rework, across several pairs. A synthetic example demonstrates functionality, not savings. This version does not measure or promise a savings percentage.

### Local usage summary

`scripts/cosmos-usage.py` reads rollout metadata already stored under `~/.codex/sessions` and summarizes threads, roles, models, effort, duration, token counters, and available rate-limit movement. It is standard-library-only and read-only. It does not emit prompts, messages, working directories, session file paths, or other conversation content.

```bash
python3 scripts/cosmos-usage.py --list --date 2026-09-16
python3 scripts/cosmos-usage.py --latest --date 2026-09-16
python3 scripts/cosmos-usage.py --session <root-id-or-unique-prefix> --format json
```

Use `--sessions-dir` only to point at another rollout directory or a synthetic test fixture. `--date` selects the corresponding rollout-storage day. JSON output is intended for local comparisons; review it before sharing because thread IDs and model names remain present. The report includes path-free counts for invalid lines, invalid rollouts, duplicates, and unreadable inputs; warnings never identify session files. When cumulative and incremental token records coexist, the latest cumulative total wins to prevent double counting. Token totals describe recorded model usage, not billing, subscription percentage, quality, or savings.
