# Environment and identity boundary

Apply this boundary before remote repository, PR/MR, CI, or push operations.
Local inspection and narrowly scoped identity checks may establish the boundary.
For an unambiguous public read, confirmed host and project binding are sufficient
unless authentication affects visibility or the requested result. Confirm the
authenticated account for private or account-dependent reads and before every
authorized mutation.

Establish the provider, environment (personal/work/external), canonical web/API
host, full namespace/project, selected client or connector, and PR/MR number when
applicable. Establish the authenticated account when required above. Before a
push, also establish the effective Git destination and Git identity. Diagnosis
does not require Git write access.

| Context | Required routing evidence |
|---|---|
| Personal GitLab | Route every GitLab CLI call through `glab-personal`. Obtain the full namespace/project and expected personal identity from the repository instructions, relevant checkout, or explicit user context. Confirm the actual project, and confirm the account live through the alias when authentication is required by the boundary above. Do not infer that an unrelated namespace is personal or authorized. |
| Work GitLab | Route every GitLab CLI call through `glab-work`. Obtain the full namespace and expected work identity from applicable work/repository instructions or explicit user context, and verify the actual identity live through the alias when authentication is required by the boundary above. Treat a target resolved outside that route as a context mismatch, not a fallback. Never use the personal GitLab account or `glab-personal` for this context. |
| GitHub | Confirm `github.com` or the actual Enterprise host and owner/repository. Confirm the active account when authentication is required by the boundary above. Determine personal/work/external context separately; GitHub does not imply personal. |

- Treat the personal mapping as expected configuration, not proof of current
  authentication. Do not classify by hostname alone: personal and work GitLab
  may share a host. Directory names, project names, commit author/email, an SSH
  username of `git`, and a plugin label are not account evidence.
- For GitLab CLI operations, use `glab-personal` or `glab-work` according to
  the established environment. Do not use bare `glab`, and do not silently
  fall back to the other alias when the selected alias is missing or fails.
  A connector may replace the CLI only after its host, project, and account
  are reconciled with the same environment.
- Derive the intended target from the user request and repository instructions;
  reconcile it with local fetch/push remotes when a relevant checkout is available.
  Remote status and diagnosis do not require a checkout; establish one before
  local implementation or Git publication when needed. Resolve SSH aliases, separate
  push URLs, URL rewrites, and upstream/fork destinations without dumping
  credentials or entire authentication/SSH configurations. Do not inspect
  credential files to resolve routing. Never assume origin
  is the publication target. Confirm fork source and target separately.
- When account verification is required, use the selected client's current-user
  endpoint or authenticated account view on the intended host. Once any required
  identity matches the expected context, confirm the project's canonical
  path/URL and provider-local ID. IDs are host-scoped;
  PR/MR numbers are repository-scoped. Scope every later call explicitly to that
  host and project, using supported client flags, a full URL, or a connector
  whose host is verified. This includes pipeline, job, trace, and retry calls;
  command examples in this skill require this explicit binding. The selected
  GitLab alias is part of that binding; never rely on the shell's default
  host/account.
- Before an authorized push, verify Git authentication separately through the
  same transport and identity route that will publish; a user identity must
  match the expected account. For an explicitly permitted project-scoped
  credential, verify its binding to the intended project instead. A provider
  identity probe can identify an SSH user; a successful `ls-remote` proves read
  access, not push permission. API/plugin access does not prove Git identity or
  write access. Never use a trial push as an authentication check; report
  unverified write permission honestly.
- A CLI-to-plugin/browser fallback is allowed only for the same confirmed
  context; recheck its host and project, and its account when authentication is
  required by this boundary, before repository operations. An anonymous public
  read does not require an account. Do not automatically switch accounts,
  credentials, or hosts after a 401/403, 404, empty result, or authentication
  failure. Do not read tokens, cookies, keychains, or credential files to bridge
  clients.
- If required identity, target, or environment is unknown or contradictory, stop
  remote operations and state the missing or conflicting evidence. Continue
  useful local work; ask only for the unresolved context. Do not make unrelated
  personal or corporate queries to discover which account happens to work. A
  failed query is not proof that a PR/MR, pipeline, or check does not exist.
- Bind authorization to the operation, environment, host, account, project, and
  source/target branches. Existing same-scope approval remains valid, but cannot
  cross environments. Verify each project in a batch and repeat the boundary
  after a client/account/remote change and before any authorized mutation.

Completion: the target is confirmed and, when authentication is required, the
expected and actual identities agree. Unknown or conflicting required context
is blocked before remote repository operations.
