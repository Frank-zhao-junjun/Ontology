# US-S14：模块确认/归档 UI

| 字段 | 值 |
|------|-----|
| **ID** | US-S14 |
| **Phase** | 1.5（Phase 1 遗留项补齐） |
| **优先级** | P1 |
| **状态** | ✅ 已完成（2026-06-18） |
| **依赖** | US-S03（store API）、US-S04（树导航 + 详情面板）、US-P01（archived 徽章） |
| **主计划** | [本体建模简化架构.plan.md](../../本体建模简化架构.plan.md) |
| **ADR** | [adr-simplified-ontology-model.md](../../adr-simplified-ontology-model.md) |
| **遗留来源** | [PHASE1-LEFTOVER-ISSUES.md L1](../../../ontology-platform/docs/PHASE1-LEFTOVER-ISSUES.md) |

## User Story

**作为** 业务建模人员，  
**我希望** 在业务链树节点详情面板上对每个 draft 模块点击「确认」按钮，查看版本历史与 archived 列表，并能对已确认节点触发"编辑（fork 新 draft）"，  
**以便** 我的草稿可被冻结为跨模块引用的目标，让其他模块通过 `latest_confirmed` 引用到稳定的版本。

## 背景与动机

- US-S03（已完成）交付了 store API：`saveModuleDraft` / `forkModuleToDraft` / `confirmModule` / `getModuleVersions` / `resolveModuleRef`。
- US-S04（已完成）交付了树导航，但详情面板**只读**展示版本状态，无操作按钮。
- US-P01（已完成）交付了 `ModuleStatusBadge`（draft/confirmed/archived 徽章）。
- **缺口**：用户当前能改 draft，但**无法**把 draft 冻结为 confirmed，也无法查看/对比历史版本。
- ADR：draft 仅本模块内编辑；confirmed 可被跨模块引用；archived 保留供历史 pin。

## 范围（In Scope）

### 1. 详情面板操作按钮（按节点状态）

| 当前状态 | 可见按钮 | 行为 |
|----------|----------|------|
| draft | 「确认」「取消编辑」 | 确认 → 写 confirmed v(N+1)；取消 → 清空 draft |
| confirmed（无 draft） | 「编辑」 | fork 新 draft |
| confirmed（有 draft） | 「编辑」「取消编辑」「确认」 | 同上；新 draft 覆盖正在编辑 |
| archived（无 confirmed） | 「查看」只读 | 仅展示 vN 详情 |
| 任何 | 「查看历史」 | 打开版本历史列表 |

### 2. 版本历史侧栏

- 列表 `getModuleVersions(kind, id)`：每行 `vN · status · createdAt`；当前 confirmed 标星
- 行操作：archived 行可点 "查看" 还原详情（只读）
- **不实现** diff 视图（仅列出元数据，避免 UI 复杂）

### 3. 确认流业务规则

- 节点**必须有 draft** 才允许确认（无 draft 按钮禁用 + tooltip 解释）
- 确认前**必须通过基础校验**：
  - A/B/C：name 非空
  - EPC：name 非空 + `parentId` ∈ scenarios
  - E1–E8：name 非空 + `dimension` 在八维内
- 校验失败 → 红色 toast + 字段级错误高亮；不写 confirmed
- 确认后弹窗展示：旧 confirmed → archived；新 → v(N+1) confirmed

### 4. 跨模块引用提示

- 节点详情面板底部：列出**引用本节点**的模块（基于 `usageRefs` 反查，US-S05 已建）
- 列出**本节点引用**的模块（递归 1 层）
- 仅展示，不阻断操作

## 范围外（Out of Scope）

| 项 | 归属 |
|----|------|
| 跨模块 `resolveModuleRef` 写入 UI（`{ version: 'v2' }` 选择器） | 后续 US（已识别遗留 L4） |
| EPC 步骤编辑、要素选择器 | US-S06/US-S08（已完成） |
| 复杂 diff 视图 | 后续 US |
| 多人并发锁 | 已识别遗留 L7 |
| 撤销/回滚（自动 fork） | 后续 US |

## 验收标准

| # | 标准 | 验证方式 |
|---|------|----------|
| AC-1 | draft 节点详情面板显示「确认」「取消编辑」两个按钮 | 组件测试 + E2E |
| AC-2 | confirmed（无 draft）显示「编辑」按钮，点击后产生新 draft | 组件测试 + E2E |
| AC-3 | 点击「确认」调用 `confirmModule`；新生成 v(N+1)，旧 confirmed 变 archived | 单元测试 |
| AC-4 | 校验失败（无 draft / name 为空）按钮禁用 + tooltip | 组件测试 |
| AC-5 | 「查看历史」侧栏列出全部 `getModuleVersions` 结果 | 组件测试 + E2E |
| AC-6 | 详情面板底部展示引用本节点 / 本节点引用的模块列表 | 组件测试 |
| AC-7 | `pnpm lint` / `ts-check` 0 error；`test:unit` / `test:integration` 全绿 | CI |
| AC-8 | E2E `@smoke`：用户可从 draft A 节点确认 → 详情面板刷新为 confirmed v1 | E2E |
| AC-9 | 不破坏 US-S04/S05/S06/S07/S08 功能 | 回归 |

## 建议 Unit 拆分（六步执行）

| Unit | 标题 | 主要产出 | ⑥ E2E |
|------|------|----------|-------|
| US-S14-U01 | 确认流纯函数（前置校验 + 提交流） | `lib/module-version/confirm-flow.ts` | N/A |
| US-S14-U02 | 详情面板操作按钮组件 | `module-detail-actions.tsx` | N/A |
| US-S14-U03 | 版本历史侧栏组件 | `version-history-panel.tsx` | N/A |
| US-S14-U04 | 工作台集成 + 引用列表 + E2E | `business-chain-detail` 接入 + e2e | ✅ |

```
依赖：U01 → U02/U03 → U04（U02/U03 可并行）
```

## 技术要点

### 纯函数：`lib/module-version/confirm-flow.ts`

```typescript
// 确认前置校验；返回 errors[] 用于 UI 高亮
function validateConfirm(moduleKind, draft, project): ValidationError[];

// 提交流；返回新版模块版本列表
function runConfirmFlow(
  moduleKind, moduleId, project
): { project, confirmed, archived };
```

校验维度：

| 模块 | 必填字段 | 关联校验 |
|------|----------|----------|
| A | name | — |
| B | name, parentId | parentId ∈ valueDomains |
| C | name, parentId | parentId ∈ capabilities |
| EPC | name, parentId | parentId ∈ scenarios |
| E1–E8 | name, dimension | dimension ∈ 8 维 |

### 组件契约

- `<ModuleDetailActions />` 接收 `node: BusinessChainNode` + 状态查询接口
- `<VersionHistoryPanel />` 接收 `kind, id` + 触发关闭回调
- data-testid：`module-action-confirm` / `module-action-fork` / `module-action-cancel` / `version-history-row-v{N}`

## 风险与假设

| 风险 | 缓解 |
|------|------|
| 详情面板已经塞满操作按钮 | 「确认」按钮放入「更多」下拉；初次 commit 后再优化 |
| 校验规则与 US-S05 saveEpc 重叠 | U01 复用 US-S05 校验函数，避免重复 |
| 引用反查慢 | 当前 ≤ 200 EPC，1 层反查 < 50ms，不做缓存 |
| 用户误操作 | 「确认」需二次确认弹窗（vN → v(N+1) 不可逆） |

## 六步执行计划（用户确认后）

1. 创建 Unit Spec（`units/US-S14-U01-spec.md` ~ `US-S14-U04-spec.md`）
2. PRD 验收条款细化
3. **Testing case**（先于 Coding）：`tests/unit/confirm-flow.spec.ts` + `tests/integration/module-detail-actions.spec.tsx` + `tests/integration/version-history-panel.spec.tsx`
4. Coding
5. Unit test 绿灯
6. E2E `@smoke`：从 draft A 确认 → 详情面板刷新为 confirmed v1

## 确认

请确认范围、验收标准与 Unit 拆分。确认后状态改为 **已确认**，按六步流水线自动推进。

- [x] 产品/架构负责人确认本 US 范围与验收标准
- [x] 确认 `confirm` 前置校验仅基础字段，不含完整 E4/E7 语义（属 US-S09 linter）
- [x] 确认范围**不含**复杂 diff 视图、并发锁、`{ version: 'vN' }` 选择器

确认人：Frank 日期：2026-06-18

---

**下一步**：用户确认本文档后，按 Unit 依赖顺序（U01 → U02/U03 → U04）执行六步流水线。