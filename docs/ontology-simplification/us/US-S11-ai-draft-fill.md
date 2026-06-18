# US-S11：AI 仅 draft 填充

| 字段 | 值 |
|------|-----|
| **ID** | US-S11 |
| **Phase** | 3 |
| **优先级** | P2 |
| **状态** | ✅ 已确认（2026-06-18）→ ✅ 已完成 |
| **依赖** | US-S03（draft/confirm）、US-S04（业务链详情）、US-S05（saveEpc）、US-S14（确认/编辑） |
| **主计划** | [本体建模简化架构.plan.md](../../本体建模简化架构.plan.md) |
| **ADR** | [adr-simplified-ontology-model.md](../../adr-simplified-ontology-model.md) |

## User Story

**作为** 业务建模人员，  
**我希望** 在业务链节点详情中对当前模块 draft 一键调用 AI 填充名称/描述/语义/EPC 步骤建议，  
**以便** 快速起草模块内容，且 AI 仅写入 draft、不自动 confirm。

## 背景与动机

- 主计划：**AI 仅填充当前模块 draft**；调用前注入 **A/B/C 链上下文** + **八维已确认要素目录**。
- 现有 `/api/generate-model` 面向 legacy 实体四大模型，**不**覆盖简化架构 A/B/C/EPC。
- ADR：跨模块引用仅指向 confirmed；AI 生成 EPC 步骤应优先引用已确认要素 id。

## 范围（In Scope）

| 项 | 说明 |
|----|------|
| 上下文构建 | `buildModuleDraftContext`：链路径 + confirmed 要素目录 + 当前 draft 快照 |
| Prompt | 按 A/B/C/EPC 输出 JSON schema；禁止修改 `id`/`parentId` |
| API | `POST /api/generate-module-draft` |
| Store | `applyAiModuleDraft`：合并 AI 建议 → `saveModuleDraft` / `saveEpc`（**不** confirm） |
| UI | 业务链详情「AI 填充草稿」按钮 + 可选补充说明对话框 |
| 门禁 | 无 draft 时自动 fork；只读 archived 禁用 |

## 范围外（Out of Scope）

| 项 | 归属 |
|----|------|
| 自动 confirm | US-S14 |
| 要素库 E1–E8 独立 AI 编辑器 | 后续 US |
| 参考文档注入 | 可选增强，非本 US 阻塞项 |
| Legacy 实体 generate-model | 保留不动 |

## 验收标准

| # | 标准 | 验证 |
|---|------|------|
| AC-1 | 上下文含链路径与 confirmed 要素列表 | unit |
| AC-2 | API 返回合法 JSON snapshot；解析失败 500 | unit |
| AC-3 | `applyAiModuleDraft` 仅更新 draft，不 confirm | unit + store |
| AC-4 | EPC 步骤 `elementRef.elementId` 必须在 confirmed 目录内（或省略 elementRef） | unit |
| AC-5 | 详情面板 draft 节点可点 AI 填充并刷新表单 | integration + e2e |
| AC-6 | lint/ts-check 0 error；S14 回归不破坏 | CI |

## Unit 拆分

| Unit | 标题 | 产出 | ⑥ E2E |
|------|------|------|-------|
| US-S11-U01 | 上下文 + Prompt + 解析/合并纯函数 | `lib/ai-draft/` | N/A |
| US-S11-U02 | generate-module-draft API | `app/api/generate-module-draft/` | N/A |
| US-S11-U03 | Store `applyAiModuleDraft` | `ontology-store.ts` | N/A |
| US-S11-U04 | 详情面板 UI + E2E | `ai-draft-fill-dialog.tsx` | ✅ |

## 确认

- [x] Frank，2026-06-18
