import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readdirSync, readFileSync} from 'node:fs';
import test from 'node:test';

const skill = readFileSync(
  'plugins/cosmos/skills/cosmos-orchestrate/SKILL.md',
  'utf8',
);
const readme = readFileSync('plugins/cosmos/README.md', 'utf8');
const profileDirectory =
  'plugins/cosmos/skills/cosmos-orchestrate/references/agents';
const profilePaths = readdirSync(profileDirectory)
  .filter((name) => name.endsWith('.toml'))
  .sort()
  .map((name) => `${profileDirectory}/${name}`);

const parsedProfiles = JSON.parse(
  execFileSync(
    'python3',
    [
      '-c',
      [
        'import json, pathlib, sys, tomllib',
        'profiles = []',
        'for path in sys.argv[1:]:',
        '    with open(path, "rb") as source:',
        '        profile = tomllib.load(source)',
        '    profile["path"] = pathlib.Path(path).name',
        '    profiles.append(profile)',
        'print(json.dumps(profiles))',
      ].join('\n'),
      ...profilePaths,
    ],
    {encoding: 'utf8'},
  ),
);

const expectedRoles = new Map([
  ['cosmos-reviewer', ['Reviewer', 'gpt-5.6-terra', 'medium']],
  ['cosmos-designer', ['Designer', 'gpt-5.6-terra', 'medium']],
  ['cosmos-implementer', ['Implementer', 'gpt-5.6-luna', 'high']],
  ['cosmos-explorer', ['Explorer', 'gpt-5.6-luna', 'low']],
  ['cosmos-git-master', ['Git Master', 'gpt-5.6-luna', 'low']],
  ['cosmos-librarian', ['Librarian', 'gpt-5.6-luna', 'medium']],
  ['cosmos-oracle', ['Oracle / Architect', 'gpt-5.6-sol', 'low']],
]);

function roleSection(role) {
  const heading = `#### ${role} —`;
  const start = skill.indexOf(heading);
  assert.notEqual(start, -1, `missing routing section for ${role}`);
  const next = skill.indexOf('\n#### ', start + heading.length);
  return skill.slice(start, next === -1 ? skill.length : next);
}

test('orchestrator applies the prescriptive delegation threshold and workflow', () => {
  for (const step of [
    'Understand',
    'Path Selection',
    'Delegation Check',
    'Dispatch',
    'Reconcile',
    'Verify',
    'Completion Gate',
  ]) {
    assert.match(skill, new RegExp(`\\*\\*${step}:\\*\\*`));
  }

  assert.match(
    skill,
    /only when the entire request is one isolated, clear, already located, low-risk action/,
  );
  assert.match(skill, /Do not keep substantive work entirely in the Orchestrator/);
  assert.match(skill, /Dispatch independent lanes in parallel/);
  assert.match(skill, /Serialize lanes that depend on another result/);
  assert.match(skill, /allowed file scopes, and the validation owner/);
});

test('orchestrator budgets concurrency instead of filling available slots', () => {
  assert.match(skill, /smallest useful concurrency budget/);
  assert.match(skill, /Default to no more than two concurrent specialists/);
  assert.match(skill, /Available slots are a ceiling, not a target/);
  assert.match(skill, /Do not occupy a slot with work that is waiting/);
});

test('delivery separates implementation, verification, review, and completion', () => {
  assert.match(skill, /\*\*Implementation:\*\*/);
  assert.match(skill, /\*\*Verification:\*\*/);
  assert.match(skill, /\*\*Independent Review:\*\*/);
  assert.match(skill, /may edit tests only when that permission and file scope were delegated explicitly/);
  assert.match(skill, /fresh Reviewer receives a read-only scope/);
  assert.match(skill, /Do not conflate their contracts/);
  assert.match(skill, /required delegates completed or their blocked, failed, or cancelled states were recorded/);
  assert.match(skill, /no commit, publication, retry, or other external effect was inferred/);
});

test('orchestrator owns delegate lifecycle and result integration', () => {
  assert.match(skill, /active, completed, blocked, failed, or cancelled/);
  assert.match(skill, /user changes scope/);
  assert.match(skill, /Do not leave idle delegates occupying the concurrency budget/);
  assert.match(skill, /do not report completion while required delegates remain active/);
  assert.match(skill, /If results disagree, compare their evidence/);
  assert.match(skill, /accepted, corrected, or explicitly rejected with a reason/);
  assert.match(skill, /no required delegate remains active/);
});

test('fallbacks avoid repeated failures and preserve evidence boundaries', () => {
  assert.match(skill, /native delegation tools are unavailable/);
  assert.match(skill, /requested model or named selector is unavailable/);
  assert.match(skill, /Do not retry the same failed model, selector, or tool call without new evidence/);
  assert.match(skill, /Distinguish observed validation and source evidence from assumptions/);
});

test('all seven roles define positive, negative, and rule-of-thumb routing', () => {
  assert.equal(expectedRoles.size, 7);

  for (const [, [role, model, effort]] of expectedRoles) {
    const section = roleSection(role);
    assert.match(
      section,
      new RegExp(`${model.replaceAll('.', '\\.')} \\/ ${effort}`),
    );
    assert.match(section, /\*\*Delegate when:\*\*/);
    assert.match(section, /\*\*Don't delegate when:\*\*/);
    assert.match(section, /\*\*Rule of thumb:\*\*/);
  }
});

test('routing keeps Explorer, Librarian, and Oracle responsibilities distinct', () => {
  assert.match(roleSection('Explorer'), /local code path is unknown/);
  assert.match(roleSection('Explorer'), /exact file and symbol are known/);
  assert.match(roleSection('Librarian'), /external documentation/);
  assert.match(roleSection('Librarian'), /stable general programming knowledge/);
  assert.match(
    roleSection('Oracle / Architect'),
    /consequential architectural decision/,
  );
  assert.match(
    roleSection('Oracle / Architect'),
    /not a default approval gate or implementer/,
  );
});

test('routing preserves Designer ownership and Git Master authorization', () => {
  assert.match(roleSection('Designer'), /visual or interaction judgment matters/);
  assert.match(
    roleSection('Designer'),
    /Implementer work must preserve the Designer's intent/,
  );
  assert.match(
    roleSection('Implementer'),
    /discovery, external research, architecture, or visual direction is still unresolved/,
  );
  assert.match(roleSection('Git Master'), /creating a commit/);
  assert.match(
    roleSection('Git Master'),
    /Delegation never authorizes a remote effect by itself/,
  );
  assert.match(skill, /\.\.\/git-master\/SKILL\.md/);
});

test('all specialist profiles parse and match documented names and models', () => {
  assert.equal(parsedProfiles.length, 7);

  for (const profile of parsedProfiles) {
    const expected = expectedRoles.get(profile.name);
    assert.ok(expected, `unexpected profile ${profile.name} in ${profile.path}`);
    const [role, model, effort] = expected;
    assert.equal(profile.model, model);
    assert.equal(profile.model_reasoning_effort, effort);
    assert.ok(profile.description.length > 0);
    assert.ok(profile.developer_instructions.length > 0);
    assert.match(profile.developer_instructions, /Do not .*delegate/i);
    assert.match(
      skill,
      new RegExp(
        `#### ${role.replace('/', '\\/')} — ${model.replaceAll('.', '\\.')} \\/ ${effort}`,
      ),
    );
    assert.match(
      readme,
      new RegExp(
        `\\| ${role.split(' / ')[0]} \\| ${model.replaceAll('.', '\\.')} \\| ${effort} \\|`,
      ),
    );
  }
});

test('documentation states the static enforcement boundary', () => {
  assert.match(
    readme,
    /tested orchestration contract, not a runtime semantic classifier/,
  );
  assert.match(
    readme,
    /TOML profiles remain optional templates rather than automatically registered agents/,
  );
  assert.match(
    readme,
    /session-level configuration can override requested read-only settings/,
  );
});


test('fixed presets exclude adaptive escalation and require verified named profiles', () => {
  assert.match(skill, /Each specialist has one fixed model and effort/);
  assert.match(skill, /Do not change a role's model or effort/);
  assert.doesNotMatch(skill, /raise only the affected agent|next supported level|to raise effort/);
  assert.match(skill, /effective name, model, and effort have been inspected in this session/);
  assert.match(skill, /Without that evidence, use generic creation/);
  assert.match(skill, /exact fixed pair is available/);
  assert.match(skill, /do not silently substitute another pair/);
  assert.match(skill, /Never claim independent review or independent verification when the Orchestrator takes over its own work/);
  assert.match(skill, /Return the lane to the Orchestrator/);
  assert.match(skill, /return evidence and partial work/);
  assert.match(skill, /gpt-6-astra \/ low/);
  assert.match(skill, /skill does not change the conversation model/);
});

test('reviewer separates code and plan review from implementation', () => {
  const reviewer = parsedProfiles.find((p) => p.name === 'cosmos-reviewer');
  const implementer = parsedProfiles.find((p) => p.name === 'cosmos-implementer');
  assert.equal(reviewer.sandbox_mode, 'read-only');
  for (const pattern of [/In code mode/, /In plan mode/, /location, evidence, and impact/, /Do not edit files, implement fixes, approve publication, or delegate/]) {
    assert.match(reviewer.developer_instructions, pattern);
  }
  assert.match(implementer.developer_instructions, /Independent code and plan review belongs to Reviewer/);
  assert.match(roleSection('Reviewer'), /independent code review/);
  assert.match(roleSection('Reviewer'), /work plan needs independent review/);
  assert.match(roleSection('Reviewer'), /Do not invoke every role as a mandatory pipeline/);
  assert.match(roleSection('Implementer'), /implementation is bounded and non-trivial/);
  assert.ok(!parsedProfiles.some((p) => p.name === 'cosmos-executor'));
  assert.match(readme, /no compatibility alias is shipped/);
  assert.match(readme, /does not migrate or remove installed copies/);
});
