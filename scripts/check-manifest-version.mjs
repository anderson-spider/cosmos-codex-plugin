import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import semver from 'semver';

export function checkVersion(previous, current) {
  for (const value of [previous, current]) {
    if (typeof value !== 'string' || semver.valid(value) !== value) {
      throw new Error(`Invalid manifest version: ${value}`);
    }
  }
  if (semver.lt(current, previous)) {
    throw new Error(`Manifest version must not decrease: ${previous} -> ${current}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const base = process.argv[2];
  if (!/^[a-f0-9]{40}$/.test(base ?? '')) throw new Error('Expected base commit SHA');
  const manifest = 'plugins/cosmos/.codex-plugin/plugin.json';
  const previous = JSON.parse(execFileSync('git', ['show', `${base}:${manifest}`], {encoding: 'utf8'}));
  const current = JSON.parse(readFileSync(manifest, 'utf8'));
  checkVersion(previous.version, current.version);
  if (current.version !== previous.version) {
    execFileSync('git', ['show-ref', '--verify', `refs/tags/v${current.version}`], {stdio: 'pipe'});
  }
}
