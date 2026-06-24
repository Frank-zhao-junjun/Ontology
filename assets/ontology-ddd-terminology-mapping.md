我将为您生成《术语映射对照表.md》文件。由于我无法直接生成可下载文件，以下是完整的Markdown内容，您可以复制保存为`.md`文件。

---

```markdown
# Ontology-DDD 术语映射对照表

## Ontology-Driven Metamodeling & Domain-Driven Design Terminology Mapping

**版本**：v1.0  
**日期**：2026-03-30  
**状态**：基于A决策（完全对齐）确认  

---

## 一、核心映射原则

> **原则**：Ontology建模与DDD建模完全对齐，消除概念混淆，确保运行时生成的代码符合DDD架构规范。

```
Ontology 建模层（设计时）          代码生成           DDD 实现层（运行时）
    领域  ─────────────────────→    限界上下文
    项目  ─────────────────────→    模块
    实体  ─────────────────────→    聚合（强制聚合根）
   五大模型 ───────────────────→    聚合结构+领域服务
```

---

## 二、完整术语映射表

### 2.1 架构层级映射

| Ontology术语 | DDD术语 | 英文对照 | 强制约束 | 说明 |
|:---|:---|:---|:---|:---|
| **领域** | **限界上下文** | Bounded Context | 1:1对应 | 8大行业领域 = 8个限界上下文 |
| **项目** | **模块** | Module | 上下文内子分组 | 项目内按业务模块划分 |
| **实体** | **聚合** | Aggregate | `isAggregateRoot = true`（强制） | Ontology实体即DDD聚合 |
| **属性** | **值对象** | Value Object | 无标识，依附于聚合 | 属性的类型定义 |
| **关系** | **实体引用** | Entity Reference | 聚合间关联 | 外键关联，跨聚合边界 |

### 2.2 模型层级映射

| Ontology模型 | DDD概念 | 英文对照 | 实现方式 | 位置 |
|:---|:---|:---|:---|:---|
| **数据模型** | **聚合结构** | Aggregate Structure | 属性+关系定义 | 聚合边界内 |
| **行为模型** | **状态模式** | State Pattern | 聚合内状态流转 | 聚合根方法 |
| **规则模型** | **不变量** | Invariants | 聚合边界内校验 | 聚合根/值对象 |
| **流程模型** | **领域服务** | Domain Service | 跨聚合编排 | 领域服务层 |
| **事件模型** | **领域事件** | Domain Event | 聚合根发布 | 事件总线 |

---

## 三、详细概念对照

### 3.1 领域（Domain）↔ 限界上下文（Bounded Context）

| 维度 | Ontology定义 | DDD定义 | 对齐说明 |
|:---|:---|:---|:---|
| **定义** | 业务领域，如离散制造、金融服务 | 语义上下文边界，包含完整业务模型 | 完全对应 |
| **边界** | 8大预设领域 | 显式边界，内部统一语言 | 领域即上下文 |
| **内部结构** | 项目 → 实体 → 模型 | 模块 → 聚合 → 领域对象 | 层级对应 |
| **跨边界通信** | 通过事件（webhook） | 领域事件或 anticorruption layer | 事件驱动集成 |

**示例**：
```
Ontology: 领域 = 离散制造
    └── 项目 = 生产管理
        └── 实体 = 生产订单（聚合）

DDD: 限界上下文 = 离散制造上下文
    └── 模块 = 生产管理模块
        └── 聚合 = 生产订单聚合（ProductionOrder）
```

---

### 3.2 实体（Entity）↔ 聚合（Aggregate）

| 维度 | Ontology定义 | DDD定义 | 强制对齐 |
|:---|:---|:---|:---|
| **核心定义** | 业务对象，包含五大模型 | 一致性边界内的对象集群 | 实体即聚合 |
| **生命周期** | 独立创建、修改、删除 | 聚合根控制整体生命周期 | 强制`isAggregateRoot=true` |
| **标识** | 全局唯一ID | 聚合根全局ID，内部实体本地ID | 实体ID即聚合根ID |
| **发布事件** | 事件模型定义 | 只有聚合根可发布领域事件 | 强制校验 |
| **关系** | 与其他实体关联 | 聚合间通过聚合根引用 | 关系即聚合引用 |

**关键约束**：
```typescript
// Ontology实体定义（强制聚合根）
interface Entity {
  id: string;
  name: string;
  nameEn: string;
  isAggregateRoot: true;  // 强制为true，不可编辑
  
  // 五大模型即聚合内部结构
  dataModel: DataModel;        // 聚合结构
  behaviorModel: BehaviorModel; // 状态模式
  ruleModel: RuleModel;        // 不变量
  processModel: ProcessModel;   // （跨聚合时）领域服务
  eventModel: EventModel;       // 领域事件定义
}
```

**生成代码**：
```python
# DDD聚合实现（运行时生成）
class ProductionOrder(AggregateRoot):
    def __init__(self, id: str):
        self.id = id                    # 聚合根全局ID
        self._state = ProductionState.DRAFT  # 行为模型：状态
        self._lines: List[OrderLine] = []    # 数据模型：内部实体
        self._rules = ProductionRules()      # 规则模型：不变量
    
    def approve(self):                   # 行为模型：状态转换
        """聚合方法 = 状态机转换"""
        self._rules.validate_can_approve()   # 规则校验
        self._state = ProductionState.APPROVED
        self._register_event(ProductionOrderApproved(self.id))  # 事件模型
```

---

### 3.3 属性（Attribute）↔ 值对象（Value Object）

| 维度 | Ontology定义 | DDD定义 | 对齐说明 |
|:---|:---|:---|:---|
| **定义** | 实体的字段定义 | 无标识的业务概念 | 属性即值对象 |
| **标识** | 无独立ID | 无标识，通过属性值判断相等 | 完全对应 |
| **不变性** | 类型、约束定义 | 创建后不可变 | 运行时生成不可变对象 |
| **校验** | 规则模型字段校验 | 值对象自校验 | 规则嵌入值对象 |

**类型映射**：
| Ontology类型 | DDD值对象类型 | 示例 |
|:---|:---|:---|
| `string` | `StringValue` | `ContractNo("HT-2025-001")` |
| `decimal` | `Money` | `Money(100000, Currency.CNY)` |
| `date` | `DateValue` | `DateValue(2025, 3, 30)` |
| `enum` | `EnumValue` | `ContractStatus.DRAFT` |
| `reference` | `EntityId` | `CustomerId("CUST-001")` |

---

### 3.4 关系（Relation）↔ 聚合引用（Aggregate Reference）

| 维度 | Ontology定义 | DDD定义 | 对齐说明 |
|:---|:---|:---|:---|
| **定义** | 实体间关联 | 聚合根之间的引用 | 关系即聚合间关联 |
| **类型** | 一对一/一对多/多对多 | 聚合关联 | 相同 |
| **实现** | 外键字段 | 聚合根ID引用 | 生成外键字段 |
| **约束** | 通过关系关联 | 不允许直接引用其他聚合内部实体 | 强制通过聚合根 |

**关系类型映射**：
| Ontology关系 | DDD实现 | 代码示例 |
|:---|:---|:---|
| `one_to_one` | 聚合根持有对方ID | `class Contract: customer_id: CustomerId` |
| `one_to_many` | 聚合根持有集合ID | `class Customer: contract_ids: List[ContractId]` |
| `many_to_many` | 通过领域服务或关联对象 | `ContractProductService` |

---

### 3.5 五大模型详细映射

#### 3.5.1 数据模型（Data Model）↔ 聚合结构

| Ontology概念 | DDD概念 | 说明 |
|:---|:---|:---|
| 实体属性 | 值对象属性 | 属性的类型即值对象类型 |
| 实体关系 | 聚合引用 | 关系即聚合根ID引用 |
| 唯一约束 | 实体标识 | 主键即聚合根ID |
| 索引定义 | 仓储查询优化 | 生成数据库索引 |

#### 3.5.2 行为模型（Behavior Model）↔ 状态模式

| Ontology概念 | DDD概念 | 说明 |
|:---|:---|:---|
| 状态定义 | 状态枚举 | `ContractStatus` |
| 状态转换 | 聚合方法 | `contract.approve()` |
| 触发方式 | 方法调用 | 用户操作或领域服务调用 |
| 前置条件 | 聚合方法校验 | 方法内校验当前状态 |

**代码生成**：
```python
# 行为模型 → 状态模式实现
class Contract(AggregateRoot):
    class State(Enum):
        DRAFT = "draft"
        APPROVED = "approved"
        ACTIVE = "active"
    
    def approve(self):
        """行为模型：approve转换 → 聚合方法"""
        if self._state != State.DRAFT:
            raise InvalidStateError("只有草稿状态可审批")
        self._state = State.APPROVED
        self._register_event(ContractApproved(self.id))
```

#### 3.5.3 规则模型（Rule Model）↔ 不变量

| Ontology规则类型 | DDD不变量位置 | 实现方式 |
|:---|:---|:---|
| 字段校验 | 值对象构造器 | 值对象自校验 |
| 跨字段校验 | 聚合根方法 | 方法内多字段校验 |
| 跨实体校验 | 领域服务 | 跨聚合查询后校验 |
| 聚合校验 | 聚合根方法 | 遍历内部实体校验 |
| 时序规则 | 领域服务/事件 | 定时任务或事件触发 |

#### 3.5.4 流程模型（Process Model）↔ 领域服务

| Ontology概念 | DDD概念 | 说明 |
|:---|:---|:---|
| 流程编排 | 领域服务方法 | 跨聚合操作序列 |
| 步骤类型 | 服务内部逻辑 | 查询、校验、调用聚合方法 |
| 决策点 | 条件分支 | 服务内if/else或策略模式 |
| 入口点 | 应用服务接口 | 对外暴露的服务方法 |

**关键区别**：
- **聚合内**：行为模型（状态机）→ 聚合方法
- **跨聚合**：流程模型 → 领域服务

#### 3.5.5 事件模型（Event Model）↔ 领域事件

| Ontology概念 | DDD概念 | 强制约束 |
|:---|:---|:---|
| 事件定义 | 领域事件类 | 过去时命名 |
| 发布者 | 聚合根 | 强制`isAggregateRoot=true` |
| 订阅者 | 事件处理器 | 幂等性保证 |
| 载荷 | 事件属性 | 精简模式（最多5字段） |
| 事务边界 | 事务提交后发布 | 默认`AFTER_COMMIT` |

---

## 四、代码生成映射

### 4.1 生成结构对照

```
Ontology建模项目/
├── 领域：离散制造
│   └── 项目：生产管理
│       ├── 实体：生产订单（聚合）
│       │   ├── 数据模型 → 聚合结构
│       │   ├── 行为模型 → 状态模式（聚合方法）
│       │   ├── 规则模型 → 不变量（校验方法）
│       │   └── 事件模型 → 领域事件
│       └── 实体：物料（聚合）
│           └── ...
└── ...

生成代码结构（运行时）/
├── domain/
│   └── discrete_manufacturing/          # 限界上下文
│       ├── __init__.py
│       ├── aggregates/                  # 聚合层
│       │   ├── production_order.py      # 生产订单聚合
│       │   │   ├── __init__.py          # 聚合根
│       │   │   ├── value_objects.py     # 值对象（数据模型属性）
│       │   │   ├── events.py            # 领域事件（事件模型）
│       │   │   └── repository.py        # 仓储接口
│       │   └── material.py              # 物料聚合
│       ├── services/                    # 领域服务层
│       │   └── production_service.py    # 流程模型实现
│       └── events/
│           └── handlers.py              # 事件订阅处理器
├── application/
│   └── services.py                      # 应用服务（流程入口）
└── infrastructure/
    └── persistence/
        └── sqlite_repository.py         # 仓储实现
```

### 4.2 命名规范映射

| Ontology命名 | DDD命名 | 示例 |
|:---|:---|:---|
| `合同`（实体名） | `Contract`（聚合类名） | `class Contract(AggregateRoot)` |
| `contract_no`（属性名） | `ContractNo`（值对象类名） | `contract_no: ContractNo` |
| `approve`（转换名） | `approve`（聚合方法名） | `def approve(self): ...` |
| `ContractApproved`（事件名） | `ContractApproved`（事件类名） | `class ContractApproved(DomainEvent)` |
| `amount_positive`（规则名） | `validate_amount_positive`（校验方法） | 方法内调用 |

---

## 五、运行时行为映射

### 5.1 AI编排器与DDD交互

```
用户自然语言："审批合同2025-001"
        ↓
AI编排器：意图识别 → 实体链接 → 操作提取
        ↓
语义注入：Contract聚合定义 + approve方法 + 规则
        ↓
LLM生成：call_skill(contract_service.approve, {id: "2025-001"})
        ↓
工具执行：
    1. 仓储查询：repo.find_by_id("2025-001") → Contract聚合实例
    2. 调用方法：contract.approve()（行为模型：状态转换）
    3. 规则校验：validate_can_approve()（规则模型：不变量）
    4. 发布事件：register_event(ContractApproved)（事件模型：领域事件）
    5. 仓储保存：repo.save(contract)
        ↓
返回结果："合同2025-001已审批通过，状态变为已批准"
```

### 5.2 混合交互与DDD视图

| 运行时视图 | DDD概念展示 | 数据来源 |
|:---|:---|:---|
| **列表视图** | 聚合列表 | 仓储查询所有聚合根 |
| **表单视图** | 聚合详情/编辑 | 聚合根+内部实体+值对象 |
| **流程视图**（默认） | 行为模型状态机 | 状态机定义 |
| **ER图视图** | 聚合间关系 | 实体关系定义 |
| **表格视图** | 值对象集合 | 聚合内部实体列表 |
| **图表视图** | 领域统计 | 跨聚合查询（领域服务） |

---

## 六、常见混淆澄清

### 6.1 ❌ 错误理解 vs ✅ 正确理解

| 错误理解 | 正确理解 |
|:---|:---|
| "Ontology实体包含DDD实体和值对象" | "Ontology实体 = DDD聚合（仅聚合根），属性=值对象" |
| "关系是实体内部的" | "关系是聚合间的，通过聚合根ID引用" |
| "行为模型是跨实体的" | "行为模型是聚合内的，跨实体=流程模型=领域服务" |
| "事件可由任何实体发布" | "事件只能由聚合根发布（强制isAggregateRoot）" |
| "项目=DDD的聚合" | "项目=DDD的模块，实体=DDD的聚合" |

### 6.2 术语禁用对照

| 避免使用 | 使用 |
|:---|:---|
| "Ontology实体内部的DDD实体" | "聚合内部的实体（Entity）" |
| "非聚合根实体" | "聚合内的实体（非根）" |
| "实体的值对象" | "聚合的值对象属性" |
| "跨实体行为" | "领域服务（流程模型）" |
| "实体发布事件" | "聚合根发布领域事件" |

---

## 七、快速参考卡

```
┌─────────────────────────────────────────────────────────┐
│              Ontology-DDD 术语快速转换                    │
├─────────────────────────────────────────────────────────┤
│  我要创建...           →    DDD中称为...                 │
│  ─────────────────────────────────────────────────────  │
│  一个领域              →    一个限界上下文               │
│  一个项目              →    一个模块                     │
│  一个实体              →    一个聚合（强制聚合根）        │
│  一个属性              →    一个值对象                   │
│  一个关系              →    一个聚合引用                 │
│  数据模型              →    聚合结构                     │
│  行为模型-状态         →    状态枚举                     │
│  行为模型-转换         →    聚合方法                     │
│  规则模型              →    不变量                       │
│  流程模型              →    领域服务                     │
│  事件模型              →    领域事件                     │
└─────────────────────────────────────────────────────────┘
```

---

## 八、附录：类型定义（更新版）

```typescript
// Ontology类型（强制对齐DDD）
interface Domain {
  id: string;
  name: string;
  nameEn: string;
  // = DDD Bounded Context
}

interface Project {
  id: string;
  domainId: string;
  name: string;
  // = DDD Module
}

interface Entity {
  id: string;
  projectId: string;
  name: string;
  nameEn: string;
  isAggregateRoot: true;  // 强制true，即DDD Aggregate
  
  // 五大模型 = 聚合内部结构
  dataModel: DataModel;        // 聚合结构（属性+关系）
  behaviorModel: BehaviorModel; // 状态模式
  ruleModel: RuleModel;        // 不变量
  processModel: ProcessModel;   // 领域服务（跨聚合时）
  eventModel: EventModel;       // 领域事件定义
}

interface Attribute {
  id: string;
  entityId: string;
  name: string;
  type: string;
  // = DDD Value Object definition
}

interface Relation {
  id: string;
  sourceEntity: string;  // 当前聚合
  targetEntity: string;  // 目标聚合（必须是聚合根）
  type: 'one_to_one' | 'one_to_many' | 'many_to_many';
  // = DDD Aggregate Reference
}

// 五大模型（详见主规格说明书）
interface DataModel { /* ... */ }
interface BehaviorModel { /* ... */ }
interface RuleModel { /* ... */ }
interface ProcessModel { /* ... */ }
interface EventModel { /* ... */ }
```

---

**文档结束**

本对照表基于"完全对齐（A决策）"原则编制，确保Ontology建模与DDD实现的无缝映射，消除术语混淆，指导代码生成和运行时实现。
```

---

以上是完整的《术语映射对照表.md》内容 