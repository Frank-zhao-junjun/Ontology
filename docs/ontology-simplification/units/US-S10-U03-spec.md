# US-S10-U03：Excel 导入 + 校验

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-S10-U03 |
| **所属 US** | [US-S10](../us/US-S10-excel-per-module.md) |
| **状态** | ✅ 已完成 |
| **预估文件** | `repo-main/src/lib/excel/import-excel.ts` |

## 1. 目标（一句话）

解析 Excel 文件 → 逐行校验（必填字段 + 引用完整性）→ 生成 ImportPreview；确认后执行导入，仅生成 draft。

## 2. 范围

### In Scope

- `parseExcelImport(file: File)` → `ImportPreview`：解析 Excel → 逐行校验
- 引用完整性检查：
  - `parentId` 指向的 A/B/C 节点是否在项目中存在
  - EPC 步骤 `elementRef.elementId` 是否在八维库中
  - 缺失 → 生成 warning
- 父节点占位逻辑：parentId 指向的节点不存在时，自动标记为 placeholder draft
- `executeImport(preview)` → 逐模块调用 `saveModuleDraft()`
- EPC 内联要素：`inlineNew === true` 的步骤走 upsert 入库 + `rebuildUsageIndex`
- 导入仅生成 draft，不自动 confirm

### Out of Scope

- 实际的文件选择和触发（U04 UI）
- 跨项目导入
- 导入时自动 confirm

## 3. 技术设计（简要）

### 3.1 函数签名

```ts
interface ParseExcelImportOptions {
  file: File;
  existingValueDomains: ValueDomain[];
  existingCapabilities: Capability[];
  existingScenarios: Scenario[];
  existingMetaElements: MetaElement[];
  existingModuleVersionRecords: ModuleVersionRecord[];
}

function parseExcelImport(options: ParseExcelImportOptions): Promise<ImportPreview>

interface ExecuteImportOptions {
  preview: ImportPreview;
  rows: ExcelModuleRow[];
  saveModuleDraft: (kind: ModuleKind, id: string, snapshot: unknown) => void;
  rebuildUsageIndex: () => void;
}

function executeImport(options: ExecuteImportOptions): void
```

### 3.2 校验流程

```
逐 Sheet 逐行 →
  1. validateModuleRow()（U01 的校验函数）→ 字段级警告
  2. parentId 完整性检查（跨 Sheet 引用）
  3. elementRef.elementId 完整性检查（EPC 引用八维要素）
  4. EPC steps JSON 解析与校验
  5. 父节点缺失 → placeholder_draft
  6. 已有 draft 的同模块 → update_draft
  7. 新模块 → new_draft
→ 汇总 ImportPreview
```

### 3.3 父节点占位

当 B 的 `parentId` 指向的 A 不在 `existingValueDomains` 中：
- 不在校验阶段报错
- 在 preview.changes 中标记为 `placeholder_draft`
- 创建最小 draft snapshot：`{ id, name: id, description: "（导入占位，请补全必填字段）" }`
- 导入后在树导航中以醒目样式显示

### 3.4 EPC 内联要素

当 EPC 步骤 `elementRef.inlineNew === true` 时：
- 将该要素 upsert 到 `metaElements`
- 导入完成后调用 `rebuildUsageIndex`

## 4. PRD 验收条款

| # | 验收项 | 验证方式 |
|---|--------|----------|
| AC-1 | 解析 Excel 后生成 ImportPreview，含 changes 和 warnings | 单元测试 |
| AC-2 | 必填字段缺失产生 warning，不阻断导入 | 单元测试 |
| AC-3 | elementId 引用不在八维库中产生 warning | 单元测试 |
| AC-4 | 父节点缺失时自动创建 placeholder draft | 单元测试 |
| AC-5 | 导入仅生成 draft（所有模块 status: 'draft'），不自动 confirm | 单元测试 |
| AC-6 | EPC 内联要素 upsert 入库 + rebuildUsageIndex | 单元测试 |
| AC-7 | 已有 draft 的同模块导入后更新 draft（不创建重复记录） | 单元测试 |

## 5. 测试计划（⚠️ 必须在 Coding 之前完成）

| 类型 | 文件路径 | 说明 |
|------|----------|------|
| Unit test | `repo-main/tests/unit/excel-import.spec.ts` | 覆盖所有 AC |

## 6. 依赖

- **前置 Unit**：US-S10-U01（excel-schema）——共用类型和校验
- **阻塞 US**：无

## 7. 流水线检查（六步强制）

| 步骤 | 完成 | 说明 |
|------|------|------|
| ① Unit Spec | [x] | 本文件 |
| ② PRD 验收条款 | [x] | AC 表 |
| ③ **Testing case** | [x] | tests/unit/excel-import.spec.ts（先 failing） |
| ④ Coding | [x] | src/lib/excel/import-excel.ts |
| ⑤ Unit test 绿灯 | [x] | 7/7 pass |
| ⑥ E2E | [x] | N/A（纯 lib） |
