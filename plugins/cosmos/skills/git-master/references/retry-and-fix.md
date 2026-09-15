# CI correction and retry

Use this reference when a CI correction, retry, rerun, cancellation, metadata
change, or follow-up publication is being considered.

## Local correction

Reconcile the checkout with the remote PR/MR source branch and head SHA.
Inspect repository state and pre-existing work before editing. Make only the
smallest task-scoped change supported by the diagnosis and run proportional
validation. Fix failures introduced by that change.

A local correction is complete when it is validated. Report any commit, push,
PR/MR update, or remote verification that remains unauthorized rather than
treating those effects as implied.

## External effects

Do not retry blindly. Retry or rerun only after the cause is addressed or when
evidence supports a flaky, runner, service, or network failure. Cancellation
always requires an explicit request. Scope the operation to the confirmed host,
repository, run or pipeline, and revision.

After any authorized retry, rerun, cancellation, metadata change, or push,
observe the new remote state. If the result is ambiguous, query the same target
before repeating the mutation. Monitor for a bounded period and report a
pending state instead of waiting indefinitely.
