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
  ['cosmos-designer', ['Designer', 'gpt-5.6-terra', 'medium']],
  ['cosmos-executor', ['Executor', 'gpt-5.6-terra', 'medium']],
  ['cosmos-explorer', ['Explorer', 'gpt-5.6-luna', 'medium']],
  ['cosmos-git-master', ['Git Master', 'gpt-5.6-luna', 'medium']],
  ['cosmos-librarian', ['Librarian', 'gpt-5.6-luna', 'medium']],
  ['cosmos-oracle', ['Oracle / Architect', 'gpt-6-astra', 'low']],
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
  assert.match(skill, /fresh Executor receives a read-only scope/);
  assert.match(skill, /do not conflate their contracts/);
  assert.match(skill, /required delegates completed or their failures were recorded/);
  assert.match(skill, /no commit, publication, retry, or other external effect was inferred/);
});

test('all six roles define positive, negative, and rule-of-thumb routing', () => {
  assert.equal(expectedRoles.size, 6);

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
    /Executor work must preserve the Designer's intent/,
  );
  assert.match(
    roleSection('Executor'),
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
  assert.equal(parsedProfiles.length, 6);

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
