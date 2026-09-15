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

assert.ok(analyzerEntry, 'release.config.mjs deve configurar o commit-analyzer');
assert.ok(notesEntry, 'release.config.mjs deve configurar o release-notes-generator');

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

test('commit-analyzer classifica fix e perf como patch, e feat como minor', async () => {
  assert.equal(await releaseFor('fix: corrige a órbita'), 'patch');
  assert.equal(await releaseFor('perf: reduz o tempo de cálculo'), 'patch');
  assert.equal(await releaseFor('feat: adiciona uma constelação'), 'minor');
});

test('commit-analyzer classifica marcadores de quebra como major', async () => {
  assert.equal(await releaseFor('feat!: remove a API anterior'), 'major');
  assert.equal(
    await releaseFor('feat: altera o contrato\n\nBREAKING CHANGE: exige nova configuração'),
    'major',
  );
});

test('commit-analyzer ignora docs e chore', async () => {
  assert.equal(await releaseFor('docs: explica a instalação'), null);
  assert.equal(await releaseFor('chore: atualiza metadados'), null);
});

test('commit-analyzer escolhe o maior incremento entre commits', async () => {
  assert.equal(
    await releaseFor(
      'fix: corrige um cálculo',
      'feat: adiciona uma opção',
      'feat!: remove a opção legada',
    ),
    'major',
  );
});

test('release-notes-generator renderiza o preset configurado', async () => {
  const notes = await generateNotes(notesEntry[1], {
    commits: [{hash: '1234567', message: 'fix: corrige a órbita'}],
    cwd: projectRoot,
    lastRelease: {gitTag: 'v1.0.0'},
    nextRelease: {gitTag: 'v1.0.1', version: '1.0.1'},
    options: {repositoryUrl: 'https://github.com/anderson-spider/cosmos-codex-plugin.git'},
    logger: {log() {}},
  });

  assert.match(notes, /Bug Fixes/);
  assert.match(notes, /corrige a órbita/);
});

test('commitlint aceita commits convencionais', async () => {
  for (const message of [
    'fix: corrige a órbita',
    'feat: adiciona uma constelação',
    'feat!: remove a API anterior',
    'feat: altera o contrato\n\nBREAKING CHANGE: exige nova configuração',
    'docs: explica a instalação',
    'chore: atualiza metadados',
  ]) {
    const result = await lintCommit(message);
    assert.equal(result.valid, true, result.errors.map((error) => error.message).join('\n'));
  }
});

test('commitlint rejeita texto livre e tipos inventados', async () => {
  for (const message of ['atualiza o plugin', 'inventado: altera o plugin']) {
    const result = await lintCommit(message);
    assert.equal(result.valid, false, `${message} deveria ser inválido`);
  }
});
