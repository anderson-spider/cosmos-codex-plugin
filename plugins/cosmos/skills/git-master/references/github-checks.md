# GitHub checks and runs

Use this reference only for GitHub or GitHub Enterprise.

Retrieve PR metadata and its check rollup with explicit repository binding.
Normally the number, state, draft state, head and base refs, head SHA,
mergeability, checks, and URL are sufficient. Fetch detailed logs only when a
blocker needs diagnosis or completeness was requested.

Confirm which revision each decisive check evaluates. Identify stale,
historical, merge-result, or unavailable results instead of presenting them as
current head status. Derive workflow run IDs from observed check or API data,
never from the PR number.

For diagnosis, inspect only relevant failed jobs and decisive log lines. Mask
secrets and sensitive values. Classify the supported root blocker when useful:
metadata or policy, code or test, dependency or toolchain, infrastructure or
network, or flaky or unknown.

Rerun failed jobs only after the cause was addressed or evidence supports an
infrastructure or flaky failure, and only with separate authorization. Verify
the resulting run ID, revision, URL, and current state.
