# GitLab merge requests

Use this reference only for GitLab hosts.

Prefer the configured `glab-personal` or `glab-work` alias selected by the
environment and identity boundary, or an explicitly requested supported
connector whose host and project have been confirmed. Confirm its account when
authentication is required by the environment and identity boundary; an
anonymous public read does not require an account. Inspect installed help when
syntax or available fields are uncertain.

Before authenticated GitLab reads or mutations, prove that the selected alias
is a real non-interactive executable, then validate its auth status for the
confirmed host, current user, and explicit project. Diagnose token-variable
overrides without printing values as specified in `environment-and-identity.md`.
On failure, pause for the manual `glab auth login --hostname <host> --web
--git-protocol ssh` recovery and repeat the selected-alias preflight; never use
bare `glab` or switch aliases.

Before creation, look for an open MR with the same source project/branch and
target project/branch. A matching MR is not a duplicate to replace: report it,
or update it only when that update is authorized.

Create with `<selected-glab-alias> mr create`, where the selected alias is
`glab-personal` or `glab-work`, using explicit repository, source, target,
title, and description arguments supported by the installed version. Never
substitute bare `glab`. Write multiline descriptions to a temporary file with
literal newlines; do not interpolate untrusted description text through the
shell.

After creation, use `<selected-glab-alias> mr view` and the relevant pipeline
view with explicit host and project binding to verify the intended MR, every
field set by the operation, source, target, title, draft state, available
mergeability or conflicts, and initial pipeline state. After an update, verify
the intended MR and every changed field; inspect additional state only when
relevant to the request. A pending pipeline is valid observed state, not a
publication failure.
