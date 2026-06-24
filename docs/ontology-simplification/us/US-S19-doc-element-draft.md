# US-S19：文档驱动 E1~E8 要素草稿（6.3）

| 字段 | 值 |
|------|-----|
| **ID** | US-S19 |
| **Phase** | 3 |
| **优先级** | P2 |
| **状态** | ✅ 已确认（2026-06-24） |
| **依赖** | US-S03（draft/confirm）、US-S07（要素库）、US-S11b（文档→EPC 复用） |
| **对应文档** | 3.6.3 实体模型生成 + 6.3 AI 辅助建模工作流 |
| **主计划** | [本体建模简化架构.plan.md](../../本体建模简化架构.plan.md) |
| **ADR** | [adr-simplified-ontology-model.md](../../adr-simplified-ontology-model.md) |

## User Story

**作为** 业务建模人员，  
**我希望** 在要素库（本体模型节点）上传业务文档，AI 解析后增量生成 E1~E8 要素草稿，  
**以便** 从业务描述文档中自动提取实体、状态机、规则、指标等要素，减少人工定义的工作量。

## 背景与动机

- 对应飞书文档 **6.3 AI 辅助建模工作流**。
- E1~E8 要素创建共 **三条通道**，殊途同归到同一三态管理（draft → confirmed → archived）：

  | 通道 | 入口 | 写入模式 | 产出 |
  |:----|:-----|:--------|:-----|
  | **通道 a** | EPC 编辑器 → 步骤引用 → 内联新建要素 | upsert draft | 从流程倒推要素 |
  | **通道 b（本 US）** | 要素库 → 上传文档 → **AI 解析** | **insert draft** | 从文档批量提取要素 |
  | **手动** | 要素库面板 → 直接新建 | 手动 draft | 逐个定义 |

- 通道 a（US-S11）已在 Phase 3 实现，本 US 新增**通道 b**，填补「文档→原料」的空缺。
- 与现有 `ReferenceDocPanel`（实体列表提取）不同：本 US 生成**完整要素对象**（含属性/关系/规则等），并写入要素库 **draft**。

## 范围（In Scope）

| 项 | 说明 |
|----|------|
| 操作位置 | 要素库面板（本体模型工作区） |
| 文档上传 | 支持 .txt/.md/.csv/.json/.docx/.pdf，最大 50000 字符 |
| 生成范围 | E1~E8 全部八维，LLM 根据文档内容智能判断哪些维度有产出 |
| 写入模式 | **insert（增量）**：新增要素 draft，不清空已有要素 |
| 生成内容 | 每个要素含 name、description、维度归属、对应结构字段 |
| API | 新建 `POST /api/generate-element-draft`（或复用现有 draft 端点扩展） |
| Store | `applyAiElementDrafts`：批量 insert 要素到对应维度的 draft |
| UI | 要素库顶部「AI 解析文档」按钮 + 文档上传对话框 + 生成进度 |
| 重复检测 | 按 name + 维度判断是否已存在类似要素，避免重复 insert |

## 范围外（Out of Scope）

| 项 | 归属 |
|----|------|
| 文档→EPC 步骤生成 | US-S11b（3.6.2） |
| 单个实体 AI 建模（E1） | 3.6.3 AI建模（`/api/generate-model`） |
| 文档实体提取（列表） | ReferenceDocPanel（3.6.3 实体提取） |
| 自动 confirm | US-S14 |
| 要素库 CRUD | 已有功能 |

## 验收标准

| # | 标准 | 验证 |
|---|------|------|
| AC-1 | 上传文档后 AI 返回 E1~E8 要素 JSON 数组 | unit |
| AC-2 | 生成的要素仅写入 draft，不自动 confirm | unit + store |
| AC-3 | 重复要素（同名同维度）不重复 insert | unit |
| AC-4 | insert 模式不清空已有要素 | unit + store |
| AC-5 | 要素库 UI 可触发生成并刷新列表 | integration + e2e |
| AC-6 | lint/ts-check 0 error | CI |

## 工作流（对应 6.3）

```
要素库面板 → 点击「AI 解析文档」
    ↓
上传业务文档（可选）
    ↓
LLM 解析 → 生成 E1~E8 要素建议
    ↓
insert，形成要素草稿（不覆盖已有）
    ↓
用户审阅 → 手动修改 → 确认 → 版本确认（US-S14）
```

## Unit 拆分

| Unit | 标题 | 产出 | ⑥ E2E |
|------|------|------|-------|
| U01 | 文档解析 + Prompt for E1~E8 | `lib/ai-draft/element-doc-prompt.ts` | N/A |
| U02 | Store `applyAiElementDrafts`（insert 去重） | `ontology-store.ts` | N/A |
| U03 | 要素库 AI 对话框 + 文档上传 | `element-library.tsx`（扩展） | N/A |
| U04 | insert 模式验证 + 去重逻辑 + E2E | 要素库 + store | ✅ |

## 确认

- [x] Frank，2026-06-24
