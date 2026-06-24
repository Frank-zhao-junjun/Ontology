# US-S02：类型骨架扩展

| 字段 | 值 |
|------|-----|
| **ID** | US-S02 |
| **Phase** | 0 |
| **优先级** | P0 |
| **状态** | 已完成（2026-06-18） |
| **依赖** | US-S01（ADR 定稿或并行草稿可对齐） |
| **主计划** | [docs/本体建模简化架构.plan.md](../../本体建模简化架构.plan.md) |
| **代码路径** | `repo-main/src/types/ontology.ts` |

## User Story

**作为** 前端/全栈开发者，  
**我希望** 在 `ontology.ts` 中具备简化架构所需的 TypeScript 类型骨架，  
**以便** 后续 store、UI、linter、compiler 可在不破坏现有功能的前提下渐进迁移（双写）。

## 背景与动机

- 现状类型以 `Domain`、`Entity`、`BusinessScenario` 等为主，与目标 A/B/C/EPC + MetaElement 模型不一致。
- Phase 0 仅增加**新类型与可选字段**，不删除旧类型，降低回归风险。

## 范围（In Scope）

在 [`repo-main/src/types/ontology.ts`](../../../repo-main/src/types/ontology.ts) **新增**（或同目录拆分类型文件后被 re-export）：

### 业务链

- `ValueDomain`（A）、`Capability`（B）、`Scenario`（C）、`EpcProcess`（EPC）
- 共用：`id`, `name`, `nameEn?`, `description?`, `semantics?`, `parentId?`
- `EpcProcess`：`steps: EpcStep[]`
- `EpcStep`：`elementRef?`（含 `dimension`, `elementId`, `versionPin`, `inlineNew?`, `inlinePayload?`）

### 八维要素库

- `MetaElement` / `MetaElementBase`：`id`, `name`, `nameEn?`, `dimension`（E1–E8）
- `ElementVisibility`、`ElementUsageRef`（派生索引条目）
- `usageRefs?` 在类型上标注为派生/可选

### 模块版本

- `ModuleKind`、`ModuleStatus`
- `ModuleVersionRecord`、`CrossModuleRef`（或 `RefPin`）

### 双写策略

- **保留**现有 `Domain`、`Entity`、`BusinessScenario` 等类型
- 新类型通过 `OntologyProject` 扩展字段挂载（如 `valueDomains?`, `capabilities?`, `scenarios?`, `epcProcesses?`, `metaElements?`），或独立 `SimplifiedOntologyProject` 接口（ADR/US 确认后二选一，默认扩展字段）

## 范围外（Out of Scope）

- `ontology-store` 业务逻辑实现（属 US-S03 等 Phase 1）
- UI 组件修改
- 删除旧类型或迁移脚本
- `rebuildUsageIndex` 实现

## 验收标准

- [x] 新类型在 `ontology.ts`（或 `types/simplified-*.ts`）中定义完整，导出可供 import
- [x] `pnpm ts-check`（在 `repo-main/`）通过，0 error
- [x] `id` / `name` 字段在业务链与 `MetaElement` 上一致
- [x] `EpcStep.elementRef` 仅持久化 `elementId`，类型体现 `inlineNew` 流程
- [x] `ModuleKind` 包含 `A|B|C|EPC|E1|…|E8`
- [x] 单元测试覆盖：类型守卫或示例 fixture 序列化/反序列化（至少 1 个 spec 文件）
- [x] 无破坏现有 `tests/unit` 既有用例

## 建议 Unit 拆分（US 确认后自动执行）

| Unit | 标题 | 主要改动 |
|------|------|----------|
| US-S02-U01 | 业务链类型 A/B/C/EPC + EpcStep | `ontology.ts` 业务链块 |
| US-S02-U02 | MetaElement + ElementUsageRef | 八维要素与反向索引类型 |
| US-S02-U03 | ModuleVersionRecord + ModuleKind | 版本与跨模块引用类型 |
| US-S02-U04 | OntologyProject 扩展 + 类型单元测试 | 项目接口扩展 + `tests/unit/simplified-types.spec.ts` |

## 确认

- [x] 产品/架构负责人确认本 US 范围与验收标准
- [ ] 确认 `OntologyProject` 扩展方式（扩展字段 vs 新接口）— **默认：扩展字段**，实施 U04 前可再定
- 确认人：Frank　日期：2026-06-18

确认后状态改为 **已确认**，即可按 Unit 流水线自动推进。
