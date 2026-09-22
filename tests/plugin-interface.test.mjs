import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const manifest = JSON.parse(
  readFileSync('plugins/cosmos/.codex-plugin/plugin.json', 'utf8'),
);
const marketplace = JSON.parse(
  readFileSync('.agents/plugins/marketplace.json', 'utf8'),
);
const skillMetadata = readFileSync(
  'plugins/cosmos/skills/cosmos-orchestrate/agents/openai.yaml',
  'utf8',
);
const skillInstructions = readFileSync(
  'plugins/cosmos/skills/cosmos-orchestrate/SKILL.md',
  'utf8',
);
const gitSkillMetadata = readFileSync(
  'plugins/cosmos/skills/git-master/agents/openai.yaml',
  'utf8',
);
const gitSkillInstructions = readFileSync(
  'plugins/cosmos/skills/git-master/SKILL.md',
  'utf8',
);
const gitProfile = readFileSync(
  'plugins/cosmos/skills/cosmos-orchestrate/references/agents/cosmos-git-master.toml',
  'utf8',
);
const gitEnvironment = readFileSync(
  'plugins/cosmos/skills/git-master/references/environment-and-identity.md',
  'utf8',
);
const gitLabInstructions = readFileSync(
  'plugins/cosmos/skills/git-master/references/gitlab.md',
  'utf8',
);
const gitLabPipelineInstructions = readFileSync(
  'plugins/cosmos/skills/git-master/references/gitlab-pipelines.md',
  'utf8',
);

test('plugin starter prompts invoke the installed Cosmos skill namespace', () => {
  const prompts = manifest.interface.defaultPrompt;

  assert.ok(prompts.length > 0 && prompts.length <= 3);
  assert.ok(prompts.every((prompt) => prompt.length <= 128));
  assert.ok(prompts.some((prompt) => /^Use \$cosmos:cosmos-orchestrate\b/.test(prompt)));
  assert.ok(prompts.some((prompt) => /^Use \$cosmos:git-master\b/.test(prompt)));
});

test('marketplace identity and source resolve to the plugin manifest', () => {
  const entry = marketplace.plugins.find((plugin) => plugin.name === manifest.name);

  assert.equal(marketplace.name, manifest.name);
  assert.equal(marketplace.interface.displayName, manifest.interface.displayName);
  assert.ok(entry, 'marketplace must contain the manifest plugin name');
  assert.deepEqual(entry.source, {source: 'local', path: './plugins/cosmos'});
  assert.equal(entry.category, manifest.interface.category);
});

test('skill metadata invokes its local skill name without the plugin namespace', () => {
  const defaultPrompt = skillMetadata.match(
    /^\s*default_prompt:\s*"([^"]+)"\s*$/m,
  );

  assert.ok(defaultPrompt, 'interface.default_prompt must be present');
  assert.match(defaultPrompt[1], /^Use \$cosmos-orchestrate\b/);
  assert.doesNotMatch(defaultPrompt[1], /\$cosmos:/);
});

test('skill remains eligible for automatic discovery', () => {
  assert.doesNotMatch(skillMetadata, /allow_implicit_invocation:\s*false/);
  assert.match(gitSkillMetadata, /allow_implicit_invocation:\s*true/);
});

test('Git Master metadata invokes its local skill name', () => {
  const defaultPrompt = gitSkillMetadata.match(
    /^\s*default_prompt:\s*"([^"]+)"\s*$/m,
  );

  assert.ok(defaultPrompt, 'Git Master interface.default_prompt must be present');
  assert.match(defaultPrompt[1], /^Use \$git-master\b/);
  assert.doesNotMatch(defaultPrompt[1], /\$cosmos:/);
});

test('orchestrator routes Git Master through the sibling skill', () => {
  assert.match(skillInstructions, /#### Git Master — gpt-6-luna \/ low/);
  assert.match(skillInstructions, /\.\.\/git-master\/SKILL\.md/);
  assert.match(gitProfile, /^name = "cosmos-git-master"$/m);
  assert.match(gitProfile, /^model = "gpt-6-luna"$/m);
  assert.match(gitProfile, /^model_reasoning_effort = "low"$/m);
});

test('Git Master includes the necessary task-branch push in a requested PR opening', () => {
  assert.match(gitSkillInstructions, /request to open a PR\/MR includes the commit and branch push/);
  assert.match(gitSkillInstructions, /no separate push confirmation is needed when the destination is confirmed/);
  assert.match(gitSkillInstructions, /not a push to another branch or repository/);
  assert.match(gitSkillInstructions, /Merge, approval, auto-merge, tags, releases, and branch deletion are outside/i);
  assert.match(gitSkillInstructions, /Never execute a force-push/i);
  assert.match(gitProfile, /request to open a PR or MR authorizes the task-scoped commit/);
});

test('Git Master routes GitLab operations through the configured environment alias', () => {
  assert.match(gitEnvironment, /Personal GitLab[\s\S]*`glab-personal`/);
  assert.match(gitEnvironment, /Work GitLab[\s\S]*`glab-work`/);
  assert.match(gitEnvironment, /Do not use bare `glab`/);
  assert.match(gitEnvironment, /do not silently[\s\S]*fall back to the other alias/i);
  assert.match(gitLabInstructions, /<selected-glab-alias> mr create/);
  assert.match(gitLabInstructions, /Never[\s\S]*substitute bare `glab`/i);
  assert.match(gitLabPipelineInstructions, /<selected-glab-alias> api/);
  assert.doesNotMatch(gitLabInstructions, /Prefer an installed `glab` client/);
  assert.doesNotMatch(gitLabPipelineInstructions, /Prefer an installed `glab` client/);
});

test('delegation contract carries authorization boundaries to subagents', () => {
  assert.match(skillInstructions, /Actions authorized for the child/);
  assert.match(skillInstructions, /applicable restrictions/);
  assert.match(skillInstructions, /effects that still require user approval/);
  assert.match(skillInstructions, /return it to the Orchestrator/);
});
