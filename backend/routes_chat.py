from flask import Blueprint, current_app, g, jsonify, request

from .api_response import error_response, resolve_trace_id
from .auth import ensure_ai_permission, require_auth
from .ai_orchestrator import ContextManager, IntentAnalyzer, ProcessStrategyEngine, llm_client
from .routes_meta_models import snapshots


bp_chat = Blueprint("chat", __name__, url_prefix="/api/chat")

context_mgr = ContextManager()
intent_analyzer = IntentAnalyzer()
strategy_engine = ProcessStrategyEngine()


@bp_chat.post("/execute")
@require_auth()
def chat_execute():
    payload = request.get_json(force=True)
    trace_id = resolve_trace_id(payload)
    session_id = payload.get("session_id", "default-session")
    user_id = g.current_user.username
    message = payload.get("message", "")

    if not current_app.config.get("AI_AVAILABLE", True):
        return jsonify(
            {
                "assistant_message": "AI service unavailable. Please continue with structured UI.",
                "actions": [],
                "context_updates": {},
                "conversation_state": "degraded",
                "trace_id": trace_id,
            }
        )

    snapshot = snapshots.get_current()
    context = context_mgr.get_or_create(session_id, user_id, snapshot.get("release_no"))
    intent = intent_analyzer.analyze(message)
    denied = ensure_ai_permission(g.current_user, intent.intent_type, trace_id)
    if denied:
        return denied
    plan = strategy_engine.build_plan(intent, snapshot)

    # Call LLM for structured ontology generation (only if API key configured)
    if llm_client.api_key:
        llm_result = llm_client.chat_structured(message)
        assistant_message = llm_result.get("message", f"Intent={intent.intent_type}")
        return jsonify(
            {
                "assistant_message": assistant_message,
                "actions": [],
                "context_updates": {
                    "focus_entity": context.focus_entity,
                    "model_snapshot_ref": context.model_snapshot_ref,
                },
                "conversation_state": "idle",
                "plan": plan,
                "trace_id": trace_id,
                "structural": llm_result.get("structural", {}),
                "behavioral": llm_result.get("behavioral", {}),
                "rules": llm_result.get("rules", {}),
                "events": llm_result.get("events", {}),
                "interfaces": llm_result.get("interfaces", {}),
                "epc": llm_result.get("epc", {}),
            }
        )

    return jsonify(
        {
            "assistant_message": f"Intent={intent.intent_type}",
            "actions": [],
            "context_updates": {
                "focus_entity": context.focus_entity,
                "model_snapshot_ref": context.model_snapshot_ref,
            },
            "conversation_state": "idle",
            "plan": plan,
            "trace_id": trace_id,
        }
    )


@bp_chat.get("/session/<session_id>/context")
@require_auth()
def chat_session_context(session_id: str):
    ctx = context_mgr.get_or_create(session_id, g.current_user.username, snapshots.get_current().get("release_no"))
    return jsonify(
        {
            "focus_entity": ctx.focus_entity,
            "recent_actions": ctx.recent_actions,
            "model_snapshot_ref": ctx.model_snapshot_ref,
        }
    )
