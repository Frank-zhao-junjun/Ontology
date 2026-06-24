# US-S10-U02：Excel 导出

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-S10-U02 |
| **所属 US** | [US-S10](../us/US-S10-excel-per-module.md) |
| **状态** | ✅ 已完成 |
| **预估文件** | `repo-main/src/lib/excel/export-excel.ts` |

## 1. 目标（一句话）

从 ModuleVersionRecord[] 和项目数据中读取 latest confirmed 快照，生成包含 12+1 Sheet 且引用列带 Data Validation 下拉的 Excel Workbook。

## 2. 范围

### In Scope

- `exportModulesToExcel(options)` 函数：接收项目数据 → 返回 `Uint8Array`（.xlsx 二进制）
- 按 ModuleKind 逐模块提取 `status === 'confirmed'` 的快照，默认取 `getLatestConfirmed`
- 支持指定版本导出（`versionMap: Record<ModuleKind, string>`）
- 生成隐藏 Sheet `_要素引用表`（id, name, dimension）
- 引用列（B/C/EPC 的 parentId、EPC 的 elementId）设置 Data Validation 下拉
- JSON 列（semantics、steps 等）序列化为 JSON 字符串
- draft 模块不导出

### Out of Scope

- 实际浏览器下载（U04 UI 负责）
- 导入逻辑（U03）
- CSV 或其它格式导出

## 3. 技术设计（简要）

### 3.1 函数签名

```ts
interface ExportExcelOptions {
  valueDomains: ValueDomain[];
  capabilities: Capability[];
  scenarios: Scenario[];
  epcProcesses: EpcProcess[];
  metaElements: MetaElement[];
  moduleVersionRecords: ModuleVersionRecord[];
  versionMap?: Partial<Record<ModuleKind, string>>; // 指定版本
}

function exportModulesToExcel(options: ExportExcelOptions): Uint8Array
```

### 3.2 核心流程

```
1. 收集所有 confirmed ModuleVersionRecord
2. 按 ModuleKind 分组
3. 创建 Workbook
4. 先生成「_要素引用表」隐藏 Sheet（所有 confirmed metaElement + A/B/C/EPC id/name/dimension）
5. 逐模块生成 Sheet：
   a. 取 latest confirmed snapshot（或指定版本）
   b. 按 ExcelSheetConfig 映射字段 → 行数据
   c. JSON 字段序列化
6. 对引用列设置 Data Validation：
   a. 公式：'=INDIRECT("_要素引用表!$A$2:$A$"&COUNTA(...))'
   b. 或用静态范围（更可靠）：直接计算引用表行数
7. 隐藏 _要素引用表
8. 输出 Uint8Array
```

### 3.3 Data Validation 实现

使用 xlsx 的 `!dataValidation` 特性：
- 对 parentId 列：list validation，source = `_要素引用表!$A$2:$A$N`
- 范围由 confirmed 要素数量动态决定
- 允许用户输入不在列表中的值（`allowBlank: true`，因为可能引用尚未存在的父节点）

### 3.4 模块数据提取

- **A/B/C/EPC**：从 `getLatestConfirmed(records, kind, id)` 的 `snapshot` 获取
- **E1–E8 MetaElement**：从 `metaElements` 数组中筛选 `confirmedVersion` 存在的项
- **parentId 映射**：A 无 parentId；B=parentId(→A)；C=parentId(→B)；EPC=parentId(→C)

## 4. PRD 验收条款

| # | 验收项 | 验证方式 |
|---|--------|----------|
| AC-1 | 导出的 Workbook 包含 13 个 Sheet（12 模块 + 1 隐藏引用表） | 单元测试 |
| AC-2 | 导出默认取 latest confirmed 快照；versionMap 指定版本时取对应版本 | 单元测试 |
| AC-3 | draft 模块不出现在导出中 | 单元测试 |
| AC-4 | 引用列设置了 Data Validation 下拉（公式范围指向 `_要素引用表`） | 单元测试 |
| AC-5 | `_要素引用表` 标记为 hidden | 单元测试 |
| AC-6 | JSON 列正确序列化（semantics/steps） | 单元测试 |

## 5. 测试计划（⚠️ 必须在 Coding 之前完成）

| 类型 | 文件路径 | 说明 |
|------|----------|------|
| Unit test | `repo-main/tests/unit/excel-export.spec.ts` | 覆盖所有 AC |

## 6. 依赖

- **前置 Unit**：US-S10-U01（excel-schema）——共用 Sheet 配置和类型
- **阻塞 US**：无

## 7. 流水线检查（六步强制）

| 步骤 | 完成 | 说明 |
|------|------|------|
| ① Unit Spec | [x] | 本文件 |
| ② PRD 验收条款 | [x] | AC 表 |
| ③ **Testing case** | [x] | tests/unit/excel-export.spec.ts（先 failing） |
| ④ Coding | [x] | src/lib/excel/export-excel.ts |
| ⑤ Unit test 绿灯 | [x] | 9/9 pass |
| ⑥ E2E | [x] | N/A（纯 lib） |
