# CI correction and external effects

Use this reference only when the user requests a correction or when a retry,
rerun, cancellation, metadata change, or push is being considered.

## Local correction

Reconcile the intended checkout with the remote PR/MR source branch and head
SHA. Inspect status, current branch, sanitized remotes, and pre-existing work
before editing. Preserve unrelated changes.

Make only task-scoped changes supported by the diagnosis. Run proportional
validation and fix failures caused by the change. A local fix is a valid
completed outcome when publication was not authorized; report the exact pending
push or remote validation rather than treating it as an incomplete local edit.

## Retry decision

Do not retry blindly. Retry only after the cause is addressed or when evidence
supports a flaky or infrastructure failure. Cancellation always requires an
explicit request. Scope every external operation to the confirmed host, project,
run or pipeline, and branch.

After an authorized rerun, retry, metadata change, or push, observe the new
remote state. If the command result is ambiguous, query that same target before
repeating the mutation. Monitor for a bounded period and report pending state
when completion has not yet been observed.
