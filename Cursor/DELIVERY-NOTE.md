# 交付说明（自主开发阶段）

**日期**：2026-03-28  
**决策**：按《实施计划》与《开发Backlog》优先落地 **B-001～B-004 能力中的可运行子集**：元模型表结构、校验、发布、快照、回滚、幂等与编排 API 桩，并通过 **pytest**。

## 产出位置

- 后端：`D:\AI\Ontology\Cursor\backend\`
- 前端：`D:\AI\Ontology\Cursor\frontend\`
- CI：`D:\AI\Ontology\Cursor\.github\workflows\ci-backend.yml`（若仓库根在 `D:\AI`，请将工作目录改为实际仓库内 `Ontology/Cursor/backend` 或移动 workflow）

## 验证方式

```bash
cd D:\AI\Ontology\Cursor\backend
python -m pip install -r requirements.txt
python -m pytest tests -v
```

**更新（Sprint FE）**：Vue3 前端 `frontend/`（**FE-001～FE-005**）；`npm run build` + `npm run test`；后端增加 **CORS**。详见 `docs/BACKLOG-SPRINT-FE.md`。

**Sprint C**：**B-010 / B-011**，**AI-005～AI-008**；`python -m pytest tests -q` 当前 **39 passed**（含 Sprint B 验收、`test_qa_smoke` 等）。详见 `docs/BACKLOG-SPRINT-C.md`、`docs/BACKLOG-SPRINT-B.md`；用例清单 `D:\AI\Ontology\1933测试通过.md`。

**本地跑通**：`D:\AI\Ontology\Cursor` 根目录 `npm install`（一次）后 `npm run dev`，浏览器打开 <http://127.0.0.1:5173>。见根目录 `README.md`。

**Sprint B**：B-005～B-009 与 AI-001～004，见 `docs/BACKLOG-SPRINT-B.md`。

---

历史：首轮 **7 passed**（仅元模型 + 编排桩）。

## CI 路径说明

若 Git 仓库根目录为 `D:\AI` 而非 `D:\AI\Ontology`，请将 workflow 中 `working-directory` 与 `paths` 改为与 monorepo 实际结构一致，或把 `backend` 拷入仓库后再调整。

## 后续建议

- 将 `backend` / `frontend` 纳入正式 git 仓库并修正 CI 路径  
- 真实 LLM、网关限流；CI 增加根目录或 `frontend` 的 build/test
