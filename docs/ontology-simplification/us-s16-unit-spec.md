# US-S16: EPC 覆盖率分析 + 仪表盘 — Unit Spec

> 日期: 2026-06-18 | 架构准据: [epc-v3.1-simplified-spec.md](./epc-v3.1-simplified-spec.md) | 依赖: US-S15 ✅

---

## 一、目标

从「模型→EPC」方向计算覆盖率：对于每个 Scenario (C) 子树，统计八维要素 (E1–E8) 被其下已确认 EPC 步骤引用的比例。输出 `EpcCoverageReport` 并在 C 工作区展示仪表盘。

---

## 二、U01: 类型定义 + computeCoverage 纯函数

### 2.1 文件

| 文件 | 说明 |
|------|------|
| `src/lib/epc-coverage/types.ts` | 类型导出 |
| `src/lib/epc-coverage/index.ts` | `computeCoverage()` 纯函数 |

### 2.2 类型

```typescript
export interface DimensionCoverage {
  dimension: MetaDimension;       // 'E1' | ... | 'E8'
  totalElements: number;          // 该维度 metaElements 总数
  coveredElements: number;        // usageRefs 非空的 element 数
  coveragePercent: number;        // 0–100，一位小数
  uncovered: { elementId: string; elementName: string }[];
}

export interface EpcCoverageReport {
  scenarioId: string;
  totalElements: number;          // 所有 8 维度总和
  coveredElements: number;
  coveragePercent: number;        // 0–100
  byDimension: Partial<Record<MetaDimension, DimensionCoverage>>;
}
```

### 2.3 输入

```typescript
interface ComputeCoverageInput {
  scenarioId: string;
  scenarios: Scenario[];              // 找目标 C
  epcProcesses: EpcProcess[];         // parentId === scenarioId 的 EPC
  metaElements: MetaElement[];        // 八维要素
  moduleVersionRecords: ModuleVersionRecord[]; // 过滤已确认
}
```

### 2.4 算法

```
1. 校验 scenarioId 在 scenarios 中存在且已确认 → 否则返回 all-zero report
2. 筛选 epcProcesses 中 parentId === scenarioId 的 EPC
3. 对每个 EPC，确认其 moduleVersionRecords 中 status === 'confirmed'
4. 收集所有已确认 EPC 的 steps[].elementRef.elementId → Set<string> (referencedIds)
5. 将 metaElements 按 dimension 分组
6. 对每组：
   totalElements = group.length
   coveredElements = group.filter(el => el.usageRefs 中存在来自步骤3中已确认EPC的引用).length
   coveragePercent = totalElements > 0 ? round(coveredElements / totalElements * 100, 1) : 0
   uncovered = group.filter(el => !covered).map(el => ({ elementId: el.id, elementName: el.name }))
7. 汇总 8 个 dimension 的总计
8. 返回 EpcCoverageReport
```

### 2.5 已确认判定

- Scenario (C): `getLatestConfirmed(records, 'C', scenarioId)` 非空
- EPC: `getLatestConfirmed(records, 'EPC', epc.id)` 非空
- 覆盖率引用判断：`element.usageRefs` 中的 `epcId` 指向已确认 EPC

---

## 三、U02: Store API

### 3.1 方法签名

```typescript
getEpcCoverage: (scenarioId: string) => EpcCoverageReport
```

### 3.2 实现

```typescript
getEpcCoverage: (scenarioId) => {
  const project = get().project;
  if (!project) return emptyReport(scenarioId);
  return computeCoverage({
    scenarioId,
    scenarios: project.scenarios ?? [],
    epcProcesses: project.epcProcesses ?? [],
    metaElements: project.metaElements ?? [],
    moduleVersionRecords: project.moduleVersionRecords ?? [],
  });
}
```

### 3.3 Store 接口声明

在 `OntologyStore` 接口中增加 `getEpcCoverage` 签名。

---

## 四、U03: 覆盖率仪表盘 UI

### 4.1 组件

`src/components/ontology/epc-coverage-panel.tsx`

### 4.2 Props

```typescript
interface EpcCoveragePanelProps {
  scenarioId: string;
}
```

### 4.3 布局

```
┌─────────────────────────────────────┐
│  EPC 覆盖率仪表盘                    │
│  ┌──────────┐                       │
│  │   73%    │  整体覆盖率（环形进度）  │
│  │ 22 / 30 │                       │
│  └──────────┘                       │
│                                     │
│  E1 数据   ██████████░░  4/6  67%   │
│  E2 行为   ██████████░░  2/4  50%   │
│  E3 事件   ██████████░░  3/3 100%   │
│  E4 规则   ██████████░░  3/5  60%   │
│  E5 角色   ██████████░░  2/2 100%   │
│  E6 指标   ██████████░░  1/3  33%   │
│  E7 约束   ██████████░░  3/4  75%   │
│  E8 接口   ████��█████░░  4/3 133%→  │
│                                     │
│  ▶ 展开查看未覆盖要素                │
└─────────────────────────────────────┘
```

### 4.4 交互

- 环形进度：整体覆盖率
- 每维度一行：进度条 + 分数 + 百分比 + 维度标签
- 点击维度行展开/折叠 `uncovered` 列表
- 未覆盖 element 可点击定位到要素库
- 挂载在 `scenario-workspace.tsx` 的 C 详情区域

### 4.5 挂载位置

在 `scenario-workspace.tsx` 中：
```
<ScenarioWorkspace>
  <ScenarioDetail />
  <EpcCoveragePanel scenarioId={activeC.id} />   ← 新增
  <EpcStepsEditor />
</ScenarioWorkspace>
```

---

## 五、U04: 测试

### 5.1 文件

`tests/unit/epc-coverage.spec.ts`

### 5.2 用例清单 (8 cases)

| # | 用例 | 输入 | 期望 |
|---|------|------|------|
| TC01 | 空项目 | scenarioId='c1', metaElements=[] | all-zero report, coveragePercent=0 |
| TC02 | C 未确认 | scenarioId='c1', C 仅有 draft record | all-zero report |
| TC03 | 无 EPC | scenarioId='c1', C confirmed, epcProcesses=[] | all-zero, totalElements 仍计算 |
| TC04 | EPC 未确认 | scenarioId='c1', EPC 仅有 draft | 引用不计入 covered |
| TC05 | 全覆盖 | E1 2个元素均有 usageRefs 指向已确认EPC | E1: 2/2=100% |
| TC06 | 部分覆盖 | E1 4个元素，2个有引用 | E1: 2/4=50% |
| TC07 | 跨维度混合 | E1 50%, E2 100%, E3 0% | 各维度独立计算 |
| TC08 | 隔离性 | 两个 C 各有 EPC，只统计目标 C 子树 | 不互相干扰 |

---

## 六、依赖

| 依赖 | 状态 |
|------|:----:|
| `MetaElement.usageRefs` (saveEpc → rebuildUsageIndex) | ✅ 已有 |
| `getLatestConfirmed` (module-version) | ✅ 已有 |
| `scenario-workspace.tsx` | ✅ 已有 |
| `useOntologyStore` | ✅ 已有 |
