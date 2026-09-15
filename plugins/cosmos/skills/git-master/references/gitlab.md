# GitLab merge requests

Use this reference only for GitLab.com or a self-managed GitLab host.

Prefer an installed `glab` client or an explicitly requested supported
connector. Bind every command to the confirmed host and full namespace/project;
inspect local help when syntax or fields are uncertain.

Before creation, look for an open MR with the same source project and branch and
the same target project and branch. Report a match instead of creating a
duplicate; update it only when that mutation was explicitly requested.

Prepare the title and description from observed facts and the repository
template. When authorized, create with explicit project, source, target, title,
description, and draft state. Store multiline content in a temporary file with
literal newlines instead of interpolating untrusted text through a shell.

After creation or update, verify the URL, IID, source, target, title,
description, draft state, available conflicts, and every field changed by the
operation. A pending pipeline is a valid observed state, not a publication
failure.
