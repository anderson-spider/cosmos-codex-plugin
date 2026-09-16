# Commits and publication

Use this reference for branch preparation, commits, and an authorized push.

## Establish the intended diff

Inspect the current branch, status, sanitized remotes, upstream, and repository
instructions. Resolve the target from explicit context or repository policy;
otherwise use the confirmed remote default branch. Refresh only the refs needed
for an accurate comparison, then inspect commits, tracked changes, untracked
files, conflicts, and ahead/behind state. An empty `base...HEAD` diff does not
exclude relevant uncommitted work.

Preserve pre-existing work. Stage only files and hunks owned by the task. Never
discard, stash, reset, overwrite, or combine unrelated changes merely to obtain
a clean worktree.

Follow verified branch and commit-message policy. If a new branch is required
and no naming policy exists, use `andersonsilva/` as the default prefix. An
existing authorized, non-protected task branch does not need renaming solely for
that convention. Validate the exact commit subject when the repository provides
a commit linter. Create the commit only when the user requested a commit or
publication.

## Push decision

Immediately before an authorized push, recheck the source branch, worktree,
remote, refspec, destination, upstream, and local and remote object IDs. Skip
the push when the intended refs already match.

Push only the confirmed task branch. Never push to `main`, `master`, `develop`,
a release, protected, or shared branch. Never execute or recommend `--force`.
A manual `--force-with-lease` command may be discussed only after explicit
confirmation and never for a protected or shared branch.

After publication, verify the destination ref and object ID. An ambiguous
result must be inspected before another push is attempted.
