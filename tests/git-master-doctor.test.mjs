import assert from 'node:assert/strict';
import {chmodSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';

const doctor = path.resolve('plugins/cosmos/scripts/git-master-doctor.sh');

function fakeCli(directory, name, provider) {
  const source = `#!/bin/sh
if [ "$1" = auth ] && [ "$2" = status ]; then
  if [ "${provider}" = github ] && [ -n "\${GH_TOKEN-}" ]; then exit 1; fi
  if [ "${provider}" = github ] && [ "\${FAKE_REQUIRE_ACTIVE-}" = yes ]; then
    case " $* " in *" --active "*) ;; *) exit 97 ;; esac
  fi
  if [ "${provider}" = gitlab ]; then
    if [ "\${FAKE_WRAPPER_TOKEN-}" = personal ] && [ -n "\${GITLAB_PERSONAL_TOKEN-}" ]; then GITLAB_TOKEN=\${GITLAB_PERSONAL_TOKEN}; fi
    if [ "\${FAKE_WRAPPER_TOKEN-}" = work ] && [ -n "\${GITLAB_LUIZALABS_TOKEN-}" ]; then GITLAB_TOKEN=\${GITLAB_LUIZALABS_TOKEN}; fi
    [ -n "\${GITLAB_TOKEN-}" ] && exit 1
  fi
  [ "\${FAKE_AUTH-host}" = fail ] && exit 1
  if [ "\${FAKE_AUTH-host}" = other-host ]; then
    case " $* " in *" --hostname "*) exit 1 ;; esac
  fi
  exit 0
fi
case " $* " in *" --jq "*) [ "${provider}" = gitlab ] && exit 99 ;; esac
if [ "$1" = api ] && [ "$2" = user ]; then
  if [ "${provider}" = gitlab ]; then printf '{"username":"%s"}\\n' "\${FAKE_ACCOUNT-expected}"; else printf '%s\\n' "\${FAKE_ACCOUNT-expected}"; fi
  exit 0
fi
if [ "$1" = api ]; then
  if [ "${provider}" = gitlab ]; then printf '{"path_with_namespace":"%s"}\\n' "\${FAKE_PROJECT-namespace/project}"; else printf '%s\\n' "\${FAKE_PROJECT-namespace/project}"; fi
  exit 0
fi
exit 1
`;
  const target = path.join(directory, name);
  writeFileSync(target, source);
  chmodSync(target, 0o755);
}

function run({provider = 'github', alias, env = {}, withCli = true} = {}) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'cosmos-doctor-'));
  if (withCli) fakeCli(directory, provider === 'github' ? 'gh' : alias, provider);
  const args = [
    doctor, '--provider', provider, '--host', 'example.test', '--project',
    'namespace/project', '--expected-account', 'expected', '--operation',
    'inspect', '--authorization', 'read-only',
  ];
  if (provider === 'gitlab') args.push('--glab-alias', alias);
  const result = spawnSync('/bin/sh', args, {
    encoding: 'utf8',
    env: {PATH: withCli ? `${directory}:/usr/bin:/bin` : directory, ...env},
  });
  rmSync(directory, {recursive: true, force: true});
  return result;
}

test('GitHub doctor reports missing CLI and does not accept an absent command', () => {
  const result = run({withCli: false});
  assert.equal(result.status, 1);
  assert.equal(result.stdout, 'status=cli_missing\n');
});

test('GitHub doctor separates an invalid environment override from saved auth', () => {
  const result = run({env: {GH_TOKEN: 'fixture-not-a-secret'}});
  assert.equal(result.status, 1);
  assert.equal(result.stdout, 'status=environment_token_invalid\n');
  assert.doesNotMatch(`${result.stdout}${result.stderr}`, /fixture-not-a-secret/);
});

test('GitHub doctor reports saved credential, account, host, project, and ready states', () => {
  assert.equal(run({env: {FAKE_AUTH: 'fail'}}).stdout, 'status=stored_credential_invalid\n');
  assert.equal(run({env: {FAKE_ACCOUNT: 'other'}}).stdout, 'status=wrong_account\n');
  assert.equal(run({env: {FAKE_AUTH: 'other-host'}}).stdout, 'status=wrong_host\n');
  assert.equal(run({env: {FAKE_PROJECT: 'other/project'}}).stdout, 'status=project_mismatch\n');
  const result = run();
  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'status=ready\n');
});

test('GitHub doctor checks only the active account', () => {
  const result = run({env: {FAKE_REQUIRE_ACTIVE: 'yes'}});
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.equal(result.stdout, 'status=ready\n');
});

test('GitLab doctor requires the selected real alias and handles generic token overrides', () => {
  const missing = run({provider: 'gitlab', alias: 'glab-personal', withCli: false});
  assert.equal(missing.stdout, 'status=cli_missing\n');
  const invalidOverride = run({
    provider: 'gitlab', alias: 'glab-personal', env: {GITLAB_TOKEN: 'fixture-not-a-secret'},
  });
  assert.equal(invalidOverride.stdout, 'status=environment_token_invalid\n');
  const ready = run({provider: 'gitlab', alias: 'glab-work'});
  assert.equal(ready.status, 0, `${ready.stdout}${ready.stderr}`);
  assert.equal(ready.stdout, 'status=ready\n');
  assert.equal(
    run({provider: 'gitlab', alias: 'glab-work', env: {FAKE_AUTH: 'fail'}}).stdout,
    'status=stored_credential_invalid\n',
  );
  assert.equal(
    run({provider: 'gitlab', alias: 'glab-work', env: {FAKE_ACCOUNT: 'other'}}).stdout,
    'status=wrong_account\n',
  );
  assert.equal(
    run({provider: 'gitlab', alias: 'glab-work', env: {FAKE_AUTH: 'other-host'}}).stdout,
    'status=wrong_host\n',
  );
  assert.equal(
    run({provider: 'gitlab', alias: 'glab-work', env: {FAKE_PROJECT: 'other/project'}}).stdout,
    'status=project_mismatch\n',
  );
});

test('GitLab doctor bypasses an invalid selected-wrapper token without exposing it', () => {
  for (const [alias, wrapperToken, tokenVariable] of [
    ['glab-personal', 'personal', 'GITLAB_PERSONAL_TOKEN'],
    ['glab-work', 'work', 'GITLAB_LUIZALABS_TOKEN'],
  ]) {
    const token = `fixture-${wrapperToken}-not-a-secret`;
    const result = run({
      provider: 'gitlab',
      alias,
      env: {FAKE_WRAPPER_TOKEN: wrapperToken, [tokenVariable]: token},
    });
    assert.equal(result.status, 1, `${alias}: ${result.stdout}${result.stderr}`);
    assert.equal(result.stdout, 'status=environment_token_invalid\n');
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, new RegExp(token));
  }
});

test('GitLab doctor reports effective overrides even when no stored credential remains', () => {
  for (const [alias, wrapperToken, tokenVariable] of [
    ['glab-personal', 'personal', 'GITLAB_PERSONAL_TOKEN'],
    ['glab-work', 'work', 'GITLAB_LUIZALABS_TOKEN'],
  ]) {
    const result = run({
      provider: 'gitlab',
      alias,
      env: {FAKE_WRAPPER_TOKEN: wrapperToken, [tokenVariable]: 'fixture-invalid', FAKE_AUTH: 'fail'},
    });
    assert.equal(result.stdout, 'status=environment_token_invalid\n');
  }
  const generic = run({
    provider: 'gitlab',
    alias: 'glab-personal',
    env: {GITLAB_TOKEN: 'fixture-invalid', FAKE_AUTH: 'fail'},
  });
  assert.equal(generic.stdout, 'status=environment_token_invalid\n');
});

test('GitLab doctor does not treat empty token variables as effective overrides', () => {
  const result = run({
    provider: 'gitlab',
    alias: 'glab-personal',
    env: {FAKE_WRAPPER_TOKEN: 'personal', GITLAB_PERSONAL_TOKEN: '', FAKE_AUTH: 'fail'},
  });
  assert.equal(result.stdout, 'status=stored_credential_invalid\n');
});
