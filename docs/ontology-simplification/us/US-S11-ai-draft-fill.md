# US-S11：AI Draft 填充（A/B/C 级语义草稿）

| 字段 | 值 |
|------|-----|
| **ID** | US-S11 |
| **Phase** | 3 |
| **优先级** | P2 |
| **状态** | ✅ 已确认（2026-06-18）→ ✅ 已完成 |
| **依赖** | US-S03（draft/confirm）、US-S04（业务链详情）、US-S14（确认/编辑） |
| **对应文档** | 3.6.1 AI Draft 填充（A/B/C 级） |
| **主计划** | [本体建模简化架构.plan.md](../../本体建模简化架构.plan.md) |
| **ADR** | [adr-simplified-ontology-model.md](../../adr-simplified-ontology-model.md) |

## User Story

**作为** 业务建模人员，  
**我希望** 在 A/B/C 业务链节点详情中对当前模块 draft 一键调用 AI 填充名称/描述/语义块，可上传参考文档辅助生成，  
**以便** 快速起草 A/B/C 各层级的模块内容，且 AI 仅写入 draft、不自动 confirm。

## 背景与动机

- 对应飞书文档 **3.6.1**：支持 A/B/C 各级节点，上传参考文档辅助生成名称/描述/语义块（terms/triggerPhrases/synonyms）。
- 现有 `/api/generate-model` 面向 legacy 实体，**不**覆盖简化架构 A/B/C。
- ADR：跨模块引用仅指向 confirmed。
- **不包含 EPC 步骤生成**（已拆至独立 US-S11b: 文档驱动 EPC 生成）。

## 范围（In Scope）

| 项 | 说明 |
|----|------|
| 层级 | A（ValueDomain）、B（Capability）、C（Scenario），不含 EPC |
| 上下文构建 | `buildModuleDraftContext`：链路径 + confirmed 要素目录 + 当前 draft 快照 |
| 参考文档 | 可选上传（.txt/.md/.csv/.json），注入 LLM 上下文提升生成质量 |
| 生成内容 | 名称、描述、语义块（terms/triggerPhrases/synonyms），按层级输出 JSON schema |
| Prompt | 禁止修改 `id`/`parentId` |
| API | `POST /api/generate-module-draft` |
| Store | `applyAiModuleDraft`：合并 AI 建议 → `saveModuleDraft`（**不** confirm） |
| UI | 业务链详情「AI 填充草稿」按钮 + 可选文档上传对话框 |
| 门禁 | 无 draft 时自动 fork；只读 archived 禁用 |

## 范围外（Out of Scope）

| 项 | 归属 |
|----|------|
| EPC 步骤生成 | **US-S11b**（文档驱动 EPC 生成，3.6.2） |
| 文档→E1~E8 要素草稿 | **US-S19**（AI 辅助建模工作流，6.3） |
| 自动 confirm | US-S14 |
| Legacy 实体 generate-model | 保留不动 |

## 验收标准

| # | 标准 | 验证 |
|---|------|------|
| AC-1 | 上下文含链路径与 confirmed 要素列表 | unit |
| AC-2 | API 返回合法 JSON snapshot；解析失败 500 | unit |
| AC-3 | `applyAiModuleDraft` 仅更新 draft，不 confirm | unit + store |
| AC-4 | 可选文档上传（.txt/.md/.csv/.json）可注入 LLM | integration |
| AC-5 | A/B/C 各级详情面板 draft 节点可点 AI 填充并刷新表单 | integration + e2e |
| AC-6 | lint/ts-check 0 error；S14 回归不破坏 | CI |

## Unit 拆分

| Unit | 标题 | 产出 | ⑥ E2E |
|------|------|------|-------|
| US-S11-U01 | 上下文 + Prompt + 解析/合并纯函数 | `lib/ai-draft/` | N/A |
| US-S11-U02 | generate-module-draft API | `app/api/generate-module-draft/` | N/A |
| US-S11-U03 | Store `applyAiModuleDraft` | `ontology-store.ts` | N/A |
| US-S11-U04 | A/B/C 详情面板 UI + 文档上传 + E2E | `ai-draft-fill-dialog.tsx` | ✅ |

## 确认

- [x] Frank，2026-06-18
