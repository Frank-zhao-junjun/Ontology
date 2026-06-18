# US-S10-U04：导入导出 UI 对话框 + E2E

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-S10-U04 |
| **所属 US** | [US-S10](../us/US-S10-excel-per-module.md) |
| **状态** | ✅ 已完成 |
| **预估文件** | `repo-main/src/components/ontology/excel-import-export-dialog.tsx`、`repo-main/tests/e2e/excel-import-export.e2e.spec.ts` |

## 1. 目标（一句话）

提供 Excel 导入导出对话框 UI：导出支持版本选择+下载，导入支持文件选择→预览→确认，并通过 E2E smoke 验证完整流程。

## 2. 范围

### In Scope

- `ExcelExportDialog`：版本选择下拉（默认 latest）+ "导出 Excel" 按钮
- `ExcelImportDialog`：
  - 文件拖放/选择区域
  - 解析完成后展示 ImportPreview：变更摘要卡片 + warning 列表
  - "确认导入"按钮执行 executeImport
  - 导入完成后关闭对话框并刷新 store
- 对话框入口：工作台顶栏或工具栏按钮
- E2E smoke：完整导入导出流程

### Out of Scope

- 导入进度条（数据量不大，一次性处理）
- 导出格式选择（仅有 .xlsx）
- Excel 在线预览/编辑

## 3. 技术设计（简要）

### 3.1 组件结构

```
ExcelExportDialog
├── 版本选择区：默认 "latest confirmed"，可下拉选具体版本号
├── "导出" 按钮 → 调用 exportModulesToExcel() → 触发下载
└── 关闭按钮

ExcelImportDialog
├── Step 1：文件选择（拖放/点击）
│   └── 支持 .xlsx 文件过滤
├── Step 2：导入预览（ImportPreview 展示）
│   ├── 变更摘要卡片（new/update/placeholder 计数）
│   └── warning 列表（可展开）
├── Step 3：确认导入
│   └── "确认导入" 按钮（有 warning 时二次确认）
└── 关闭按钮
```

### 3.2 Store 调用

- 导出：`getModuleVersions()` → 获取可选版本列表
- 导入：`saveModuleDraft()` → 逐模块写入 draft；`rebuildUsageIndex()` → 重建索引

### 3.3 入口位置

工作台工具栏新增「导入/导出」按钮，点击弹出 Tab 切换对话框（一个对话框含两个 Tab：导出 / 导入）。

## 4. PRD 验收条款

| # | 验收项 | 验证方式 |
|---|--------|----------|
| AC-1 | 导出对话框可选择版本并下载 .xlsx 文件 | E2E |
| AC-2 | 导入对话框可拖放/选择 .xlsx 文件并展示预览 | E2E |
| AC-3 | 预览中正确展示变更摘要（new/update/placeholder 数量） | E2E |
| AC-4 | 确认导入后 store 中的 draft 正确生成 | E2E |
| AC-5 | 导入的父节点占位 draft 在树导航中可见 | E2E |

## 5. 测试计划（⚠️ 必须在 Coding 之前完成）

| 类型 | 文件路径 | 说明 |
|------|----------|------|
| E2E | `repo-main/tests/e2e/excel-import-export.e2e.spec.ts` | 覆盖 AC-1 ~ AC-5 的 smoke 用例 |

## 6. 依赖

- **前置 Unit**：US-S10-U01/U02/U03（Schema + 导出 + 导入逻辑）
- **阻塞 US**：无

## 7. 流水线检查（六步强制）

| 步骤 | 完成 | 说明 |
|------|------|------|
| ① Unit Spec | [x] | 本文件 |
| ② PRD 验收条款 | [x] | AC 表 |
| ③ **Testing case** | [x] | tests/e2e/excel-import-export.e2e.spec.ts（先 failing） |
| ④ Coding | [x] | src/components/ontology/excel-import-export-dialog.tsx |
| ⑤ Unit test 绿灯 | [x] | N/A（UI 组件，由 E2E 覆盖） |
| ⑥ E2E | [x] | 5/5 smoke pass |
