# US-S11b：文档驱动 EPC 生成（3.6.2）

| 字段 | 值 |
|------|-----|
| **ID** | US-S11b |
| **Phase** | 3 |
| **优先级** | P2 |
| **状态** | ✅ 已确认（2026-06-24） |
| **依赖** | US-S03（draft/confirm）、US-S05（saveEpc）、US-S14（确认/编辑） |
| **对应文档** | 3.6.2 文档驱动 EPC 生成（v1.0 新增） |
| **主计划** | [本体建模简化架构.plan.md](../../本体建模简化架构.plan.md) |
| **ADR** | [adr-simplified-ontology-model.md](../../adr-simplified-ontology-model.md) |

## User Story

**作为** 业务建模人员，  
**我希望** 在 EPC 节点上传业务文档（.txt/.md/.csv/.json），AI 解析后全量生成 EPC 步骤草稿，  
**以便** 从业务描述文档快速生成流程骨架，减少手动建模工作量。

## 背景与动机

- 对应飞书文档 **3.6.2**，v1.0 新增功能。
- 与 US-S11（A/B/C 级语义草稿）共享 `POST /api/generate-module-draft` API。
- 不同点：US-S11 生成 A/B/C 语义块，此 US 专门生成 **EPC 步骤序列**。

## 范围（In Scope）

| 项 | 说明 |
|----|------|
| 层级 | 仅 EPC（EpcProcess）节点 |
| 文档上传 | 支持 .txt/.md/.csv/.json，最大 50000 字符 |
| 生成内容 | EPC 步骤序列（steps[]），含步骤名称、描述、elementRef 引用 |
| fork 规则 | ①有已确认版→从已确认版 fork；②无确认版有 draft→覆盖当前 draft；③都没有→创建 draft |
| API | `POST /api/generate-module-draft`（复用 US-S11 API） |
| Store | `applyAiEpcDraft`：合并 AI 建议 → `saveEpc`（**不** confirm） |
| UI | EPC 编辑器「AI 填充草稿」按钮 + 文档上传对话框 |
| 要素引用 | AI 生成的 elementRef 优先引用已确认要素；无匹配可建议新建 |

## 范围外（Out of Scope）

| 项 | 归属 |
|----|------|
| A/B/C 级语义生成 | US-S11（3.6.1） |
| 文档→E1~E8 要素草稿 | US-S19（6.3） |
| 自动 confirm | US-S14 |
| 实体提取（非 EPC 步骤） | ReferenceDocPanel（3.6.3） |

## 验收标准

| # | 标准 | 验证 |
|---|------|------|
| AC-1 | 上传文档后 AI 返回合法 EPC 步骤 JSON | unit |
| AC-2 | fork 规则正确执行（覆盖/创建） | unit + store |
| AC-3 | 生成的 elementRef 仅引用已确认要素（或省略） | unit |
| AC-4 | 步骤 draft 不自动 confirm | unit + store |
| AC-5 | EPC 编辑器可触发生成并刷新步骤列表 | integration + e2e |
| AC-6 | lint/ts-check 0 error | CI |

## Unit 拆分

| Unit | 标题 | 产出 | ⑥ E2E |
|------|------|------|-------|
| U01 | 文档解析 + Prompt for EPC steps | `lib/ai-draft/epc-doc-prompt.ts` | N/A |
| U02 | Store `applyAiEpcDraft` | `ontology-store.ts` | N/A |
| U03 | EPC 编辑器 AI 对话框 + 文档上传 | `ai-draft-fill-dialog.tsx`（扩展） | ✅ |
| U04 | fork 规则集成 + E2E | EPC 编辑流程 | ✅ |

## 确认

- [x] Frank，2026-06-24
