# US-S07：要素库未引用视图

| 字段 | 值 |
|------|-----|
| **ID** | US-S07 |
| **Phase** | 2 |
| **优先级** | P1 |
| **状态** | ✅ **已确认**（2026-06-18）→ **已完成** |
| **依赖** | US-S02、US-S05（usageRefs）、US-S06（要素入库） |
| **主计划** | [docs/本体建模简化架构.plan.md](../../本体建模简化架构.plan.md) |

## User Story

**作为** 业务建模人员，  
**我希望** 在要素库中按 E1–E8 浏览项目要素，并筛选「未引用」要素、查看引用次数与来源，  
**以便** 发现孤儿要素（W-EPC-02）并决定挂接或清理。

## 范围（In Scope）

| 项 | 说明 |
|----|------|
| 纯函数 | `isUnreferencedElement`、`filterUnreferencedElements`、按维度过滤 |
| Store | `getUnreferencedElements()` |
| `ElementLibrary` | E1–E8 Tab；列表展示 name、引用次数；**仅显示未引用** 开关 |
| 引用来源 | 只读展示 `usageRefs`（EPC/步骤） |
| 工作台 | 顶栏 **要素库** Tab |

## 范围外

| 项 | 归属 |
|----|------|
| 要素 CRUD / 确认按钮 | 后续 US |
| C 工作区引用并集 | US-S08 |
| W-EPC linter 警示中心 | US-S09 |

## 验收标准

| # | 标准 | 验证 |
|---|------|------|
| AC-1 | `usageRefs` 为空视为未引用 | unit |
| AC-2 | 筛选开关仅显示未引用要素 | integration |
| AC-3 | 按 E1–E8 Tab 过滤 | integration |
| AC-4 | 列表展示引用次数；可展开引用来源 | integration |
| AC-5 | Store `getUnreferencedElements` 与 lib 一致 | unit |
| AC-6 | `ci:check` 绿灯 | CI |
| AC-7 | E2E `@smoke` 未引用筛选 | e2e |

## Unit 拆分

| Unit | 标题 | ⑥ E2E |
|------|------|-------|
| U01 | 未引用纯函数 | N/A |
| U02 | Store API | N/A |
| U03 | ElementLibrary 组件 | N/A |
| U04 | 工作台集成 + smoke | ✅ |

## 确认

- [x] Frank，2026-06-18

## 验证

`pnpm run ci:check` 全绿；unit +5、integration +3、e2e smoke +1