# GitLab pipelines and jobs

Use this reference only for GitLab hosts.

Prefer the configured `glab-personal` or `glab-work` alias selected by the
environment and identity boundary, or an explicitly requested supported
connector whose host and project have been established. Confirm its account
when authentication is required by the environment and identity boundary; an
anonymous public read does not require an account. Inspect installed help when
syntax or JSON fields are uncertain.

Pipeline and job reads are authenticated remote reads: complete the selected
GitLab alias preflight before them. A browser or plugin fallback requires the
same reconfirmed environment, host, project, account, and exact authorization
for any resulting mutation.

For status, retrieve the MR and its head pipeline with explicit host and project
binding. The MR state, source and target, head SHA, conflicts, pipeline status,
and URL are normally sufficient.

Confirm which MR revision the reported pipeline evaluates. Relate each decisive
result to the current head or its applicable merge-result revision, and identify
stale or unavailable results explicitly. When the user requests a historical
pipeline, preserve that historical scope instead of treating it as current
status.

For diagnosis, retrieve enough jobs to identify the failed root job. Preserve
job ID, name, stage, status, failure reason, and URL for evidence actually used.
Follow pagination only when the relevant jobs are not yet found, completeness is
needed to distinguish multiple roots, or the user asks for the full job set.

Fetch traces only for failed or root-cause jobs using the supported equivalent
of:

```bash
<selected-glab-alias> api "projects/<project_id>/jobs/<job_id>/trace"
```

Report decisive error lines with the job URL after masking secret or sensitive
values.

When authorized and justified, retry through the supported API surface:

```bash
<selected-glab-alias> api --method POST "projects/<project_id>/pipelines/<pipeline_id>/retry"
```

Verify the resulting pipeline and job IDs and their current states.
