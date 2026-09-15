import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {prepare} from '../scripts/prepare-release.mjs';

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
    writeFixture(root, 'plugins/cosmos/assets/icon.png', 'fake png');
    writeFixture(root, 'plugins/cosmos/__pycache__/ignored.pyc', 'cache');
    writeFixture(root, 'plugins/cosmos/untracked.txt', 'not tracked');
    if (symlink) {
        symlinkSync('assets/icon.png', path.join(root, 'plugins/cosmos/link.png'));
    }
    execFileSync('git', ['add', '.agents', 'plugins/cosmos/.codex-plugin', 'plugins/cosmos/skills', 'plugins/cosmos/assets'], {cwd: root});
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

test('prepara um ZIP apenas com arquivos rastreados no layout do marketplace', async (t) => {
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
    ].sort());
    assert.equal(JSON.parse(contents.manifest).version, '1.2.3');
    assert.equal(JSON.parse(readFileSync(path.join(cwd, 'plugins/cosmos/.codex-plugin/plugin.json'), 'utf8')).version, '1.2.3');
    assert.match(logs[0], /Manifesto atualizado para 1\.2\.3/);
    assert.match(logs[0], /cosmos-1\.2\.3\.zip/);
});

test('rejeita versões que não são estáveis', async () => {
    for (const version of ['1.2.3-beta.1', '01.2.3']) {
        await assert.rejects(
            prepare({}, {cwd: process.cwd(), nextRelease: {version}, logger: {log() {}}}),
            /versão da release deve ser estável/i,
        );
    }
});

test('rejeita links simbólicos rastreados', async (t) => {
    const cwd = createRepository({symlink: true});
    t.after(() => rmSync(cwd, {recursive: true, force: true}));

    await assert.rejects(
        prepare({}, {cwd, nextRelease: {version: '1.2.3'}, logger: {log() {}}}),
        (error) => /symlinks are not allowed/i.test(error.stderr.toString()),
    );
});
