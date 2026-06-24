# Ontology 项目 — Cursor 工作区（PM 编排产出）

本目录为 **项目经理编排 + 子代理分工** 的约定产出根目录，与仓库根目录 `D:\AI\Ontology` 中的需求/架构/LLD **并列**，不替代正式 Git 仓库（代码仓库可在后续建在本目录子路径或单独路径）。

## 本地跑通（验证阶段）

目标：**浏览器能打开三栏 UI，对话能打到后端**（Vite 把 `/api`、`/health` 代理到 `127.0.0.1:5000`）。

**首次（各装一次依赖）**

```text
cd D:\AI\Ontology\Cursor
python -m pip install -r backend\requirements.txt
cd frontend && npm install && cd ..
npm install
```

**一键启动（本目录）**

```text
npm run dev
```

- 前端：<http://127.0.0.1:5173>（需先 **登录**，默认账号如 `operator` / `Operator!dev1`，见 `backend/README.md`）  
- 健康检查：<http://127.0.0.1:5000/health>（应返回 `{"status":"ok"}`）

**或两个终端**：`backend` 下 `python run.py`；`frontend` 下 `npm run dev`。

**冒烟**：后端 `python -m pytest tests -q`（当前 **39 passed**）；前端 `cd frontend && npm run build && npm run test`。

**端口被占用时**（例如本机 `5000` 已有服务）：先在同一终端设环境变量再 `npm run dev`：

```powershell
$env:PORT="5050"
$env:VITE_API_TARGET="http://127.0.0.1:5050"
npm run dev
```

（`run.py` 读 `PORT`；Vite 代理读 `VITE_API_TARGET`，见 `frontend/vite.config.ts`。）

---

## 工作方式

1. **人类**：目标、优先级、验收拍板。  
2. **主会话（PM）**：按《实施计划》拆里程碑与任务包，并行启动子代理（探索/实现/脚本），合并结论并落盘到本目录。  
3. **子代理**：每次任务有明确输入路径、输出路径与完成定义（DoD），避免重复与漂移。

## 目录约定

| 路径 | 用途 |
| --- | --- |
| `docs/` | PM 文档：工作流、决策记录、会议纪要摘要 |
| `tracking/` | 需求追踪矩阵（RTM）、条款 ↔ 实现映射 |
| `sprints/` | 按里程碑/迭代的任务清单与回顾 |
| `agents/` | 子代理任务说明模板与历史（可选） |
| `proposals/` | 仓库结构、技术选型补充等非最终稿 |
| `generated/` | 由工具/子代理生成的中间稿（可删改） |

## 上游基线（勿随意改语义）

- 需求：`D:\AI\Ontology\最终需求文档.md`（v2.2）
- 架构：`D:\AI\Ontology\系统架构设计文档-最终稿.md`（v2.0-final）
- LLD：`D:\AI\Ontology\系统详细设计文档-LLD-最终稿.md`（若存在）或 `系统详细设计文档-LLD.md`
- 计划：`D:\AI\Ontology\实施计划.md`（v1.0）

## 子代理使用原则

- **可并行**：无共享写冲突的文档起草、目录设计、条款摘录、Backlog 拆解。  
- **须串行**：同一文件的冲突编辑；合并后再开下一轮。  
- **输出**：每个子任务写明「写入文件路径」，默认在 `D:\AI\Ontology\Cursor\` 下。

## 当前代码产出

- **后端 MVP 壳**：`backend/` — 含 Sprint B/C（规则热加载、异步事件队列、工具执行、自愈、LLM 降级等）；`python -m pytest tests -q` 应 **39 passed**。详见 `backend/README.md`、`DELIVERY-NOTE.md`、`docs/BACKLOG-SPRINT-B.md`、`docs/BACKLOG-SPRINT-C.md`；完整用例列表见 `D:\AI\Ontology\1933测试通过.md`。
- **前端（Vue3）**：`frontend/` — **FE-001～FE-007** 三栏 + 动作协议 + chat + 图表桩 + 错误码中文；`npm run build` / `npm run test`。详见 `frontend/README.md`、`docs/BACKLOG-SPRINT-FE.md`。
- **全量已实现功能清单（Cursor + 根目录对照）**：[2100测试通过.md](2100测试通过.md)

---

*创建日期：2026-03-28*
