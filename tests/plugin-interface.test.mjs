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

test('starter prompts explicitly invoke the installed Cosmos skill', () => {
  const prompts = manifest.interface.defaultPrompt;

  assert.ok(prompts.length > 0 && prompts.length <= 3);
  for (const prompt of prompts) {
    assert.ok(prompt.length <= 128);
    assert.match(prompt, /^Use \$cosmos:cosmos-orchestrate\b/);
  }
});

test('skill remains eligible for automatic discovery', () => {
  assert.doesNotMatch(skillMetadata, /allow_implicit_invocation:\s*false/);
});
