import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';

const script = 'plugins/cosmos/scripts/cosmos-usage.py';

function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'cosmos-usage-'));
  const day = join(directory, '2026', '09', '16');
  mkdirSync(day, {recursive: true});
  const records = [
    [
      {type: 'session_meta', payload: {id: 'root-session', session_id: 'root-session', source: 'cli'}},
      {type: 'turn_context', timestamp: '2026-09-16T10:00:00Z', payload: {model: 'gpt-root', effort: 'low'}},
      {type: 'token_usage_record', timestamp: '2026-09-16T10:00:02Z', payload: {usage: {input_tokens: 100, cached_input_tokens: 40, output_tokens: 20, reasoning_output_tokens: 5, total_tokens: 120}}},
      {type: 'event_msg', timestamp: '2026-09-16T10:00:03Z', payload: {type: 'token_count', rate_limits: {plan_type: 'test', primary: {used_percent: 10}, secondary: {used_percent: 20}}}},
      {type: 'event_msg', timestamp: '2026-09-16T10:00:04Z', payload: {type: 'token_count', info: {last_token_usage: {input_tokens: 100, output_tokens: 20, total_tokens: 120}, total_token_usage: {input_tokens: 100, cached_input_tokens: 40, output_tokens: 20, reasoning_output_tokens: 5, total_tokens: 120}}, rate_limits: {plan_type: 'test', primary: {used_percent: 11}, secondary: {used_percent: 21}}, message: 'must-not-leak'}},
    ],
    [
      {type: 'session_meta', payload: {id: 'child-session', session_id: 'root-session', parent_thread_id: 'root-session', cwd: '/private/project', source: {subagent: {thread_spawn: {agent_role: 'executor'}}}}},
      {type: 'turn_context', timestamp: '2026-09-16T10:00:01Z', payload: {model: 'gpt-child', effort: 'medium'}},
      {type: 'event_msg', timestamp: '2026-09-16T10:00:03Z', payload: {type: 'token_usage_record', usage: {input_tokens: 50, output_tokens: 10, total_tokens: 60}, prompt: 'secret prompt'}},
    ],
  ];
  records.forEach((rollout, index) => {
    writeFileSync(
      join(day, `rollout-${index}.jsonl`),
      `${rollout.map((record) => JSON.stringify(record)).join('\n')}\n`,
    );
  });
  return directory;
}

function run(directory, ...args) {
  return execFileSync(
    'python3',
    [script, '--sessions-dir', directory, ...args],
    {encoding: 'utf8'},
  );
}

test('usage report aggregates thread metadata and token deltas', () => {
  const directory = fixture();
  try {
    const report = JSON.parse(run(directory, '--latest', '--format', 'json'));
    assert.equal(report.thread_count, 2);
    assert.equal(report.delegation_count, 1);
    assert.equal(report.totals.total_tokens, 180);
    assert.equal(report.diagnostics.scanned_files, 2);
    assert.deepEqual(report.rate_limit_change.primary, [10, 11]);
    assert.deepEqual(report.threads.map((thread) => thread.role), ['root', 'executor']);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test('cumulative token records replace incremental records instead of double counting', () => {
  const directory = fixture();
  try {
    const report = JSON.parse(run(directory, '--latest', '--format', 'json'));
    assert.equal(report.threads[0].tokens.total_tokens, 120);
    assert.equal(report.threads[0].responses, 1);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test('cumulative-only token records provide the response count fallback', () => {
  const directory = fixture();
  const day = join(directory, '2026', '09', '16');
  try {
    writeFileSync(join(day, 'rollout-cumulative-only.jsonl'), [
      {type: 'session_meta', payload: {id: 'cumulative-root', session_id: 'cumulative-root', source: 'cli'}},
      {type: 'event_msg', timestamp: '2026-09-16T11:00:00Z', payload: {type: 'token_count', info: {last_token_usage: {total_tokens: 7}, total_token_usage: {total_tokens: 7}}}},
      {type: 'event_msg', timestamp: '2026-09-16T11:00:01Z', payload: {type: 'token_count', info: {last_token_usage: {total_tokens: 5}, total_token_usage: {total_tokens: 12}}}},
    ].map((record) => JSON.stringify(record)).join('\n'));
    const report = JSON.parse(run(directory, '--session', 'cumulative-', '--format', 'json'));
    assert.equal(report.threads[0].responses, 2);
    assert.equal(report.totals.total_tokens, 12);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test('mixed timestamp offsets and invalid token values remain deterministic', () => {
  const directory = fixture();
  const day = join(directory, '2026', '09', '16');
  try {
    writeFileSync(join(day, 'rollout-offsets.jsonl'), [
      {type: 'session_meta', timestamp: '2026-09-16T08:00:00', payload: {id: 'offset-root', session_id: 'offset-root', source: 'cli'}},
      {type: 'turn_context', timestamp: '2026-09-16T09:00:00+01:00', payload: {model: 'gpt-test', effort: 'low'}},
      {type: 'token_usage_record', timestamp: '2026-09-16T08:00:01Z', payload: {usage: {input_tokens: -2, output_tokens: true, total_tokens: 3}}},
    ].map((record) => JSON.stringify(record)).join('\n'));
    const report = JSON.parse(run(directory, '--session', 'offset-', '--format', 'json'));
    assert.equal(report.threads[0].duration_seconds, 1);
    assert.equal(report.totals.input_tokens, 0);
    assert.equal(report.totals.output_tokens, 0);
    assert.equal(report.totals.total_tokens, 3);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test('real subagent metadata with a null role remains a delegation', () => {
  const directory = fixture();
  const day = join(directory, '2026', '09', '16');
  try {
    writeFileSync(join(day, 'rollout-real-subagent.jsonl'), `${JSON.stringify({
      type: 'session_meta',
      payload: {
        id: 'real-child',
        session_id: 'root-session',
        parent_thread_id: 'root-session',
        thread_source: 'subagent',
        source: {subagent: {thread_spawn: {agent_role: null, agent_path: '/root/private-task'}}},
      },
    })}\n`);
    const report = JSON.parse(run(directory, '--latest', '--format', 'json'));
    assert.equal(report.delegation_count, 2);
    assert.equal(report.threads.find((thread) => thread.thread_id === 'real-child').role, 'subagent');
    assert.doesNotMatch(JSON.stringify(report), /private-task/);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test('usage output excludes paths, prompts, messages, and rollout filenames', () => {
  const directory = fixture();
  try {
    const output = run(directory, '--session', 'root-', '--format', 'json');
    for (const sensitive of ['/private/project', 'secret prompt', 'must-not-leak', 'rollout-0.jsonl']) {
      assert.doesNotMatch(output, new RegExp(sensitive.replaceAll('/', '\\/')));
    }
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test('usage list supports date filtering and rejects ambiguous modes', () => {
  const directory = fixture();
  try {
    assert.match(run(directory, '--list', '--date', '2026-09-16'), /root-session \| 2 \| 1/);
    const result = spawnSync(
      'python3',
      [script, '--sessions-dir', directory, '--list', '--latest'],
      {encoding: 'utf8'},
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /choose exactly one/);
    const jsonList = JSON.parse(run(directory, '--list', '--format', 'json'));
    assert.equal(jsonList.sessions[0].session_id, 'root-session');
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test('invalid and duplicate rollouts produce path-free diagnostics', () => {
  const directory = fixture();
  const day = join(directory, '2026', '09', '16');
  try {
    writeFileSync(join(day, 'rollout-invalid.jsonl'), 'secret-path invalid json\n');
    writeFileSync(join(day, 'rollout-duplicate.jsonl'), `${JSON.stringify({
      type: 'session_meta', payload: {id: 'child-session', session_id: 'root-session'},
    })}\n`);
    const result = spawnSync(
      'python3',
      [script, '--sessions-dir', directory, '--latest', '--format', 'json'],
      {encoding: 'utf8'},
    );
    assert.equal(result.status, 0);
    const report = JSON.parse(result.stdout);
    assert.equal(report.diagnostics.invalid_lines, 1);
    assert.equal(report.diagnostics.invalid_rollouts, 1);
    assert.equal(report.diagnostics.duplicate_threads, 1);
    assert.match(result.stderr, /warning: skipped or ignored/);
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /secret-path|rollout-invalid/);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test('missing directory errors do not echo its path', () => {
  const directory = fixture();
  rmSync(directory, {recursive: true, force: true});
  const result = spawnSync(
    'python3',
    [script, '--sessions-dir', `${directory}-private`, '--list'],
    {encoding: 'utf8'},
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /sessions directory not found/);
  assert.doesNotMatch(result.stderr, /cosmos-usage-/);
});

test('argument errors from an absolute invocation do not expose the script path', () => {
  const directory = fixture();
  try {
    const absoluteScript = join(process.cwd(), script);
    const result = spawnSync(
      'python3',
      [absoluteScript, '--sessions-dir', directory, '--list', '--latest'],
      {encoding: 'utf8'},
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /^usage: cosmos-usage\.py/m);
    assert.doesNotMatch(result.stderr, new RegExp(process.cwd().replaceAll('/', '\\/')));
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});
