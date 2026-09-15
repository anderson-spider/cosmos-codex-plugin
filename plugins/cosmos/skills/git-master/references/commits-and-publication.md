# Commits and publication

Use this reference for branch preparation, commits, and an authorized push.

## Establish the intended diff

Inspect repository instructions, branch, status, sanitized remotes, upstream,
tracked and untracked changes, conflicts, and ahead or behind state. Refresh
only the refs required for an accurate comparison. An empty `base...HEAD` diff
does not exclude relevant uncommitted work.

Preserve pre-existing work. Stage only files and hunks owned by the task. Never
discard, stash, reset, overwrite, or combine unrelated changes merely to obtain
a clean worktree.

Follow verified branch and commit-message policy. If a new branch is required
and no naming policy exists, propose a short descriptive name without assuming
a personal namespace. Validate the exact commit subject when the repository
provides a commit linter. Create the commit only when the user requested a
commit or publication.

## Push decision

Immediately before an authorized push, recheck the source branch, worktree,
remote, refspec, destination, upstream, and local and remote object IDs. Skip
the push when the intended refs already match.

Push only the confirmed task branch. Never push directly to a default,
protected, shared, or release branch and never execute a force-push. If history
rewriting makes publication impossible, stop and explain the manual recovery
options; `--force-with-lease` may be discussed but not executed by this skill.

After publication, verify the destination ref and object ID. An ambiguous
result must be inspected before another push is attempted.
