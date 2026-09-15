# Environment and identity

Apply this boundary before remote repository, PR/MR, CI, or push operations.

Establish the provider, canonical host, full owner or namespace and repository,
selected client, and request number when applicable. An unambiguous public read
needs no authenticated identity. Before any authenticated or account-dependent
operation, confirm the active account on the intended host. Before a push, also
confirm the effective Git destination, transport, refspec, and Git identity.

Derive the intended target from the user request and repository instructions,
then reconcile it with local fetch and push remotes. Do not assume `origin` is
the publication target. Resolve SSH aliases, separate push URLs, URL rewrites,
upstreams, and forks without printing credentials or reading token, cookie,
keychain, or credential files.

Provider login, API access, and Git transport are separate evidence. A
successful read proves neither the intended account nor write permission. Never
use a trial push as an authentication check and never switch accounts, hosts, or
credentials automatically after an error.

If identity, repository, environment, or destination is missing or
contradictory, stop remote operations, state the conflict, and continue safe
local preparation. Authorization is valid only for the confirmed operation,
host, account when required, repository, and source and target branches.
