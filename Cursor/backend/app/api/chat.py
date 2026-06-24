from __future__ import annotations

from flask import Blueprint, jsonify, request

from app.services.orchestration import orchestrate_turn
from app.services.publish import build_current_snapshot
from app.services.self_healing import RetriableError, run_with_self_healing
from app.services.tool_executor import execute_tools

bp = Blueprint("chat", __name__, url_prefix="/api/chat")

# MVP in-memory session and retry tracking
_sessions: dict[str, dict] = {}
_retry_counts: dict[str, int] = {}
MAX_MANUAL_RETRY = 5


def _trace_id() -> str:
    return getattr(request, "trace_id", "no-trace")


@bp.route("/execute", methods=["POST"])
def execute():
    body = request.get_json(force=True, silent=True) or {}
    session_id = body.get("session_id") or "default"
    message = (body.get("message") or "").strip()
    ui_context = body.get("ui_context") or {}

    # AI-008: LLM degradation — structured UI only
    if request.headers.get("X-LLM-Available", "true").lower() == "false":
        snap = build_current_snapshot()
        snapshot_ref = (
            f"snapshot:{snap['release_no']}" if snap and snap.get("release_no") else None
        )
        st = _sessions.setdefault(session_id, {})
        st["degraded"] = True
        st["model_snapshot_ref"] = snapshot_ref
        return jsonify(
            {
                "assistant_message": "LLM unavailable — use structured UI paths only.",
                "actions": [
                    {
                        "type": "SHOW_UI_ONLY",
                        "version": 1,
                    }
                ],
                "conversation_state": st,
                "degraded": True,
                "error_code": None,
                "trace_id": _trace_id(),
            }
        )

    snap = build_current_snapshot()
    snapshot_ref = (
        f"snapshot:{snap['release_no']}" if snap and snap.get("release_no") else None
    )

    st = _sessions.setdefault(
        session_id,
        {
            "focus_entity": ui_context.get("focus_entity"),
            "model_snapshot_ref": snapshot_ref,
        },
    )
    st["model_snapshot_ref"] = snapshot_ref

    orch = orchestrate_turn(session_id, message, _sessions)
    lower = message.lower()
    if "error" in lower and "permission" in lower:
        return jsonify(
            {
                "assistant_message": "blocked",
                "actions": [],
                "conversation_state": st,
                "error_code": "P4031",
                "orchestration": orch,
                "trace_id": _trace_id(),
            }
        ), 200

    intent = orch["intent"]
    tools = orch["tools"]
    ctx = {
        "snapshot": orch.get("snapshot"),
        "session_id": session_id,
        "message": message,
    }

    # AI-005 + AI-006: tool execution + self-healing (flaky demo when message contains flaky_tool)
    flaky_state = {"n": 0}

    def tool_fn() -> list[dict]:
        if "flaky_tool" in lower:
            flaky_state["n"] += 1
            if flaky_state["n"] < 3:
                raise RetriableError("transient tool failure")
        return execute_tools(tools, ctx)

    tool_results, attempts, heal_err = run_with_self_healing(tool_fn)
    if heal_err:
        return jsonify(
            {
                "assistant_message": "tool failed after self-healing",
                "actions": [],
                "error_code": heal_err,
                "self_healing_attempts": attempts,
                "trace_id": _trace_id(),
            }
        ), 200
    assistant = (
        f"intent={intent}; tools={tools}; tool_results={tool_results}; "
        f"plan_steps={len(orch.get('process_plan') or [])}; attempts={attempts}"
    )

    if intent == "navigate":
        st["recent_actions"] = st.get("recent_actions", []) + [{"type": "NAVIGATE"}]

    actions_out: list[dict] = []
    for tr in tool_results or []:
        if tr.get("tool") == "chart_tool" and tr.get("chart"):
            actions_out.append(
                {
                    "type": "RENDER_CHART",
                    "version": 1,
                    "chart": tr["chart"],
                }
            )

    return jsonify(
        {
            "assistant_message": assistant,
            "actions": actions_out,
            "tool_results": tool_results,
            "context_updates": {
                "model_snapshot_ref": snapshot_ref,
                "intent": intent,
                "routed_tools": tools,
            },
            "conversation_state": st,
            "orchestration": orch,
            "trace_id": _trace_id(),
        }
    )


@bp.route("/retry", methods=["POST"])
def retry():
    body = request.get_json(force=True, silent=True) or {}
    message_id = body.get("message_id") or ""
    if not message_id:
        return jsonify(
            {"ok": False, "error_code": "A4002", "trace_id": _trace_id()}
        ), 400
    n = _retry_counts.get(message_id, 0) + 1
    if n > MAX_MANUAL_RETRY:
        return jsonify(
            {
                "retry_result": "blocked",
                "attempts": n - 1,
                "error_code": "A4092",
                "trace_id": _trace_id(),
            }
        ), 400
    _retry_counts[message_id] = n
    return jsonify(
        {
            "retry_result": "ok",
            "attempts": n,
            "attempt_id": f"att-{message_id}-{n}",
            "trace_id": _trace_id(),
        }
    )


@bp.route("/session/<session_id>/context", methods=["GET"])
def session_context(session_id: str):
    st = _sessions.get(session_id, {})
    snap = build_current_snapshot()
    return jsonify(
        {
            "focus_entity": st.get("focus_entity"),
            "recent_actions": st.get("recent_actions", []),
            "model_snapshot_ref": st.get("model_snapshot_ref")
            or (f"snapshot:{snap['release_no']}" if snap else None),
            "retries": dict(_retry_counts),
            "degraded": st.get("degraded"),
            "trace_id": _trace_id(),
        }
    )
