# US-S04: Testing Cases — A/B/C/EPC 业务链树

> 日期: 2026-06-18  
> 对应 US: [US-S04-business-chain-tree.md](../us/US-S04-business-chain-tree.md)  
> Unit Spec: [U01](../units/US-S04-U01-spec.md) · [U02](../units/US-S04-U02-spec.md) · [U03](../units/US-S04-U03-spec.md) · [U04](../units/US-S04-U04-spec.md)

---

## US-S04-U01：business-chain 树纯函数

### TC-U01-01: 构建严格 A→B→C→EPC 树，过滤 orphan B

**Given**:
- `valueDomains`: A1
- `capabilities`: B1(parent=A1), B-orphan(parent=missing)
- `scenarios`: C1(parent=B1)
- `epcProcesses`: EPC1(parent=C1)

**When**: `buildBusinessChainTree(project)`

**Then**:
- 根节点仅 A1；B1→C1→EPC1 层级正确
- orphan B 不出现在树中

**实现状态**: ✅  
**测试映射**: `tests/unit/business-chain-tree.spec.ts` → `should build strict A→B→C→EPC tree`

---

### TC-U01-02: 显示路径为 name 链

**Given**: A/B/C/EPC 各有 name

**When**: `getBusinessChainDisplayPath(project, 'EPC', epcId)`

**Then**: 返回 `A名/B名/C名/EPC名`

**实现状态**: ✅  
**测试映射**: `should return display path as name chain`

---

### TC-U01-03: 按 kind + id 查找节点

**When**: `findBusinessChainNode(project, 'C', cId)`

**Then**: 返回对应 scenario 对象

**实现状态**: ✅  
**测试映射**: `should find node by kind and id`

---

### TC-U01-04: 有子节点时禁止删除

**Given**: B 下有 C

**When**: `canDeleteBusinessChainNode(project, 'B', bId)`

**Then**: `false`

**实现状态**: ✅  
**测试映射**: `should block delete when node has children`

---

## US-S04-U02：store CRUD + module draft

### TC-U02-01: 新建 A 并写入 module draft

**When**: `addValueDomain({ name, nameEn, ... })`

**Then**:
- `valueDomains` 含新 A
- `moduleVersionRecords` 含 A 的 draft

**实现状态**: ✅  
**测试映射**: `tests/unit/business-chain-store.spec.ts` → `should add value domain and persist module draft`

---

### TC-U02-02: 通过 store API 构建完整链 A→B→C→EPC

**When**: 依次 `addValueDomain` → `addCapability` → `addScenario` → `addEpcProcess`

**Then**: 四层数据互相关联，`parentId` 正确

**实现状态**: ✅  
**测试映射**: `should build A→B→C→EPC chain via store APIs`

---

### TC-U02-03: 有子节点时 block delete；空 C 可删

**When**:
1. 删除有 EPC 的 C → 失败
2. 删除无子节点的 C → 成功

**Then**: 符合 AC 删除规则

**实现状态**: ✅  
**测试映射**: `should block delete when children exist and allow empty C delete`

---

### TC-U02-04: 新节点 module status 为 draft

**When**: 新建 B

**Then**: `resolveBusinessChainModuleStatus(...)` → `draft`

**实现状态**: ✅  
**测试映射**: `should report draft module status for new nodes`

---

### TC-U02-05: 选中态更新

**When**: `setBusinessChainSelection({ kind, id })`

**Then**: store 中 selection 与传入一致

**实现状态**: ✅  
**测试映射**: `should update selection state`

---

## US-S04-U03：树 UI 组件

### TC-U03-01: 渲染 A/B/C/EPC 层级

**Given**: mock store 含完整链

**When**: 渲染 `BusinessChainTree`

**Then**: 可见各层节点 name；可展开/折叠

**实现状态**: ✅  
**测试映射**: `tests/integration/business-chain-tree.spec.tsx`

---

### TC-U03-02: 点击节点更新选中态

**When**: 用户点击 C 节点

**Then**: store selection 更新；详情区显示路径

**实现状态**: ✅  
**测试映射**: `tests/integration/business-chain-tree.spec.tsx`

---

## US-S04-U04：模块状态与选中同步

### TC-U04-01: 树徽章反映 draft/confirmed/archived

**Given**: draft / confirmed / archived 各一节点

**When**: 渲染树节点

**Then**: 徽章分别显示对应状态

**实现状态**: ✅  
**测试映射**: `business-chain-module-status.spec.ts`（4 cases）+ `business-chain-tree.spec.tsx`（draft/archived badge）+ `business-chain-confirm.spec.tsx`（confirm 后 badge）

---

## 汇总

| TC ID | Unit | 场景 | 状态 |
|-------|------|------|------|
| TC-U01-01~04 | U01 | 树 lib | ✅ |
| TC-U02-01~05 | U02 | store CRUD | ✅ |
| TC-U03-01~02 | U03 | 树 UI | ✅ |
| TC-U04-01 | U04 | 状态徽章 | ✅ |

---

## 回归命令

```bash
pnpm run test:phase1
# E2E
pnpm vitest run tests/e2e/business-chain-tree.e2e.spec.ts
```
