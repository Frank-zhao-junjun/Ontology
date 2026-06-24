# US-S12：遗留代码删除

| 字段 | 值 |
|------|-----|
| **ID** | US-S12 |
| **Phase** | 4 |
| **优先级** | P3 |
| **状态** | ✅ 已完成（2026-06-18） |
| **依赖** | US-S11（AI draft 填充） |
| **主计划** | [本体建模简化架构.plan.md](../../本体建模简化架构.plan.md) |

## User Story

**作为** 维护者，  
**我希望** 移除 Agent 语义层 / Entity Lifecycle / ProcessModel 编排等遗留入口与死代码，并提供 BusinessScenario → 业务链 C 的迁移工具，  
**以便** 简化架构成为唯一建模叙事，降低维护成本。

## 范围（In Scope）

| 项 | 说明 |
|----|------|
| 遗留审计 | 确认 `repo-main` 无 Agent/Lifecycle API 与 UI 入口 |
| ProcessModel | 删除 store 中未使用的 Orchestration CRUD；类型保留只读兼容 |
| 迁移 | `migrateBusinessScenariosToChain`：legacy `BusinessScenario` → A/B/C 占位 |
| Store | `migrateLegacyBusinessScenariosToChain()` 一键迁移 |

## 范围外

| 项 | 归属 |
|----|------|
| 删除 legacy 实体/dataModel 编辑器 | 后续迭代（E1 仍依赖实体路径） |
| Manifest compiler 映射 | US-S13 |
| ontology-platform 后端 | 不在本仓库 |

## 验收标准

| # | 标准 | 验证 |
|---|------|------|
| AC-1 | 无 `agent-semantic-layer` / `entity-lifecycle` API 路由 | unit audit |
| AC-2 | store 无 `addOrchestration` 等 ProcessModel CRUD | grep + unit |
| AC-3 | 迁移后 legacy scenario 出现在 `project.scenarios` | unit |
| AC-4 | `pnpm lint` / `ts-check` / 既有测试不退化 | CI |

## Unit 拆分

| Unit | 标题 | ⑥ E2E |
|------|------|-------|
| U01 | 遗留入口审计 | N/A |
| U02 | 删除 ProcessModel store CRUD | N/A |
| U03 | BusinessScenario → 业务链迁移纯函数 | N/A |
| U04 | Store 迁移 API + 集成测试 | N/A |

## 确认

- [x] Frank，2026-06-18
