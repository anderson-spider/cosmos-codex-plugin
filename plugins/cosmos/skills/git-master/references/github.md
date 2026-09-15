# GitHub pull requests

Use this reference only for GitHub or GitHub Enterprise.

Prefer an installed `gh` client or an explicitly requested supported connector.
Bind every command to the confirmed host and `owner/repository`; inspect local
help when syntax or fields are uncertain.

Before creation, look for an open PR with the same head repository and branch
and the same base repository and branch. Report a match instead of creating a
duplicate; update it only when that mutation was explicitly requested.

Prepare the title and body from observed facts and the repository template.
When authorized, create with explicit repository, head, base, title, body, and
draft state. Store multiline content in a temporary file with literal newlines
instead of interpolating untrusted text through a shell.

After creation or update, verify the URL, number, source, target, title, body,
draft state, available mergeability, and every field changed by the operation.
Pending checks are a valid observed state, not a publication failure.
