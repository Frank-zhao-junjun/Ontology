# US-S10：Excel 分模块导入导出

| 字段 | 值 |
|------|-----|
| **ID** | US-S10 |
| **Phase** | 3 |
| **优先级** | P2 |
| **状态** | ✅ **已确认**（2026-06-18） |
| **依赖** | US-S03（模块版本 store）、US-S04（A/B/C/EPC 树）、US-S05（saveEpc 流水线）、US-S08（C 工作区） |
| **主计划** | [docs/本体建模简化架构.plan.md](../../本体建模简化架构.plan.md) |

## User Story

**作为** 业务建模人员，  
**我希望** 将本体模型的各模块（A/B/C/EPC/E1–E8）导出为分模块 Excel 模板，编辑后重新导入生成 draft，  
**以便** 批量编辑和跨团队协作时有一个离线的结构化编辑手段。

## 范围（In Scope）

| 项 | 说明 |
|----|------|
| **导出 Excel** | 为每个模块生成独立 Sheet（A / B / C / EPC / E1–E8），默认导出 **latest confirmed** 快照；可选导出指定版本 |
| **EPC Sheet 拆分** | EPC 按 C 分 Sheet 或在同一 Sheet 中带 `scenarioId` 列区分归属 |
| **导入 Excel** | 解析 Excel 文件 → 校验字段完整性 → 调用 `saveModuleDraft()` 逐模块创建 draft；**导入仅生成 draft，不自动 confirm** |
| **引用校验** | EPC 步骤中的 `elementId` 引用列校验：导入时检查引用目标是否在八维库中存在（已确认或 draft）；不存在时 warning |
| **父节点占位** | 导入时若引用的父节点（A/B/C）在项目中不存在，允许自动创建占位 draft；确认前需补齐必填字段 |
| **EPC 内联要素** | EPC Sheet 含 `inlineNew` 标记列；导入时若标记为内联新建，走 `saveEpc` → upsert 入库 + `rebuildUsageIndex` |
| **导入预览** | 导入前展示变更摘要：哪些模块将新建 draft、哪些将更新已有 draft、哪些行有校验 warning |

## 范围外（Out of Scope）

| 项 | 归属 |
|----|------|
| AI 草稿填充 | US-S11 |
| 导入时自动 confirm | 不在 ADR 范围（导入仅 draft） |
| Excel 公式计算/宏 | 仅结构化数据导入导出 |
| 图片/附件嵌入 | 不在范围内 |
| 跨项目导入 | 仅当前项目内 |

## Excel 模板结构

### Sheet 规划（12 个模块 + 1 个隐藏引用表）

| Sheet | 模块 | 关键列 |
|-------|------|--------|
| **_要素引用表** 🔒 | 隐藏 Sheet | id, name, dimension——供 EPC Sheet 和 B/C Sheet 的下拉列表引用 |
| A | ValueDomain | id, name, nameEn, description, semantics(JSON), parentId(null) |
| B | Capability | id, name, nameEn, description, semantics(JSON), parentId(→A.id)，parentId 列设下拉引用 _要素引用表 |
| C | Scenario | id, name, nameEn, description, semantics(JSON), parentId(→B.id)，parentId 列设下拉引用 _要素引用表 |
| EPC | EpcProcess | id, name, nameEn, description, semantics(JSON), parentId(→C.id)，steps(JSON) |
| E1 | 数据 | 同 MetaElement：id, name, nameEn, dimension, visibility, description |
| E2 | 行为 | 同上 + stateMachine(JSON) |
| E3 | 事件 | 同上 + eventPayload(JSON) |
| E4 | 规则 | 同上 + ruleExpression(JSON) |
| E5 | 岗位角色 | 同上 |
| E6 | 指标 | 同上 + formula |
| E7 | 约束 | 同上 + constraintExpr(JSON) |
| E8 | 接口 | 同上 + dataSource(JSON) |

### EPC Sheet 特殊列

| 列 | 说明 |
|----|------|
| `steps` | JSON 数组，每项含 `{id, name, elementRef: {dimension, elementId, versionPin, inlineNew?, inlinePayload?}}` |
| `scenarioId` | 归属 C 的 id（当 EPC 合并在同一 Sheet 时） |

### 引用列的下拉验证（Data Validation）

**对用户友好是强需求**。导出时自动设置以下下拉：

| 目标列 | 所在 Sheet | 数据来源 | 说明 |
|--------|-----------|----------|------|
| `parentId` | A / B / C | `_要素引用表!$A$2:$A$N` | 下拉显示可选父节点 id |
| `steps[].elementRef.elementId` | EPC | `_要素引用表!$A$2:$A$N`（按 dimension 分组） | EPC 步骤引用要素时下拉选择，按 E1–E8 分类 |
| `parentId` | EPC | C Sheet 的 id 列 | 下拉显示可选 C 节点 id |

- `_要素引用表` 为隐藏 Sheet，导出时自动填充所有已确认要素的 `id`、`name`、`dimension`
- 用户在 Excel 中编辑时，引用列单元格点击即出现下拉列表，无需手动输入 id
- 导入时校验所选 id 是否仍在八维库中（可能已被删除）

### 导出版本选择

- 默认：`getLatestConfirmed(records, kind, moduleId)` → snapshot
- 可选：指定版本号（如 `v2`），回退到 `getConfirmedByVersion()`
- draft 不导出（仅在项目内编辑）

## 导入流程

```
用户选择 Excel 文件
  → 解析各 Sheet 为模块数组
  → 逐行校验：
      1. 必填字段检查（id/name/ModuleKind 特定字段）
      2. 引用完整性检查（parentId 指向的 A/B/C 是否存在；elementId 是否在八维库中）
      3. 父节点缺失 → 自动创建占位 draft（标记 missingParent: true）
      4. 引用不存在 → warning（不阻断导入）
  → 展示导入预览（变更摘要 + warning 列表）
  → 用户确认
  → 逐模块调用 saveModuleDraft()
     - EPC 模块：若 steps 中含 inlineNew，走 saveEpc 流水线（upsert + rebuildUsageIndex）
  → 完成，刷新 store
```

## Unit 拆分（建议）

| Unit | 标题 | 说明 | ⑥ E2E |
|------|------|------|-------|
| U01 | `lib/excel/excel-schema.ts` | 定义 12 个 Sheet 的列映射、类型、校验规则 | N/A |
| U02 | `lib/excel/export-excel.ts` | 从 store 读取 latest confirmed 快照 → 生成 Excel Workbook（SheetJS） | N/A |
| U03 | `lib/excel/import-excel.ts` | 解析 Excel → 逐行校验 → 生成 ImportPreview | N/A |
| U04 | `excel-import-export-dialog.tsx` | UI 对话框：导出（版本选择 + 下载）/ 导入（文件选择 → 预览 → 确认） | ✅ |

## 验收标准

| # | 验收项 | 验证方式 |
|---|--------|----------|
| AC-1 | 导出 Excel 包含 12 个 Sheet（A/B/C/EPC/E1–E8），每个 Sheet 列头与 Schema 一致 | 单元测试 |
| AC-2 | 导出默认取 latest confirmed 快照；可切换到指定版本导出 | 单元测试 |
| AC-3 | 导入解析后展示变更摘要：新建 draft 数量、更新 draft 数量、warning 数量 | 单元测试 |
| AC-4 | 导入仅生成 draft，不自动 confirm（导入后模块状态全为 draft） | 单元测试 |
| AC-5 | EPC 步骤引用 `elementId` 不在八维库中时产生 warning，不阻断导入 | 单元测试 |
| AC-6 | 父节点（A/B/C）缺失时自动创建占位 draft | 单元测试 |
| AC-7 | EPC Sheet 中 `inlineNew` 标记的要素导入后走 upsert + rebuildUsageIndex | 单元测试 |
| AC-8 | 导入确认后 store 中 draft 正确生成，树导航可展示新模块 | E2E smoke |
| AC-9 | 导出 Excel 的引用列（parentId、elementId）设置了 Data Validation 下拉，用户在 Excel 中可从下拉列表中选择 id 而非手动输入 | 手动验证（打开导出的 Excel 文件检查） |

## 约束

- 依赖库：[`xlsx`](https://www.npmjs.com/package/xlsx)（SheetJS Community Edition）——纯 JS 的 `.xlsx` 读写库，支持浏览器端运行，支持 Data Validation、隐藏 Sheet、单元格样式等，无需任何服务端依赖
- 导入不修改已有 confirmed 快照——仅创建/更新 draft
- 所有语义字段（`semantics`、`steps` 等 JSON 列）在 Excel 中以 JSON 字符串形式存储
- 隐藏 Sheet `_要素引用表` 在导出时自动生成，导入时忽略以 `_` 开头的 Sheet

## 确认

- [x] Frank，2026-06-18 —— 范围与 9 条 AC 确认；要求引用列必须做 Excel Data Validation 下拉，对用户友好
