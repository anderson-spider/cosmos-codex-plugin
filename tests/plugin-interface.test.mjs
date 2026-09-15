import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const manifest = JSON.parse(
  readFileSync('plugins/cosmos/.codex-plugin/plugin.json', 'utf8'),
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

test('plugin starter prompts invoke the installed Cosmos skill namespace', () => {
  const prompts = manifest.interface.defaultPrompt;

  assert.ok(prompts.length > 0 && prompts.length <= 3);
  assert.ok(prompts.every((prompt) => prompt.length <= 128));
  assert.ok(prompts.some((prompt) => /^Use \$cosmos:cosmos-orchestrate\b/.test(prompt)));
  assert.ok(prompts.some((prompt) => /^Use \$cosmos:git-master\b/.test(prompt)));
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
  assert.match(skillInstructions, /\| Git Master \| gpt-5\.6-terra \/ medium \|/);
  assert.match(skillInstructions, /\.\.\/git-master\/SKILL\.md/);
  assert.match(gitProfile, /^name = "cosmos-git-master"$/m);
  assert.match(gitProfile, /^model = "gpt-5\.6-terra"$/m);
  assert.match(gitProfile, /^model_reasoning_effort = "medium"$/m);
});

test('Git Master keeps local and remote effects independently authorized', () => {
  assert.match(gitSkillInstructions, /commit or publication/i);
  assert.match(gitSkillInstructions, /does not authorize a push/i);
  assert.match(gitSkillInstructions, /separate explicit authorization/i);
  assert.match(gitSkillInstructions, /Merge, approval, auto-merge, tags, releases, and branch deletion are outside/i);
  assert.match(gitSkillInstructions, /Never execute a force-push/i);
});

test('delegation contract carries authorization boundaries to subagents', () => {
  assert.match(skillInstructions, /Ações autorizadas para o filho/);
  assert.match(skillInstructions, /restrições aplicáveis/);
  assert.match(skillInstructions, /efeitos que ainda dependem de aprovação do usuário/);
  assert.match(skillInstructions, /devolvê-la ao Orchestrator/);
});
