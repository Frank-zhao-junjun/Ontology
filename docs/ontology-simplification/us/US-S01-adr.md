# US-S01：ADR 编写

| 字段 | 值 |
|------|-----|
| **ID** | US-S01 |
| **Phase** | 0 |
| **优先级** | P0 |
| **状态** | 已完成（2026-06-18） |
| **依赖** | 无（首项） |
| **主计划** | [docs/本体建模简化架构.plan.md](../../本体建模简化架构.plan.md) |

## User Story

**作为** 架构负责人 / 开发团队，  
**我希望** 有一份正式的架构决策记录（ADR），将简化方案的产品决策与数据模型约定文档化，  
**以便** 后续 US/Unit 实施有唯一准据，并与 `ontology-platform` Manifest 契约对齐。

## 背景与动机

- 主计划已收敛 A→B→C→EPC 业务树、E1–E8 全局要素库、EPC 主引用 + 反向索引、模块版本与警示规则。
- ADR 将把这些决策从「计划」固化为「可评审、可引用的架构文档」，减少实施阶段歧义。

## 范围（In Scope）

1. 创建 [`docs/adr-simplified-ontology-model.md`](../../adr-simplified-ontology-model.md)
2. 文档需覆盖：
   - **业务链**：A（ValueDomain）→ B（Capability）→ C（Scenario）→ EPC（EpcProcess）；严格父子树；一 C 多 EPC
   - **八维合并表**：E1–E8 与现状模块（数据/行为/事件/规则/组织/指标/约束/接口）映射
   - **E4 规则 vs E7 约束** 边界说明
   - **标识规范**：A/B/C/EPC 与八要素统一 `id` 不可变、`name` 可改；引用用 ID、UI 用名称
   - **引用模型**：EPC `steps[].elementRef` 为权威；`usageRefs` 派生；`rebuildUsageIndex` 时机
   - **版本与引用 pin**：draft / confirmed / archived；`latest_confirmed` vs 锁定版本
   - **警示规则** W-EPC-01~05：warning only，不阻断导出
   - **与 Manifest / compiler** 的映射方向（引用 `ontology-platform/docs/shared/ontology-manifest-spec.md`）
3. ADR 采用标准结构：Context / Decision / Consequences / Alternatives（可选）

## 范围外（Out of Scope）

- 修改 `repo-main` 应用代码或 store
- 删除 Agent 语义层 / Entity Lifecycle（属 Phase 4）
- 完整 compiler 实现（仅写映射方向）

## 验收标准

- [x] `docs/adr-simplified-ontology-model.md` 已创建且可被团队直接评审
- [x] 主计划中「已确认的产品决策」在 ADR 中均有对应章节，无矛盾
- [x] E1–E8 合并表完整，E4/E7 边界有至少 2 条示例
- [x] id/name 规范对业务链与八要素均有说明
- [x] EPC 主引用 + 反向索引流程有示意图或步骤说明
- [x] W-EPC-01~05 列表与主计划一致
- [x] 文内链接指向本仓库路径（`E:/00 - AI/Ontology` 子目录）

## 建议 Unit 拆分（US 确认后自动执行）

| Unit | 标题 | 预估产出 |
|------|------|----------|
| US-S01-U01 | ADR 骨架与业务链章节 | ADR 文件 + Context/Decision 框架 |
| US-S01-U02 | E1–E8 合并表与 E4/E7 边界 | ADR 维度章节 |
| US-S01-U03 | 标识、引用、版本与 pin 策略 | ADR 数据与引用章节 |
| US-S01-U04 | 警示规则与 Manifest 映射 | ADR 校验与平台章节；主计划交叉引用 |

> 每个 Unit 使用 [`_UNIT_SPEC_TEMPLATE.md`](../units/_UNIT_SPEC_TEMPLATE.md)，并按 [`UNIT_VALIDATION_CHECKLIST.md`](../UNIT_VALIDATION_CHECKLIST.md) 验收（文档类 Unit 以 Spec 验收项 + 人工评审为主，无代码时可跳过 Coding/测试门禁）。

## 确认

- [x] 产品/架构负责人确认本 US 范围与验收标准
- 确认人：Frank　日期：2026-06-18

确认后状态改为 **已确认**，即可按 Unit 流水线自动推进。
