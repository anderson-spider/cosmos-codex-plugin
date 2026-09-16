# GitHub checks and runs

Use this reference only for GitHub or GitHub Enterprise.

Prefer the installed `gh` client or an explicitly requested supported connector
whose host and repository have been established. Confirm its account when
authentication is required by the environment and identity boundary; an
anonymous public read does not require an account. Inspect installed help when
syntax or JSON fields are uncertain.

For status, retrieve PR metadata and the check rollup with explicit repository
binding. Useful fields include number, title, state, draft state, head and base
refs, head SHA, mergeability, check rollup, and URL. Query detailed checks only
as needed to identify a blocker or satisfy the requested completeness.

Confirm which PR revision the reported checks evaluate. Relate each decisive
result to the current head or its applicable merge-result revision, and identify
stale or unavailable results explicitly. When the user requests a historical
run, preserve that historical scope instead of treating it as current status.

For diagnosis, derive a workflow run ID from observed check data, a run URL, or
API output; never infer it from the PR number. Inspect the run and use
`gh run view <run-id> --log-failed` for relevant failed jobs. Report decisive
error lines with check and run URLs after masking secret or sensitive values.

When authorized and justified, rerun failed jobs with the installed client's
supported equivalent of:

```bash
gh run rerun <run-id> --failed
```

Verify the resulting run ID and current state.
