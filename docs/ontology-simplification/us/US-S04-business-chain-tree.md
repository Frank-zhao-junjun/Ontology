# US-S04：A/B/C/EPC 业务链树导航

| 字段 | 值 |
|------|-----|
| **ID** | US-S04 |
| **Phase** | 1 |
| **优先级** | P0 |
| **状态** | ✅ **已完成**（2026-06-18） |
| **依赖** | US-S02（A/B/C/EPC 类型）、US-S03（模块版本 store） |
| **主计划** | [docs/本体建模简化架构.plan.md](../../本体建模简化架构.plan.md) |
| **ADR** | [docs/adr-simplified-ontology-model.md](../../adr-simplified-ontology-model.md) |

## User Story

**作为** 业务建模人员，  
**我希望** 在建模工作台左侧看到 **A→B→C→EPC** 严格父子树，并能选中节点、查看路径（如 `生产域/计划能力/排产场景/主排产流程`），  
**以便** 按业务链组织建模对象，并为后续 EPC 编辑与八维要素挂接提供导航上下文。

## 背景与动机

- 现状工作台以「实体项目 + BusinessScenario」组织实体，与 ADR 的 **ValueDomain → Capability → Scenario → EpcProcess** 业务链不一致。
- US-S02 已定义类型并挂载到 `OntologyProject`；US-S03 已具备模块版本读写能力。
- 本 US **仅交付树导航与基础 CRUD**，不实现 EPC 步骤编辑、要素选择器、`saveEpc` 流水线（分属 US-S05 / Phase 2）。

## 范围（In Scope）

### 数据与规则

- 读写 `project.valueDomains`、`capabilities`、`scenarios`、`epcProcesses`（空数组默认 `[]`）
- 父子约束：`B.parentId → A.id`，`C.parentId → B.id`，`EPC.parentId → C.id`
- **标识**：`id` 创建后不可变；`name` 可编辑；树与面包屑 **展示 name**，存储与选中态用 **id**
- 显示路径：由祖先 **name** 拼接（`A名/B名/C名/EPC名`），id 变化时路径字符串随 name 更新
- 节点创建时调用 `saveModuleDraft`（US-S03）写入对应 `ModuleKind` 的 draft 快照
- 树节点旁展示模块状态徽章：`draft` / `confirmed` / `archived`（`resolveBusinessChainModuleStatus`；US-P01）

### UI

- 新组件：可展开/折叠的业务链树（A 为根，逐层展开 B/C/EPC）
- 操作：选中节点；在 A 下新建 B、B 下新建 C、C 下新建 EPC；编辑当前节点 `name`/`description`（简表单项）；删除叶子或空子树节点（有子节点时禁止删或需确认——见 AC）
- 集成：在 `modeling-workspace` 增加顶层入口 **「业务链」**（与「实体建模」等并列），选中节点时右侧显示占位详情区（名称、描述、路径、版本状态；**不含** EPC 步骤列表编辑）

### 库函数（可测）

- 从 `OntologyProject` 构建树结构、校验 `parentId` 引用完整性、生成显示路径、按 id 查找节点

## 范围外（Out of Scope）

| 项 | 归属 |
|----|------|
| `saveEpc` 流水线、`rebuildUsageIndex` | US-S05 |
| EPC 步骤编辑器、八维要素选择器、内联新建要素 | Phase 2（US-S06~S08） |
| 要素库 E1–E8 独立入口、未引用筛选 | Phase 2 |
| 模块 **确认/归档** 按钮与版本 pin UI | 可本 US 只读展示；确认操作可延后至 US-S05 或单独 US |
| 删除旧 `BusinessScenario` / 实体侧栏 | Phase 4 |
| Excel 导入占位 A/B/C | Phase 3 |
| `business-epc-linter`、警示中心 | Phase 3 |

## 验收标准

| # | 标准 | 验证方式 |
|---|------|----------|
| AC-1 | 项目无数据时树为空，可创建首个 A | E2E @smoke + 手动 | [x] |
| AC-2 | 严格四级：A 下仅 B，B 下仅 C，C 下仅 EPC；非法 `parentId` 在 lib 层拒绝或过滤 | 单元测试 | [x] |
| AC-3 | 选中节点后面包屑/路径展示为 **name** 链，内部状态为 **id** | 单元测试 + E2E | [x] |
| AC-4 | 新建/更新节点后 `saveModuleDraft` 被调用，对应 `moduleVersionRecords` 含 draft | 单元测试 | [x] |
| AC-5 | 树节点显示 draft/confirmed/**archived** 状态（见 US-P01） | 组件测试 | [x] |
| AC-6 | 删除有子节点的 A/B/C 被阻止；删除无子 EPC 或空 C 允许 | 单元测试 | [x] |
| AC-7 | `pnpm lint` / `ts-check` / `test:unit` 绿灯；本 US 相关 E2E `@smoke` 通过 | CI | [x] |
| AC-8 | 不破坏现有实体建模、EPC Tab（旧）等功能 | 回归 | [x] |

## 建议 Unit 拆分（US 确认后按六步执行）

> 每 Unit：**① Spec → ② PRD → ③ Tests（先于 Code）→ ④ Code → ⑤ Unit 绿灯 → ⑥ E2E 或 N/A**

| Unit | 标题 | 主要产出 | ⑥ E2E |
|------|------|----------|-------|
| US-S04-U01 | 业务链树纯函数库 | [`US-S04-U01-spec.md`](../units/US-S04-U01-spec.md) | ✅ |
| US-S04-U02 | Store CRUD + draft 挂钩 | [`US-S04-U02-spec.md`](../units/US-S04-U02-spec.md) | ✅ |
| US-S04-U03 | 树导航 UI 组件 | [`US-S04-U03-spec.md`](../units/US-S04-U03-spec.md) | ✅ |
| US-S04-U04 | 工作台集成 + E2E | [`US-S04-U04-spec.md`](../units/US-S04-U04-spec.md) | ✅ |

## 流水线合规

四 Unit §7 六步均已 `[x]`；U04 E2E `@smoke` 通过。

## 技术要点（已实现）

### Store API

```typescript
// 选定节点（工作台级状态）
selectedBusinessChainNode: { kind: 'A'|'B'|'C'|'EPC'; id: string } | null

addValueDomain / updateValueDomain / deleteValueDomain
addCapability(parentAId, ...) / updateCapability / deleteCapability
addScenario(parentBId, ...) / updateScenario / deleteScenario
addEpcProcess(parentCId, ...) / updateEpcProcess / deleteEpcProcess
getBusinessChainModuleStatus(moduleKind, moduleId): ModuleStatus | 'none'
```

### 树节点 data-testid 约定（E2E）

- `business-chain-node-A-{id}`
- `business-chain-node-B-{id}`
- `business-chain-node-C-{id}`
- `business-chain-node-EPC-{id}`
- `business-chain-path`（面包屑容器）

### 与旧模型共存

- Phase 1 **双写**：不删除 `dataModel.businessScenarios`；新业务链数据仅存 `valueDomains` 等扩展字段。
- 「实体建模」Tab 行为不变；「业务链」为增量入口。

## 风险与假设

| 风险 | 缓解 |
|------|------|
| 工作台侧栏过挤 | 「业务链」独立 Tab，非替换实体侧栏 |
| 确认流 UI 缺失 | 本 US 只读展示版本状态；`confirmModule` UI 后续补齐 |
| EPC 空 `steps` | 新建 EPC 默认 `steps: []`，步骤编辑属 Phase 2 |

**假设**：用户接受「业务链」为新建模入口，旧场景数据迁移留 Phase 4。

## 六步执行计划（US 确认后）

| 阶段 | 动作 |
|------|------|
| **US** | 用户确认本文档（下方勾选） |
| **U01** | 创建 `US-S04-U01-spec.md` → AC → **先** `business-chain-tree.spec.ts` → `tree.ts` → 绿灯 → E2E N/A |
| **U02** | 同上流程 → store API |
| **U03** | 同上流程 → UI 组件 |
| **U04** | 同上流程 → workspace 集成 → `@smoke` E2E |
| **US 完成** | 四 Unit §7 全 `[x]` 后标 US-S04 已完成 |

## 确认

请确认范围、验收标准与 Unit 拆分。确认后状态改为 **已确认**，按六步流水线自动推进（无需逐步请示）。

- [x] 产品/架构负责人确认本 US 范围与验收标准
- [x] 确认工作台入口为 **「业务链」新 Tab**（非替换实体建模）
- [x] 确认本 US **不含** EPC 步骤编辑与要素选择器（属 Phase 2）
- [x] 确认模块「确认/归档」操作可延后，本 US 仅只读展示版本状态

确认人：Frank 日期：2026-06-18

---

**状态更新**：✅ **已确认**（2026-06-18）

下一步：按 Unit 依赖顺序（U01 → U02 → U03 → U04）自动执行六步流水线：
1. 创建 Unit Spec（使用 `_UNIT_SPEC_TEMPLATE.md`）
2. PRD 验收条款细化
3. **Testing case**（先于 Coding 定义测试用例）
4. Coding 实现
5. Unit test 绿灯
6. E2E testing（U04 必须）
