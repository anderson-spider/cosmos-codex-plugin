import assert from 'node:assert/strict';
import test from 'node:test';

import {syncVersion} from '../scripts/sync-release-version.mjs';

const owner = 'octo';
const repo = 'cosmos';
const mainManifest = {
  name: 'cosmos',
  version: '0.1.0',
  description: 'Plugin Cosmos',
  interface: {displayName: 'Cosmos'},
};

function content(manifest, sha = 'manifest-sha') {
  return {data: {sha, content: Buffer.from(JSON.stringify(manifest)).toString('base64')}};
}

function notFound() {
  return Object.assign(new Error('Not Found'), {status: 404});
}

function createMock({
  latest = {tag_name: 'v0.2.0', html_url: 'https://example.test/releases/v0.2.0'},
  main = mainManifest,
  branchManifest,
  branchSha = 'branch-sha',
  latestError,
  refError = notFound(),
  openPulls = [],
  closedPulls = [],
  comparisonFiles = [{filename: 'plugins/cosmos/.codex-plugin/plugin.json'}],
} = {}) {
  const calls = [];
  const github = {
    rest: {
      repos: {
        async getLatestRelease(args) {
          calls.push(['getLatestRelease', args]);
          if (latestError) throw latestError;
          return {data: latest};
        },
        async getBranch(args) {
          calls.push(['getBranch', args]);
          return {data: {commit: {sha: 'main-sha'}}};
        },
        async getContent(args) {
          calls.push(['getContent', args]);
          if (args.ref === 'main-sha') return content(main);
          return content(branchManifest);
        },
        async createOrUpdateFileContents(args) {
          calls.push(['createOrUpdateFileContents', args]);
          return {data: {commit: {sha: 'update-sha'}}};
        },
        async compareCommitsWithBasehead(args) {
          calls.push(['compareCommitsWithBasehead', args]);
          return {data: {files: comparisonFiles}};
        },
      },
      git: {
        async getRef(args) {
          calls.push(['getRef', args]);
          if (refError) throw refError;
          return {data: {object: {sha: branchSha}}};
        },
        async createRef(args) {
          calls.push(['createRef', args]);
          return {data: {ref: args.ref}};
        },
      },
      pulls: {
        async list(args) {
          calls.push(['list', args]);
          return {data: args.state === 'open' ? openPulls : closedPulls};
        },
        async create(args) {
          calls.push(['create', args]);
          return {data: {number: 42}};
        },
      },
    },
  };
  return {calls, github, core: {info() {}}};
}

function called(mock, method) {
  return mock.calls.filter(([name]) => name === method);
}

function input(mock) {
  return {github: mock.github, context: {repo: {owner, repo}}, core: mock.core};
}

test('cria branch de automação, atualiza só o manifesto e abre uma PR', async () => {
  const mock = createMock();

  const result = await syncVersion(input(mock));

  assert.deepEqual(result, {
    action: 'pull-request-created',
    branch: 'automation/cosmos-v0.2.0',
    version: '0.2.0',
    pullRequest: 42,
  });
  assert.deepEqual(called(mock, 'createRef')[0][1], {
    owner,
    repo,
    ref: 'refs/heads/automation/cosmos-v0.2.0',
    sha: 'main-sha',
  });
  const update = called(mock, 'createOrUpdateFileContents')[0][1];
  assert.equal(update.path, 'plugins/cosmos/.codex-plugin/plugin.json');
  assert.equal(update.branch, 'automation/cosmos-v0.2.0');
  assert.equal(update.sha, 'manifest-sha');
  assert.equal(update.message, 'chore(release): sync plugin version 0.2.0');
  assert.equal(JSON.parse(Buffer.from(update.content, 'base64')).version, '0.2.0');
  assert.equal(called(mock, 'getContent')[0][1].ref, 'main-sha');
  assert.equal(called(mock, 'create')[0][1].base, 'main');
  assert.equal(called(mock, 'create')[0][1].title, 'chore(release): sync plugin version 0.2.0');
  assert.match(called(mock, 'create')[0][1].body, /Sync the plugin manifest.*release v0\.2\.0/);
});

test('em nova execução com PR aberta não faz escritas', async () => {
  const mock = createMock({
    refError: null,
    branchManifest: {...mainManifest, version: '0.2.0'},
    openPulls: [{number: 42}],
  });

  const result = await syncVersion(input(mock));

  assert.equal(result.action, 'pull-request-exists');
  assert.equal(called(mock, 'createRef').length, 0);
  assert.equal(called(mock, 'createOrUpdateFileContents').length, 0);
  assert.equal(called(mock, 'create').length, 0);
});

test('não faz nada quando ainda não existe release', async () => {
  const mock = createMock({latestError: notFound()});

  assert.deepEqual(await syncVersion(input(mock)), {action: 'no-release'});
  assert.equal(called(mock, 'getBranch').length, 0);
  assert.equal(called(mock, 'createRef').length, 0);
});

test('não faz nada quando main já tem a mesma versão ou uma mais nova', async () => {
  for (const version of ['0.2.0', '0.3.0']) {
    const mock = createMock({main: {...mainManifest, version}});
    const result = await syncVersion(input(mock));
    assert.equal(result.action, 'already-synced');
    assert.equal(called(mock, 'createRef').length, 0);
  }
});

test('propaga erro de autorização ao consultar a release', async () => {
  const mock = createMock({latestError: Object.assign(new Error('Forbidden'), {status: 403})});

  await assert.rejects(syncVersion(input(mock)), /Forbidden/);
});

test('falha quando uma branch de automação existente contém edição humana', async () => {
  const mock = createMock({
    refError: null,
    branchManifest: {...mainManifest, version: '0.2.0', description: 'Edição humana'},
  });

  await assert.rejects(syncVersion(input(mock)), /não podem ser sobrescritas/);
  assert.equal(called(mock, 'createOrUpdateFileContents').length, 0);
  assert.equal(called(mock, 'create').length, 0);
});

test('recupera uma criação parcial quando a branch ainda aponta para o snapshot de main', async () => {
  const mock = createMock({
    refError: null,
    branchSha: 'main-sha',
    branchManifest: mainManifest,
  });

  const result = await syncVersion(input(mock));

  assert.equal(result.action, 'pull-request-created');
  assert.equal(called(mock, 'createRef').length, 0);
  assert.equal(called(mock, 'createOrUpdateFileContents').length, 1);
});

test('falha ao reutilizar uma branch que também altera outro arquivo', async () => {
  const mock = createMock({
    refError: null,
    branchManifest: {...mainManifest, version: '0.2.0'},
    comparisonFiles: [
      {filename: 'plugins/cosmos/.codex-plugin/plugin.json'},
      {filename: 'plugins/cosmos/README.md'},
    ],
  });

  await assert.rejects(syncVersion(input(mock)), /fora do manifesto/);
  assert.equal(called(mock, 'create').length, 0);
});
