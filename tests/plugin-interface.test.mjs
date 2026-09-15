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

test('plugin starter prompts invoke the installed Cosmos skill namespace', () => {
  const prompts = manifest.interface.defaultPrompt;

  assert.ok(prompts.length > 0 && prompts.length <= 3);
  for (const prompt of prompts) {
    assert.ok(prompt.length <= 128);
    assert.match(prompt, /^Use \$cosmos:cosmos-orchestrate\b/);
  }
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
});

test('delegation contract carries authorization boundaries to subagents', () => {
  assert.match(skillInstructions, /Ações autorizadas para o filho/);
  assert.match(skillInstructions, /restrições aplicáveis/);
  assert.match(skillInstructions, /efeitos que ainda dependem de aprovação do usuário/);
  assert.match(skillInstructions, /devolvê-la ao Orchestrator/);
});
