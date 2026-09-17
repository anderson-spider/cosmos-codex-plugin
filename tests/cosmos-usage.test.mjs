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
      {type: 'event_msg', timestamp: '2026-09-16T10:00:04Z', payload: {type: 'token_count', rate_limits: {plan_type: 'test', primary: {used_percent: 11}, secondary: {used_percent: 21}}, message: 'must-not-leak'}},
    ],
    [
      {type: 'session_meta', payload: {id: 'child-session', session_id: 'root-session', cwd: '/private/project', source: {subagent: {thread_spawn: {agent_role: 'executor'}}}}},
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
    assert.deepEqual(report.rate_limit_change.primary, [10, 11]);
    assert.deepEqual(report.threads.map((thread) => thread.role), ['root', 'executor']);
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
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});
