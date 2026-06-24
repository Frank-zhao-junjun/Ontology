from dataclasses import dataclass
from typing import Any
import json
import os
import urllib.request
import urllib.error


@dataclass
class SessionContext:
    session_id: str
    user_id: str
    focus_entity: dict[str, Any] | None
    model_snapshot_ref: str | None
    recent_actions: list[dict[str, Any]]


class ContextManager:
    def __init__(self):
        self._store: dict[str, SessionContext] = {}

    def get_or_create(self, session_id: str, user_id: str, snapshot_ref: str | None) -> SessionContext:
        if session_id not in self._store:
            self._store[session_id] = SessionContext(
                session_id=session_id,
                user_id=user_id,
                focus_entity=None,
                model_snapshot_ref=snapshot_ref,
                recent_actions=[],
            )
        ctx = self._store[session_id]
        ctx.model_snapshot_ref = snapshot_ref
        return ctx

    def set_focus(self, session_id: str, entity_type: str, entity_id: str):
        if session_id in self._store:
            self._store[session_id].focus_entity = {"type": entity_type, "id": entity_id}


@dataclass
class IntentResult:
    intent_type: str
    params: dict[str, Any]


class IntentAnalyzer:
    def analyze(self, message: str) -> IntentResult:
        text = message.lower()
        if any(k in text for k in ["新增", "创建", "create", "update", "修改", "提交"]):
            return IntentResult("WRITE", {})
        if any(k in text for k in ["打开", "进入", "navigate", "go to"]):
            return IntentResult("NAVIGATE", {})
        if any(k in text for k in ["分析", "趋势", "图", "chart", "analyze"]):
            return IntentResult("ANALYZE", {})
        return IntentResult("QUERY", {})


class ProcessStrategyEngine:
    def build_plan(self, intent: IntentResult, snapshot: dict[str, Any]) -> list[dict[str, Any]]:
        release = snapshot.get("release_no")
        return [{"step": "intent_route", "intent": intent.intent_type, "snapshot": release}]


SYSTEM_PROMPT = """你是一个企业级本体建模AI助手。你的任务是根据用户输入，生成结构化的本体模型数据。

本体模型包含5个维度+1个编排层：
- 维1 静态结构(structural): 实体(entities)、属性(attributes)、关系(relations)、值对象(valueObjects)
- 维2 动态行为(behavioral): 行为(actions)、状态机(stateMachines)、指标(indicators)
- 维3 规则约束(rules): 校验(validations)、护栏(guardrails)、策略(policies)、权限(permissions)、探针(probes)
- 维4 事件消息(events): 事件类型(eventTypes)、因果链(causalities)
- 维5 外部接口(interfaces): API(apis)、查询(queries)、计算(compute)、通知(notifications)
- EPC编排层: 流程步骤(steps)，每步引用维4事件触发→维2行为→维3规则→维5工具

你必须以JSON格式回复，格式如下：
{
  "message": "给用户的自然语言回复",
  "structural": { "entities": [...], "relations": [...], "valueObjects": [...] },
  "behavioral": { "actions": [...], "stateMachines": [...], "indicators": [...] },
  "rules": { "validations": [...], "guardrails": [...], "policies": [...], "permissions": [...], "probes": [...] },
  "events": { "eventTypes": [...], "causalities": [...] },
  "interfaces": { "apis": [...], "queries": [...], "compute": [...], "notifications": [...] },
  "epc": { "steps": [...] }
}

如果用户未涉及某维度，该维度返回空对象{}。只用中文回复。"""


class LLMClient:
    def __init__(self, api_key: str = "", base_url: str = "", model: str = ""):
        self.api_key = api_key or os.environ.get("LLM_API_KEY", "")
        self.base_url = base_url or os.environ.get("LLM_BASE_URL", "https://api.deepseek.com/v1")
        self.model = model or os.environ.get("LLM_MODEL", "deepseek-chat")

    def chat(self, user_message: str) -> str:
        if not self.api_key:
            return json.dumps({"message": "LLM 服务未配置 (LLM_API_KEY 环境变量未设置)", "structural": {}, "behavioral": {}, "rules": {}, "events": {}, "interfaces": {}, "epc": {}}, ensure_ascii=False)

        body = json.dumps({
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            "temperature": 0.3,
            "max_tokens": 4096,
        }).encode("utf-8")

        req = urllib.request.Request(
            f"{self.base_url.rstrip('/')}/chat/completions",
            data=body,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
            },
        )

        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["choices"][0]["message"]["content"]
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else str(e)
            return json.dumps({"message": f"LLM API 错误 ({e.code}): {error_body[:200]}", "structural": {}, "behavioral": {}, "rules": {}, "events": {}, "interfaces": {}, "epc": {}}, ensure_ascii=False)
        except Exception as e:
            return json.dumps({"message": f"LLM 请求失败: {str(e)[:200]}", "structural": {}, "behavioral": {}, "rules": {}, "events": {}, "interfaces": {}, "epc": {}}, ensure_ascii=False)

    def chat_structured(self, user_message: str) -> dict[str, Any]:
        raw = self.chat(user_message)
        # Try to extract JSON from the response (may be wrapped in markdown)
        text = raw.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:]) if len(lines) > 1 else text
            if text.endswith("```"):
                text = text[:-3]
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {"message": raw, "structural": {}, "behavioral": {}, "rules": {}, "events": {}, "interfaces": {}, "epc": {}}


llm_client = LLMClient()

