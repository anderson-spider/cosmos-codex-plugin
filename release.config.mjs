export default {
  branches: ['main'],
  tagFormat: 'v${version}',
  plugins: [
    ['@semantic-release/commit-analyzer', {preset: 'conventionalcommits'}],
    ['@semantic-release/release-notes-generator', {preset: 'conventionalcommits'}],
    ['./scripts/prepare-release.mjs', {}],
    ['@semantic-release/github', {
      assets: [{path: 'dist/cosmos-*.zip', label: 'Cosmos marketplace (versioned plugin)'}],
      successComment: false,
      failComment: false,
      releasedLabels: false,
    }],
  ],
};
