# P0 Manifest 对齐任务清单

> **Canonical 副本**：本文件位于 Git 仓库 `repo-main/docs/`。工作区 `Ontology/docs/` 同名文件请与此保持同步。

**依据**：[修改建议3.md](../../修改建议3.md) · [ontology-manifest-spec.md](../../../本体建模/docs/shared/ontology-manifest-spec.md)  
**实施顺序**：validator → compiler → **前端纯本地导出（US-D03）** → API（可选 P1）  
**代码仓库**：本目录上一级即 `repo-main` 根

---

## 实施顺序总览

| 阶段 | 范围 | 任务 ID |
|------|------|---------|
| 1 | Validator（V01–V11） | P0-01 ~ P0-03 |
| 2 | Compiler（OntologyProject → Manifest） | P0-04 ~ P0-08 |
| 3 | 前端 US-D03（纯浏览器 compile + validate + 下载） | P0-13 ~ P0-16 |
| 4 | API（**可选 / P1**） | P0-09 ~ P0-12 |

---

## 阶段 1：Validator

### P0-01 — manifest-validator 脚手架与类型 **【首个 PR】**

| 项 | 内容 |
|----|------|
| **标题** | feat(manifest): add OntologyManifest validator (V01-V11) |
| **描述** | 新增 `src/lib/manifest-validator`，类型对齐 `ontology-manifest-spec`；实现 V01–V11；golden 测试使用 `manufacturing-manifest.yaml`。 |
| **验收标准** | ① `validateManifest()` 返回 `{ valid, errors, warnings }`；② 制造样例零 error；③ 至少 2 个非法 fixture 触发预期规则；④ `pnpm test:unit` 含 `manifest-validator.spec.ts` 通过。 |
| **涉及文件** | `src/lib/manifest-validator/*`、`tests/fixtures/*.yaml`、`tests/unit/manifest-validator.spec.ts` |
| **依赖** | 无 |
| **估算** | M |
| **PR** | [#18](https://github.com/Frank-zhao-junjun/Ontology/pull/18) · `feat/p0-manifest-validator` → `main`（**已合并**） |

**GitHub Issue 模板（可复制）**

```bash
gh issue create --title "P0-01: manifest-validator V01-V11" --body "$(cat <<'EOF'
## 描述
新增 OntologyManifest 校验库，与 ontology-manifest-spec §8 对齐。

## 验收标准
- [ ] validateManifest 覆盖 V01-V11
- [ ] manufacturing-manifest.yaml 零 error
- [ ] 非法 fixture 覆盖 V03/V04/V10 等
- [ ] 单元测试纳入 CI

## 文件
- src/lib/manifest-validator/*
- tests/fixtures/
- tests/unit/manifest-validator.spec.ts
EOF
)"
```

---

### P0-02 — 校验 API 端点

| 项 | 内容 |
|----|------|
| **标题** | feat(api): POST /api/manifest/validate |
| **描述** | 接收 YAML/JSON body，解析后调用 `validateManifest`，返回 US-A01 AC-4 风格错误列表。 |
| **验收标准** | ① POST 合法/非法样例返回预期 `valid`；② 错误含 `code`、`elementType`、`id`、`field`；③ 集成测试覆盖。 |
| **涉及文件** | `src/app/api/manifest/validate/route.ts`、`tests/integration/api-manifest-validate.spec.ts` |
| **依赖** | P0-01 |
| **估算** | S |

```bash
gh issue create --title "P0-02: POST /api/manifest/validate" --body "依赖 P0-01。见 docs/P0-manifest-alignment-tasks.md"
```

---

### P0-03 — CI 纳入 manifest 校验

| 项 | 内容 |
|----|------|
| **标题** | ci: run manifest-validator on golden fixture |
| **描述** | `ci:check` 或单独 job：编译/加载 golden YAML，validator 零 error 才通过。 |
| **验收标准** | PR 门禁失败时能定位到 V 规则编号。 |
| **涉及文件** | `package.json`、`tests/unit/manifest-validator.spec.ts` |
| **依赖** | P0-01 |
| **估算** | S |

---

## 阶段 2：Compiler

> **P0-02（修改建议3 实施顺序）**：`feat/p0-manifest-compiler` 单 PR 交付 P0-04～P0-08 编译器主体（`src/lib/manifest-compiler/`），导出前可 `compileManifest` + `validateManifest`。

### P0-04 — manifest-compiler 脚手架与 metadata **【done @ feat/p0-manifest-compiler】**

| 项 | 内容 |
|----|------|
| **标题** | feat(manifest): compiler scaffold + metadata segment |
| **描述** | `src/lib/manifest-compiler/`：`OntologyProject` → 顶层 `apiVersion/kind/metadata`；`source: ontology-designer`，`compiledAt` ISO8601。 |
| **验收标准** | 单元测试断言 metadata 字段与项目/domain 映射。 |
| **涉及文件** | `src/lib/manifest-compiler/*`、`tests/unit/manifest-compiler.spec.ts`、`tests/fixtures/manifest-compile-project.json` |
| **依赖** | P0-01 |
| **估算** | M |
| **PR** | [#19](https://github.com/Frank-zhao-junjun/Ontology/pull/19) · `feat/p0-manifest-compiler` → `main`（rebase 后 diff 不含 #18） |

---

### P0-05 — 语义层映射 objectTypes / relations / scenarios **【done @ #19】**

| 项 | 内容 |
|----|------|
| **标题** | feat(manifest): semantic mapping (objectTypes, relations, scenarios) |
| **描述** | `entityRole` → `kind`；关系 cardinality 枚举转换；`businessScenarios.applicableObjectTypeIds`。 |
| **验收标准** | 对照 `manufacturing-manifest.yaml` 子集，关键 id 一致。 |
| **涉及文件** | `src/lib/manifest-compiler/mappers/*` |
| **依赖** | P0-04 |
| **估算** | L |

---

### P0-06 — 状态机提升至 spec.semantic.stateMachines **【done @ feat/p0-manifest-compiler】**

| 项 | 内容 |
|----|------|
| **标题** | feat(manifest): stateMachines mapping + state.code |
| **描述** | 从 `behaviorModel.stateMachines` 映射；补 `code` / `isInitial`。 |
| **验收标准** | 导出样例通过 V09。 |
| **涉及文件** | `src/lib/manifest-compiler/mappers/state-machines.ts` |
| **依赖** | P0-05 |
| **估算** | M |

---

### P0-07 — 行为层 actions / rules / domainEvents 引用 **【done @ feat/p0-manifest-compiler】**

| 项 | 内容 |
|----|------|
| **标题** | feat(manifest): behavior + events mapping with ID refs |
| **描述** | `preRuleIds`、`publishesEventIds` 使用 rule/event **id**；满足 V05–V07。 |
| **验收标准** | 制造域样例编译后 `validateManifest` 零 error。 |
| **涉及文件** | `src/lib/manifest-compiler/behavior.ts`、`events.ts` |
| **依赖** | P0-05 |
| **估算** | L |

---

### P0-08 — governance / dataSources 空结构 + V10 **【done @ feat/p0-manifest-compiler】**

| 项 | 内容 |
|----|------|
| **标题** | feat(manifest): empty governance/dataSources + secretRef policy |
| **描述** | 无数据时输出 `roles: []`、`dataSources: []`；主数据 URL 不写入明文（V10）。 |
| **验收标准** | 编译结果通过 V10；结构完整。 |
| **涉及文件** | `src/lib/manifest-compiler/governance.ts`、`dataSources.ts` |
| **依赖** | P0-04 |
| **估算** | M |

---

## 阶段 3：前端（US-D03，纯本地导出）

> **决策（2026-06-04）**：US-D03 采用浏览器内 `compileManifest` + `validateManifest` + 下载，**不依赖** HTTP API。实现见 `src/lib/manifest-export.ts`。

### P0-13 — 主按钮「导出 OntologyManifest」 **【已落地 @ #19】**

| 项 | 内容 |
|----|------|
| **标题** | feat(ui): primary Manifest YAML export button (client-side) |
| **描述** | `manifest-export-dialog.tsx` + `manifest-export.ts`；原「导出项目」改为 JSON 备份次要入口。 |
| **验收标准** | 建模工作区主按钮可下载 YAML/JSON；EPC 文案说明不进入主契约。 |
| **涉及文件** | `src/lib/manifest-export.ts`、`manifest-export-dialog.tsx`、`modeling-workspace.tsx` |
| **依赖** | P0-04～P0-08（compiler）、P0-01（validator） |
| **估算** | M |
| **状态** | ✅ 已落地 |

---

### P0-14 — 导出前 V01–V11 错误展示 **【与 P0-13 同提交】**

| 项 | 内容 |
|----|------|
| **标题** | feat(ui): show manifest validation errors before export |
| **描述** | 对话框列表展示 `code + elementType + id + field`；`valid=false` 时禁用下载。 |
| **验收标准** | 非法项目可见校验条目。 |
| **涉及文件** | `manifest-export-dialog.tsx` |
| **依赖** | P0-13 |
| **估算** | M |
| **状态** | ✅ 已落地 |

---

### P0-15 — 治理 / 数据源 Tab（空结构可编辑） **【已落地】**

| 项 | 内容 |
|----|------|
| **标题** | feat(ui): governance + dataSources tabs (US-D02) |
| **描述** | 项目级 Tab「治理」「数据源」；`governanceModel` / `dataSourcesModel`；compiler 从 store 编译。 |
| **验收标准** | 五层 Tab 与 spec 段名一致；V10 编辑器禁止明文 token。 |
| **涉及文件** | `ontology-store.ts`、`governance-editor.tsx`、`data-source-editor.tsx`、`modeling-workspace.tsx` |
| **依赖** | P0-08 |
| **估算** | L |
| **状态** | ✅ 已落地（分支 `feat/p0-15-governance-datasources`） |

---

### P0-16 — publish-dialog 文案与 Manifest 引导

| 项 | 内容 |
|----|------|
| **标题** | fix(ui): clarify draft vs platform publish in publish dialog |
| **描述** | 区分设计台 draft 与平台 published；默认引导 Manifest 导出。 |
| **验收标准** | 文案无「已发布到平台」误导。 |
| **涉及文件** | `publish-dialog.tsx` |
| **依赖** | P0-13 |
| **估算** | S |

---

## 阶段 4：API（可选 / P1）

### P0-09 — POST /api/manifest/export **【可选 / P1】**

| 项 | 内容 |
|----|------|
| **标题** | feat(api): POST /api/manifest/export (YAML/JSON) |
| **描述** | 仅当需要服务端导出、审计或 CI 批量生成时再实现；逻辑应复用 `buildManifestExportBundle`。 |
| **验收标准** | 与前端导出结果一致。 |
| **涉及文件** | `src/app/api/manifest/export/route.ts` |
| **依赖** | P0-04 ~ P0-08、`manifest-export.ts` |
| **估算** | M |
| **优先级** | **P1**（P0 已用纯前端满足 US-D03） |

---

### P0-10 — GET /api/manifest/schema **【可选 / P1】**

| 项 | 内容 |
|----|------|
| **标题** | feat(api): GET /api/manifest/schema |
| **描述** | 返回 apiVersion、V 规则说明、样例路径。 |
| **验收标准** | 响应 JSON 含 V01–V11 列表。 |
| **涉及文件** | `src/app/api/manifest/schema/route.ts` |
| **依赖** | P0-01 |
| **估算** | S |
| **优先级** | **P1** |

---

### P0-11 — 标记 /api/export deprecated **【可选 / P1】**

| 项 | 内容 |
|----|------|
| **标题** | chore(api): deprecate legacy config package export |
| **描述** | `/api/export` 响应注明：平台交接请用浏览器 Manifest 导出；配置包仅代码生成。 |
| **验收标准** | body 含 deprecation 提示。 |
| **涉及文件** | `src/app/api/export/route.ts` |
| **依赖** | P0-13（前端主路径已切换） |
| **估算** | S |
| **优先级** | **P1** |

---

### P0-12 — round-trip 单方 golden 测试 **【已落地】**

| 项 | 内容 |
|----|------|
| **标题** | test(manifest): golden compile + validate manufacturing fixture |
| **描述** | 项目 → compile → validate → export；与 `manufacturing-manifest.yaml` 关键 id 子集对齐（`manufacturing-golden-expectations.json`）。 |
| **验收标准** | CI 通过；见 `tests/README.md`。 |
| **涉及文件** | `tests/unit/manifest-manufacturing-golden.spec.ts`、`tests/fixtures/manufacturing-golden-expectations.json` |
| **依赖** | P0-07、`manifest-export.ts` |
| **估算** | M |
| **状态** | ✅ 已落地 |

---

## Git / PR 工作流

仓库路径：本文件所在仓库根目录（`repo-main`）。若遇 `dubious ownership`，使用：

```powershell
git -c safe.directory='E:/00 - AI/Ontology/repo-main' -C "E:\00 - AI\Ontology\repo-main" <command>
```

### PR 链接

| PR | 分支 | 内容 | 状态 |
|----|------|------|------|
| [#18](https://github.com/Frank-zhao-junjun/Ontology/pull/18) | `feat/p0-manifest-validator` | P0-01 validator（V01–V11） | **已合并** |
| [#19](https://github.com/Frank-zhao-junjun/Ontology/pull/19) | `feat/p0-manifest-compiler` | P0-04～P0-08 compiler + P0-13/14 前端导出 + 本文档 | **open** · rebase 后 diff 仅含 compiler/导出/文档（不含 #18） |

PR #19：https://github.com/Frank-zhao-junjun/Ontology/pull/19

---

## 后续实施顺序（2026-06-04 共识）

| 顺序 | 任务 | 说明 |
|------|------|------|
| 1 | 合并 [#19](https://github.com/Frank-zhao-junjun/Ontology/pull/19) | compiler + 前端 Manifest 导出已就绪 |
| 2 | **P0-16**（P0-15 ✅） | `publish-dialog` 与 Manifest 导出引导 |
| 3 | **P0-12** | 制造域 golden：`compile` → `validate`，联调前安全网 |
| 4 | **命名约定固化** | 与 ontology-platform 对齐 `id` / `nameEn`（见下表），写入双方 ADR 或 import 文档 |
| 5 | **US-A01 联调** | **依赖平台侧 import/发布就绪**；设计台先保证导出 YAML 稳定 + P0-12 绿 |

**暂缓（P1）**：P0-09 API 导出、P0-10 schema API、P0-11 deprecated 标记（纯前端已满足 US-D03）。

---

## 与平台对齐：`id` / `nameEn` 约定（草案）

联调前与 ontology-platform 确认并**单一化**下列规则（建议以 `manufacturing-manifest.yaml` 为样例基准）：

| 层级 | 字段 | 建议约定 | 设计台现状 | 风险若不一致 |
|------|------|----------|------------|--------------|
| 对象类型 | `objectTypes[].id` | kebab-case 稳定 id（如 `production-order`） | `Entity.id` | 导入找不到类型 |
| 对象类型 | `nameEn` | PascalCase 业务英文名（如 `ProductionOrder`） | `Entity.nameEn` | 代码生成/表名错位 |
| 属性 | `properties[].id` | Manifest 内稳定键（如 `attr-order-id`，可带 `entityId--` 前缀防冲突） | `Attribute.id` + compiler 去重 | 引用/校验断裂 |
| 属性 | `properties[].nameEn` | **平台表列 / snake_case**（如 `order_id`、`cost_price`）；**方案 A**：导入器以 `nameEn` 为列名 | `Attribute.nameEn` | 表字段映射失败、治理 `fieldPermissions` 对不上 |
| 领域事件 | `domainEvents[].nameEn` | 过去式 PascalCase（如 `OrderCreated`） | `EventDefinition.nameEn` | V08 警告或拒绝 |
| 动作/规则 | `id` | 全局唯一，引用用 **id** 非显示名 | `Action`/`Rule` id | V05–V07 断裂 |

**动作项**：平台提供「导入器字段对照表」或样例 PR；设计台 `manifest-compiler` 按约定输出；P0-12 golden 断言关键 id。

---

## 待确认项（来自修改建议3 §2.5）

- `value_object` 是否单独 UI 库 → 建议 P1
- EPC 是否仅 `extensions.epc` → P1
- 属性 `id` vs `nameEn` → **方案 A 已采纳**（见上表）；联调时仅确认平台导入器是否以 `nameEn` 为列名（阻塞 US-A01，不阻塞 P0-15/16/P0-12）

---

**文档版本**：2026-06-04（含后续顺序与命名草案）
