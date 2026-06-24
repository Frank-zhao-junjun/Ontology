# Ontology 前端（MVP）

Vue 3 + Vite + TypeScript。对齐 **FE-001～FE-005** 最小能力。

## 能力

| Backlog | 说明 |
| --- | --- |
| FE-001 | `src/types/action-protocol.ts`：动作协议 v1 + `version` |
| FE-002 | `ThreeColumnLayout.vue`：左对话 / 中内容 / 右上下文 |
| FE-003 | `useChat.ts`：`/api/chat/execute`、`X-LLM-Available` |
| FE-004 | `ContentPanel.vue`：欢迎 / 合同列表 / 详情占位 |
| FE-005 | 关闭「LLM 可用」或后端返回降级时，右侧提示条 |
| FE-006 | `ChartBlock`：欢迎页展示 `RENDER_CHART` 柱状图桩 |
| FE-007 | `errorCodes.ts`：`error_code` → 中文说明 |

开发代理：`vite` 将 `/api`、`/health` 转到 `http://127.0.0.1:5000`。

## 命令

**推荐（与后端一起起）**：在 `D:\AI\Ontology\Cursor` 根目录先 `npm install`（根目录一次），再 `npm run dev`，会同时启动 Flask `:5000` 与本前端 `:5173`。

**对齐「1900」全量 REST（合同 + 五实体 CRUD）**：请启动 **Ontology 根目录**后端 `python backend/app.py`，再在本目录 `npm run dev`；登录使用 `admin` / `admin123`，打开 **五实体联调** Tab。

**仅前端**：

```bash
cd D:\AI\Ontology\Cursor\frontend
npm install
npm run dev
```

另开终端启动后端：`cd ..\backend && python run.py`。

```bash
npm run build
npm run test
```
