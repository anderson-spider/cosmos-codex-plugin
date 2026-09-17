import {readFileSync, writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const STABLE_VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const MANIFEST = 'plugins/cosmos/.codex-plugin/plugin.json';

function parts(version) {
    if (typeof version !== 'string' || !STABLE_VERSION.test(version)) {
        throw new Error(`Version must be stable and use x.y.z; received: ${String(version)}`);
    }
    return version.split('.').map(Number);
}

function compare(left, right) {
    const leftParts = parts(left);
    const rightParts = parts(right);
    for (let index = 0; index < leftParts.length; index += 1) {
        if (leftParts[index] !== rightParts[index]) return leftParts[index] - rightParts[index];
    }
    return 0;
}

export function syncManifest(version, manifestPath = MANIFEST) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    parts(manifest.version);
    parts(version);
    if (compare(version, manifest.version) < 0) {
        throw new Error(`Refusing to decrease manifest version: ${manifest.version} -> ${version}`);
    }
    if (version === manifest.version) return false;
    manifest.version = version;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const version = process.argv[2];
    const changed = syncManifest(version);
    process.stdout.write(changed ? `Manifest synchronized to ${version}\n` : `Manifest already at ${version}\n`);
}
