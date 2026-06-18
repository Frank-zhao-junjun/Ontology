# US-S10-U01：Excel Schema 定义

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-S10-U01 |
| **所属 US** | [US-S10](../us/US-S10-excel-per-module.md) |
| **状态** | ✅ 已完成 |
| **预估文件** | `repo-main/src/lib/excel/excel-schema.ts` |

## 1. 目标（一句话）

定义 12 个模块 Sheet + 1 个隐藏引用表 的列映射、TypeScript 类型、校验规则，供 U02/U03 共用。

## 2. 范围

### In Scope

- **列定义**：每个 ModuleKind 的列名、类型、必填/可选、默认值
- **类型定义**：`ExcelColumnDef`、`ExcelSheetConfig`、`ExcelModuleRow`、`ImportPreview`、`ImportChangeItem`、`ValidationWarning`
- **校验函数**：`validateModuleRow(row, sheetConfig)` → `ValidationWarning[]`——必填字段检查、类型检查、parentId 格式检查
- **12+1 Sheet 配置表**：A/B/C/EPC/E1–E8 + 隐藏引用表 `_要素引用表`

### Out of Scope

- 实际的 Excel 读写（U02/U03）
- 引用完整性校验（U03 负责——需要查 store）
- UI 组件（U04）

## 3. 技术设计（简要）

### 3.1 核心类型

```ts
interface ExcelColumnDef {
  key: string;           // 对应 snapshot 字段名（支持嵌套如 steps）
  header: string;        // 列头中文
  type: 'string' | 'json' | 'enum';
  required: boolean;
  enumValues?: string[]; // 仅 type='enum' 时
  description?: string;
}

interface ExcelSheetConfig {
  moduleKind: ModuleKind;
  sheetName: string;     // 不含下划线前缀（可见 Sheet）
  columns: ExcelColumnDef[];
  hidden?: boolean;       // _要素引用表
}

interface ExcelModuleRow {
  moduleKind: ModuleKind;
  moduleId: string;
  data: Record<string, unknown>;
}

interface ValidationWarning {
  sheet: string;
  row: number;
  column: string;
  message: string;
}

interface ImportChangeItem {
  moduleKind: ModuleKind;
  moduleId: string;
  action: 'new_draft' | 'update_draft' | 'placeholder_draft';
  existingStatus?: ModuleStatus;
  row: number;
}

interface ImportPreview {
  changes: ImportChangeItem[];
  warnings: ValidationWarning[];
  summary: {
    newDrafts: number;
    updatedDrafts: number;
    placeholderDrafts: number;
    warningCount: number;
  };
}
```

### 3.2 Sheet 配置

12 个可见 Sheet + 1 个隐藏引用表。每个 Sheet 的核心列：

| Sheet | 特殊处理 |
|-------|----------|
| A | parentId 固定为 null |
| B/C | parentId 必填，下拉引用 _要素引用表 |
| EPC | steps 为 JSON 列；parentId 必填；scenarioId 冗余列 |
| E1–E8 | id/name/dimension 必填 |

### 3.3 校验规则

`validateModuleRow` 逐列检查：
1. 必填字段非空
2. JSON 列可 parse
3. enum 列值在允许范围
4. id 格式：不含空格、不以 `_` 开头

## 4. PRD 验收条款

| # | 验收项 | 验证方式 |
|---|--------|----------|
| AC-1 | 12 个 Sheet 配置完整，列定义与 US 模板结构一致 | 单元测试 |
| AC-2 | `validateModuleRow` 检测必填字段缺失并返回 warning | 单元测试 |
| AC-3 | `validateModuleRow` 检测 JSON 列格式错误并返回 warning | 单元测试 |
| AC-4 | `ImportPreview` 等类型可正确构造和访问 | 类型编译通过 |

## 5. 测试计划（⚠️ 必须在 Coding 之前完成）

| 类型 | 文件路径 | 说明 |
|------|----------|------|
| Unit test | `repo-main/tests/unit/excel-schema.spec.ts` | 覆盖所有 AC |

## 6. 依赖

- **前置 Unit**：无（本 US 首个 Unit）
- **阻塞 US**：无

## 7. 流水线检查（六步强制）

| 步骤 | 完成 | 说明 |
|------|------|------|
| ① Unit Spec | [x] | 本文件 |
| ② PRD 验收条款 | [x] | AC 表 |
| ③ **Testing case** | [x] | tests/unit/excel-schema.spec.ts（先 failing） |
| ④ Coding | [x] | src/lib/excel/excel-schema.ts |
| ⑤ Unit test 绿灯 | [x] | 15/15 pass |
| ⑥ E2E | [x] | N/A（纯 lib） |
