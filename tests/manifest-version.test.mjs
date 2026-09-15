import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkVersion} from '../scripts/check-manifest-version.mjs';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

test('accepts unchanged source versions and a newer tagged release version', () => {
  checkVersion('0.1.0', '0.1.0');
  checkVersion('0.1.0', '1.0.0');
});

test('rejects version regressions and malformed manifests', () => {
  assert.throws(() => checkVersion('1.1.0', '1.0.0'), /must not decrease/);
  for (const value of [null, 'v1.0.0', '01.0.0', 'one']) {
    assert.throws(() => checkVersion('1.0.0', value), /Invalid/);
  }
});

test('CLI rejects an invented version and accepts an existing release tag', (t) => {
  const cwd = mkdtempSync(join(tmpdir(), 'cosmos-version-check-'));
  t.after(() => rmSync(cwd, {recursive: true, force: true}));
  const git = (...args) => execFileSync('git', args, {cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
  git('init', '-q');
  git('config', 'user.name', 'Fixture');
  git('config', 'user.email', 'fixture@example.test');
  const directory = join(cwd, 'plugins/cosmos/.codex-plugin');
  mkdirSync(directory, {recursive: true});
  const manifest = join(directory, 'plugin.json');
  writeFileSync(manifest, JSON.stringify({version: '0.1.0'}));
  git('add', '.');
  git('commit', '-qm', 'fixture');
  const base = git('rev-parse', 'HEAD').trim();
  writeFileSync(manifest, JSON.stringify({version: '1.0.0'}));
  const script = fileURLToPath(new URL('../scripts/check-manifest-version.mjs', import.meta.url));
  const check = () => execFileSync(process.execPath, [script, base], {cwd, stdio: 'pipe'});
  assert.throws(check);
  git('tag', 'v1.0.0');
  assert.doesNotThrow(check);
});
