"""AI-005: execute routed tools (stubs; real DB/LLM wired later)."""

from __future__ import annotations

from typing import Any


def query_tool_stub(context: dict[str, Any]) -> dict[str, Any]:
    snap = context.get("snapshot") or {}
    models = snap.get("models") or []
    return {
        "ok": True,
        "tool": "query_tool",
        "row_count": len(models),
        "preview": [m.get("name") for m in models[:5]],
    }


def skill_tool_stub(context: dict[str, Any]) -> dict[str, Any]:
    return {
        "ok": True,
        "tool": "skill_tool",
        "note": "invoke domain skill (stub)",
    }


def ui_action_tool_stub(context: dict[str, Any]) -> dict[str, Any]:
    return {
        "ok": True,
        "tool": "ui_action_tool",
        "actions": [{"type": "NAVIGATE", "path": "/"}],
    }


def chart_tool_stub(context: dict[str, Any]) -> dict[str, Any]:
    return {
        "ok": True,
        "tool": "chart_tool",
        "chart": {
            "type": "bar",
            "title": "示例统计（桩）",
            "labels": ["合同", "发票", "客户"],
            "values": [12, 8, 20],
        },
    }


def direct_response_tool_stub(context: dict[str, Any]) -> dict[str, Any]:
    return {"ok": True, "tool": "direct_response_tool"}


TOOLS = {
    "query_tool": query_tool_stub,
    "skill_tool": skill_tool_stub,
    "ui_action_tool": ui_action_tool_stub,
    "chart_tool": chart_tool_stub,
    "direct_response_tool": direct_response_tool_stub,
}


def execute_tools(tool_names: list[str], context: dict[str, Any]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for name in tool_names:
        fn = TOOLS.get(name)
        if not fn:
            out.append({"ok": False, "tool": name, "error_code": "A4002"})
            continue
        out.append(fn(context))
    return out
