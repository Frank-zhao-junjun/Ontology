# Ontology 项目迭代计划

> 基于 Ralph Loop 方法论：一次迭代只做一件事
> 生成时间：2026-04-19

---

## 迭代总览

| Sprint | 主题 | User Stories | 状态 |
|--------|------|--------------|------|
| Sprint 1 | 核心建模基础 | US-1.1, US-1.2, US-2.1, US-2.2, US-2.3 | 待开始 |
| Sprint 2 | 数据模型完善 | US-3.1, US-3.2, US-3.3, US-3.4 | 待开始 |
| Sprint 3 | 行为与规则模型 | US-4.1, US-4.2, US-5.1 | 待开始 |
| Sprint 4 | 事件模型与 EPC | US-6.1, US-7.1 | 待开始 |
| Sprint 5 | 主数据与元数据 | US-8.1, US-8.2, US-9.1, US-9.2 | 待开始 |
| Sprint 6 | 版本管理与导出 | US-10.1, US-10.2 | 待开始 |
| Sprint 7 | 增强功能 | US-3.5, US-4.3, US-5.2, US-5.3, US-6.2, US-7.2, US-8.3, US-10.3, US-11.1, US-11.2 | 待开始 |

---

## Sprint 1: 核心建模基础

**目标**: 完成项目、业务场景、实体的基础 CRUD

### US-1.1 项目管理

**User Story**: 作为架构师，我需要创建项目分组，以便按领域组织建模工作

**验收标准**:
- [ ] 项目创建接口 POST /api/projects
- [ ] 项目列表接口 GET /api/projects
- [ ] 项目更新接口 PUT /api/projects/[id]
- [ ] 项目删除接口 DELETE /api/projects/[id]
- [ ] 项目按领域分组显示

**测试用例**:
```
TC-1.1.1: 创建项目 - 成功
TC-1.1.2: 创建项目 - 缺少必填字段 - 失败
TC-1.1.3: 更新项目 - 成功
TC-1.1.4: 删除项目 - 成功
TC-1.1.5: 项目列表 - 按领域过滤
```

**涉及文件**:
- src/app/api/projects/route.ts
- src/app/api/projects/[id]/route.ts
- src/components/ontology/project-list.tsx
- src/components/ontology/project-setup.tsx

---

### US-1.2 业务场景管理

**User Story**: 作为架构师，我需要为项目创建业务场景，以便明确实体归属边界

**验收标准**:
- [ ] 业务场景创建接口
- [ ] 业务场景 CRUD
- [ ] 业务场景按项目过滤
- [ ] 实体必须归属业务场景

**测试用例**:
```
TC-1.2.1: 创建业务场景 - 成功
TC-1.2.2: 创建业务场景 - 缺少 projectId - 失败
TC-1.2.3: 业务场景列表 - 按项目过滤
TC-1.2.4: 删除业务场景 - 有关联实体时 - 失败
```

**涉及文件**:
- src/store/ontology-store.ts (addBusinessScenario)
- src/components/ontology/modeling-workspace.tsx (BusinessScenarioForm)

---

### US-2.1 实体聚合角色

**User Story**: 作为架构师，我需要创建实体并标记聚合角色，以便明确 DDD 边界

**验收标准**:
- [ ] 实体创建时选择聚合角色（aggregate_root / child_entity）
- [ ] 子实体必须指定 parentAggregateId
- [ ] 聚合根不可指定 parentAggregateId
- [ ] 只有聚合根可发布领域事件

**测试用例**:
```
TC-2.1.1: 创建聚合根 - 成功
TC-2.1.2: 创建子实体 - 指定父聚合 - 成功
TC-2.1.3: 创建子实体 - 未指定父聚合 - 失败
TC-2.1.4: 创建聚合根 - 指定父聚合 - 失败
TC-2.1.5: 子实体发布事件 - 失败
```

**涉及文件**:
- src/lib/entity-role.ts
- src/components/ontology/data-model-editor.tsx
- src/types/ontology.ts

---

### US-2.2 实体归属业务场景

**User Story**: 作为架构师，我需要为实体归属业务场景，以便按场景组织实体

**验收标准**:
- [ ] 创建实体时 businessScenarioId 必填
- [ ] 创建后 businessScenarioId 不可更改
- [ ] 更新接口拒绝修改 businessScenarioId

**测试用例**:
```
TC-2.2.1: 创建实体 - 有 businessScenarioId - 成功
TC-2.2.2: 创建实体 - 无 businessScenarioId - 失败
TC-2.2.3: 更新实体 - 修改 businessScenarioId - 失败
```

**涉及文件**:
- src/store/ontology-store.ts (addEntity)
- src/components/ontology/data-model-editor.tsx

---

### US-2.3 实体列表过滤

**User Story**: 作为架构师，我需要查看当前业务场景下的实体列表，以便聚焦建模

**验收标准**:
- [ ] 实体列表按 businessScenarioId 过滤
- [ ] 未选场景时禁用"新建实体"按钮
- [ ] 切换场景后列表自动刷新

**测试用例**:
```
TC-2.3.1: 选择场景 - 列表显示该场景实体
TC-2.3.2: 切换场景 - 列表更新
TC-2.3.3: 未选场景 - 新建实体按钮禁用
```

**涉及文件**:
- src/components/ontology/modeling-workspace.tsx

---

## Sprint 2: 数据模型完善

**目标**: 完成属性编辑、元数据关联、主数据引用

### US-3.1 属性 CRUD

**User Story**: 作为架构师，我需要为实体添加属性，以便定义数据结构

**验收标准**:
- [ ] 属性创建/编辑/删除
- [ ] 支持 9 种数据类型：string, text, integer, decimal, boolean, date, datetime, enum, reference
- [ ] 属性名唯一性校验

**测试用例**:
```
TC-3.1.1: 创建属性 - string 类型 - 成功
TC-3.1.2: 创建属性 - reference 类型 - 成功
TC-3.1.3: 创建属性 - 重复名称 - 失败
TC-3.1.4: 删除属性 - 成功
```

**涉及文件**:
- src/components/ontology/data-model-editor.tsx
- src/types/ontology.ts (Attribute)

---

### US-3.2 元数据模板关联

**User Story**: 作为架构师，我需要关联元数据模板，以便确保字段标准一致性

**验收标准**:
- [ ] 属性编辑时可选择元数据模板
- [ ] 关联后数据类型由模板决定（只读）
- [ ] 关联后不可手动修改类型

**测试用例**:
```
TC-3.2.1: 关联元数据模板 - 类型自动填充
TC-3.2.2: 关联后修改类型 - 失败
TC-3.2.3: 解除关联 - 类型可编辑
```

**涉及文件**:
- src/components/ontology/data-model-editor.tsx
- src/components/ontology/metadata-manager.tsx

---

### US-3.3 引用类型属性

**User Story**: 作为架构师，我需要创建引用类型属性，以便表达实体关系

**验收标准**:
- [ ] 引用类型时显示"引用实体"或"引用主数据"选择
- [ ] 二者互斥，只能选其一
- [ ] 引用实体时选择本项目中的实体

**测试用例**:
```
TC-3.3.1: 引用实体 - 成功
TC-3.3.2: 引用主数据 - 成功
TC-3.3.3: 同时引用实体和主数据 - 失败
```

**涉及文件**:
- src/components/ontology/data-model-editor.tsx

---

### US-3.4 主数据关联

**User Story**: 作为架构师，我需要关联主数据，以便引用业务基础数据

**验收标准**:
- [ ] isMasterDataRef 开关
- [ ] 开启时 masterDataType 必填
- [ ] 关闭时清空 masterDataType 和 masterDataField

**测试用例**:
```
TC-3.4.1: 开启主数据关联 - 选择类型 - 成功
TC-3.4.2: 开启主数据关联 - 未选类型 - 失败
TC-3.4.3: 关闭主数据关联 - 清空关联字段
```

**涉及文件**:
- src/components/ontology/data-model-editor.tsx
- src/components/ontology/masterdata-manager.tsx

---

## Sprint 3: 行为与规则模型

**目标**: 完成状态机、状态转换、验证规则

### US-4.1 状态定义

**User Story**: 作为架构师，我需要为实体定义状态，以便表达业务生命周期

**验收标准**:
- [ ] 状态 CRUD
- [ ] 状态码唯一
- [ ] 状态类型：初始态、中间态、终态

**测试用例**:
```
TC-4.1.1: 创建状态 - 成功
TC-4.1.2: 创建状态 - 重复状态码 - 失败
TC-4.1.3: 删除状态 - 有转换规则引用 - 失败
```

**涉及文件**:
- src/components/ontology/behavior-model-editor.tsx

---

### US-4.2 状态转换规则

**User Story**: 作为架构师，我需要定义状态转换规则，以便约束业务流程

**验收标准**:
- [ ] 转换规则 CRUD
- [ ] 前置状态、后置状态
- [ ] 触发条件表达式

**测试用例**:
```
TC-4.2.1: 创建转换规则 - 成功
TC-4.2.2: 创建转换规则 - 无效状态 - 失败
TC-4.2.3: 状态机完整性校验
```

**涉及文件**:
- src/components/ontology/behavior-model-editor.tsx

---

### US-5.1 字段验证规则

**User Story**: 作为架构师，我需要定义字段验证规则，以便确保数据合法性

**验收标准**:
- [ ] 验证规则 CRUD
- [ ] 规则表达式
- [ ] 错误消息配置

**测试用例**:
```
TC-5.1.1: 创建验证规则 - 成功
TC-5.1.2: 规则表达式语法校验
TC-5.1.3: 规则优先级排序
```

**涉及文件**:
- src/components/ontology/rule-model-editor.tsx

---

## Sprint 4: 事件模型与 EPC

**目标**: 完成领域事件、EPC 说明书

### US-6.1 领域事件定义

**User Story**: 作为架构师，我需要为聚合根定义领域事件，以便通知状态变更

**验收标准**:
- [ ] 仅聚合根可发布事件
- [ ] 事件命名过去式
- [ ] 事件携带数据定义

**测试用例**:
```
TC-6.1.1: 聚合根创建事件 - 成功
TC-6.1.2: 子实体创建事件 - 失败
TC-6.1.3: 事件命名校验
```

**涉及文件**:
- src/components/ontology/event-model-editor.tsx

---

### US-7.1 EPC 事件说明书

**User Story**: 作为架构师，我需要查看聚合根的 EPC 事件说明书，以便了解业务流程

**验收标准**:
- [ ] 仅聚合根显示 EPC 页签
- [ ] 自动生成，不可编辑
- [ ] 内容基于四大元模型汇总

**测试用例**:
```
TC-7.1.1: 聚合根显示 EPC 页签
TC-7.1.2: 子实体无 EPC 页签
TC-7.1.3: EPC 内容与模型一致
```

**涉及文件**:
- src/components/ontology/epc-tab.tsx
- src/lib/epc-generator/index.ts

---

## Sprint 5: 主数据与元数据

**目标**: 完成主数据定义、导入、元数据模板

### US-8.1 主数据定义

**User Story**: 作为架构师，我需要定义主数据类型，以便管理业务基础数据

**验收标准**:
- [ ] 主数据定义 CRUD
- [ ] fieldNames 动态解析
- [ ] 动态表生成

**测试用例**:
```
TC-8.1.1: 创建主数据定义 - 成功
TC-8.1.2: fieldNames 解析 - 中英文逗号
TC-8.1.3: 动态表列生成
```

**涉及文件**:
- src/components/ontology/masterdata-manager.tsx
- src/lib/masterdata/field-parser.ts

---

### US-8.2 主数据导入

**User Story**: 作为架构师，我需要导入主数据记录，以便初始化业务数据

**验收标准**:
- [ ] Excel 导入
- [ ] 字段映射
- [ ] 数据校验

**测试用例**:
```
TC-8.2.1: Excel 导入 - 成功
TC-8.2.2: Excel 导入 - 字段不匹配 - 失败
TC-8.2.3: 导入数据校验
```

**涉及文件**:
- src/components/ontology/masterdata-manager.tsx

---

### US-9.1 元数据模板定义

**User Story**: 作为架构师，我需要定义元数据模板，以便标准化字段属性

**验收标准**:
- [ ] 元数据 CRUD
- [ ] 类型、长度、约束定义

**测试用例**:
```
TC-9.1.1: 创建元数据模板 - 成功
TC-9.1.2: 模板类型校验
```

**涉及文件**:
- src/components/ontology/metadata-manager.tsx

---

### US-9.2 元数据模板选择

**User Story**: 作为架构师，我需要在属性编辑时选择元数据模板，以便复用标准字段

**验收标准**:
- [ ] 下拉选择元数据模板
- [ ] 类型自动填充

**测试用例**:
```
TC-9.2.1: 选择元数据模板 - 类型自动填充
TC-9.2.2: 模板列表加载
```

**涉及文件**:
- src/components/ontology/data-model-editor.tsx

---

## Sprint 6: 版本管理与导出

**目标**: 完成版本快照、配置导出

### US-10.1 版本快照

**User Story**: 作为架构师，我需要创建版本快照，以便保存建模成果

**验收标准**:
- [ ] 版本号语义化（1.0.0）
- [ ] 版本状态：draft / published
- [ ] 四大元模型快照

**测试用例**:
```
TC-10.1.1: 创建版本 - 成功
TC-10.1.2: 版本号格式校验
TC-10.1.3: 版本快照完整性
```

**涉及文件**:
- src/components/ontology/version-manager.tsx
- src/components/ontology/publish-dialog.tsx

---

### US-10.2 配置导出

**User Story**: 作为架构师，我需要导出配置包，以便加载到运行时系统

**验收标准**:
- [ ] config.json + data/*.json
- [ ] manifest 信息
- [ ] 可选示例数据

**测试用例**:
```
TC-10.2.1: 导出配置包 - 成功
TC-10.2.2: 导出包含示例数据
TC-10.2.3: manifest 完整性
```

**涉及文件**:
- src/lib/configexporter/index.ts
- src/app/api/export/route.ts

---

## Sprint 7: 增强功能

**目标**: 完成关系定义、触发器、AI 辅助等增强功能

### US-3.5 实体关系定义

**验收标准**:
- [ ] 1:1, 1:N, N:M 关系
- [ ] 关系方向明确

### US-4.3 状态触发器

**验收标准**:
- [ ] 触发器配置
- [ ] 事件发布

### US-5.2 跨字段验证

**验收标准**:
- [ ] 跨字段规则
- [ ] 条件表达式

### US-5.3 业务约束规则

**验收标准**:
- [ ] 规则优先级
- [ ] 拦截动作

### US-6.2 事件订阅

**验收标准**:
- [ ] 订阅配置
- [ ] 同步/异步处理

### US-7.2 EPC 导出

**验收标准**:
- [ ] Markdown/PDF 导出
- [ ] 内容一致

### US-8.3 主数据 CRUD

**验收标准**:
- [ ] 动态表 CRUD
- [ ] 生效/失效状态

### US-10.3 版本历史

**验收标准**:
- [ ] 版本列表
- [ ] 对比功能

### US-11.1 AI 模型建议

**验收标准**:
- [ ] 豆包大模型调用
- [ ] 建议列表

### US-11.2 一键应用 AI 建议

**验收标准**:
- [ ] 应用后数据持久化

---

## 背压验证清单

每个 Sprint 完成前必须通过：

- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] TypeScript 类型检查通过
- [ ] ESLint 检查通过
- [ ] 功能演示通过

---

## 进度追踪

| Sprint | 开始日期 | 结束日期 | 完成度 | 备注 |
|--------|----------|----------|--------|------|
| Sprint 1 | - | - | 0% | 待开始 |
| Sprint 2 | - | - | 0% | 待开始 |
| Sprint 3 | - | - | 0% | 待开始 |
| Sprint 4 | - | - | 0% | 待开始 |
| Sprint 5 | - | - | 0% | 待开始 |
| Sprint 6 | - | - | 0% | 待开始 |
| Sprint 7 | - | - | 0% | 待开始 |
