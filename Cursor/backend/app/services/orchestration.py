"""AI-001 ~ AI-004: context, intent, process strategy from snapshot, tool routing."""

from __future__ import annotations

from typing import Any, Literal

from app.services.publish import build_current_snapshot

Intent = Literal["query", "write", "navigate", "analyze", "unknown"]


def get_session_context(session_id: str, store: dict[str, dict]) -> dict[str, Any]:
    """AI-001."""
    snap = build_current_snapshot()
    ref = f"snapshot:{snap['release_no']}" if snap and snap.get("release_no") else None
    st = store.setdefault(session_id, {})
    st.setdefault("model_snapshot_ref", ref)
    st["model_snapshot_ref"] = ref
    return {
        "session_id": session_id,
        "focus_entity": st.get("focus_entity"),
        "model_snapshot_ref": st.get("model_snapshot_ref"),
        "recent_actions": st.get("recent_actions", []),
    }


def analyze_intent(message: str) -> Intent:
    """AI-002: keyword classifier (LLM placeholder)."""
    lower = message.lower()
    if "error" in lower and "permission" in lower:
        return "query"
    if any(w in lower for w in ("open", "navigate", "跳转", "打开")):
        return "navigate"
    if any(
        w in lower
        for w in ("write", "create", "submit", "save", "录入", "状态")
    ):
        return "write"
    if any(w in lower for w in ("analyze", "分析", "chart", "图表", "统计")):
        return "analyze"
    if any(w in lower for w in ("what", "list", "查询", "show", "?")):
        return "query"
    return "unknown"


def build_process_plan(snapshot: dict[str, Any] | None, intent: Intent) -> list[dict[str, Any]]:
    """AI-003: steps from process model in snapshot (minimal)."""
    if not snapshot:
        return [{"step": "noop", "reason": "no snapshot"}]
    models = snapshot.get("models") or []
    process_models = [m for m in models if m.get("model_type") == "process"]
    if not process_models:
        return [
            {"step": "collect_context", "intent": intent},
            {"step": "route_tools", "intent": intent},
        ]
    proc = process_models[0].get("content") or {}
    steps_out = []
    for i, s in enumerate(proc.get("steps") or []):
        steps_out.append({"step_index": i, "definition": s})
    if not steps_out:
        steps_out = [{"step": "default", "intent": intent}]
    return steps_out


def route_tools(intent: Intent, plan: list[dict[str, Any]]) -> list[str]:
    """AI-004: tool names to invoke."""
    if intent == "query":
        return ["query_tool"]
    if intent == "write":
        return ["skill_tool"]
    if intent == "navigate":
        return ["ui_action_tool"]
    if intent == "analyze":
        return ["query_tool", "chart_tool"]
    return ["direct_response_tool"]


def orchestrate_turn(
    session_id: str,
    message: str,
    store: dict[str, dict],
) -> dict[str, Any]:
    """Single entry for chat pipeline."""
    ctx = get_session_context(session_id, store)
    intent = analyze_intent(message)
    snap = build_current_snapshot()
    plan = build_process_plan(snap, intent)
    tools = route_tools(intent, plan)
    return {
        "context": ctx,
        "intent": intent,
        "process_plan": plan,
        "tools": tools,
        "snapshot": snap,
    }
