# US-S14: Testing Cases — 模块确认/归档 UI

> 日期: 2026-06-18  
> 对应 US: [US-S14-module-confirm-archive-ui.md](../us/US-S14-module-confirm-archive-ui.md)  
> 依赖: [US-S03](../us/US-S03-module-version-store.md) · [US-S04](../us/US-S04-business-chain-tree.md)

---

## US-S14-U01：confirm-flow 纯函数

### TC-U01-01: 空 name 拒绝 confirm

**When**: `validateConfirmInput({ name: '' })`

**Then**: 返回 validation error

**实现状态**: ✅  
**测试映射**: `tests/unit/confirm-flow.spec.ts` → `should reject confirm when name is empty`

---

### TC-U01-02: B 的 parentId 不在 valueDomains 拒绝

**实现状态**: ✅  
**测试映射**: `should reject B when parentId missing from valueDomains`

---

### TC-U01-03: EPC parentId 不在 scenarios 拒绝

**实现状态**: ✅  
**测试映射**: `should reject EPC when parentId not in scenarios`

---

### TC-U01-04: E1 dimension 非法拒绝

**实现状态**: ✅  
**测试映射**: `should reject E1 when dimension invalid`

---

### TC-U01-05: runConfirmFlow 首次 confirm → v1

**实现状态**: ✅  
**测试映射**: `runConfirmFlow should confirm draft as v1`

---

### TC-U01-06: 二次 confirm 归档旧 confirmed

**实现状态**: ✅  
**测试映射**: `runConfirmFlow should archive prior confirmed on second confirm`

---

### TC-U01-07: 无 draft 时 runConfirmFlow 返回 errors

**实现状态**: ✅  
**测试映射**: `runConfirmFlow should return errors when no draft`

---

### TC-U01-08: cancelModuleDraft 移除 draft record

**实现状态**: ✅  
**测试映射**: `cancelModuleDraft should remove draft record`

---

## US-S14-U02：ModuleDetailActions 组件

### TC-U02-01: draft 节点显示确认/取消

**实现状态**: ✅  
**测试映射**: `tests/integration/module-detail-actions.spec.tsx` → `should show confirm and cancel for draft node`

---

### TC-U02-02: confirmed 无 draft 显示 fork（编辑）

**实现状态**: ✅  
**测试映射**: `should show fork button for confirmed without draft`

---

### TC-U02-03: 校验失败时确认按钮 disabled

**实现状态**: ✅  
**测试映射**: `should disable confirm when validation fails`

---

### TC-U02-04: 对话框提交后触发 onConfirm

**实现状态**: ✅  
**测试映射**: `should call onConfirm after dialog submit`

---

## US-S14-U03：VersionHistoryPanel

### TC-U03-01: 列表展示版本并标记当前 confirmed

**实现状态**: ✅  
**测试映射**: `tests/integration/version-history-panel.spec.tsx` → `should list versions and mark current confirmed`

---

### TC-U03-02: 点击 archived 行触发 view

**实现状态**: ✅  
**测试映射**: `should trigger view on archived row`

### TC-U03-03: archive 后版本列表按 draft→confirmed→archived 排序

**实现状态**: ✅  
**测试映射**: `should sort rows draft → confirmed → archived after second confirm`

---

## US-S14-U04：业务链确认集成 + E2E

### TC-U04-01: 树详情 confirm draft A → v1 + badge 刷新

**实现状态**: ✅  
**测试映射**: `tests/integration/business-chain-confirm.spec.tsx` → `should confirm draft A node to v1 and refresh badge`

---

### TC-U04-02: 价值域展示子能力 incoming reference

**实现状态**: ✅  
**测试映射**: `should list child capability as incoming reference for value domain`

---

### TC-U04-03: 工作台 E2E draft A 确认全路径 @smoke

**Given**: 空项目 → 业务链 Tab → 新建价值域

**When**: 点击确认 → 提交对话框

**Then**:
- `getBusinessChainModuleStatus('A', id) === 'confirmed'`
- `getModuleVersions` 含 `v1 + confirmed`

**实现状态**: ✅  
**测试映射**: `tests/e2e/module-confirm.e2e.spec.ts` → `@smoke 用户可从 draft A 节点确认`

---

## 汇总

| Unit | TC 数 | 自动化 | 状态 |
|------|-------|--------|------|
| U01 confirm-flow | 8 | 8 | ✅ |
| U02 ModuleDetailActions | 4 | 4 | ✅ |
| U03 VersionHistoryPanel | 3 | 3 | ✅ |
| U04 集成 + E2E | 3 | 3 | ✅ |
| **合计** | **18** | **18** | ✅ |

---

## 回归命令

```bash
pnpm run test:phase1.5
```
