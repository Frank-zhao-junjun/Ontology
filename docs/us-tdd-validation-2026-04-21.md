# Ralph 风格 US 全量清单与 TDD 验证基线

日期：2026-04-21

## 方法

- 依赖优先：先验证会阻塞后续故事的基础 US。
- 一次一事：每次只补一条故事的直接测试证据，不混做大批实现。
- 证据优先：只有仓库中存在可运行测试，且覆盖核心验收，才标记为“核心已验证”。

## 状态定义

- `核心已验证`：已有直接测试覆盖该 US 的核心验收路径。
- `部分验证`：已有实现或间接测试，但验收标准未被完整锁定。
- `未验证`：暂无直接测试证据，或只有文档说明没有测试落地。

## Ralph 顺序

1. 基础边界：US-1.1, US-1.2, US-2.1, US-2.2, US-2.3
2. 数据基础：US-8.1, US-9.1, US-3.1, US-3.2, US-3.3, US-3.4, US-3.5
3. 行为与治理：US-4.1, US-4.2, US-4.3, US-5.1, US-5.2, US-5.3, US-6.1, US-6.2
4. 交付与运行时：US-7.1, US-7.2, US-10.1, US-10.2, US-10.3
5. AI 辅助：US-11.1, US-11.2

## 全量 US 清单

| US | 故事 | 当前状态 | 现有证据 | 下一条 TDD 动作 |
|---|---|---|---|---|
| US-1.1 | 项目分组创建与管理 | 核心已验证 | `tests/unit/entity-project-management.spec.ts`, `tests/integration/entity-project-list.spec.tsx`, `src/app/api/projects/route.test.ts`, `src/app/api/projects/[id]/route.test.ts`, `src/components/ontology/modeling-workspace.tsx` | 转向 US-9.1 / US-10.3 / US-6.2 等下一批高优先缺口 |
| US-1.2 | 业务场景 CRUD | 核心已验证 | `tests/unit/business-scenario-management.spec.ts`, `tests/integration/business-scenario-project-boundary.spec.tsx`, `src/app/api/projects/[id]/route.test.ts`, `src/components/ontology/modeling-workspace.tsx`, `src/store/ontology-store.ts` | 转向 US-2.1，继续验证聚合角色边界 |
| US-1.3 | 项目下业务场景列表 | 核心已验证 | `tests/integration/business-scenario-list.spec.tsx`, `src/components/ontology/modeling-workspace.tsx` | 后续可补性能基准测试 |
| US-2.1 | 实体聚合角色与 DDD 边界 | 核心已验证 | `tests/unit/entity-aggregate-boundary.spec.ts`, `tests/integration/event-model-editor-aggregate-guard.spec.tsx`, `tests/unit/normalizer-aggregate-root.spec.ts`, `tests/unit/ontology-store.spec.ts` | 转向 US-1.3 / US-4.1 / US-9.1 等下一批高优先缺口 |
| US-2.2 | 实体归属业务场景 | 核心已验证 | `tests/unit/entity-business-scenario.spec.ts`, `tests/unit/ontology-store.spec.ts` | 继续补 UI/API 层创建校验测试 |
| US-2.3 | 当前业务场景实体列表过滤 | 核心已验证 | `tests/integration/modeling-workspace-scenario-filter.spec.tsx` | 继续补详情页只读场景展示测试 |
| US-3.1 | 属性 CRUD 与数据类型 | 部分验证 | `tests/integration/attribute-free-datatype.spec.ts`, `tests/integration/attribute-masterdata-reference.spec.tsx` | 补属性顺序与批量操作测试 |
| US-3.2 | 元数据模板绑定 | 部分验证 | `tests/integration/attribute-metadata-template.spec.ts` | 补模板版本升级/影响分析测试 |
| US-3.3 | 引用类型属性 | 部分验证 | `tests/integration/attribute-free-datatype.spec.ts`, `tests/integration/attribute-masterdata-reference.spec.tsx` | 补 entity/masterData 二选一互斥测试 |
| US-3.4 | 主数据关联属性 | 部分验证 | `tests/unit/ontology-store.spec.ts`, `tests/integration/attribute-masterdata-reference.spec.tsx` | 补引用路径解析与字段校验测试 |
| US-3.5 | 实体间关系建模 | 核心已验证 | `tests/unit/normalizer-relation.spec.ts`, `tests/integration/data-model-relation-crud.spec.tsx`, `src/components/ontology/data-model-editor.tsx` | 转向 US-8.1，补版本管理与同步策略测试 |
| US-4.1 | 状态定义 | 核心已验证 | `tests/unit/state-definition-rules.spec.ts`, `tests/integration/behavior-model-editor-state-rules.spec.tsx`, `src/store/ontology-store.ts`, `src/components/ontology/behavior-model-editor.tsx` | 转向 US-4.2 / US-9.1 / US-6.1 等下一批缺口 |
| US-4.2 | 状态转换规则 | 核心已验证 | `tests/unit/state-transition-rules.spec.ts`, `tests/integration/behavior-model-editor-transition-rules.spec.tsx`, `src/store/ontology-store.ts`, `src/components/ontology/behavior-model-editor.tsx` | 转向 US-9.1 / US-1.1 / US-6.2 等下一批高优先缺口 |
| US-4.3 | 状态触发器 | 核心已验证 | `tests/unit/state-trigger-rules.spec.ts`, `tests/integration/behavior-model-editor-trigger-rules.spec.tsx`, `src/store/ontology-store.ts`, `src/components/ontology/behavior-model-editor.tsx` | 转向 US-5.3，补业务约束规则 |
| US-5.1 | 字段验证规则 | 核心已验证 | `tests/unit/field-validation-rules.spec.ts`, `tests/integration/rule-model-editor-field-validation.spec.tsx`, `tests/unit/ontology-store.spec.ts`, `src/store/ontology-store.ts`, `src/components/ontology/rule-model-editor.tsx` | 转向 US-5.3，补业务约束规则 |
| US-5.2 | 跨字段验证规则 | 核心已验证 | `tests/unit/cross-field-validation-rules.spec.ts`, `tests/integration/rule-model-editor-cross-field.spec.tsx`, `src/store/ontology-store.ts`, `src/components/ontology/rule-model-editor.tsx` | 转向 US-5.3，补非法操作拦截与日志测试 |
| US-5.3 | 业务约束规则 | 核心已验证 | `tests/unit/business-constraint-rules.spec.ts`, `tests/integration/rule-model-editor-business-constraint.spec.tsx`, `src/store/ontology-store.ts`, `src/components/ontology/rule-model-editor.tsx` | 下一步可转向 US-7.1/US-7.2 或 US-11.2 等剩余“未验证”故事 |
| US-6.1 | 聚合根领域事件 | 核心已验证 | `tests/unit/domain-event-definition-rules.spec.ts`, `tests/integration/event-model-editor-domain-rules.spec.tsx`, `tests/integration/event-model-editor-aggregate-guard.spec.tsx`, `tests/unit/ontology-store.spec.ts`, `tests/unit/epc-generator.spec.ts` | 转向 US-6.2 / US-4.2，继续补事件订阅与转换规则 |
| US-6.2 | 事件订阅 | 核心已验证 | `tests/unit/event-subscription-rules.spec.ts`, `tests/integration/event-model-editor-subscription-rules.spec.tsx`, `tests/unit/ontology-store.spec.ts`, `src/store/ontology-store.ts`, `src/components/ontology/event-model-editor.tsx` | 转向 US-10.3 / US-5.1 / US-4.3 等下一批高优先缺口 |
| US-7.1 | EPC 事件说明书 | 核心已验证 | `tests/unit/epc-generator.spec.ts`, `tests/integration/epc-tab.spec.tsx`, `tests/unit/ontology-store.spec.ts`, `src/lib/epc-generator/index.ts`, `src/components/ontology/epc-tab.tsx` | 转向 US-7.2，补导出格式定制与下载一致性测试 |
| US-7.2 | EPC 导出 | 核心已验证 | `tests/integration/epc-tab.spec.tsx`, `tests/integration/api-export-artifact.spec.ts`, `src/components/ontology/epc-tab.tsx` | 转向 US-11.2，一键应用 AI 建议 |
| US-8.1 | 主数据类型定义 | 核心已验证 | `tests/unit/masterdata-field-schema.spec.ts`, `tests/unit/masterdata-version-sync.spec.ts`, `tests/integration/masterdata-import-dynamic-table.spec.ts`, `tests/integration/masterdata-definition-sync.spec.tsx`, `tests/e2e/masterdata-dynamic-table.e2e.spec.ts`, `src/store/ontology-store.ts`, `src/components/ontology/masterdata-manager.tsx` | 转向 US-8.2，补 Excel 字段映射与模板管理测试 |
| US-8.2 | 主数据记录导入 | 核心已验证 | `src/app/api/masterdata/init/route.test.ts`, `tests/integration/masterdata-import-dynamic-table.spec.ts`, `tests/integration/masterdata-template-apply.spec.tsx`, `src/components/ontology/masterdata-manager.tsx`, `src/app/api/masterdata/init/route.ts` | 转向 US-8.3，补审计日志与版本控制测试 |
| US-8.3 | 主数据记录 CRUD | 核心已验证 | `tests/unit/masterdata-dynamic-record.spec.ts`, `tests/integration/masterdata-dynamic-crud.spec.ts`, `tests/e2e/masterdata-dynamic-table.e2e.spec.ts`, `tests/unit/masterdata-audit-log.spec.ts`, `tests/unit/masterdata-version-sync.spec.ts` | 转向 US-10.1 等其他缺口，审计日志与版本控制已验证 |
| US-9.1 | 元数据模板定义 | 核心已验证 | `tests/unit/metadata-template-management.spec.ts`, `tests/integration/metadata-manager-crud.spec.tsx`, `src/app/api/metadata/init/route.test.ts` | 转向 US-10.3 / US-6.2 / US-5.1 等下一批高优先缺口 |
| US-9.2 | 属性编辑时选择元数据模板 | 部分验证 | `tests/integration/attribute-metadata-template.spec.ts` | 补模板搜索与推荐测试 |
| US-10.1 | 版本快照 | 核心已验证 | `tests/unit/ontology-store.spec.ts`, `tests/unit/version-snapshot-rollback.spec.ts` | 转向 US-9.2/US-11.1 等其他缺口，回滚策略已验证 |
| US-10.2 | 导出配置包 | 核心已验证 | `tests/unit/export-validation.spec.ts`, `tests/unit/export-manifest.spec.ts`, `tests/integration/api-export*.spec.ts`, `tests/e2e/modeling-export-runtime.e2e.spec.ts` | 补导出格式定制与性能基准测试 |
| US-10.3 | 版本历史 | 核心已验证 | `tests/unit/version-history-management.spec.ts`, `tests/integration/version-manager-history.spec.tsx`, `tests/integration/runtime-version.spec.ts` | 转向 US-5.1 / US-4.3 等下一批高优先缺口 |
| US-11.1 | AI 生成模型建议 | 部分验证 | `src/app/api/generate-model/route.test.ts`, `src/lib/ai/query-service.test.ts` | 补建议质量评估与个性化测试 |
| US-11.2 | 一键应用 AI 建议 | 核心已验证 | `tests/integration/manual-generator-ai-apply-rollback.spec.tsx`, `src/app/api/generate-model/route.test.ts`, `src/components/ontology/manual-generator.tsx` | 后续可补批量应用与冲突合并策略测试 |

## 当前优先缺口

优先从这些 P0 且缺少直接证据的故事开始：

1. US-9.2 属性编辑时选择元数据模板（部分验证 -> 核心已验证）
2. US-11.1 AI 生成模型建议（部分验证 -> 核心已验证）

## 本轮已补证据

- US-10.1：新增 `tests/unit/version-snapshot-rollback.spec.ts` 并在状态管理中实现 `rollbackVersion`
  - 确保将主数据定义、主数据记录、各类模型（数据、行为、规则、事件、过程、EPC等）一并深拷贝恢复至历史快照。

- US-8.3：新增 `tests/unit/masterdata-audit-log.spec.ts`
  - 更新和停用主数据记录时，自动更新 `updatedAt` 时间戳审计日志。
  - 创建版本时自动持久化主数据当前状态已经由 `tests/unit/masterdata-version-sync.spec.ts` 补全。

- US-2.2：新增 `tests/unit/entity-business-scenario.spec.ts`
  - 创建实体必须带 `businessScenarioId`
  - 更新实体时保留原场景，不允许跨场景迁移
- US-2.3：新增 `tests/integration/modeling-workspace-scenario-filter.spec.tsx`
  - 未选场景时禁用“+ 新建”
  - 切换业务场景后实体列表按 `businessScenarioId` 过滤
- US-2.3：修正 `src/components/ontology/modeling-workspace.tsx`
  - 未选业务场景时实体列表应为空，而不是显示全部实体
- US-1.2：新增 `tests/unit/business-scenario-management.spec.ts`
  - 新增/更新业务场景基础字段
  - 删除仍有关联实体的业务场景时必须拒绝删除
- US-1.2：修正 `src/store/ontology-store.ts`
  - `deleteBusinessScenario` 在存在关联实体时返回 no-op，避免破坏归属链
- US-1.2：新增 `tests/integration/business-scenario-project-boundary.spec.tsx`
  - 未选择具体项目时禁用“创建业务场景”入口
  - 只有选中具体项目后才允许创建业务场景
- US-1.2：新增数量限制直接证据
  - 同一项目达到 10 个业务场景后，store 必须拒绝新增第 11 个
  - 工作台在达到 10 个场景后禁用创建入口，并显示上限提示
- US-1.2：修正 `src/components/ontology/modeling-workspace.tsx`
  - “全部项目”视角下禁用业务场景创建，避免误挂到首个项目
  - 增加“请先选择具体项目”提示，补齐项目边界反馈
- US-1.2：补强 `src/app/api/projects/[id]/route.test.ts`
  - PUT 更新项目快照时应保留 `businessScenarios` 持久化数据
- US-1.2：修正 `src/store/ontology-store.ts` + `src/components/ontology/modeling-workspace.tsx`
  - 用户已确认阈值为“每项目最多 10 个业务场景”，状态层与入口层均已落地保护
- US-1.2：新增 UI CRUD 直接证据
  - 工作台支持编辑业务场景名称并即时反映到列表
  - 工作台删除业务场景时，会先拦截有关联实体的场景，再允许删除无关联场景
- US-2.1：新增 `tests/unit/entity-aggregate-boundary.spec.ts`
  - `child_entity` 缺少 `parentAggregateId` 时必须拒绝保存
  - `aggregate_root` 携带 `parentAggregateId` 时必须拒绝保存
  - `child_entity` 指向不存在父聚合时必须拒绝保存
  - 删除聚合根时必须级联删除其子实体
  - `aggregate_root` 在仍有子实体归属时不允许直接降级为 `child_entity`
  - `child_entity` 在显式清空 `parentAggregateId` 后可升级为 `aggregate_root`
  - `child_entity` 不允许再挂接到另一个 `child_entity`，当前嵌套深度限制为“聚合根 + 一层子实体”
- US-2.1：新增 `tests/integration/event-model-editor-aggregate-guard.spec.tsx`
  - `child_entity` 在事件编辑器中尝试定义事件时必须被 UI 直接拦截
  - `aggregate_root` 在事件编辑器中定义事件时应正常写入事件模型
- US-2.1：修正 `src/store/ontology-store.ts`
  - 新增聚合角色边界校验，避免非法 `entityRole + parentAggregateId` 组合落库
  - `deleteEntity` 改为沿 `parentAggregateId` 链执行级联删除
  - `updateEntity` 新增聚合根降级保护，避免仍被子实体引用的聚合根被降级后留下非法父子链
- US-1.3：新增 `tests/integration/business-scenario-list.spec.tsx`
  - 业务场景列表可按所选项目过滤
  - 每个业务场景显示关联实体数量
  - 支持按名称、英文名、描述搜索业务场景
- US-4.1：新增 `tests/unit/state-definition-rules.spec.ts`
  - 向状态机新增带颜色的中间态应成功保存
  - 同一状态机内状态编码必须唯一
  - 同一状态机最多只能有一个初始态
  - 删除仍被转换规则引用的状态必须失败
- US-4.1：修正 `src/store/ontology-store.ts` + `src/components/ontology/behavior-model-editor.tsx`
  - `addStateMachine` / `updateStateMachine` 入口现已统一校验状态唯一性、初始态数量和删状态引用保护
  - 行为编辑器删除状态时不再静默级联删除转换，而是明确提示先处理转换规则
- US-4.1：新增 `tests/integration/behavior-model-editor-state-rules.spec.tsx`
  - 编辑器内新增普通中间态应成功显示并落库
  - 编辑器内若生成出的状态编码与现有状态重复，应直接提示错误并拒绝保存
  - 编辑器内尝试新增第二个初始态时，应直接提示错误并拒绝保存
  - 编辑器内删除仍被转换引用的状态时，应提示先处理转换规则
- US-4.1：补充“状态数量限制”决策与实现
  - 用户已确认阈值为“每个状态机最多 10 个状态”
  - store 现已统一拦截第 11 个状态，编辑器交互也会直接提示错误并拒绝保存
- US-1.3：修正 `src/components/ontology/modeling-workspace.tsx`
  - 业务场景列表不再总是显示全部场景，而是先按项目过滤再应用搜索
  - 新增“搜索业务场景”输入框与空结果提示
  - 项目切换时若当前场景不在新项目范围内，会自动清空已选场景
- US-1.1：新增 `tests/unit/entity-project-management.spec.ts`
  - 新增/更新项目分组基础字段
  - 删除仍有关联实体的项目分组时必须拒绝删除
- US-1.1：修正 `src/store/ontology-store.ts`
  - `deleteEntityProject` 在存在关联实体时返回 no-op，避免破坏实体归属链
- US-1.1：新增 `tests/integration/entity-project-list.spec.tsx`
  - 工作台项目列表显示每个项目的实体数量
  - 选中项目后仅显示该项目下的业务场景与实体
  - 删除当前选中的空项目后，工作台应自动回退到“全部项目”
  - 删除有关联实体的项目时，工作台必须直接提示并拒绝删除
- US-1.1：补强 `src/app/api/projects/[id]/route.test.ts`
  - DELETE 路由现已覆盖数据库删除失败时的 500 返回语义
  - 结合既有 GET/PUT/DELETE 成功路径，项目 API 删除策略已有直接测试证据
- US-6.1：新增 `tests/unit/domain-event-definition-rules.spec.ts`
  - 仅聚合根可以定义领域事件
  - 领域事件名称必须使用过去式
  - `state_change` 事件缺少触发条件时必须拒绝保存
  - 默认补齐 `transactionPhase = AFTER_COMMIT` 与最小 payload `[{ field: 'id' }]`
- US-6.1：新增 `tests/integration/event-model-editor-domain-rules.spec.tsx`
  - 编辑器默认创建事件时应生成过去式名称
  - 非过去式名称会被提示并阻止落库
  - 状态变更事件缺少触发条件会被提示并阻止落库
- US-6.1：修正 `src/store/ontology-store.ts` + `src/components/ontology/event-model-editor.tsx`
  - 事件规则已下沉到 store，避免绕过 UI 直接写入非法事件
  - 编辑器默认事件名改为基于触发类型的过去式命名，并同步补齐默认 payload
  - 保存失败时直接向用户反馈明确错误原因
- US-6.1：已完成整仓回归验证
  - `pnpm run ci:check` 全绿，包含 lint、ts-check、unit、integration、e2e smoke
  - 当前未见对 EPC 导出、运行时与既有事件链路的回归影响
- US-4.2：新增 `tests/unit/state-transition-rules.spec.ts`
  - 有效转换应允许保存前置条件与后置动作
  - 引用不存在状态的转换必须拒绝保存
  - 自动/定时转换缺少条件表达式时必须拒绝保存
- US-4.2：新增 `tests/integration/behavior-model-editor-transition-rules.spec.tsx`
  - 编辑器内可创建带条件表达式与后置动作的有效转换
  - 未选择起始/目标状态时应提示错误并拒绝保存
  - 自动触发转换缺少条件表达式时应提示错误并拒绝保存
- US-4.2：修正 `src/store/ontology-store.ts` + `src/components/ontology/behavior-model-editor.tsx`
  - 状态机规则现已统一校验转换引用完整性，避免无效状态穿透到状态层
  - 自动/定时转换现在必须显式提供触发条件
  - 行为编辑器已补充条件表达式与后置动作输入，并在保存前给出明确校验反馈
- US-4.2：补齐剩余 CRUD 直接证据
  - 行为编辑器现已提供独立的“编辑转换 / 删除转换”入口
  - `tests/integration/behavior-model-editor-transition-rules.spec.tsx` 已覆盖编辑已有转换与删除已有转换两条直接交互证据
  - 结合已有 store 约束与创建路径测试，US-4.2 当前已满足转换 CRUD、状态完整性、条件表达式与动作配置的核心验收
- US-9.1：新增元数据模板定义直接证据
  - 新增 `tests/unit/metadata-template-management.spec.ts`，覆盖 store 层元数据模板 CRUD + 中文名/英文名查询
  - 新增 `tests/integration/metadata-manager-crud.spec.tsx`，覆盖元数据管理页面新增、编辑、删除与按领域/名称搜索
  - 结合既有 `src/app/api/metadata/init/route.test.ts`，US-9.1 当前已具备“初始化 + 管理 + 消费”的核心验证闭环
- US-6.2：新增事件订阅直接证据
  - 新增 `tests/unit/event-subscription-rules.spec.ts`，覆盖异步订阅重试策略必填、事件引用有效性、同步订阅默认幂等配置
  - 新增 `tests/integration/event-model-editor-subscription-rules.spec.tsx`，覆盖事件编辑器中的异步订阅创建、缺少重试策略拦截、同步订阅默认幂等与删除路径
  - 修正 `src/store/ontology-store.ts` + `src/components/ontology/event-model-editor.tsx`，将订阅规则下沉到 store，并在编辑器中直接暴露处理方式、重试策略、处理器标识与幂等键模式
  - 已重跑整条 `pnpm run ci:check`；当前 lint、ts-check、24 个 unit 文件、25 个 integration 文件与 4 个 e2e smoke 文件全部通过，US-6.2 可正式上调为“核心已验证”
- US-10.3：新增版本历史直接证据
  - 新增 `tests/unit/version-history-management.spec.ts`，覆盖版本历史查询、发布/归档状态流转、latest 版本选择
  - 新增 `tests/integration/version-manager-history.spec.tsx`，覆盖版本历史列表展示与每版本实体/状态机规模摘要（影响分析基线）
  - 结合既有 `tests/integration/runtime-version.spec.ts`，当前已覆盖“切换正确 + 历史可见 + 规模对比”主链路
- US-5.1：新增字段验证规则直接证据
  - 新增 `tests/unit/field-validation-rules.spec.ts`，覆盖表达式必填、优先级持久化与规则启停切换
  - 新增 `tests/integration/rule-model-editor-field-validation.spec.tsx`，覆盖规则编辑器中的表达式规则创建、优先级展示与启停交互
  - 修正 `src/store/ontology-store.ts` + `src/components/ontology/rule-model-editor.tsx`，将字段规则校验（regex/range/expression）下沉到 store，并在编辑器中补充优先级输入与展示
- US-4.3：新增状态触发器直接证据
  - 新增 `tests/unit/state-trigger-rules.spec.ts`，覆盖手动/事件/定时触发器配置、日志记录与发布事件关联校验
  - 新增 `tests/integration/behavior-model-editor-trigger-rules.spec.tsx`，覆盖编辑器中触发器配置、缺失触发事件拦截、执行日志摘要展示
  - 已执行 `pnpm exec vitest run tests/unit/state-trigger-rules.spec.ts tests/integration/behavior-model-editor-trigger-rules.spec.tsx`，当前 2 个文件、7 条用例全部通过
  - 已按 `ci:check` 分段完成整仓回归验证：`pnpm run lint`、`pnpm run ts-check`、`pnpm run test:unit`、`pnpm run test:integration`、`pnpm run test:e2e:smoke` 全部通过；当前 28 个 unit 文件、29 个 integration 文件与 4 个 e2e smoke 文件全绿
- US-5.2：新增跨字段验证直接证据
  - 新增 `tests/unit/cross-field-validation-rules.spec.ts`，覆盖跨字段最少字段数、表达式必填、按优先级排序（执行顺序）
  - 新增 `tests/integration/rule-model-editor-cross-field.spec.tsx`，覆盖规则编辑器中跨字段规则创建、字段列表录入与优先级展示
  - 修正 `src/store/ontology-store.ts` + `src/components/ontology/rule-model-editor.tsx`，补跨字段规则校验下沉与字段列表输入能力
- US-5.3：新增业务约束规则直接证据
  - 新增 `tests/unit/business-constraint-rules.spec.ts`，覆盖跨实体业务约束非法配置拦截（缺检查实体/缺检查条件）与规则执行拦截日志记录
  - 新增 `tests/integration/rule-model-editor-business-constraint.spec.tsx`，覆盖规则编辑器中跨实体约束创建与约束配置落库
  - 修正 `src/store/ontology-store.ts` + `src/components/ontology/rule-model-editor.tsx` + `src/types/ontology.ts`，补业务约束校验、规则执行日志结构与编辑器输入项
- US-7.1：补齐 EPC 校验规则与质量评分证据
  - 增强 `tests/unit/epc-generator.spec.ts`：新增质量评分与问题清单断言，覆盖组织/系统补齐后评分提升与问题消除
  - 增强 `tests/integration/epc-tab.spec.tsx`：新增 EPC 评分展示与完整性问题代码展示断言
  - 修正 `src/components/ontology/epc-tab.tsx`：在“生成依据”区域展示 `validationSummary.score` 质量评分
  - 已执行 `pnpm exec vitest run tests/unit/epc-generator.spec.ts tests/integration/epc-tab.spec.tsx`，当前 2 个文件、9 条用例全部通过
- US-7.2：补齐 EPC 导出格式与一致性证据
  - 增强 `src/components/ontology/epc-tab.tsx`：新增 `导出 PDF` 入口，导出命名与当前 EPC 实体保持一致
  - 增强 `tests/integration/epc-tab.spec.tsx`：新增“预览与导出内容一致性”断言（Markdown/PDF 内容均含同一 EPC 正文）与 PDF 命名断言
  - 结合既有 `tests/integration/api-export-artifact.spec.ts` 的产物结构校验，当前已覆盖 EPC 导出 JSON/Markdown/PDF 与配置包下载主链路
  - 已执行 `pnpm exec vitest run tests/integration/epc-tab.spec.tsx tests/integration/api-export-artifact.spec.ts`，当前 2 个文件、9 条用例全部通过
- US-11.2：补齐 AI 建议应用闭环证据
  - 新增 `tests/integration/manual-generator-ai-apply-rollback.spec.tsx`，覆盖 AI 建议预览、单项应用落库、单项回滚恢复
  - 增强 `src/components/ontology/manual-generator.tsx`：为建议项新增“回滚”能力，支持对已应用建议执行逆操作
  - 结合既有 `src/app/api/generate-model/route.test.ts`，当前已覆盖“建议生成 -> 预览 -> 应用 -> 回滚”主链路
  - 已执行 `pnpm exec vitest run tests/integration/manual-generator-ai-apply-rollback.spec.tsx src/app/api/generate-model/route.test.ts`，当前 2 个文件、4 条用例全部通过
- US-3.5：补齐关系建模 CRUD 与约束证据
  - 新增 `tests/integration/data-model-relation-crud.spec.tsx`，覆盖关系新增、编辑、删除主链路，以及多对多缺失中间实体时的保存拦截
  - 增强 `src/components/ontology/data-model-editor.tsx`：关系编辑器新增“编辑关系”入口，支持更新已有关系；新增多对多中间实体输入与保存校验
  - 结合既有 `tests/unit/normalizer-relation.spec.ts` 的关系引用完整性验证，US-3.5 当前已覆盖“关系定义 + 约束拦截 + 展示与落库”核心链路
  - 已执行 `pnpm exec vitest run tests/unit/normalizer-relation.spec.ts tests/integration/data-model-relation-crud.spec.tsx`，当前 2 个文件、5 条用例全部通过
- US-8.1：补齐主数据定义版本快照与同步策略证据
  - 新增 `tests/unit/masterdata-version-sync.spec.ts`，覆盖主数据定义/记录进入版本快照，以及字段清单变更后记录重映射策略
  - 新增 `tests/integration/masterdata-definition-sync.spec.tsx`，覆盖主数据定义编辑字段后动态数据表列同步更新与已存记录映射行为
  - 增强 `src/store/ontology-store.ts`：`createVersion` 增加 `masterData` 快照；`updateMasterData` 在字段清单变化时执行记录重映射，保证同步一致性
  - 增强 `src/components/ontology/masterdata-manager.tsx`：补编辑/启停/删除按钮可访问名称，稳定集成测试并提升交互可测性
  - 已执行 `pnpm exec vitest run tests/unit/masterdata-field-schema.spec.ts tests/unit/masterdata-dynamic-record.spec.ts tests/unit/masterdata-version-sync.spec.ts tests/integration/masterdata-import-dynamic-table.spec.ts tests/integration/masterdata-dynamic-crud.spec.ts tests/integration/masterdata-definition-sync.spec.tsx`，当前 6 个文件、8 条用例全部通过
- US-8.2：补齐 Excel 字段映射与模板管理证据
  - 增强 `src/app/api/masterdata/init/route.ts`：Markdown 导入字段映射新增 `字段清单` / `字段列表` 别名兼容
  - 增强 `src/app/api/masterdata/init/route.test.ts`：新增表头别名映射测试（`业务领域`、`主数据名称`、`字段清单`）
  - 增强 `src/components/ontology/masterdata-manager.tsx`：新增字段模板（基础主体/物料/组织）一键填充能力
  - 新增 `tests/integration/masterdata-template-apply.spec.tsx`：覆盖新增主数据时选择模板并自动写入字段清单
  - 已执行 `pnpm exec vitest run src/app/api/masterdata/init/route.test.ts tests/integration/masterdata-template-apply.spec.tsx tests/integration/masterdata-import-dynamic-table.spec.ts tests/integration/masterdata-dynamic-crud.spec.ts`，当前 4 个文件、7 条用例全部通过