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
- Small request: execute directly without opening a team or requiring a subagent.
- Unfamiliar work: Explorer or Librarian returns bounded context.
- Implementation: Executor and/or Designer, with one owner per file.
- Substantial Git, PR/MR, or CI work: Git Master receives the sibling skill path and the request's exact authorization.
- Every delegation passes authorized actions, restrictions, and effects still subject to approval; additional decisions return to the Orchestrator.
- Review: proportionate; Oracle only for difficult decisions, persistent diagnosis, or material risk. A routine independent review can use a new read-only Executor.
- Model or tool failure: record the unavailable supporting capability, avoid identical retries, and take over the work when possible. Do not confuse unavailable native delegation with absence of the skill or silently replace the distribution.

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
