import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {prepare} from '../scripts/prepare-release.mjs';
import releaseConfig from '../release.config.mjs';

const releaseWorkflow = readFileSync('.github/workflows/release.yml', 'utf8');

function writeFixture(root, file, contents) {
    const target = path.join(root, file);
    mkdirSync(path.dirname(target), {recursive: true});
    writeFileSync(target, contents);
}

function createRepository({symlink = false} = {}) {
    const root = mkdtempSync(path.join(os.tmpdir(), 'cosmos-package-'));
    execFileSync('git', ['init', '--quiet'], {cwd: root});
    execFileSync('git', ['config', 'user.email', 'test@example.com'], {cwd: root});
    execFileSync('git', ['config', 'user.name', 'Package Test'], {cwd: root});
    writeFixture(root, '.agents/plugins/marketplace.json', '{"name":"cosmos"}\n');
    writeFixture(root, 'plugins/cosmos/.codex-plugin/plugin.json', '{"name":"cosmos","version":"0.1.0"}\n');
    writeFixture(root, 'plugins/cosmos/skills/cosmos-orchestrate/SKILL.md', '# Cosmos\n');
    writeFixture(root, 'plugins/cosmos/skills/cosmos-orchestrate/references/agents/cosmos-git-master.toml', 'name = "cosmos-git-master"\n');
    writeFixture(root, 'plugins/cosmos/skills/git-master/SKILL.md', '# Git Master\n');
    writeFixture(root, 'plugins/cosmos/skills/git-master/agents/openai.yaml', 'interface:\n  display_name: "Git Master"\n');
    writeFixture(root, 'plugins/cosmos/skills/git-master/references/github.md', '# GitHub\n');
    writeFixture(root, 'plugins/cosmos/skills/git-master/references/retry-and-fix.md', '# Retry\n');
    writeFixture(root, 'plugins/cosmos/scripts/git-master-doctor.sh', '#!/bin/sh\nexit 0\n');
    writeFixture(root, 'plugins/cosmos/assets/icon.png', 'fake png');
    writeFixture(root, 'plugins/cosmos/__pycache__/ignored.pyc', 'cache');
    writeFixture(root, 'plugins/cosmos/untracked.txt', 'not tracked');
    if (symlink) {
        symlinkSync('assets/icon.png', path.join(root, 'plugins/cosmos/link.png'));
    }
    execFileSync('git', ['add', '.agents', 'plugins/cosmos/.codex-plugin', 'plugins/cosmos/skills', 'plugins/cosmos/scripts', 'plugins/cosmos/assets'], {cwd: root});
    if (symlink) {
        execFileSync('git', ['add', 'plugins/cosmos/link.png'], {cwd: root});
    }
    execFileSync('git', ['commit', '--quiet', '-m', 'fixture'], {cwd: root});
    return root;
}

function readArchive(archive) {
    const program = String.raw`import json, sys, zipfile
with zipfile.ZipFile(sys.argv[1]) as z:
    print(json.dumps({'names': z.namelist(), 'manifest': z.read('plugins/cosmos/.codex-plugin/plugin.json').decode()}))`;
    return JSON.parse(execFileSync('python3', ['-c', program, archive], {encoding: 'utf8'}));
}

test('prepares a ZIP with only tracked files in the marketplace layout', async (t) => {
    const cwd = createRepository();
    t.after(() => rmSync(cwd, {recursive: true, force: true}));
    const logs = [];

    await prepare({}, {cwd, nextRelease: {version: '1.2.3'}, logger: {log: (message) => logs.push(message)}});

    const archive = path.join(cwd, 'dist', 'cosmos-1.2.3.zip');
    const contents = readArchive(archive);
    assert.deepEqual(contents.names.sort(), [
        '.agents/plugins/marketplace.json',
        'plugins/cosmos/.codex-plugin/plugin.json',
        'plugins/cosmos/assets/icon.png',
        'plugins/cosmos/skills/cosmos-orchestrate/SKILL.md',
        'plugins/cosmos/skills/cosmos-orchestrate/references/agents/cosmos-git-master.toml',
        'plugins/cosmos/skills/git-master/SKILL.md',
        'plugins/cosmos/skills/git-master/agents/openai.yaml',
        'plugins/cosmos/skills/git-master/references/github.md',
        'plugins/cosmos/skills/git-master/references/retry-and-fix.md',
        'plugins/cosmos/scripts/git-master-doctor.sh',
    ].sort());
    assert.equal(JSON.parse(contents.manifest).version, '1.2.3');
    assert.equal(JSON.parse(readFileSync(path.join(cwd, 'plugins/cosmos/.codex-plugin/plugin.json'), 'utf8')).version, '0.1.0');
    assert.match(logs[0], /manifest version 1\.2\.3/);
    assert.match(logs[0], /cosmos-1\.2\.3\.zip/);
});

test('release configuration never commits or pushes the source manifest', () => {
    const pluginNames = releaseConfig.plugins.map((plugin) => Array.isArray(plugin) ? plugin[0] : plugin);

    assert.equal(pluginNames.includes('@semantic-release/git'), false);
    assert.deepEqual(pluginNames.slice(-2), [
        './scripts/prepare-release.mjs',
        '@semantic-release/github',
    ]);
});

test('release workflow opens a failure-tolerant manifest-only PR', () => {
    assert.match(releaseWorkflow, /^  sync-manifest:$/m);
    assert.match(releaseWorkflow, /^    continue-on-error: true$/m);
    assert.match(releaseWorkflow, /pull-requests: write/);
    assert.match(releaseWorkflow, /releases\/latest/);
    assert.match(releaseWorkflow, /cosmos-\$\{tag#v\}\.zip/);
    assert.match(releaseWorkflow, /git merge-base --is-ancestor/);
    assert.match(releaseWorkflow, /scripts\/sync-release-manifest\.mjs/);
    assert.match(releaseWorkflow, /git push origin "HEAD:refs\/heads\/\$branch"/);
    assert.match(releaseWorkflow, /gh pr list --state all --base main --head "\$branch"/);
    assert.match(releaseWorkflow, /gh pr create/);
    assert.doesNotMatch(releaseWorkflow, /git push[^\n]*refs\/heads\/main/);
    assert.doesNotMatch(releaseWorkflow, /gh pr merge/);
    assert.ok(
        releaseWorkflow.indexOf('gh auth setup-git') < releaseWorkflow.indexOf('git fetch --force --tags origin'),
        'Git authentication must be configured before fetching tags',
    );
    assert.ok(
        releaseWorkflow.indexOf('gh pr list --state all') < releaseWorkflow.indexOf('git push origin'),
        'Existing PR decisions must be checked before recreating a deleted branch',
    );
});

test('rejects unstable versions', async () => {
    for (const version of ['1.2.3-beta.1', '01.2.3']) {
        await assert.rejects(
            prepare({}, {cwd: process.cwd(), nextRelease: {version}, logger: {log() {}}}),
            /release version must be stable/i,
        );
    }
});

test('rejects tracked symbolic links', async (t) => {
    const cwd = createRepository({symlink: true});
    t.after(() => rmSync(cwd, {recursive: true, force: true}));

    await assert.rejects(
        prepare({}, {cwd, nextRelease: {version: '1.2.3'}, logger: {log() {}}}),
        (error) => /symlinks are not allowed/i.test(error.stderr.toString()),
    );
    assert.equal(
        JSON.parse(readFileSync(path.join(cwd, 'plugins/cosmos/.codex-plugin/plugin.json'), 'utf8')).version,
        '0.1.0',
    );
});
