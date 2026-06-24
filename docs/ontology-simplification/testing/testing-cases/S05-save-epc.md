# US-S05: Testing Cases — saveEpc 流水线 + rebuildUsageIndex

> 日期: 2026-06-18  
> 对应 US: [US-S05-save-epc-pipeline.md](../us/US-S05-save-epc-pipeline.md)  
> Unit Spec: [US-S05-UNITS.md](../units/US-S05-UNITS.md)

---

## US-S05-U01：validateSaveEpcInput

### TC-U01-01: 合法 EPC 通过校验

**Given**: EPC 含合法 steps、elementRef

**When**: `validateSaveEpcInput(input)`

**Then**: 不抛错

**实现状态**: ✅  
**测试映射**: `tests/unit/validate-save-epc.spec.ts` → `should pass valid epc`

---

### TC-U01-02: inlineNew 无 payload 抛错

**Given**: step.elementRef `{ inlineNew: true }` 无 `inlinePayload`

**When**: `validateSaveEpcInput(...)`

**Then**: throw

**实现状态**: ✅  
**测试映射**: `should throw when inlineNew without payload`

---

### TC-U01-03: 非 inline ref 空 elementId 抛错

**Given**: `inlineNew: false`, `elementId: ''`

**When**: `validateSaveEpcInput(...)`

**Then**: throw

**实现状态**: ✅  
**测试映射**: `should throw when non-inline ref has empty elementId`

---

## US-S05-U02：upsertInlineElements

### TC-U02-01: inlineNew 新建要素并 saveModuleDraft

**Given**: step 含 `inlineNew: true` + `inlinePayload`

**When**: `upsertInlineElements(project, steps)`

**Then**:
- `metaElements` 新增要素
- 对应 E1–E8 draft 写入

**实现状态**: ✅  
**测试映射**: `tests/unit/upsert-inline.spec.ts`

---

## US-S05-U03：rebuildUsageIndex

### TC-U03-01: 全量扫描 EPC steps 重建 usageRefs

**Given**:
- EPC1 step 引用 e1
- EPC2 step 引用 e2

**When**: `rebuildUsageIndex(project)`

**Then**:
- e1.usageRefs 含 EPC1/step
- e2.usageRefs 含 EPC2/step

**实现状态**: ✅  
**测试映射**: `tests/unit/rebuild-usage-index.spec.ts` → `should rebuild usageRefs from all epc steps`

---

### TC-U03-02: 删除 step 后 usageRefs 清空

**Given**: 原先 e1 被引用

**When**: 移除 step 后 `rebuildUsageIndex`

**Then**: e1.usageRefs 为空或不含该 step

**实现状态**: ✅  
**测试映射**: `should clear usage when step removed`

---

## US-S05-U04：runSaveEpcPipeline + store saveEpc

### TC-U04-01: 完整流水线 inline → epc draft → usageIndex

**Given**:
- EPC 含 inlineNew 要素
- 已有 metaElements 数组

**When**: `runSaveEpcPipeline({ epcId, epcData, project, ... })`

**Then**:
- inline 要素落库，step 填充 elementId
- EPC draft 更新
- usageRefs 与 steps 一致

**实现状态**: ✅  
**测试映射**: `tests/unit/save-epc.spec.ts` → `should upsert inline, save epc draft, and rebuild usage index`

---

### TC-U04-02: store.saveEpc 委托流水线

**Given**: 已 createProject + 业务链 EPC 节点

**When**: `store.saveEpc(epcId, epcData)`

**Then**: `project.epcProcesses` 与 `moduleVersionRecords` 同步更新

**实现状态**: ✅  
**测试映射**: `tests/unit/save-epc-store.spec.ts`

---

## 汇总

| TC ID | Unit | 场景 | 状态 |
|-------|------|------|------|
| TC-U01-01~03 | U01 | validate | ✅ |
| TC-U02-01 | U02 | upsert inline | ✅ |
| TC-U03-01~02 | U03 | rebuild index | ✅ |
| TC-U04-01~02 | U04 | pipeline + store | ✅ |

**E2E**: 经 Phase 2 `epc-steps-editor` 间接覆盖

---

## 回归命令

```bash
pnpm run test:phase1
```
