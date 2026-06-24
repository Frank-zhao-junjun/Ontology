# US-S17-U04：EpcValidationPanel 三栏校验 UI

| 字段 | 值 |
|------|-----|
| **Unit ID** | US-S17-U04 |
| **所属 US** | [US-S17](../us/US-S17-cross-consistency.md) |
| **状态** | ✅ 全部完成 — 六步闭环 |
| **预估文件** | `src/components/ontology/epc-validation-panel.tsx`, `tests/unit/epc-validation-panel.spec.tsx`, `tests/e2e/epc-validation-panel.e2e.spec.ts` |

## 1. 目标

在 C 工作区（`scenario-workspace.tsx`）中集成 `EpcValidationPanel` 组件，三栏展示 VE / VM / VX 三类校验结果：

- **VE 栏**（EPC → 模型）：`lintBusinessEpc` 产出 W-EPC-01~17 警告
- **VM 栏**（模型 → EPC）：`getEpcCoverage` 产出覆盖率报告
- **VX 栏**（交叉一致性）：`getCrossConsistency` 产出 VX-01~12 问题列表

## 2. 范围

### In Scope

- `EpcValidationPanel` 组件（三 Tab 切换）
- VE Tab：复用 `WarningCenter` 的 W-EPC 列表展示
- VM Tab：展示 `EpcCoverageReport` 维度覆盖表 + 未覆盖要素清单
- VX Tab：展示 `CrossConsistencyIssue[]` 列表，按严重度分组着色
- 顶部汇总条（总计 errors / warnings / infos / 覆盖率百分比）
- 与 `scenario-workspace.tsx` 集成（已预留 import）
- 空状态：C 未确认或无 EPC 时显示提示
- 单元测试 + E2E smoke

### Out of Scope

- `lintBusinessEpc` / `getEpcCoverage` / `getCrossConsistency` 逻辑修改
- 新建独立路由页面

## 3. 技术设计

### Props

```typescript
export interface EpcValidationPanelProps {
  scenarioId: string;
  onNavigateToElement?: (elementId: string, dimension: MetaDimension) => void;
  onNavigateToChain?: (moduleKind: ModuleKind, moduleId: string) => void;
}
```

### 数据获取（通过 Zustand store）

```typescript
const warnings = useOntologyStore((s) => s.getBusinessEpcWarnings());
const coverage = useOntologyStore((s) => s.getEpcCoverage(scenarioId));
const vxIssues = useOntologyStore((s) => s.getCrossConsistency(scenarioId));
```

### 三 Tab 结构

```
┌──────────────────────────────────────────────┐
│  📊 校验面板              ⚠3 ⚠5 ⓘ2  85%     │
├──────────────────────────────────────────────┤
│  [VE 引用校验 (3)] [VM 覆盖率 (85%)] [VX 交叉 (5)] │
├──────────────────────────────────────────────┤
│                                              │
│  VE Tab:                                     │
│  ┌ W-EPC-01  引用要素未确认        ⚠ 2     ┐│
│  ├ W-EPC-06  名称不一致            ⚠ 1     ┤│
│  └ ...                                      ┘│
│                                              │
│  VM Tab:                                     │
│  ┌ E1 数据模型  ████████░░  80%  2/10      ┐│
│  ├ E2 行为模型  ██████████  100%  5/5      ┤│
│  ├ E3 事件模型  ████░░░░░░  40%  2/5      ┤│
│  └ ...                                      ┘│
│                                              │
│  VX Tab:                                     │
│  ┌ 🔴 VX-02  Event「创建」所属实体不匹配    ┐│
│  ├ 🟡 VX-01  行为要素未绑定状态机           ┤│
│  ├ 🔵 VX-06  角色权限未覆盖实体              ┘│
│  └ ...                                        │
└──────────────────────────────────────────────┘
```

### VE Tab

- 筛选器：按 `EpcWarningRuleId` 过滤
- 每条警告：规则编号 Badge + `message` + 跳转按钮（导航到对应模块）
- 复用一个简化的 `WarningCenter` 内部逻辑（不额外抽象，直接内联渲染循环）
- 空状态：「当前场景下未发现 EPC 引用警告」

### VM Tab

- 复用 `EpcCoverageReport` 数据（US-S16-U03 已有面板，本处只做嵌入展示或延迟到 U04 做统一汇总行）
- 每个维度一行：维度名 + 进度条 + 覆盖率百分比 + covered/total
- 未覆盖清单可展开/折叠
- 空状态：「当前场景下无可计算覆盖率的 EPC」

### VX Tab

- 筛选器：按 `VxRuleId` 过滤
- 分组：按 `severity`（error → warning → info）
- 每条问题：severity Badge（红/黄/蓝）+ 规则编号 + `message` + 受影响元素名
- 空状态：「当前场景下未发现交叉一致性问题」

### 顶部汇总条

- `summary.errors`（红）、`summary.warnings`（黄）、`summary.infos`（蓝）
- `summary.totalCoverage`（覆盖率百分比，灰色）
- 从 `EpcCoverageReport` 和各 issue 列表计算

### 集成点

`scenario-workspace.tsx` 已有 `import { EpcValidationPanel } from '@/components/ontology/epc-validation-panel';`（第 6 行），只需在 JSX 中插入：

```tsx
<EpcValidationPanel scenarioId={scenario.id} />
```

## 4. PRD 验收条款

| # | 验收项 | 验证方式 | 对应 TC |
|---|--------|----------|:--:|
| AC-1 | C 已确认且有警告时，VE Tab 展示 W-EPC 问题列表 | 单元测试 | TC-01 |
| AC-2 | VM Tab 展示八维覆盖率（E1–E8 各一行进度条） | 单元测试 | TC-03 |
| AC-3 | VX Tab 展示交叉一致性问题，按严重度颜色区分 | 单元测试 | TC-04, TC-07 |
| AC-4 | 顶部汇总行显示三项合计数字 + 覆盖率 | 单元测试 | TC-05, TC-06 |
| AC-5 | Tab 切换正常（默认 VE） | 单元测试 | TC-02 |
| AC-6 | C 未确认时，三 Tab 均显示空状态提示 | 单元测试 | TC-08 |
| AC-7 | 无 EPC 子节点时，三 Tab 均显示空状态提示 | 单元测试 | TC-09 |
| AC-8 | 三 Tab 计数器准确反映问题数量 | 单元测试 | TC-05, TC-15 |
| AC-9 | 混合状态：VE 有警告但 VX 为空 → VX Tab 显示空状态 | 单元测试 | TC-13 |
| AC-10 | 混合状态：覆盖率 0%（无 EPC 引用）→ 进度条 0% 不崩溃 | 单元测试 | TC-14 |
| AC-11 | E2E smoke：从业务链导航到 C → 面板可见 + 三 Tab 切换 | E2E | TC-16, TC-17 |
| AC-12 | lint 0 error · ts-check pass | ci:check | — |

## 5. 测试用例（⚠️ TDD：先于编码）

> **Mock 策略**：单元测试直接 mock `useOntologyStore` selector 返回值（`getBusinessEpcWarnings` / `getEpcCoverage` / `getCrossConsistency`），不构造完整 `OntologyProject`。E2E 使用真实 Store 数据。

### 单元测试（`tests/unit/epc-validation-panel.spec.tsx`）

| # | 场景 | 条件 | 预期 |
|---|------|------|------|
| TC-01 | 三 Tab 渲染 | C 已确认 + 有警告/覆盖/VX 数据 | 三个 Tab 按钮可见 |
| TC-02 | VE 默认选中 | 初始渲染 | VE Tab active |
| TC-03 | VM Tab 切换 | 点击 VM Tab | VM 面板内容可见，进度条渲染 |
| TC-04 | VX Tab 切换 | 点击 VX Tab | VX 面板内容可见 |
| TC-05 | 汇总计数 | mock 3 W-EPC + 2 VX（其中 1 error + 1 warning） | 顶部显示 "⚠5" — 三个数字 badge |
| TC-06 | 覆盖率百分比 | mock `getEpcCoverage` 返回 `{ coveragePercent: 50, byDimension: {...} }` | 顶部显示 "50%" |
| TC-07 | VX 严重度着色 | error / warning / info 各 1 | 3 种颜色 Badge（红/黄/蓝） |
| TC-08 | C 未确认空状态 | mock 所有 selector 返回空 | 三 Tab 均显示提示文字 |
| TC-09 | 无 EPC 空状态 | C 已确认但 childEpcs=[] | 三 Tab 均显示提示文字 |
| TC-10 | VE 筛选器 | 选择 W-EPC-06 | 仅显示 ruleId==='W-EPC-06' 的项 |
| TC-11 | VX 筛选器 | 选择 VX-01 | 仅显示 code==='VX-01' 的项 |
| **TC-13** | **VE 有警告 VX 为空** | mock 3 W-EPC 警告 + VX=[] | VE Tab 显示 3 条，VX Tab 显示「未发现交叉一致性问题」 |
| **TC-14** | **覆盖率 0% 不崩溃** | mock coveragePercent=0, coveredElements=0 | 进度条显示 0%，无除零异常 |
| **TC-15** | **Tab Badge 计数器** | mock 3 W-EPC + 2 VX | VE Tab 标签 = "VE 引用校验 (3)"，VX Tab = "VX 交叉 (2)" |

### E2E Smoke（`tests/e2e/epc-validation-panel.e2e.spec.ts`）

| # | 场景 | 预期 |
|---|------|------|
| TC-16 | 业务链 → C → 校验面板可见 | 面板渲染，三 Tab 可见 |
| TC-17 | 三 Tab 实际切换 | 点击 VM/VX Tab → 对应内容渲染，无白屏/报错 |

## 6. 依赖

- **前置 Unit**：U01（纯函数）✅ · U02（测试）✅ · U03（Store）✅
- **相关组件**：`warning-center.tsx`（参考 W-EPC 列表渲染模式）· `epc-coverage-panel.tsx`（参考覆盖率展示模式）
- **阻塞 US**：S18（依赖 S17-U04 完成）

## 7. 六步验证

- [x] ① Unit Spec（本文档）
- [x] ② PRD（§4 验收条款 — 10 项 AC）
- [x] ③ Testing case（§5 — 15 单元 + 2 E2E = 17 cases，先于编码）
- [x] ④ Coding（`epc-validation-panel.tsx` + `scenario-workspace.tsx` 集成）
- [x] ⑤ Unit test（`tests/unit/epc-validation-panel.spec.tsx` 14/14 全绿）
- [x] ⑥ E2E（`tests/e2e/epc-validation.e2e.spec.ts` — smoke pass · TC-16/17 全覆盖）

## 8. 完成证据

```bash
cd D:\AI\Ontology
pnpm lint
pnpm ts-check
npx vitest run tests/unit/epc-validation-panel.spec.tsx

npx vitest run tests/integration/epc-validation-panel.spec.tsx tests/e2e/epc-validation.e2e.spec.ts

```
