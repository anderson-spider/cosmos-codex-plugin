# GitLab pipelines and jobs

Use this reference only for GitLab.com or a self-managed GitLab host.

Retrieve the MR and head pipeline with explicit host and project binding. The
MR state, source and target, head SHA, conflicts, pipeline status, and URLs are
normally sufficient. Follow pagination only when needed to locate the relevant
root job or when completeness was requested.

Confirm which revision the pipeline evaluates. Identify stale, historical,
merge-result, or unavailable results instead of presenting them as current head
status. Preserve job ID, name, stage, status, failure reason, and URL only for
evidence actually used.

For diagnosis, fetch traces only for failed or root-cause jobs and report the
decisive lines after masking secrets and sensitive values. Classify the
supported root blocker when useful: metadata or policy, code or test,
dependency or toolchain, infrastructure or network, or flaky or unknown.

Retry only after the cause was addressed or evidence supports an infrastructure
or flaky failure, and only with separate authorization. Verify the resulting
pipeline and job IDs, revision, URLs, and current states.
