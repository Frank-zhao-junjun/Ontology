# Sprint FE：前端泳道（FE-001～FE-005）

**日期**：2026-03-28  
**路径**：`D:\AI\Ontology\Cursor\frontend`

## 交付

1. 三栏布局与基础样式（需求 7.2）。
2. 动作协议类型与 `normalizeAction`（含 `version: 1`）。
3. `useChat`：`fetch` `/api/chat/execute`，携带 `X-LLM-Available`、`X-Trace-Id`；勾选框控制 LLM 开关（FE-005 / AI-008）。
4. 合同域静态占位：欢迎 / 列表 / 详情（FE-004 联调前）。
5. 后端：`Flask-CORS` 放行 `/api/*`，便于 Vite 代理跨源。

## 验证

```bash
# 终端 1
cd D:\AI\Ontology\Cursor\backend
python run.py

# 终端 2
cd D:\AI\Ontology\Cursor\frontend
npm install
npm run build
npm run test
```

## 后续

- 对接真实列表/表单 API、错误码映射（FE-007）、图表组件（FE-006）。
