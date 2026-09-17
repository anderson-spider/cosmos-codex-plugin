import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {syncManifest} from '../scripts/sync-release-manifest.mjs';

function fixture(version = '1.3.0') {
    const directory = mkdtempSync(path.join(os.tmpdir(), 'cosmos-version-sync-'));
    const manifest = path.join(directory, 'plugin.json');
    writeFileSync(manifest, `${JSON.stringify({name: 'cosmos', version, description: 'fixture'}, null, 2)}\n`);
    return {directory, manifest};
}

test('updates only the manifest version', (t) => {
    const {directory, manifest} = fixture();
    t.after(() => rmSync(directory, {recursive: true, force: true}));

    assert.equal(syncManifest('1.4.0', manifest), true);
    assert.deepEqual(JSON.parse(readFileSync(manifest, 'utf8')), {
        name: 'cosmos', version: '1.4.0', description: 'fixture',
    });
});

test('is idempotent when the manifest already matches', (t) => {
    const {directory, manifest} = fixture('1.4.0');
    t.after(() => rmSync(directory, {recursive: true, force: true}));
    const before = readFileSync(manifest, 'utf8');

    assert.equal(syncManifest('1.4.0', manifest), false);
    assert.equal(readFileSync(manifest, 'utf8'), before);
});

test('rejects malformed versions and downgrades', (t) => {
    const {directory, manifest} = fixture('1.4.0');
    t.after(() => rmSync(directory, {recursive: true, force: true}));

    assert.throws(() => syncManifest('1.3.0', manifest), /Refusing to decrease/);
    assert.throws(() => syncManifest('v1.5.0', manifest), /stable and use x\.y\.z/);
    assert.equal(JSON.parse(readFileSync(manifest, 'utf8')).version, '1.4.0');
});
