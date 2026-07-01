# ADR 技术实现附录：耦合度分析 + 解耦方案 + 工作量估算

> 补充 [ADR：Agent 接口选择 — MCP Server vs CLI](./adr-agent-interface-cli-vs-mcp.md) 的第 1 节（耦合度分析）和 Phase 1 的具体执行计划。
> 日期: 2026-06-30 | 作者: 技术分析子任务

---

## 1. 当前代码耦合度全景

### 1.1 文件级耦合矩阵

发现1：`chat-actions.ts` 不存在。问题描述中提到的 chat-actions.ts 在代码库中不存在。Copilot 的动作执行逻辑（~120行 executeAction switch 语句）直接嵌入在 modeling-copilot-panel.tsx 的 React 组件中。每种 action 类型直接调用 useOntologyStore.getState() 的 store 方法。

发现2：Store 是 React 状态的巨无霸。ontology-store.ts 是一个 4553 行的单文件，同时承担了三重角色：类型定义（OntologyState 接口, 417行）、辅助验证函数（~430行）、zustand store 实现（~3700行）。这些 action 实现里，每个 set() 调用都是通过 (state) => ({ project: { ...state.project, ... } }) 模式做不可变更新。这种模式可以直接提取为 OntologyProject → OntologyProject 的纯函数，提取成本极低。

发现3：60% 的逻辑已可复用。校验器、compiler、覆盖率分析、模块版本管理、Excel 导入导出等核心逻辑已经设计为参数化纯函数——它们直接接受 OntologyProject（或子集）作为输入，返回计算结果，完全不依赖 zustand。

发现4：已有 MCP 设计文档。docs/mcp-agent-ontology-interaction.md 已定义了 11 类场景、9+ Tool 草案和 4 层能力分层。

### 1.2 关键文件状态

| 文件 | 行数 | 角色 | 可复用性 |
|------|------|------|----------|
| src/store/ontology-store.ts | 4553 | 单例 store（接口+辅助函数+实现） | 全部耦合 |
| src/types/ontology.ts | 2027 | 纯 TS 类型定义 | 完全可复用 |
| src/components/ontology/copilot/modeling-copilot-panel.tsx | 860 | Copilot UI + 内联动作执行器 | 强耦合 |
| src/lib/manifest-compiler/*.ts (11 files) | ~500 | OntologyProject → OntologyManifest | 纯函数，可复用 |
| src/lib/manifest-validator/rules.ts | 370 | V01-V11 校验 | 纯函数，可复用 |
| src/lib/manifest-export.ts | 76 | 编译+校验+序列化 | 纯函数，可复用 |
| src/lib/business-epc-linter/index.ts | 303 | W-EPC lint | 纯函数，可复用 |
| src/lib/epc-cross-consistency/index.ts | 855 | VX 交叉一致性 | 纯函数，可复用 |
| src/lib/epc-coverage/index.ts | 106 | 覆盖率计算 | 纯函数，可复用 |
| src/lib/excel/export-excel.ts | 243 | Excel 导出 | 纯函数，可复用 |
| src/lib/excel/import-excel.ts | 295 | Excel 导入解析 | 纯函数，可复用 |
| src/lib/module-version/index.ts | ~200 | 模块版本 CRUD | 纯函数，可复用 |
| src/lib/epc-pipeline/save-epc.ts | ~150 | EPC 保存流水线 | 纯函数，可复用 |

---

## 2. 前置条件：无头内核 @ontology/core 提取方案

### 2.1 业务链 CRUD 纯函数提取（12个函数）

当前 store 中的实现模式（以 addValueDomain 为例）：

```
addValueDomain: (input) => {
  const fields = normalizeBusinessChainNodeInput(input);
  const node = { id: generateId(), ...fields };
  set((state) => {
    if (!state.project) throw new Error('...');
    const valueDomains = [...(state.project.valueDomains ?? []), node];
    const records = saveModuleDraftRecord(state.project.moduleVersionRecords ?? [], {...});
    return { project: { ...state.project, valueDomains, moduleVersionRecords: records, updatedAt: ... } };
  });
  return node;
}
```

提取为纯函数：

```
export function addValueDomain(project, input) => {
  // 移除 set/get 闭包，直接返回 { project, node }
}
```

需提取的全部业务链 CRUD 函数：

| Store 方法 | 提取为 |
|-----------|--------|
| addValueDomain(input) | (project, input) => {project, node} |
| updateValueDomain(id, updates) | (project, id, updates) => project |
| deleteValueDomain(id) | (project, id) => project |
| addCapability(parentAId, input) | (project, parentAId, input) => {project, node} |
| updateCapability(id, updates) | (project, id, updates) => project |
| deleteCapability(id) | (project, id) => project |
| addScenario(parentBId, input) | (project, parentBId, input) => {project, node} |
| updateScenario(id, updates) | (project, id, updates) => project |
| deleteScenario(id) | (project, id) => project |
| addEpcProcess(parentCId, input) | (project, parentCId, input) => {project, node} |
| updateEpcProcess(id, updates) | (project, id, updates) => project |
| deleteEpcProcess(id) | (project, id) => project |

### 2.2 Store Query 薄封装提取（6个函数）

当前 store 中的模式（以 getBusinessEpcWarnings 为例）：

```
getBusinessEpcWarnings: () => {
  const { project } = get();
  if (!project) return [];
  return lintBusinessEpc({
    records: project.moduleVersionRecords ?? [],
    epcProcesses: project.epcProcesses ?? [],
    metaElements: project.metaElements ?? [],
    capabilities: project.capabilities ?? [],
    valueDomains: project.valueDomains ?? [],
  });
}
```

提取为：

```
export function getBusinessEpcWarnings(project): EpcWarning[] {
  if (!project) return [];
  return lintBusinessEpc({ ... });
}
```

6 个需提取的 Query：

| Store 方法 | 调用的 lib 函数 | 提取后 |
|-----------|----------------|--------|
| getBusinessEpcWarnings() | lintBusinessEpc() | getBusinessEpcWarnings(project) |
| getEpcCoverage(scenarioId) | computeCoverage() | getEpcCoverage(project, scenarioId) |
| getCrossConsistency(scenarioId) | validateCrossConsistency() | getCrossConsistency(project, scenarioId) |
| getUnreferencedElements() | filterUnreferencedElements() | getUnreferencedElements(project) |
| getSemanticCoverage() | - | getSemanticCoverage(project) |
| deriveEpcStepsFromScenario(scenarioId) | deriveEpcSteps() | deriveEpcStepsFromScenario(project, scenarioId) |

### 2.3 Copilot 动作执行器提取

当前：modeling-copilot-panel.tsx 中 ~120 行 switch 语句，每个 case 直接调 store.addValueDomain() 等。

提取后：src/lib/ontology-core/action-executor.ts，提供 executeActions(project, actions) => ActionResult[]。每个 ActionResult 携带新的 project 状态，支持链式调用。

同时修改 modeling-copilot-panel.tsx 导入 action-executor 替代内联 switch。

---

## 3. MCP Server 详细实现方案

### 3.1 架构概览

Agent Runtime (Claude/Cursor/Cline) → MCP stdio → ontology-mcp → @ontology/core 纯函数 → project-store (in-memory + JSON file)

### 3.2 Tool 清单（MVP 8个）

| Tool | 描述 | 返回 |
|------|------|------|
| ontology_project_create | 创建项目 | { projectId, name } |
| ontology_project_load | 加载项目 | OntologyProject |
| ontology_business_chain_add | 添加 A/B/C/EPC 节点 | { node, projectId } |
| ontology_business_chain_update | 更新节点 | { node, projectId } |
| ontology_manifest_compile | 编译 Manifest | OntologyManifest |
| ontology_manifest_validate | 校验 Manifest | ManifestValidationResult |
| ontology_lint_epc | EPC lint | EpcWarning[] |
| ontology_coverage_report | 覆盖率报告 | EpcCoverageReport |

### 3.3 Resource 清单（MVP 4个）

| URI | 用途 |
|-----|------|
| ontology://project/{id}/state | Agent 读项目状态 |
| ontology://project/{id}/manifest | Agent 获取 Manifest |
| ontology://project/{id}/coverage/{scenarioId} | 覆盖率查询 |
| ontology://project/{id}/consistency/{scenarioId} | 一致性查询 |

### 3.4 Prompt 清单（MVP 2个）

| Prompt | 用途 |
|--------|------|
| modeling_copilot | COPILOT_SYSTEM_PROMPT + 项目上下文 |
| validator_expert | 校验专家 prompt |

---

## 4. 详细文件操作清单

### 4.1 Phase 1a：无头内核 @ontology/core（6-8 人天）

新增:
- src/lib/ontology-core/index.ts (barrel export)
- src/lib/ontology-core/project.ts (create/load/save/validate project)
- src/lib/ontology-core/business-chain.ts (add/update/delete A/B/C/EPC)
- src/lib/ontology-core/queries.ts (warnings/coverage/consistency 查询)
- src/lib/ontology-core/action-executor.ts (executeActions + buildProjectContext)

修改:
- src/store/ontology-store.ts (注入纯函数)
- src/components/ontology/copilot/modeling-copilot-panel.tsx (导入 action-executor)

关键原则：提取不改变类型定义，不改变已有 lib 纯函数，Store 适配器与提取同 PR。

### 4.2 Phase 1b：MCP Server（8.5 人天）

新增 packages/ontology-mcp/:
- package.json, tsconfig.json
- src/index.ts, src/server.ts (MCP 服务器入口 + 注册)
- src/tools/project.ts, business-chain.ts, manifest.ts, lint.ts, coverage.ts
- src/resources/project.ts, manifest.ts, coverage.ts, consistency.ts
- src/prompts/modeling-prompt.ts, validator-prompt.ts
- src/store/project-store.ts, types.ts
- src/utils/schema.ts
- tests/tools.test.ts, resources.test.ts

修改 pnpm-workspace.yaml (新增 ontology-mcp package)

### 4.3 Phase 3（可选）：CLI（3-4 人天）

新增 packages/ontology-cli/:
- package.json (commander + tsup)
- src/index.ts + 7 个 commands (project/business-chain/manifest/excel/lint/coverage/version)
- src/utils/project-io.ts, output.ts

修改 pnpm-workspace.yaml

---

## 5. 工作量汇总

| Phase | 内容 | 人天 | 风险 |
|-------|------|------|------|
| 1a | 无头内核 @ontology/core | 6-8 | 中：ci:check 全绿 |
| G1 | 业务链 CRUD 纯函数 | 3-4 | 低 |
| G2 | Store Query 薄封装 | 1-2 | 低 |
| G3 | 动作执行器提取 | 1 | 中：UI 上下文依赖 |
| G4 | Store 适配器注入 | 0.5 | 低 |
| 1b | MCP Server | 8.5 | 中：project-store 设计 |
| Tools (8个) | 3 | 低 |
| Resources (4个) | 1 | 低 |
| Prompts (2个) | 0.5 | 低 |
| project-store | 1.5 | 中 |
| 测试 + Agent 配置 | 2 | 低 |
| Phase 1 合计 | 14-16 | |
| Phase 3: CLI | 3-4 | 低 |

---

## 6. 技术风险与缓解

| 风险 | 级别 | 缓解 |
|------|------|------|
| Store 解耦破坏现有 UI | 🔴 | G4 与 G1-G3 同 PR，运行 ci:check + test:phase:all |
| localStorage 存量数据丢失 | 🟡 | Phase 1 MCP 独立于浏览器，Phase 2 打通同步 |
| MCP SDK 版本不兼容 | 🟢 | 锁定 ^1.0.0 |
| 大 project 序列化开销 | 🟢 | 惰性加载 + 分片 |
| ci:check tsconfig paths 失败 | 🟡 | 使用 workspace protocol + tsup |
| action-executor 测试覆盖 | 🟡 | 新增纯函数测试 |

---

## 7. Store 方法映射表

| Store 方法分组 | 去向 | 人天 | 优先级 |
|---------------|------|------|--------|
| 业务链 CRUD (12个) | business-chain.ts | 1+1+0.5 | P0 |
| 项目 CRUD (3个) | project.ts | 0.5 | P0 |
| Query 封装 (6个) | queries.ts | 0.5 | P0 |
| Copilot 动作 (1个) | action-executor.ts | 1 | P0 |
| 模块版本 (4个) | version.ts | 0.5 | P1 |
| Entity/StateMachine/Rule/Event 等 | models.ts | 1 | P2 |
| Metadata/MasterData/Department 等 | models.ts | 1 | P2 |
| UI 状态 (setActiveModelType 等) | 留在 store | 0 | - |

---

**结论：建议从 Phase 1a（无头内核，6-8 人天）开始，然后 Phase 1b（MCP Server，8.5 人天）。CLI（Phase 3, 3-4 人天）作为 CI/CD 场景的可选项放在后续。**
