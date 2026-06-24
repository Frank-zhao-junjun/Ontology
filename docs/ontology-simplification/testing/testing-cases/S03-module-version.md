# US-S03: Testing Cases — 模块版本 Store

> 日期: 2026-06-18  
> 对应 US: [US-S03-module-version-store.md](../us/US-S03-module-version-store.md)  
> Unit Spec: [U01](../units/US-S03-U01-spec.md) · [U02](../units/US-S03-U02-spec.md)

---

## US-S03-U01：module-version 纯函数库

### TC-U01-01: 每模块仅一个 draft，upsert 覆盖

**Given**:
- `records = []`
- 模块 `C` / `c-1`，首次 snapshot `{ name: 'v0' }`

**When**:
1. `saveModuleDraft([], { moduleKind: 'C', moduleId: 'c-1', snapshot: { name: 'v0' } })`
2. 再次 `saveModuleDraft(r1, { ..., snapshot: { name: 'v1' } })`

**Then**:
- 第二次结果 `records.length === 1`
- `getModuleDraft(r2, 'C', 'c-1').snapshot === { name: 'v1' }`

**实现状态**: ✅  
**测试映射**: `tests/unit/module-version.spec.ts` → `should upsert a single draft per module`

---

### TC-U01-02: confirm v1→v2，旧 confirmed 变 archived

**Given**:
- EPC `epc-1` 有 draft `{ steps: [] }`

**When**:
1. `confirmModule` → v1 confirmed
2. `forkConfirmedToDraft` → 新 draft
3. 再次 `confirmModule` → v2

**Then**:
- `getLatestConfirmed().version === 'v2'`
- history 中 v1 为 `archived`，仅 1 条 archived

**实现状态**: ✅  
**测试映射**: `should confirm draft as v1 then v2 and archive prior confirmed`

---

### TC-U01-03: resolve latest_confirmed 与 pin vN

**Given**:
- 已 confirm v1、fork、confirm v2

**When**:
- `resolveModuleRef(..., pin: 'latest_confirmed')`
- `resolveModuleRef(..., pin: { version: 'v1' })`

**Then**:
- latest → v2
- pin v1 → snapshot `{ a: 1 }`（v1 内容）

**实现状态**: ✅  
**测试映射**: `should resolve latest_confirmed and pinned version`

---

### TC-U01-04: draft 不可被 resolve

**Given**:
- 仅有 draft，无 confirmed

**When**: `resolveModuleRef(..., pin: 'latest_confirmed')`

**Then**: 返回 `null`

**实现状态**: ✅  
**测试映射**: `should not resolve draft as cross-module ref target`

---

### TC-U01-05: 无 draft 时 confirm 抛错

**Given**: `records = []`

**When**: `confirmModule([], 'A', 'a-1', now)`

**Then**: throw `/No draft/`

**实现状态**: ✅  
**测试映射**: `confirmModule should throw when no draft exists`

---

## US-S03-U02：ontology-store 模块版本 API

### TC-U02-01: draft 持久化到 project.moduleVersionRecords

**Given**: 新建项目

**When**: `store.saveModuleDraft('EPC', 'epc-1', { steps: [] })`

**Then**:
- `project.moduleVersionRecords.length === 1`
- 首条 `status === 'draft'`

**实现状态**: ✅  
**测试映射**: `tests/unit/module-version-store.spec.ts` → `should persist module drafts`

---

### TC-U02-02: store confirm + resolve latest_confirmed

**Given**: `saveModuleDraft('E1', 'el-1', { name: '订单' })`

**When**:
1. `confirmModule('E1', 'el-1')` → v1
2. `resolveModuleRef({ targetModuleKind: 'E1', targetElementId: 'el-1', pin: 'latest_confirmed' })`

**Then**: `resolved.snapshot === { name: '订单' }`

**实现状态**: ✅  
**测试映射**: `should confirm module and resolve latest_confirmed via store`

---

### TC-U02-03: 二次 confirm 后 history 含 archived + confirmed v2

**Given**: C `c-1` draft `{ n: 1 }` → confirm → fork `{ n: 2 }` → confirm

**When**: `getModuleVersions('C', 'c-1')`

**Then**:
- 存在 `v1 + archived`
- 存在 `v2 + confirmed`

**实现状态**: ✅  
**测试映射**: `should list module version history after second confirm`

---

## 汇总

| TC ID | Unit | 场景 | 状态 |
|-------|------|------|------|
| TC-U01-01 | U01 | draft upsert | ✅ |
| TC-U01-02 | U01 | confirm 递增 + archive | ✅ |
| TC-U01-03 | U01 | resolve pin | ✅ |
| TC-U01-04 | U01 | draft 不可 resolve | ✅ |
| TC-U01-05 | U01 | 无 draft 抛错 | ✅ |
| TC-U02-01 | U02 | store 持久化 | ✅ |
| TC-U02-02 | U02 | store confirm + resolve | ✅ |
| TC-U02-03 | U02 | 版本历史 | ✅ |

**E2E**: N/A（无 UI）

---

## 回归命令

```bash
pnpm run test:phase1
```
