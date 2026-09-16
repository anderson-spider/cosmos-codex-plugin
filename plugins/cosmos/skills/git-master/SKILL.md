---
name: git-master
description: "Prepare commits and branches, publish authorized changes, manage GitHub pull requests or GitLab merge requests, and inspect or repair CI when requested."
---

# Git Master

Handle Git publication, pull or merge requests, and CI without treating one
operation as permission for another. Default to inspection and preparation when
the requested external effect is not explicit.

## Choose the mode

- **Inspect:** report repository, branch, worktree, remote, PR/MR, or CI state.
- **Prepare:** identify the intended source branch and target, organize the task
  diff, and produce a reviewable title, description, validation summary, and
  pending actions without publishing. Create or modify local branch content only
  when task-scoped implementation is authorized.
- **Commit:** stage only task-owned changes and commit only when the user asked
  for a commit or publication.
- **Push:** publish only the confirmed non-protected task branch after explicit
  authorization for that push and destination.
- **PR/MR:** prepare, create, or update the confirmed request. Creation or update
  requires its own explicit authorization and does not authorize a push. Do not
  create a duplicate when one already exists.
- **CI:** report status, diagnose a blocker, or make a requested local correction.
  Retry, rerun, or cancellation requires separate explicit authorization.

Merge, approval, auto-merge, tags, releases, and branch deletion are outside
this skill. Never execute a force-push. A manual `--force-with-lease` recovery
may be discussed only as an exceptional user-run action after the risks and
exact target are established.

## Load only relevant guidance

- Before remote reads or mutations, read
  [environment and identity](references/environment-and-identity.md).
- For branch, commit, or push work, read
  [commits and publication](references/commits-and-publication.md).
- For GitHub PR work, read [GitHub pull requests](references/github.md).
- For GitLab MR work, read [GitLab merge requests](references/gitlab.md).
- For GitHub CI, read [GitHub checks](references/github-checks.md).
- For GitLab CI, read [GitLab pipelines](references/gitlab-pipelines.md).
- For CI fixes or external retries, read
  [CI correction and retry](references/retry-and-fix.md).

Read repository instructions and only the templates or validation documentation
needed for the selected mode.

## Authorization and evidence

Inspection and diagnosis are read-only. A request to fix CI authorizes the
smallest supported local correction and proportional validation, but not a
commit, push, PR/MR mutation, or retry unless that effect was also requested.

Bind every remote mutation to the confirmed provider, environment, host,
account when authentication matters, repository, operation, source branch, and
target. Authorization for one category never implies another. Reuse an
authorization only when all of those dimensions remain unchanged.

Use the minimum current evidence needed for the selected mode. Preserve
unrelated work, stop before publication when identity or destination conflicts,
and verify every completed mutation against the same explicit target. If a
result is ambiguous, inspect before retrying so duplicate requests or repeated
effects are not created.

Follow verified repository templates and title rules. For GitLab merge requests,
always write the description in Brazilian Portuguese. For GitHub pull requests,
write the body in English unless verified repository policy requires another
language. When no title language or format is defined, use English and use
Conventional Commit style only when the repository uses it. Include observed
validation results, name material checks not run, and omit AI attribution and
emojis. Add reviewers, labels, and assignees only when requested or required by
verified repository policy.

## Deterministic CLI preflight and recovery

Before **any authenticated remote read or mutation**, establish the operation
and its exact authorization, provider, environment, host, full project path,
expected account, and selected CLI. Then run the provider's CLI preflight in
that order. Do not treat an attempted read as the preflight.

The optional read-only helper `../../scripts/git-master-doctor.sh` records the
same boundary without printing credentials. Pass every context field, including
the operation and authorization; it returns one of `cli_missing`,
`environment_token_invalid`, `stored_credential_invalid`, `wrong_account`,
`wrong_host`, `project_mismatch`, or `ready`. It is a diagnostic aid, not
authorization for the next operation.

On a failed preflight, stop authenticated reads and all mutations. State the
status, the confirmed context, and the next manual action. Do not inspect token
values, credential files, cookies, keychains, or `gh auth token --show-token`.
After a manual recovery, repeat CLI presence, authentication, current-user
identity, host, and explicit project validation before resuming.

Browser or plugin access is a fallback only when the required CLI is missing or
CLI recovery is genuinely blocked. Reconfirm provider, environment, host,
project, and required account in that surface; obtain exact approval again for
each mutation and message. Never silently switch an account, host, credential,
or GitLab alias to make a request work.
