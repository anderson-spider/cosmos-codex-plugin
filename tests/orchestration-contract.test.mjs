import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readdirSync, readFileSync} from 'node:fs';
import test from 'node:test';

const skill = readFileSync(
  'plugins/cosmos/skills/cosmos-orchestrate/SKILL.md',
  'utf8',
);
const readme = readFileSync('plugins/cosmos/README.md', 'utf8');
const repositoryReadme = readFileSync('README.md', 'utf8');
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
  ['cosmos-reviewer', ['Reviewer', 'gpt-6-sol', 'high']],
  ['cosmos-designer', ['Designer', 'gpt-6-sol', 'medium']],
  ['cosmos-implementer', ['Implementer', 'gpt-6-luna', 'high']],
  ['cosmos-3d-modeler', ['3D Modeler', 'gpt-6-sol', 'medium']],
  ['cosmos-explorer', ['Explorer', 'gpt-6-luna', 'low']],
  ['cosmos-git-master', ['Git Master', 'gpt-6-luna', 'low']],
  ['cosmos-librarian', ['Librarian', 'gpt-6-luna', 'medium']],
  ['cosmos-oracle', ['Oracle / Architect', 'gpt-6-astra', 'high']],
]);

function roleSection(role) {
  const heading = `#### ${role} —`;
  const start = skill.indexOf(heading);
  assert.notEqual(start, -1, `missing routing section for ${role}`);
  const next = skill.indexOf('\n#### ', start + heading.length);
  return skill.slice(start, next === -1 ? skill.length : next);
}

function agentTable(document) {
  const lines = document.split('\n');
  const start = lines.indexOf('| Agent | Model | Effort |');
  assert.notEqual(start, -1, 'missing Agent/Model/Effort table');
  assert.equal(lines[start + 1], '|---|---|---|');
  const rows = new Map();
  for (const line of lines.slice(start + 2)) {
    if (!line.startsWith('|')) break;
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
    assert.equal(cells.length, 3, `invalid agent row: ${line}`);
    assert.ok(!rows.has(cells[0]), `duplicate agent: ${cells[0]}`);
    rows.set(cells[0], cells.slice(1));
  }
  return rows;
}

test('orchestrator chooses direct work or bounded delegation', () => {
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

  assert.match(skill, /Direct execution is a normal Orchestrator path, including substantive work/);
  assert.match(skill, /Task size or category alone does not require delegation/);
  assert.match(skill, /independent work, specialist judgment or tools, or independent review/);
  assert.match(skill, /For direct Git or CI work, read the sibling/);
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

test('all eight roles define positive, negative, and rule-of-thumb routing', () => {
  assert.equal(expectedRoles.size, 8);

  for (const [, [role, model, effort]] of expectedRoles) {
    const section = roleSection(role);
    assert.match(
      section,
      new RegExp(`${model.replaceAll('.', '\\.')} \\/ ${effort}`),
    );
    assert.match(section, /\*\*After deciding to delegate, choose this specialist when:\*\*/);
    assert.match(section, /\*\*Don't delegate when:\*\*/);
    assert.match(section, /\*\*Rule of thumb:\*\*/);
  }
});

test('both README agent tables match the eight TOML presets and chat-selected Orchestrator recommendation', () => {
  const expected = new Map([['Orchestrator', ['gpt-6-sol', 'medium']]]);
  for (const profile of parsedProfiles) {
    const role = expectedRoles.get(profile.name)?.[0];
    assert.ok(role, `unexpected profile ${profile.name}`);
    expected.set(role.split(' / ')[0], [profile.model, profile.model_reasoning_effort]);
  }
  assert.equal(expected.size, 9);
  const sortedEntries = (table) => [...table].sort(([left], [right]) => left.localeCompare(right));
  assert.deepEqual(sortedEntries(agentTable(repositoryReadme)), sortedEntries(expected));
  assert.deepEqual(sortedEntries(agentTable(readme)), sortedEntries(expected));
  assert.match(repositoryReadme, /only a recommendation for the Orchestrator/);
  assert.match(repositoryReadme, /selected in the chat/);
  assert.match(repositoryReadme, /does not register the\s+specialists automatically/);
});

test('routing examples and session instructions preserve decision and Git boundaries', () => {
  assert.match(skill, /Make decisions using the instructions loaded in this session/);
  assert.match(skill, /source checkout or a local installation/);
  assert.match(skill, /does not retroactively change the instructions/);
  assert.match(skill, /small change in a known file directly/);
  assert.match(skill, /sequential local Git sync[\s\S]*reading the sibling Git Master skill/);
  assert.match(skill, /read-only investigation to Oracle[\s\S]*independent judgment/);
  assert.match(skill, /For direct Git or CI work, read the sibling/);
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
  assert.match(roleSection('Implementer'), /the task is 3D asset creation or editing/);
  assert.match(roleSection('3D Modeler'), /the work is gameplay or tooling code without 3D asset edits/);
  assert.match(roleSection('Git Master'), /requested commit, push, PR\/MR mutation, CI correction/);
  assert.match(
    roleSection('Git Master'),
    /Delegation never authorizes a remote effect by itself/,
  );
  assert.match(skill, /\.\.\/git-master\/SKILL\.md/);
});

test('3D Modeler routes Unity work through MCP before computer use', () => {
  const section = roleSection('3D Modeler');
  const profile = parsedProfiles.find((p) => p.name === 'cosmos-3d-modeler');
  assert.match(section, /3D asset or scene requiring modeling/);
  assert.match(section, /prefer an available Unity MCP/);
  assert.match(section, /computer use as a fallback only when the MCP is unavailable or lacks the needed operation/);
  assert.match(section, /Never infer tool access or visual validation from the model preset alone/);
  assert.match(profile.developer_instructions, /prefer an available Unity MCP/);
  assert.match(profile.developer_instructions, /Use computer use to operate the Unity Editor only when the MCP is unavailable or lacks the needed operation/);
  assert.match(profile.developer_instructions, /Do not claim visual or runtime validation unless it occurred/);
});

test('all specialist profiles parse and match documented names and models', () => {
  assert.equal(parsedProfiles.length, 8);

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
  assert.match(skill, /gpt-6-sol \/ medium/);
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
  assert.match(roleSection('Implementer'), /code implementation is bounded and non-trivial/);
  assert.ok(!parsedProfiles.some((p) => p.name === 'cosmos-executor'));
  assert.match(readme, /no compatibility alias is shipped/);
  assert.match(readme, /does not migrate or remove installed copies/);
});
