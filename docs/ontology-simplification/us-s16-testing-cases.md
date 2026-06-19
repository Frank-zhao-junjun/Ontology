# US-S16: Testing Cases

> 日期: 2026-06-18 | 对应 Spec: [us-s16-unit-spec.md](./us-s16-unit-spec.md)

---

## TC01: 空项目返回 all-zero report

**Given**:
- `scenarioId = 'c1'`
- `scenarios = [{ id: 'c1', name: '场景', parentId: 'b1' }]`
- `moduleVersionRecords = [confirmedRecord('C', 'c1', scenarios[0])]`
- `epcProcesses = []`
- `metaElements = []`

**When**: `computeCoverage({ scenarioId, scenarios, epcProcesses, metaElements, moduleVersionRecords })`

**Then**:
```typescript
{
  scenarioId: 'c1',
  totalElements: 0,
  coveredElements: 0,
  coveragePercent: 0,
  byDimension: {}
}
```

---

## TC02: C 未确认返回 all-zero

**Given**:
- `scenarioId = 'c1'`
- `scenarios = [{ id: 'c1', name: '场景', parentId: 'b1' }]`
- `moduleVersionRecords = []` — 无 confirmed record
- `metaElements = [{ id: 'e1', name: '要素', dimension: 'E1', usageRefs: [] }]`

**When**: `computeCoverage(...)`

**Then**: `totalElements: 0, coveredElements: 0, coveragePercent: 0`

---

## TC03: 有 C 无 EPC → 所有 element 未覆盖

**Given**:
- `scenarioId = 'c1'`, C 已确认
- `epcProcesses = []`
- `metaElements`: E1×2（均有 usageRefs 但指向不存在/未确认的 EPC）

**When**: `computeCoverage(...)`

**Then**:
- E1: `totalElements: 2, coveredElements: 0, coveragePercent: 0`
- 汇总: `totalElements: 2, coveredElements: 0`

---

## TC04: EPC 未确认 → 引用不计入

**Given**:
- `scenarioId = 'c1'`, C 已确认
- `epcProcesses = [{ id: 'epc1', name: '流程', parentId: 'c1', steps: [{ id: 's1', name: '步', elementRef: { dimension: 'E1', elementId: 'e1', versionPin: 'latest_confirmed' } }] }]`
- `moduleVersionRecords`: EPC 仅有 draft，无 confirmed
- `metaElements = [{ id: 'e1', name: '要素', dimension: 'E1', usageRefs: [{ epcId: 'epc1', stepId: 's1' }] }]`

**When**: `computeCoverage(...)`

**Then**:
- E1: `totalElements: 1, coveredElements: 0` — 因 EPC 未确认

---

## TC05: 全覆盖 100%

**Given**:
- `scenarioId = 'c1'`, C 已确认
- EPC 已确认 + steps 引用 e1, e2
- `metaElements`: E1×2，均有 usageRefs [{ epcId: 'epc1', stepId: 's1' }]

**When**: `computeCoverage(...)`

**Then**:
```typescript
{
  totalElements: 2,
  coveredElements: 2,
  coveragePercent: 100,
  byDimension: {
    E1: { totalElements: 2, coveredElements: 2, coveragePercent: 100, uncovered: [] }
  }
}
```

---

## TC06: 部分覆盖 50%

**Given**:
- E1: 4 elements，其中 2 个无 usageRefs / usageRefs 指向未确认 EPC

**Then**:
- E1: `totalElements: 4, coveredElements: 2, coveragePercent: 50`
- `uncovered`: [{ elementId: 'e3', elementName: '...' }, { elementId: 'e4', elementName: '...' }]

---

## TC07: 跨维度混合

**Given**:
- E1×4 (covered: 2) → 50%
- E2×2 (covered: 2) → 100%
- E3×3 (covered: 0) → 0%
- E4×1 (covered: 1) → 100%
- 其余 E5-E8: 0

**Then**:
```typescript
{
  totalElements: 10,
  coveredElements: 5,
  coveragePercent: 50,
  byDimension: {
    E1: { coveragePercent: 50, ... },
    E2: { coveragePercent: 100, ... },
    E3: { coveragePercent: 0, ... },
    E4: { coveragePercent: 100, ... },
  }
}
```

---

## TC08: 隔离性 — 两个 C 互不干扰

**Given**:
- `scenarioId = 'c1'`
- C1 下 EPC1 引用 E1.e1
- C2 下 EPC2 引用 E1.e2
- 所有均已确认

**When**: `computeCoverage({ scenarioId: 'c1', ... })`

**Then**:
- E1: e1 covered, e2 NOT covered（�� e2 的 usageRefs 指向 EPC2，不在 C1 子树）
- `coveragePercent = 50`

---

## 汇总

| TC | 场景 | 关键断言 |
|----|------|---------|
| TC01 | 空项目 | 全零 |
| TC02 | C 未确认 | 全零 |
| TC03 | 无 EPC | totalElements 计算，covered=0 |
| TC04 | EPC 未确认 | 引用不计入 |
| TC05 | 全覆盖 | 100% |
| TC06 | 部分覆盖 | 50% + uncovered 列表 |
| TC07 | 跨维度混合 | 各维度独立 |
| TC08 | 隔离性 | C 子树隔离 |
