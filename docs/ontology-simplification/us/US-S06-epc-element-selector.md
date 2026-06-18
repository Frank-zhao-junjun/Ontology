# US-S06：EPC 要素选择器

| 字段 | 值 |
|------|-----|
| **ID** | US-S06 |
| **Phase** | 2 |
| **优先级** | P1 |
| **状态** | ✅ **已确认**（2026-06-18）→ **已完成** |
| **依赖** | US-S02（类型）、US-S03（模块版本）、US-S04（业务链）、US-S05（saveEpc 流水线） |
| **主计划** | [docs/本体建模简化架构.plan.md](../../本体建模简化架构.plan.md) |

## User Story

**作为** 业务建模人员，  
**我希望** 在 EPC 步骤上通过八维要素选择器挂接已有要素或内联新建要素，并保存后自动入库与重建索引，  
**以便** 在 EPC 编辑器中完成步骤与八维要素库的权威引用挂接。

## 范围（In Scope）

| 项 | 说明 |
|----|------|
| 纯函数库 | 按维度分组、搜索过滤、`resolveElementLabel`、构建 `elementRef` |
| `ElementSelector` | E1–E8 分组下拉 + 搜索；展示 **name**，持久化 **id** |
| 内联新建 | 选维度 → 输入名称 → `inlineNew` + `inlinePayload` |
| `EpcStepsEditor` | 步骤增删改 + 每步挂接选择器；**保存** 调用 `saveEpc` |
| 集成 | `BusinessChainDetail` 选中 EPC 时展示步骤编辑器 |

## 范围外（Out of Scope）

| 项 | 归属 |
|----|------|
| 八维要素库独立 Tab、未引用筛选 | US-S07 |
| C 工作区引用并集预览 | US-S08 |
| `business-epc-linter`、W-EPC 警示 | US-S09 |
| 模块确认/归档 UI | 后续 US |

## 验收标准

| # | 标准 | 验证 |
|---|------|------|
| AC-1 | 选择器按 E1–E8 分组展示要素 **name** | integration |
| AC-2 | 搜索按 name/nameEn 过滤 | unit + integration |
| AC-3 | 内联新建生成 `elementRef`（`inlineNew` + payload） | unit |
| AC-4 | 选中已有要素写入 `elementId`，无 `inlineNew` | unit |
| AC-5 | EPC 步骤可增删改；保存调用 `saveEpc` 流水线 | integration |
| AC-6 | 保存后内联要素进入 `metaElements` | integration |
| AC-7 | `pnpm lint` / `ts-check` / `test:unit` 绿灯 | CI |
| AC-8 | E2E `@smoke` 覆盖选择器 + 保存 | e2e |

## Unit 拆分

| Unit | 标题 | 产出 | ⑥ E2E |
|------|------|------|-------|
| US-S06-U01 | 要素选择器纯函数 | `lib/element-selector/` | N/A |
| US-S06-U02 | ElementSelector 组件 | `element-selector.tsx` | N/A |
| US-S06-U03 | EpcStepsEditor + 详情集成 | `epc-steps-editor.tsx` + detail | N/A |
| US-S06-U04 | 集成 + E2E smoke | integration + e2e spec | ✅ |

## 确认

- [x] Frank，2026-06-18

## 验证

`pnpm run ci:check` 全绿；unit +6、integration +6、e2e smoke +1