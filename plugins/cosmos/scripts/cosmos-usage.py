#!/usr/bin/env python3
"""Summarize local Codex rollout usage without exposing conversation content."""

from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

TOKEN_FIELDS = (
    "input_tokens",
    "cached_input_tokens",
    "output_tokens",
    "reasoning_output_tokens",
    "total_tokens",
)


def parse_timestamp(value: Any) -> datetime | None:
    if not isinstance(value, str):
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def validate_date(value: str) -> str:
    try:
        datetime.strptime(value, "%Y-%m-%d")
    except ValueError as error:
        raise argparse.ArgumentTypeError("date must use YYYY-MM-DD") from error
    return value


def rollout_paths(sessions_dir: Path, date: str | None) -> Iterable[Path]:
    base = sessions_dir
    if date:
        year, month, day = date.split("-")
        base = base / year / month / day
    if base.is_dir():
        yield from sorted(base.rglob("rollout-*.jsonl"))


def read_records(path: Path) -> list[dict[str, Any]]:
    records = []
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return records
    for line in lines:
        try:
            record = json.loads(line)
        except (json.JSONDecodeError, TypeError):
            continue
        if isinstance(record, dict):
            records.append(record)
    return records


def role_from_meta(meta: dict[str, Any]) -> str:
    source = meta.get("source")
    if isinstance(source, dict):
        subagent = source.get("subagent")
        if isinstance(subagent, str):
            return subagent
        if isinstance(subagent, dict):
            spawn = subagent.get("thread_spawn")
            if isinstance(spawn, dict) and spawn.get("agent_role"):
                return str(spawn["agent_role"])
            if subagent.get("other"):
                return str(subagent["other"])
    if meta.get("id") == (meta.get("session_id") or meta.get("id")):
        return "root"
    return str(meta.get("thread_source") or "subagent")


def blank_tokens() -> dict[str, int]:
    return {field: 0 for field in TOKEN_FIELDS}


def add_tokens(target: dict[str, int], source: dict[str, Any]) -> None:
    for field in TOKEN_FIELDS:
        value = source.get(field, 0)
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            target[field] += int(value)


def analyze_rollout(path: Path, records: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not records or records[0].get("type") != "session_meta":
        return None
    meta = records[0].get("payload")
    if not isinstance(meta, dict) or not meta.get("id"):
        return None

    model = "unknown"
    effort = "unknown"
    tokens = blank_tokens()
    cumulative: dict[str, Any] | None = None
    timestamps = []
    rate_limits = []
    responses = 0

    for record in records:
        timestamp = parse_timestamp(record.get("timestamp"))
        if timestamp:
            timestamps.append(timestamp)
        payload = record.get("payload")
        if not isinstance(payload, dict):
            continue
        if record.get("type") == "turn_context":
            model = str(payload.get("model") or model)
            effort = str(payload.get("effort") or effort)
        is_usage = record.get("type") == "token_usage_record"
        is_usage = is_usage or (
            record.get("type") == "event_msg"
            and payload.get("type") == "token_usage_record"
        )
        if is_usage and isinstance(payload.get("usage"), dict):
            add_tokens(tokens, payload["usage"])
            responses += 1
        if record.get("type") == "event_msg" and payload.get("type") == "token_count":
            info = payload.get("info")
            if isinstance(info, dict) and isinstance(info.get("total_token_usage"), dict):
                cumulative = info["total_token_usage"]
            if isinstance(payload.get("rate_limits"), dict):
                rate_limits.append(payload["rate_limits"])

    if responses == 0 and cumulative:
        add_tokens(tokens, cumulative)

    started = min(timestamps) if timestamps else parse_timestamp(meta.get("timestamp"))
    ended = max(timestamps) if timestamps else started
    duration = int((ended - started).total_seconds()) if started and ended else None
    root_id = str(meta.get("session_id") or meta["id"])
    return {
        "thread_id": str(meta["id"]),
        "root_id": root_id,
        "role": role_from_meta(meta),
        "model": model,
        "effort": effort,
        "responses": responses,
        "duration_seconds": duration,
        "started": started.isoformat() if started else None,
        "tokens": tokens,
        "rate_limit_first": rate_limits[0] if rate_limits else None,
        "rate_limit_last": rate_limits[-1] if rate_limits else None,
    }


def collect_sessions(sessions_dir: Path, date: str | None) -> dict[str, list[dict[str, Any]]]:
    sessions: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for path in rollout_paths(sessions_dir, date):
        thread = analyze_rollout(path, read_records(path))
        if thread:
            sessions[thread["root_id"]].append(thread)
    return dict(sessions)


def session_start(threads: list[dict[str, Any]]) -> datetime:
    starts = [parse_timestamp(thread["started"]) for thread in threads]
    known = [started for started in starts if started]
    return min(known) if known else datetime.min.replace(tzinfo=timezone.utc)


def select_session(
    sessions: dict[str, list[dict[str, Any]]], prefix: str | None, latest: bool
) -> tuple[str, list[dict[str, Any]]]:
    if prefix:
        matches = [root_id for root_id in sessions if root_id.startswith(prefix)]
        if len(matches) != 1:
            raise ValueError(f"session prefix matched {len(matches)} sessions")
        root_id = matches[0]
    elif latest:
        root_id = max(sessions, key=lambda key: session_start(sessions[key]))
    else:
        raise ValueError("choose --session, --latest, or --list")
    return root_id, sorted(
        sessions[root_id], key=lambda thread: (thread["role"] != "root", thread["started"] or "")
    )


def rate_percent(rate: dict[str, Any] | None, window: str) -> Any:
    if not isinstance(rate, dict) or not isinstance(rate.get(window), dict):
        return None
    return rate[window].get("used_percent")


def report(root_id: str, threads: list[dict[str, Any]]) -> dict[str, Any]:
    totals = blank_tokens()
    for thread in threads:
        add_tokens(totals, thread["tokens"])
    root = next((thread for thread in threads if thread["role"] == "root"), None)
    rate_change = None
    if root and root["rate_limit_first"] and root["rate_limit_last"]:
        first = root["rate_limit_first"]
        last = root["rate_limit_last"]
        rate_change = {
            "plan_type": last.get("plan_type"),
            "primary": [rate_percent(first, "primary"), rate_percent(last, "primary")],
            "secondary": [rate_percent(first, "secondary"), rate_percent(last, "secondary")],
        }
    return {
        "session_id": root_id,
        "thread_count": len(threads),
        "delegation_count": sum(thread["role"] != "root" for thread in threads),
        "totals": totals,
        "rate_limit_change": rate_change,
        "threads": threads,
    }


def render_text(data: dict[str, Any]) -> str:
    lines = [
        f"Session: {data['session_id']}",
        f"Threads: {data['thread_count']} (delegations: {data['delegation_count']})",
        "Role | Model / effort | Responses | Input | Cached | Output | Reasoning | Total | Duration",
    ]
    for thread in data["threads"]:
        tokens = thread["tokens"]
        duration = "-" if thread["duration_seconds"] is None else f"{thread['duration_seconds']}s"
        lines.append(
            f"{thread['role']} | {thread['model']} / {thread['effort']} | {thread['responses']} | "
            f"{tokens['input_tokens']} | {tokens['cached_input_tokens']} | "
            f"{tokens['output_tokens']} | {tokens['reasoning_output_tokens']} | "
            f"{tokens['total_tokens']} | {duration}"
        )
    totals = data["totals"]
    lines.append(
        "Total | - | - | "
        f"{totals['input_tokens']} | {totals['cached_input_tokens']} | "
        f"{totals['output_tokens']} | {totals['reasoning_output_tokens']} | "
        f"{totals['total_tokens']} | -"
    )
    rate = data["rate_limit_change"]
    if rate:
        lines.append(
            f"Rate limits ({rate['plan_type'] or 'unknown'}): "
            f"primary {rate['primary'][0]} -> {rate['primary'][1]}, "
            f"secondary {rate['secondary'][0]} -> {rate['secondary'][1]}"
        )
    return "\n".join(lines)


def render_list(sessions: dict[str, list[dict[str, Any]]], limit: int) -> str:
    ordered = sorted(sessions.items(), key=lambda item: session_start(item[1]), reverse=True)
    lines = ["Started | Session | Threads | Delegations"]
    for root_id, threads in ordered[:limit]:
        started = session_start(threads)
        lines.append(
            f"{started.isoformat()} | {root_id} | {len(threads)} | "
            f"{sum(thread['role'] != 'root' for thread in threads)}"
        )
    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sessions-dir", type=Path, default=Path.home() / ".codex" / "sessions")
    parser.add_argument("--date", type=validate_date)
    parser.add_argument("--list", action="store_true")
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--session", help="Root session ID or unique prefix")
    parser.add_argument("--latest", action="store_true")
    parser.add_argument("--format", choices=("text", "json"), default="text")
    args = parser.parse_args(argv)

    if args.limit < 1:
        parser.error("--limit must be positive")
    if sum((args.list, bool(args.session), args.latest)) != 1:
        parser.error("choose exactly one of --list, --session, or --latest")
    if not args.sessions_dir.is_dir():
        parser.error(f"sessions directory not found: {args.sessions_dir}")

    sessions = collect_sessions(args.sessions_dir, args.date)
    if not sessions:
        print("no rollout metadata found", file=sys.stderr)
        return 1
    if args.list:
        print(render_list(sessions, args.limit))
        return 0
    try:
        root_id, threads = select_session(sessions, args.session, args.latest)
    except ValueError as error:
        parser.error(str(error))
    data = report(root_id, threads)
    print(json.dumps(data, indent=2) if args.format == "json" else render_text(data))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
