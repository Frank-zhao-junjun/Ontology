# US-S05：saveEpc 流水线 + rebuildUsageIndex

| 字段 | 值 |
|------|-----|
| **ID** | US-S05 |
| **Phase** | 1 |
| **优先级** | P0 |
| **状态** | ✅ **已确认**（2026-06-18）→ **已完成** |
| **依赖** | US-S02（类型）、US-S03（模块版本 store）、US-S04（`epcProcesses` 业务链数据） |
| **主计划** | [docs/本体建模简化架构.plan.md](../../本体建模简化架构.plan.md) |
| **ADR** | [docs/adr-simplified-ontology-model.md](../../adr-simplified-ontology-model.md) |

## User Story

**作为** 调用 store / 流水线的开发者，  
**我希望** 在保存 EPC 数据时，系统自动 upsert 内联新建要素、更新 EPC draft 快照并重建 `usageRefs` 反向索引，  
**以便** 要素库派生索引与 EPC `steps[].elementRef` 权威引用保持一致，且符合模块版本规范。

## 背景与动机

- ADR：**EPC 步骤 `elementRef` 为权威**；`MetaElement.usageRefs` 为 **派生**，由 `rebuildUsageIndex()` 全量扫描生成。
- US-S02：`EpcStep.elementRef` 含 `inlineNew`、`inlinePayload`。
- US-S03：`saveModuleDraft` / 模块 draft 快照。
- US-S04：业务链 CRUD 写入 `project.epcProcesses`；**不含** EPC 步骤编辑 UI。
- 本 US 交付 **纯函数 + store API**；UI 保存按钮在 Phase 2（US-S06+）接入。

## 范围（In Scope）

### 核心流程（与 ADR §3 saveEpc 对齐）

```typescript
/** 纯函数编排；store 层同步调用，与 US-S03 一致 */
function runSaveEpcPipeline(input: SaveEpcInput): SaveEpcResult {
  // 1. 扫描 steps[].elementRef（inlineNew）→ upsert 到 project.metaElements，并 saveModuleDraft(E1–E8)
  // 2. 写回 steps：填充 elementId，清除 inlineNew / inlinePayload（已落库）
  // 3. 更新 epcProcesses 中目标 EPC + saveModuleDraft('EPC', epcId, snapshot)
  // 4. rebuildUsageIndex() → 更新所有 metaElements.usageRefs
}
```

| 步骤 | 说明 |
|------|------|
| ① upsert 内联要素 | `inlineNew: true` 且有 `inlinePayload`；新建则生成 **不透明 `id`**（与现有 `generateId` 一致）；更新已有 `elementId`；每条要素 `saveModuleDraft(dimension, elementId, snapshot)` |
| ② 持久化 EPC | 合并到 `epcProcesses`；`saveModuleDraft('EPC', epcId, epcSnapshot)` |
| ③ 重建索引 | 幂等全量扫描全部 `epcProcesses`；`scenarioId` = `epc.parentId`（C.id） |

### 存储约定

- 八维要素：项目级扁平数组 `project.metaElements[]`，以 `dimension: E1–E8` 区分（**非**按维度拆多个数组）。
- `elementRef` 持久化仅存 `elementId` + `versionPin`（不缓存 `name`）。
- `id` 创建后不可变；`name` 可改（ADR §4）。

### Store API（拟定，同步）

```typescript
// ontology-store.ts — 与 US-S03 相同，不用 async
saveEpc: (epcId: string, epcData: EpcProcess) => void;
rebuildUsageIndex: () => void;
getElementUsageRefs: (elementId: string) => ElementUsageRef[];
```

纯函数（`lib/epc-pipeline/`）：

```typescript
upsertInlineElements(metaElements, steps, saveDraft): { metaElements, steps }
rebuildUsageIndex(projectSlices): MetaElement[]
runSaveEpcPipeline(input): SaveEpcResult
validateSaveEpcInput(epc, metaElements): void  // U05
```

## 范围外（Out of Scope）

| 项 | 归属 |
|----|------|
| EPC **步骤**编辑器 UI、保存按钮 | **Phase 2**（US-S06 要素选择器 / EPC 编辑器） |
| A/B/C/EPC **树导航** | US-S04（已完成） |
| 八维要素选择器（下拉 + 搜索） | Phase 2（US-S06） |
| 要素库「未引用」筛选视图 | Phase 2（US-S07） |
| C 工作区引用并集预览 | Phase 2（US-S08） |
| `business-epc-linter`、W-EPC-01~05 | Phase 3（US-S09） |
| Excel 导入 EPC | Phase 3（US-S10） |
| AI 填充 EPC 草稿 | Phase 3（US-S11） |
| 模块 **确认/归档** UI | 后续 US；US-S03 仅 API |
| confirmed 快照 linter 触发 | ADR 第 4 步；随 US-S09 |

## 验收标准

| # | 标准 | 验证方式 |
|---|------|----------|
| AC-1 | `runSaveEpcPipeline` / store `saveEpc` 可调用 | 单元测试 |
| AC-2 | `inlineNew` 要素 upsert 到 `metaElements`，并写入对应 **E1–E8** draft | 单元测试 |
| AC-3 | upsert 后 `steps[].elementRef.elementId` 已填充，`inlineNew` 已清除 | 单元测试 |
| AC-4 | `saveModuleDraft('EPC', …)` 被调用，`moduleVersionRecords` 含 EPC draft | 单元测试 |
| AC-5 | `rebuildUsageIndex` 后 `usageRefs` 与全部 EPC 步骤引用一致（含 `scenarioId`=C.id） | 单元测试 |
| AC-6 | 移除步骤或 `elementRef` 后，对应 `usageRefs` 条目消失 | 单元测试 |
| AC-7 | 基础输入校验：`inlineNew` 无 payload、无 `elementId` 的非内联引用等 **抛错**（非 W-EPC 警示） | 单元测试 |
| AC-8 | `pnpm lint` / `ts-check` / `test:unit` 绿灯 | CI |
| AC-9 | 不破坏实体建模、旧 EPC Tab | 回归 |
| AC-10 | （可选）100 EPC × 500 步重建 &lt; 1s | 性能测试 |

## 建议 Unit 拆分（US 确认后六步执行）

> 每 Unit：**① Spec → ② PRD → ③ Tests（先于 Code）→ ④ Code → ⑤ Unit 绿灯 → ⑥ E2E N/A**

| Unit | 标题 | 主要产出 | ⑥ E2E |
|------|------|----------|-------|
| US-S05-U01 | upsert 内联要素 | `lib/epc-pipeline/upsert-inline.ts` + unit | N/A |
| US-S05-U02 | rebuildUsageIndex | `lib/epc-pipeline/rebuild-usage-index.ts` + unit | N/A |
| US-S05-U03 | saveEpc 编排 | `lib/epc-pipeline/save-epc.ts` + unit | N/A |
| US-S05-U04 | Store 集成 | `ontology-store` + `save-epc-store.spec.ts` | N/A |
| US-S05-U05 | 流水线输入校验 | `lib/epc-pipeline/validate-save-epc.ts` + unit | N/A |

> Unit Spec：`units/US-S05-U0n-spec.md` 在 **US 确认后** 创建。

### Unit 依赖

```
(U01 ∥ U02) → U05 → U03 → U04
```

- U01/U02 可并行；U03 依赖 U01、U02、U05；U04 依赖 U03。

## 技术要点

### 内联新建示例

```typescript
const step: EpcStep = {
  id: 'step-1',
  name: '创建订单',
  elementRef: {
    dimension: 'E1',
    elementId: '', // upsert 前可空；保存后写入真实 id
    versionPin: 'latest_confirmed',
    inlineNew: true,
    inlinePayload: { name: '订单', description: '销售订单实体' },
  },
};
```

### rebuildUsageIndex（幂等）

```
usageMap = Map<elementId, ElementUsageRef[]>
for each epc in epcProcesses:
  scenarioId = epc.parentId
  for each step in epc.steps:
    if step.elementRef?.elementId:
      append { epcId, stepId, scenarioId, versionPin } to usageMap[elementId]
for each meta in metaElements:
  meta.usageRefs = usageMap.get(meta.id) ?? []
```

### U05 校验范围（基础版，非 ADR 全量 E4/E7 语义）

| 检查 | 行为 |
|------|------|
| `inlineNew` 且无 `inlinePayload` | **throw** |
| 非 `inlineNew` 且 `elementId` 为空 | **throw** |
| `dimension` 非 E1–E8 | **throw** |
| payload 与 dimension 明显不符（可选类型守卫） | **throw** |

> **不含**：E4「校验规则」vs E7「策略约束」的完整语义校验、W-EPC 警示、跨 C 归属规则——属 Phase 2/3。

### 错误处理

- upsert：`inlinePayload` 缺 `name` → throw
- rebuild：孤儿 `elementId`（库中不存在）→ 不写入 usageRefs（W-EPC-05 由 US-S09 linter 处理）

## 风险与假设

| 风险 | 缓解 |
|------|------|
| 全量重建性能 | 幂等扫描；大项目后续增量优化 |
| 单用户编辑 | Phase 1 无并发锁 |
| dangling elementId | rebuild 不生成虚假 usageRefs |

**假设**：调用方传入完整 `EpcProcess`（含 `steps`）；规模 &lt; 500 EPC / 5000 步。

## 六步执行计划（US 确认后）

| 阶段 | 动作 |
|------|------|
| **US** | 用户确认 |
| **U01–U05** | Spec → Tests → Code → 绿灯（均 E2E N/A） |
| **US 完成** | 五 Unit §7 全 `[x]` |

## 确认

- [x] 确认范围：纯函数 + store，**无 UI**
- [x] 确认流水线：**upsert → 写 EPC draft → rebuildUsageIndex**（与 ADR 一致）
- [x] 确认 **不含** EPC 步骤编辑器（属 Phase 2 / US-S06+）
- [x] 确认 U05 仅为**输入校验基础版**，非完整 E4/E7 语义与 W-EPC

确认人：Frank　日期：2026-06-18

## Unit 完成

| Unit | Spec | 六步 |
|------|------|------|
| US-S05-U01 | upsert-inline | ✅ |
| US-S05-U02 | rebuild-usage-index | ✅ |
| US-S05-U03 | save-epc | ✅ |
| US-S05-U04 | store 集成 | ✅ |
| US-S05-U05 | validate-save-epc | ✅ |

验证：`pnpm test:unit` 187 pass（含 S05 新增 11）
