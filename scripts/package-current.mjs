import {readFileSync} from 'node:fs';

import {prepare} from './prepare-release.mjs';

const manifest = JSON.parse(
    readFileSync('plugins/cosmos/.codex-plugin/plugin.json', 'utf8'),
);

await prepare({}, {
    cwd: process.cwd(),
    nextRelease: {version: manifest.version},
    logger: {log: (message) => process.stdout.write(`${message}\n`)},
});
