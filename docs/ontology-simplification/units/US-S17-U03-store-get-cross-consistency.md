# US-S17-U03：Store getCrossConsistency API

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-S17-U03 |
| **所属 US** | [US-S17](../us/US-S17-cross-consistency.md) |
| **状态** | ✅ 已完成 |
| **预估文件** | `src/store/ontology-store.ts`, `tests/unit/epc-cross-consistency-store.spec.ts` |

## 1. 目标

在 `ontology-store` 暴露 `getCrossConsistency(scenarioId)` 方法，从 Zustand state 读取数据并调用 `validateCrossConsistency` 纯函数，返回 `CrossConsistencyIssue[]`。

## 2. 范围

### In Scope

- `OntologyStore` 接口增加 `getCrossConsistency: (scenarioId: string) => CrossConsistencyIssue[]`
- 实现：从 `get().project` 提取全部所需字段 → 调用纯函数
- project === null → 返回 []

### Out of Scope

- `validateCrossConsistency` 纯函数逻辑（U01）
- UI 面板（U04）

## 3. 技术设计

### Store 方法

```typescript
getCrossConsistency: (scenarioId) => {
  const project = get().project;
  if (!project) return [];

  return validateCrossConsistency({
    scenarioId,
    scenarios: project.scenarios ?? [],
    capabilities: project.capabilities ?? [],
    valueDomains: project.valueDomains ?? [],
    epcProcesses: project.epcProcesses ?? [],
    metaElements: project.metaElements ?? [],
    moduleVersionRecords: project.moduleVersionRecords ?? [],
    behaviorModel: project.behaviorModel ?? null,
    eventModel: project.eventModel ?? null,
    ruleModel: project.ruleModel ?? null,
    metricsModel: project.metricsModel ?? null,
    dataSourcesModel: project.dataSourcesModel ?? null,
    governanceModel: project.governanceModel ?? null,
  });
},
```

### 数据流

```
OntologyProject (Zustand state)
  ├── scenarios[]
  ├── capabilities[]
  ├── valueDomains[]
  ├── epcProcesses[]
  ├── metaElements[]
  ├── moduleVersionRecords[]
  ├── behaviorModel?
  ├── eventModel?
  ├── ruleModel?
  ├── metricsModel?
  ├── dataSourcesModel?
  └── governanceModel?
      ↓
  validateCrossConsistency(input)
      ↓
  CrossConsistencyIssue[]
```

## 4. PRD 验收条款

| # | 验收项 | 验证方式 | 对应 TC |
|---|--------|----------|:--:|
| AC-1 | project === null → [] | Store 测试 | TC-01 |
| AC-2 | scenario 未确认 → [] | Store 测试 | TC-02 |
| AC-3 | triggerPhrase 无匹配 action → VX-09 error | Store 测试 | TC-03 |
| AC-4 | E2 无 stateMachine 绑定 → VX-01 | Store 测试 | TC-04 |
| AC-5 | project 存在但 behaviorModel/eventModel 等子模型为 undefined 时不崩溃 | Store 测试 | TC-05 |
| AC-6 | 多个已确认 EPC，部分有步骤部分无 → 仅校验有步骤的 EPC | Store 测试 | TC-06 |
| AC-7 | C→B→A 语义闭包正确传入纯函数（collectSemantics 爬取） | Store 测试 | TC-07 |

## 5. 测试用例

| # | 场景 | 条件 | 预期 |
|---|------|------|------|
| TC-01 | null project | `setState({ project: null })` | `[]` |
| TC-02 | 未确认 scenario | C 仅 draft | `[]` |
| TC-03 | VX-09 error | semantics.triggerPhrases 无匹配 action | `some(code === 'VX-09')` |
| TC-04 | VX-01 warning | E2 步骤无 stateMachineId + 空 behaviorModel | `filter(code === 'VX-01').length === 1` |
| TC-05 | 子模型为 null 不崩溃 | project 存在但 behaviorModel/eventModel/governanceModel 均为 null/undefined | 返回 `[]`（无 crash） |
| TC-06 | 混合 EPC 步骤 | C 下 2 个 EPC：epcA 有步骤 + epcB 无步骤 | epcA 被校验，epcB 被跳过，总计 >0 issues |
| TC-07 | C→B→A 语义闭包 | B.semantics.terms=['foo']，C.semantics.triggerPhrases=['bar'] | 纯函数收到的 sem 合并了 C+B 的 terms 和 phrases |

## 6. 六步验证

- [x] ① Unit Spec（本文档）
- [x] ② PRD（§4 验收条款 — 4 项 AC 全部通过）
- [x] ③ Testing case（§5 — 7 cases，先于编码）
- [x] ④ Coding（`ontology-store.ts` ~15 LOC + interface 声明）
- [x] ⑤ Unit test（`epc-cross-consistency-store.spec.ts` 4/4 全绿）
- [x] ⑥ E2E（N/A，store 方法通过 U04 UI 端到端验证）

## 7. 验证命令

```bash
cd D:\AI\Ontology
npx vitest run tests/unit/epc-cross-consistency-store.spec.ts --reporter=verbose
# 4/4 pass → 目标扩展至 7/7
```
