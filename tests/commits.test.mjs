import assert from 'node:assert/strict';
import test from 'node:test';
import {fileURLToPath} from 'node:url';

import lint from '@commitlint/lint';
import load from '@commitlint/load';
import {analyzeCommits} from '@semantic-release/commit-analyzer';
import {generateNotes} from '@semantic-release/release-notes-generator';

import releaseConfig from '../release.config.mjs';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const commitlintConfig = await load({}, {cwd: projectRoot});
const analyzerEntry = releaseConfig.plugins.find(
  ([plugin]) => plugin === '@semantic-release/commit-analyzer',
);
const notesEntry = releaseConfig.plugins.find(
  ([plugin]) => plugin === '@semantic-release/release-notes-generator',
);

assert.ok(analyzerEntry, 'release.config.mjs must configure commit-analyzer');
assert.ok(notesEntry, 'release.config.mjs must configure release-notes-generator');

async function releaseFor(...messages) {
  return analyzeCommits(analyzerEntry[1], {
    commits: messages.map((message, index) => ({
      hash: String(index).padStart(7, '0'),
      message,
    })),
    cwd: projectRoot,
    logger: {log() {}},
  });
}

async function lintCommit(message) {
  return lint(message, commitlintConfig.rules, {
    parserOpts: commitlintConfig.parserPreset.parserOpts,
  });
}

test('commit-analyzer classifies fix and perf as patch and feat as minor', async () => {
  assert.equal(await releaseFor('fix: correct the orbit'), 'patch');
  assert.equal(await releaseFor('perf: reduce calculation time'), 'patch');
  assert.equal(await releaseFor('feat: add a constellation'), 'minor');
});

test('commit-analyzer classifies breaking markers as major', async () => {
  assert.equal(await releaseFor('feat!: remove the previous API'), 'major');
  assert.equal(
    await releaseFor('feat: change the contract\n\nBREAKING CHANGE: require new configuration'),
    'major',
  );
});

test('commit-analyzer ignores docs and chore', async () => {
  assert.equal(await releaseFor('docs: explain installation'), null);
  assert.equal(await releaseFor('chore: update metadata'), null);
});

test('commit-analyzer chooses the largest increment among commits', async () => {
  assert.equal(
    await releaseFor(
      'fix: correct a calculation',
      'feat: add an option',
      'feat!: remove the legacy option',
    ),
    'major',
  );
});

test('release-notes-generator renders the configured preset', async () => {
  const notes = await generateNotes(notesEntry[1], {
    commits: [{hash: '1234567', message: 'fix: correct the orbit'}],
    cwd: projectRoot,
    lastRelease: {gitTag: 'v1.0.0'},
    nextRelease: {gitTag: 'v1.0.1', version: '1.0.1'},
    options: {repositoryUrl: 'https://github.com/anderson-spider/cosmos-codex-plugin.git'},
    logger: {log() {}},
  });

  assert.match(notes, /Bug Fixes/);
  assert.match(notes, /correct the orbit/);
});

test('commitlint accepts conventional commits', async () => {
  for (const message of [
    'fix: correct the orbit',
    'feat: add a constellation',
    'feat!: remove the previous API',
    'feat: change the contract\n\nBREAKING CHANGE: require new configuration',
    'docs: explain installation',
    'chore: update metadata',
  ]) {
    const result = await lintCommit(message);
    assert.equal(result.valid, true, result.errors.map((error) => error.message).join('\n'));
  }
});

test('commitlint rejects free text and invented types', async () => {
  for (const message of ['update the plugin', 'invented: change the plugin']) {
    const result = await lintCommit(message);
    assert.equal(result.valid, false, `${message} should be invalid`);
  }
});
