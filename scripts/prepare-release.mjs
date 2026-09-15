import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const STABLE_VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const PLUGIN_MANIFEST = 'plugins/cosmos/.codex-plugin/plugin.json';
const REQUIRED_PREFIXES = ['.agents/plugins/marketplace.json', 'plugins/cosmos/'];
const CACHE_SEGMENTS = new Set(['__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache', 'node_modules']);

function isCachePath(file) {
    return file.split('/').some((segment) => CACHE_SEGMENTS.has(segment) || segment === '.DS_Store')
        || file.endsWith('.pyc')
        || file.endsWith('.pyo');
}

function trackedFiles(cwd) {
    const output = execFileSync('git', ['ls-files', '-z', '--', '.agents/plugins/marketplace.json', 'plugins/cosmos'], {
        cwd,
        encoding: 'utf8',
    });
    const files = output.split('\0').filter(Boolean);

    if (!files.includes('.agents/plugins/marketplace.json') || !files.includes(PLUGIN_MANIFEST)) {
        throw new Error('O marketplace e o manifesto do plugin devem estar versionados no Git.');
    }

    for (const file of files) {
        if (!REQUIRED_PREFIXES.some((prefix) => file === prefix || file.startsWith(prefix))) {
            throw new Error(`Arquivo fora do layout do marketplace: ${file}`);
        }
        if (path.posix.isAbsolute(file) || file.split('/').includes('..') || isCachePath(file)) {
            throw new Error(`Arquivo rastreado não pode entrar no pacote: ${file}`);
        }
    }
    return files;
}

const CREATE_ARCHIVE = String.raw`
import json, os, pathlib, stat, sys, zipfile

root = pathlib.Path.cwd().resolve()
output = pathlib.Path(sys.argv[1]).resolve()
version = sys.argv[2]
files = json.loads(sys.stdin.read())
manifest_path = 'plugins/cosmos/.codex-plugin/plugin.json'

with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for rel in files:
        candidate = root / rel
        current = root
        for part in pathlib.PurePosixPath(rel).parts:
            current = current / part
            if stat.S_ISLNK(os.lstat(current).st_mode):
                raise RuntimeError('Symlinks are not allowed in release archives: ' + rel)
        info = os.lstat(candidate)
        resolved = candidate.resolve()
        if os.path.commonpath((str(root), str(resolved))) != str(root):
            raise RuntimeError('Release file escapes repository: ' + rel)
        if not stat.S_ISREG(info.st_mode):
            raise RuntimeError('Release entry is not a regular file: ' + rel)
        if rel == manifest_path:
            content = json.loads(candidate.read_text(encoding='utf-8'))
            content['version'] = version
            archive.writestr(rel, json.dumps(content, ensure_ascii=False, indent=2) + '\n')
        else:
            archive.write(candidate, rel)
`;

/**
 * Create the marketplace-ready Cosmos archive for semantic-release.
 *
 * @param {object} pluginConfig semantic-release plugin options (reserved).
 * @param {object} context semantic-release context.
 */
export async function prepare(pluginConfig, context) {
    void pluginConfig;
    const version = context?.nextRelease?.version;
    if (typeof version !== 'string' || !STABLE_VERSION.test(version)) {
        throw new Error(`A versão da release deve ser estável no formato x.y.z; recebida: ${String(version)}`);
    }

    const cwd = path.resolve(context?.cwd ?? process.cwd());
    const manifestPath = path.join(cwd, PLUGIN_MANIFEST);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (typeof manifest?.version !== 'string' || !STABLE_VERSION.test(manifest.version)) {
        throw new Error(`O manifesto do plugin contém uma versão inválida: ${String(manifest?.version)}`);
    }
    manifest.version = version;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const files = trackedFiles(cwd);
    const dist = path.join(cwd, 'dist');
    const archive = path.join(dist, `cosmos-${version}.zip`);
    mkdirSync(dist, {recursive: true});
    rmSync(archive, {force: true});

    execFileSync('python3', ['-c', CREATE_ARCHIVE, archive, version], {
        cwd,
        input: JSON.stringify(files),
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
    });
    context?.logger?.log(`Manifesto atualizado para ${version} e arquivo de release criado: ${archive}`);
}

export default {prepare};
