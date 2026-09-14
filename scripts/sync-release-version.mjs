import {isDeepStrictEqual} from 'node:util';

import semver from 'semver';

const MANIFEST_PATH = 'plugins/cosmos/.codex-plugin/plugin.json';

function stableVersionFromTag(tag) {
  const match = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(tag);
  if (!match || !semver.valid(match[0].slice(1))) {
    throw new Error(`A tag de release deve ser estável no formato vX.Y.Z: ${tag}`);
  }
  return match[0].slice(1);
}

function decodeManifest(response, ref) {
  const content = response.data;
  if (Array.isArray(content) || typeof content?.content !== 'string' || typeof content.sha !== 'string') {
    throw new Error(`Não foi possível ler ${MANIFEST_PATH} em ${ref}`);
  }

  try {
    const manifest = JSON.parse(Buffer.from(content.content, 'base64').toString('utf8'));
    if (typeof manifest?.version !== 'string' || !semver.valid(manifest.version)) {
      throw new Error('version inválida');
    }
    return {manifest, sha: content.sha};
  } catch (error) {
    throw new Error(`Manifesto inválido em ${ref}: ${error.message}`);
  }
}

function sameContentExceptVersion(first, second) {
  const firstWithoutVersion = {...first};
  const secondWithoutVersion = {...second};
  delete firstWithoutVersion.version;
  delete secondWithoutVersion.version;
  return isDeepStrictEqual(firstWithoutVersion, secondWithoutVersion);
}

function encodeManifest(manifest) {
  return Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`).toString('base64');
}

function isNotFound(error) {
  return error?.status === 404;
}

/**
 * Sincroniza a versão publicada com o manifesto por meio de uma pull request.
 * Esta função nunca grava diretamente na branch main.
 */
export async function syncVersion({github, context, core}) {
  const {owner, repo} = context.repo;
  let latestRelease;
  try {
    latestRelease = await github.rest.repos.getLatestRelease({owner, repo});
  } catch (error) {
    if (isNotFound(error)) {
      core.info('Não há release publicado para sincronizar.');
      return {action: 'no-release'};
    }
    throw error;
  }

  const version = stableVersionFromTag(latestRelease.data.tag_name);
  const mainBranch = await github.rest.repos.getBranch({owner, repo, branch: 'main'});
  const mainSha = mainBranch.data.commit.sha;
  const mainContent = decodeManifest(
    await github.rest.repos.getContent({owner, repo, path: MANIFEST_PATH, ref: mainSha}),
    mainSha,
  );

  if (semver.gte(mainContent.manifest.version, version)) {
    core.info(`O manifesto já está em ${mainContent.manifest.version}.`);
    return {action: 'already-synced', version: mainContent.manifest.version};
  }

  const branch = `automation/cosmos-v${version}`;
  let branchExists = true;
  let branchSha;
  try {
    const branchRef = await github.rest.git.getRef({owner, repo, ref: `heads/${branch}`});
    branchSha = branchRef.data.object.sha;
  } catch (error) {
    if (!isNotFound(error)) {
      throw error;
    }
    branchExists = false;
  }

  let updateManifest = !branchExists;
  if (!branchExists) {
    await github.rest.git.createRef({owner, repo, ref: `refs/heads/${branch}`, sha: mainSha});
  } else {
    const branchContent = decodeManifest(
      await github.rest.repos.getContent({owner, repo, path: MANIFEST_PATH, ref: branch}),
      branch,
    );
    const readyForPullRequest = (
      branchContent.manifest.version === version
      && sameContentExceptVersion(branchContent.manifest, mainContent.manifest)
    );
    const recoverablePartialCreation = (
      branchSha === mainSha
      && isDeepStrictEqual(branchContent.manifest, mainContent.manifest)
    );
    if (!readyForPullRequest && !recoverablePartialCreation) {
      throw new Error(`A branch ${branch} contém alterações que não podem ser sobrescritas.`);
    }
    updateManifest = recoverablePartialCreation;
  }

  if (updateManifest) {
    await github.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: MANIFEST_PATH,
      branch,
      sha: mainContent.sha,
      message: `chore(release): sync plugin version ${version}`,
      content: encodeManifest({...mainContent.manifest, version}),
    });
  }

  const comparison = await github.rest.repos.compareCommitsWithBasehead({
    owner,
    repo,
    basehead: `${mainSha}...${branch}`,
  });
  const unexpectedFiles = (comparison.data.files ?? [])
    .map((file) => file.filename)
    .filter((filename) => filename !== MANIFEST_PATH);
  if (unexpectedFiles.length > 0) {
    throw new Error(`A branch ${branch} também altera arquivos fora do manifesto: ${unexpectedFiles.join(', ')}`);
  }

  const openPulls = await github.rest.pulls.list({
    owner,
    repo,
    state: 'open',
    head: `${owner}:${branch}`,
    base: 'main',
  });
  if (openPulls.data.length > 0) {
    core.info(`A pull request de sincronização para ${version} já está aberta.`);
    return {action: 'pull-request-exists', branch, version};
  }

  if (branchExists) {
    const closedPulls = await github.rest.pulls.list({
      owner,
      repo,
      state: 'closed',
      head: `${owner}:${branch}`,
      base: 'main',
    });
    if (closedPulls.data.length > 0) {
      throw new Error(`A branch ${branch} já possui uma pull request fechada; intervenção manual é necessária.`);
    }
  }

  const pullRequest = await github.rest.pulls.create({
    owner,
    repo,
    head: branch,
    base: 'main',
    title: `chore(release): sync plugin version ${version}`,
    body: `Sync the plugin manifest to match [release v${version}](${latestRelease.data.html_url}).`,
  });
  core.info(`Pull request #${pullRequest.data.number} criada para a versão ${version}.`);
  return {action: 'pull-request-created', branch, version, pullRequest: pullRequest.data.number};
}
