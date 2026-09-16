# GitHub pull requests

Use this reference only for GitHub or GitHub Enterprise.

Prefer the installed `gh` client or an explicitly requested supported connector
whose host and project have been confirmed. Confirm its account when
authentication is required by the environment and identity boundary; an
anonymous public read does not require an account. Inspect installed help when
syntax or available fields are uncertain.

Before an authenticated GitHub read or mutation, complete the CLI-first
preflight in `environment-and-identity.md`: `gh` executable, `gh auth status
--hostname <host>`, current user through `gh api user --hostname <host>`, and
the explicit project through `gh api repos/<owner>/<repo> --hostname <host>`.
If environment token overrides cause auth failure, retry with `GH_TOKEN` and
`GITHUB_TOKEN` unset; never reveal them. Recover only with the documented
manual `gh auth login --hostname <host> --web --git-protocol ssh` and revalidate
before resuming.

Before creation, look for an open PR with the same head repository/branch and
base repository/branch. A matching PR is not a duplicate to replace: report it,
or update it only when that update is authorized.

Create with `gh pr create` using explicit repository, head, base, title, and body
arguments supported by the installed version. Write multiline descriptions to a
temporary file with literal newlines; do not interpolate untrusted description
text through the shell.

After creation, use `gh pr view` and `gh pr checks` with explicit repository
binding to verify the intended PR, every field set by the operation, source,
target, title, draft state, available mergeability or conflicts, and initial
checks. After an update, verify the intended PR and every changed field; inspect
additional state only when relevant to the request. Pending checks are valid
observed state, not a publication failure.
