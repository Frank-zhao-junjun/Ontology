from backend.ai_orchestrator import ContextManager, IntentAnalyzer, IntentResult, ProcessStrategyEngine


def test_context_manager_persists_focus_and_snapshot():
    mgr = ContextManager()
    ctx = mgr.get_or_create("s1", "u1", "r1")
    assert ctx.model_snapshot_ref == "r1"
    mgr.set_focus("s1", "contract", "C-001")
    ctx2 = mgr.get_or_create("s1", "u1", "r2")
    assert ctx2.focus_entity == {"type": "contract", "id": "C-001"}
    assert ctx2.model_snapshot_ref == "r2"


def test_intent_analyzer_classifies_four_types():
    analyzer = IntentAnalyzer()
    assert analyzer.analyze("创建一个合同").intent_type == "WRITE"
    assert analyzer.analyze("打开合同列表").intent_type == "NAVIGATE"
    assert analyzer.analyze("分析本月趋势").intent_type == "ANALYZE"
    assert analyzer.analyze("查询合同列表").intent_type == "QUERY"


def test_process_strategy_engine_uses_snapshot_ref():
    engine = ProcessStrategyEngine()
    plan = engine.build_plan(IntentResult("QUERY", {}), {"release_no": "r100"})
    assert plan[0]["snapshot"] == "r100"
    assert plan[0]["intent"] == "QUERY"


def test_chat_execute_returns_plan(client):
    execute = client.post(
        "/api/chat/execute",
        json={"session_id": "s-chat", "user_id": "u-chat", "message": "查询合同"},
    )
    assert execute.status_code == 200
    data = execute.get_json()
    assert data["plan"][0]["intent"] == "QUERY"
    assert data["conversation_state"] == "idle"
