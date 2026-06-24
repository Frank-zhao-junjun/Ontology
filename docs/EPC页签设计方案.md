# EPC页签设计方案

## 1. 目标定位

本方案为聚合根对象新增一个生成型 `EPC` 页签，将 EPC 定位为“聚合根业务活动规格说明书”，用于基于聚合根相关的：

- 数据对象
- 业务规则
- 事件
- 状态机

自动生成企业级 EPC 文档视图，并允许补充少量 EPC 专用元数据，以满足业务规格说明、导出交付、评审与审计场景。

### 1.1 产品定位

- EPC 不是新的主真值元模型。
- EPC 是聚合根的派生产物与规格说明视图。
- EPC 页签只对 `entityRole = aggregate_root` 的实体显示。
- EPC 文档默认由系统生成，用户只维护无法从四大元模型稳定推导出的补充语义。

### 1.2 设计原则

- 单一真值：数据、行为、规则、事件仍是核心真值。
- 派生生成：EPC 内容优先自动生成，不增加重复维护负担。
- 缺口显式化：无法自动推导的字段标记“待补充”，不做虚构生成。
- 企业规范化：输出结构对齐 EPC业务活动规格说明书 与 epc-generator skill 模板。

## 2. 适用范围与边界

### 2.1 适用对象

- 聚合根实体
- 需要输出业务活动规格说明书的业务对象
- 需要与 Coze / 代码导出 / 评审文档衔接的业务流程对象

### 2.2 不适用对象

- 聚合内子实体
- 纯技术型辅助实体
- 当前 `processModel` 中的AI编排步骤

### 2.3 与现有模型的关系

- 数据模型：提供聚合根、子实体、关键信息对象、主数据引用
- 行为模型：提供状态、状态转换、起止状态
- 规则模型：提供前置条件、分支条件、异常规则、合规控制
- 事件模型：提供触发事件、领域事件、订阅后动作
- EPC补充元数据：提供组织单元、执行系统、输入输出、SLA、KPI、合规说明等无法稳定推导的信息

## 3. 页面形态

### 3.1 导航位置

在聚合根实体详情下，原有：

- 数据对象
- 状态机
- 业务规则
- 事件

新增：

- EPC

### 3.2 显示条件

- 当实体为聚合根时显示 EPC 页签
- 当实体为子实体时不显示 EPC 页签
- 如果聚合根尚未具备最小生成条件，页签可显示，但正文提示“信息不足，待补充”

### 3.3 页面结构

EPC 页签建议拆为四个子区域：

1. 概览区
2. 补充配置区
3. 文档预览区
4. 自检与导出区

## 4. 最小数据模型

EPC 需要一层独立的补充语义，不建议复用当前 `processModel`。

### 4.1 新增顶层结构

建议在项目层新增：

```ts
interface EpcModel {
  id: string;
  name: string;
  version: string;
  profiles: EpcAggregateProfile[];
  generatedAt?: string;
  updatedAt: string;
}
```

### 4.2 聚合根 EPC 配置对象

```ts
interface EpcAggregateProfile {
  aggregateId: string;
  businessName: string;
  businessCode?: string;
  documentVersion: string;
  status: 'draft' | 'generated' | 'reviewed';
  purpose?: string;
  scopeStart?: string;
  scopeEnd?: string;
  businessBackground?: string;
  organizationalUnits: EpcOrganizationalUnit[];
  systems: EpcSystemActor[];
  informationObjects: EpcInformationObject[];
  activities: EpcActivityDefinition[];
  connectors: EpcConnectorDefinition[];
  exceptions: EpcExceptionDefinition[];
  kpis: EpcKpiDefinition[];
  integrations: EpcIntegrationDefinition[];
  complianceItems: EpcComplianceDefinition[];
  notes?: string;
  generatedDocument?: string;
  validationSummary?: EpcValidationSummary;
}
```

### 4.3 组织单元

```ts
interface EpcOrganizationalUnit {
  id: string;
  name: string;
  type?: 'role' | 'department' | 'system' | 'external_party';
  responsibilities?: string;
  permissions?: string;
}
```

### 4.4 系统对象

```ts
interface EpcSystemActor {
  id: string;
  name: string;
  type?: 'internal' | 'external' | 'platform';
  description?: string;
}
```

### 4.5 信息对象

```ts
interface EpcInformationObject {
  id: string;
  name: string;
  sourceType: 'aggregate' | 'child_entity' | 'masterdata' | 'manual';
  sourceRefId?: string;
  attributes: string[];
  description?: string;
}
```

### 4.6 EPC活动定义

```ts
interface EpcActivityDefinition {
  id: string;
  name: string;
  activityType: 'task' | 'auto_task' | 'review' | 'approval' | 'notification' | 'follow_up';
  derivedFrom: 'state_transition' | 'event' | 'rule' | 'manual';
  transitionId?: string;
  eventId?: string;
  ruleIds?: string[];
  ownerOrgUnitId?: string;
  systemId?: string;
  inputObjectIds?: string[];
  outputObjectIds?: string[];
  precondition?: string;
  postcondition?: string;
  sla?: string;
  enabled?: boolean;
}
```

### 4.7 连接器定义

```ts
interface EpcConnectorDefinition {
  id: string;
  type: 'xor' | 'and';
  sourceActivityId?: string;
  sourceEventId?: string;
  condition?: string;
  branches: {
    label: string;
    targetEventName: string;
    ruleId?: string;
  }[];
}
```

### 4.8 异常、KPI、集成、合规

```ts
interface EpcExceptionDefinition {
  id: string;
  name: string;
  triggerCondition: string;
  handlingFlow: string;
  ownerOrgUnitId?: string;
}

interface EpcKpiDefinition {
  id: string;
  name: string;
  target: string;
  measurement: string;
}

interface EpcIntegrationDefinition {
  id: string;
  systemName: string;
  integrationContent: string;
  integrationMode?: string;
  description?: string;
}

interface EpcComplianceDefinition {
  id: string;
  requirement: string;
  verificationMethod?: string;
}
```

## 5. 生成输入映射规则

### 5.1 数据模型到 EPC

- 聚合根实体映射为 EPC 主业务对象
- 聚合内子实体映射为信息对象候选项
- 主数据引用属性映射为外部信息对象候选项
- 聚合根关键属性映射到信息对象属性表

### 5.2 状态机到 EPC

- 初始状态优先生成开始事件候选
- 终态优先生成结束事件候选
- 状态转换优先生成功能活动
- 转换结果优先生成“已完成/已通过/已驳回/已确认”等事件节点

### 5.3 规则模型到 EPC

- 字段级/跨字段规则生成控制点说明
- 聚合校验/时序规则生成分支条件或异常处理
- 启用状态为 `enabled=false` 的规则默认不进入正文，仅作为候选

### 5.4 事件模型到 EPC

- `create` / `state_change` 事件优先转化为 EPC 事件节点
- 事件订阅不直接作为 EPC 事件，而是转化为自动任务、通知或集成动作候选
- 非聚合根事件不参与 EPC 生成

## 6. 主生成规则

### 6.1 最小生成条件

满足以下任一组合即可生成草案：

- 聚合根 + 至少1个状态机
- 聚合根 + 至少1个事件 + 至少1条规则
- 聚合根 + 用户手工补充至少1个活动定义

### 6.2 文档章节生成规则

#### 6.2.1 基本信息

来源：

- `businessName`
- `documentVersion`
- 聚合根名称
- 项目名称与领域名称
- 用户补充的 purpose/background/scope

#### 6.2.2 EPC流程概述

来源：

- 聚合根业务名称
- 初始状态/开始事件
- 终态/结束事件
- systems / organizationalUnits

#### 6.2.3 事件表

生成规则：

- 开始状态或创建事件生成开始事件
- 状态变化结果生成中间事件
- 终态或失败态生成结束事件
- 定时规则可生成边界事件

命名规则：

- 状态类：`对象 + 已完成/已提交/已审批/已确认`
- 异常类：`对象 + 已失败/已驳回/已超时`

#### 6.2.4 功能表

生成规则：

- 状态转换生成功能节点
- 订阅动作中属于系统自动执行的生成自动任务
- 手工补充活动可并入功能表

命名规则：

- `动词 + 宾语`
- 不允许“处理/维护/跟进”这类模糊动词作为默认命名

#### 6.2.5 规则表

生成规则：

- 直接来自规则模型
- EPC补充层可以追加“流程规则”说明

#### 6.2.6 组织单元表

生成规则：

- 不能从现有四个模型完整推导，必须来自 EPC 补充配置
- 系统可预填：`系统`、`外部参与方` 等默认项

#### 6.2.7 信息对象表

生成规则：

- 聚合根实体自动生成主信息对象
- 子实体自动生成从属信息对象候选
- 主数据引用生成外部信息对象候选
- 用户可增删候选项

#### 6.2.8 EPC流程链

生成规则：

- 优先按“事件 → 功能 → 事件”生成
- 若出现功能连续相连，则自动尝试插入结果事件
- 若无法可靠补齐，则标注“结构待确认”

#### 6.2.9 流程矩阵与连接关系

生成规则：

- 根据事件和功能链自动推导矩阵
- XOR/AND 仅在规则模型或补充连接器明确定义时生成
- 不生成 OR 连接器

#### 6.2.10 角色权限矩阵

生成规则：

- 基于 `activities.ownerOrgUnitId`
- 未绑定组织单元的活动显示“待补充”

#### 6.2.11 异常处理

生成规则：

- 来自异常规则、失败态、定时超时条件、手工异常定义

#### 6.2.12 性能指标、系统集成、合规要求

生成规则：

- 默认不自动臆造
- 需要用户在 EPC 补充配置中维护

## 7. UI交互方案

### 7.1 页签入口交互

- 仅聚合根显示 EPC 页签
- 子实体 hover 时可提示“EPC仅支持聚合根”

### 7.2 页签内部布局

建议采用左右布局：

- 左侧：配置面板
- 右侧：文档预览面板

或上下布局：

- 顶部：状态与操作条
- 中部：配置与预览双栏
- 底部：校验结果与导出按钮

### 7.3 顶部操作条

包含：

- 重新生成
- 查看差异
- 仅刷新预览
- 导出 Markdown
- 导出 JSON
- 完整性自检

### 7.4 概览卡片

展示：

- 聚合根名称
- 生成状态
- 事件数
- 功能数
- 规则数
- 信息对象数
- 缺失项数量

### 7.5 补充配置交互

建议拆成折叠区：

1. 基本信息
2. 组织单元
3. 系统与外部参与方
4. 信息对象候选
5. 活动与责任绑定
6. 分支与异常
7. KPI/集成/合规

### 7.6 自动与手动边界

- 系统自动生成的字段显示“派生”标识
- 用户覆盖修改的字段显示“手工覆盖”标识
- 支持“恢复自动值”

### 7.7 预览交互

- Markdown 预览
- 章节侧边导航
- 章节折叠
- 缺失项高亮
- 自检结果跳转定位

## 8. 自检与校验规则

### 8.1 第一层校验

沿用并扩展 epc-generator validator 的检查项：

- 事件完整性
- 功能完整性
- 规则完整性
- 信息对象完整性
- 流程链完整性
- 流程矩阵完整性
- 连接关系完整性

### 8.2 第二层结构校验

新增强约束：

- 至少1个开始事件
- 至少1个结束事件
- 事件与功能应严格交替
- 禁止功能→功能直接连接，除非系统自动插入中间事件
- 禁止事件→事件直接连接
- XOR/AND 连接器必须有明确条件
- 每个功能必须绑定组织单元或系统
- 所有路径必须可到达结束事件

### 8.3 第三层覆盖率提示

提示但不阻断：

- 缺少 KPI
- 缺少合规项
- 缺少系统集成
- 信息对象属性过少

## 9. 导出格式

### 9.1 文档导出

导出路径建议：

```txt
epc/{aggregate-name}.md
```

内容结构严格对齐 EPC业务活动规格说明书 模板：

- 1. 基本信息
- 2. EPC流程概述
- 3. EPC元素定义
- 4. EPC流程链
- 5. EPC流程矩阵
- 6. EPC元素连接关系
- 7. 角色和权限矩阵
- 8. 异常处理
- 9. 性能指标
- 10. 系统集成
- 11. 合规要求
- 12. EPC完整性自检
- 13. 附录

### 9.2 结构化导出

建议同时导出：

```json
epc/{aggregate-name}.json
```

包含：

- 原始派生数据
- 用户补充数据
- 最终文档快照
- 校验结果

### 9.3 导出 manifest 扩展

建议在导出 manifest 中追加：

- `epcCount`
- `epcAggregates`
- `generatedEpcAt`

## 10. 与现有仓库的落地方式

### 10.1 类型层

- 在 `src/types/ontology.ts` 中新增 `EpcModel` 及相关接口

### 10.2 Store层

- 在 `src/store/ontology-store.ts` 中新增 `epcModel`
- 提供 `setEpcProfile`、`updateEpcProfile`、`regenerateEpcDocument` 等动作

### 10.3 UI层

- 新增 `src/components/ontology/epc-tab.tsx`
- 在聚合根实体详情区挂载 EPC 页签

### 10.4 生成器层

- 新增 `src/lib/epc-generator/index.ts`
- 负责将四大元模型 + EPC补充元数据映射为文档与结构化结果

### 10.5 导出层

- 在 `src/lib/configexporter/index.ts` 中增加 EPC 导出

### 10.6 测试层

至少补：

- 单测：映射规则
- 单测：结构校验
- 集成测试：聚合根 EPC 页签显示与再生成
- 集成测试：Markdown 导出

## 11. 分阶段实施建议

### Phase 1

- 新增 EPC 页签
- 新增 EPC profile 最小字段
- 实现 Markdown 草案生成
- 展示缺失项提示

### Phase 2

- 增加活动责任绑定
- 增加信息对象与异常/KPI/合规配置
- 增加完整性校验

### Phase 3

- 增加导出到 config package
- 增加差异对比
- 增加AI辅助补全文案

## 12. 最终结论

EPC 应被实现为“聚合根下的生成型业务活动规格说明书页签”，而不是恢复旧流程模型或新增一套手工流程编辑器。

最优实现路径是：

- 以四大元模型为主真值
- 通过 EPC补充元数据填补组织、系统、输入输出、SLA、KPI、合规等信息缺口
- 自动生成企业级 EPC 文档
- 允许有限覆盖与校验

这样既能保持你当前产品的建模主线不跑偏，也能把 EPC 文档能力正式收入口径统一的产品体系。