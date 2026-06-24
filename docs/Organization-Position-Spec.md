# 组织体系与岗位模型规格

> 版本: 2.0 | 状态: Draft  
> 前置: EPC-Upgrade-Spec v3.1, Entity-Lifecycle-Spec v2.0  
> 目标: 补齐本体模型的组织架构建模能力，支持 HR 系统定时同步，使 EPC 的 OrganizationalUnit 节点有真实模型可引用

---

## 一、现状与缺口

| 现有模型 | 能力 | 缺口 |
|---------|------|------|
| `GovernanceRole` | 权限角色 (RBAC)，只有 name + permissions | 不是组织架构，无层级、无岗位 |
| `EpcOrganizationalUnit` | EPC 内嵌扁平组织，type=role/department/system/external_party | 不是一级模型，无 CRUD，无层级树 |
| `GovernanceAgentPolicy.roleId` | 引用角色 | 没有岗位概念 |
| `Position.responsibilities` | `string?` 自由文本 | 无法被 EPC/Agent/Lifecycle 结构化引用 |

**核心问题**: 
1. 本体模型有"谁能做什么"(Governance)，但缺少"谁在哪"(Organization)
2. 岗位职责仅为自由文本，无法被 Agent 理解、无法做职责冲突校验
3. 组织架构数据与 HR 系统割裂，手动维护成本高且易过时

---

## 二、新增模型定义

### 2.1 组织模型 (OrganizationModel)

```typescript
// ========== 组织体系模型 ==========

/** 部门类型 */
export type DepartmentType = 'headquarters' | 'division' | 'department' | 'team' | 'group';

/** 部门 */
export interface Department {
  id: string;
  name: string;                        // 部门名称
  nameEn: string;                      // 英文名称
  code?: string;                       // 部门编码
  type: DepartmentType;                // 部门类型
  parentId?: string;                   // 上级部门ID（组织树）
  managerPositionId?: string;          // 部门负责人岗位ID
  description?: string;
  sortOrder?: number;                  // 排序
  status: 'active' | 'inactive';      // 状态
  metadata?: Record<string, string>;   // 扩展属性
  // --- HR 同步字段 ---
  syncSource?: string;                 // 同步来源，如 'feishu' | 'dingtalk' | 'sap' | 'workday'
  syncExternalId?: string;             // HR 系统中的外部ID
  syncUpdatedAt?: string;              // 最后同步时间 ISO 8601
}

/** 岗位职责项 */
export interface PositionResponsibility {
  id: string;
  name: string;                        // 职责名称，如"采购审批"
  description?: string;                // 详细描述
  scope: 'entity' | 'process' | 'domain' | 'custom';
  scopeRefs: string[];                 // 关联的 Entity/Process/Domain IDs
  actions: string[];                   // 可执行的 Action IDs
  decisionAuthority: 'none' | 'recommend' | 'approve' | 'veto';
  delegateToPositionIds?: string[];    // 可委托的岗位IDs
  isActive: boolean;
}

/** 岗位 */
export interface Position {
  id: string;
  name: string;                        // 岗位名称
  nameEn: string;                      // 英文名称
  code?: string;                       // 岗位编码
  departmentId: string;                // 所属部门ID
  parentPositionId?: string;           // 上级岗位（汇报线）
  level?: number;                      // 岗位层级
  roleIds: string[];                   // 关联的治理角色IDs → GovernanceRole
  headcount?: number;                  // 编制人数
  responsibilities: PositionResponsibility[];  // 结构化职责
  requiredCompetencies?: string[];     // 任职要求
  status: 'active' | 'inactive';
  metadata?: Record<string, string>;
  // --- HR 同步字段 ---
  syncSource?: string;                 // 同步来源
  syncExternalId?: string;             // HR 系统中的外部ID
  syncUpdatedAt?: string;              // 最后同步时间 ISO 8601
}

/** 组织模型 */
export interface OrganizationModel {
  id: string;
  departments: Department[];
  positions: Position[];
  createdAt: string;
  updatedAt: string;
  // --- HR 同步配置 ---
  syncConfig?: HRSyncConfig;           // 同步配置
  lastSyncResult?: HRSyncResult;       // 最近一次同步结果
}
```

### 2.2 HR 同步配置与结果

```typescript
/** HR 系统同步配置 */
export interface HRSyncConfig {
  enabled: boolean;                    // 是否启用自动同步
  source: HRSyncSource;               // 同步来源
  endpoint?: string;                   // HR 系统 API 端点（由后端安全存储）
  syncInterval: HRSyncInterval;        // 同步频率
  fieldMapping: HRFieldMapping;        // HR 字段 → 本体模型字段映射
  conflictStrategy: HRConflictStrategy;// 冲突策略
  syncScope: HRSyncScope;             // 同步范围
}

/** HR 同步来源 */
export type HRSyncSource = 
  | 'feishu'       // 飞书
  | 'dingtalk'     // 钉钉
  | 'wechat_work'  // 企业微信
  | 'sap'          // SAP HCM
  | 'workday'      // Workday
  | 'custom_api';  // 自定义 API

/** 同步频率 */
export type HRSyncInterval = 
  | 'realtime'     // 实时（Webhook 回调）
  | 'hourly'       // 每小时
  | 'daily'        // 每天
  | 'weekly'       // 每周
  | 'manual';      // 仅手动触发

/** HR 字段映射 */
export interface HRFieldMapping {
  department: {
    name?: string;          // HR 部门名称字段路径，如 'department_name'
    nameEn?: string;        // HR 英文名称字段路径
    code?: string;          // HR 部门编码字段路径
    parentId?: string;      // HR 上级部门字段路径
    type?: string;          // HR 部门类型字段路径
    managerId?: string;     // HR 部门负责人字段路径
    status?: string;        // HR 状态字段路径
  };
  position: {
    name?: string;          // HR 岗位名称字段路径
    nameEn?: string;        // HR 英文名称字段路径
    code?: string;          // HR 岗位编码字段路径
    departmentCode?: string;// HR 所属部门编码字段路径
    parentCode?: string;    // HR 上级岗位编码字段路径
    level?: string;         // HR 岗位层级字段路径
    headcount?: string;     // HR 编制人数字段路径
    status?: string;        // HR 状态字段路径
  };
}

/** 冲突策略 */
export type HRConflictStrategy = 
  | 'hr_wins'       // HR 数据覆盖本地（默认）
  | 'local_wins'    // 保留本地修改
  | 'merge'         // 合并（HR 数据填充空字段，已有字段保留）
  | 'manual';       // 标记冲突，人工审核

/** 同步范围 */
export interface HRSyncScope {
  syncDepartments: boolean;            // 是否同步部门
  syncPositions: boolean;              // 是否同步岗位
  syncResponsibilities: boolean;       // 是否同步职责（少数 HR 系统支持）
  includeInactive: boolean;            // 是否包含停用的部门/岗位
  departmentFilter?: {                 // 部门过滤（如只同步特定根部门下）
    rootCodes?: string[];              // 根部门编码列表
  };
}

/** HR 同步结果 */
export interface HRSyncResult {
  syncId: string;                      // 同步记录ID
  triggeredAt: string;                 // 触发时间
  completedAt?: string;                // 完成时间
  status: 'success' | 'partial' | 'failed';
  source: HRSyncSource;
  summary: {
    departments: {
      total: number;                   // HR 侧部门总数
      created: number;                 // 本地新增
      updated: number;                 // 本地更新
      deactivated: number;             // 本地停用（HR 侧已不存在）
      unchanged: number;               // 无变化
    };
    positions: {
      total: number;
      created: number;
      updated: number;
      deactivated: number;
      unchanged: number;
    };
  };
  conflicts?: HRSyncConflict[];        // 冲突列表
  errors?: HRSyncError[];              // 错误列表
}

/** 同步冲突 */
export interface HRSyncConflict {
  type: 'department' | 'position';
  externalId: string;                  // HR 系统中的 ID
  localId: string;                     // 本地 ID
  field: string;                       // 冲突字段
  hrValue: string;                     // HR 侧值
  localValue: string;                  // 本地值
  resolution?: 'hr_wins' | 'local_wins' | 'merged'; // 解决方式
}

/** 同步错误 */
export interface HRSyncError {
  type: 'department' | 'position';
  externalId?: string;
  code: string;                        // 错误码，如 'REF_NOT_FOUND'
  message: string;                     // 错误描述
  detail?: string;                     // 详细信息
}
```

### 2.3 数据关系图

```
OrganizationModel
  ├── Department[] (树形结构 via parentId)
  │     ├── syncExternalId → HR 系统
  │     └── Position[] (via departmentId)
  │           ├── syncExternalId → HR 系统
  │           ├── roleIds[] → GovernanceRole (跨模型引用)
  │           ├── responsibilities[] → PositionResponsibility
  │           │     ├── scopeRefs[] → Entity / Process / Domain
  │           │     ├── actions[] → Action
  │           │     └── delegateToPositionIds[] → Position
  │           └── parentPositionId → Position (汇报线)
  │
  ├── syncConfig → HRSyncConfig
  │     ├── source: feishu | dingtalk | sap | workday | custom_api
  │     ├── syncInterval: realtime | hourly | daily | weekly | manual
  │     └── conflictStrategy: hr_wins | local_wins | merge | manual
  │
  └── EPC 引用:
        EpcOrganizationalUnit.refType = 'department' | 'position'
        EpcOrganizationalUnit.refId = Department.id | Position.id
```

### 2.4 与现有模型的关系

| 关联 | 说明 |
|------|------|
| Organization → Governance | Position.roleIds → GovernanceRole.id，岗位继承角色的权限 |
| Organization → EPC | EpcOrganizationalUnit 引用 Department/Position |
| Organization → Behavior | PositionResponsibility.actions → Action，岗位在哪些 State 下可操作 |
| Organization → Rule | Constraint.role → 通过 Role 关联到 Position |
| Organization → Process | Step.responsibleRole → 通过 Role 关联到 Position |
| Organization → Event | Subscription → 可关联 Position 作为事件处理方 |
| Organization → Metrics | Metric.boundActionId → Action → Position → Department |
| Organization → Lifecycle | State.allowedRoles → Position → responsibilities.actions 校验一致性 |
| Organization → Agent | AgentPolicy → Position → responsibilities.decisionAuthority |
| Organization → HR | Department/Position.syncExternalId ↔ HR 系统双向标识 |

---

## 三、Store 变更

### 3.1 OntologyProject 新增字段

```typescript
interface OntologyProject {
  // ... 现有字段
  organizationModel?: OrganizationModel | null;  // 新增
}
```

### 3.2 Store 新增方法

```typescript
// 组织模型操作
addDepartment(department: Omit<Department, 'id'>): Department;
updateDepartment(deptId: string, department: Partial<Department>): void;
deleteDepartment(deptId: string): void;

addPosition(position: Omit<Position, 'id'>): Position;
updatePosition(positionId: string, position: Partial<Position>): void;
deletePosition(positionId: string): void;

// 岗位职责操作
addPositionResponsibility(positionId: string, resp: Omit<PositionResponsibility, 'id'>): void;
updatePositionResponsibility(positionId: string, respId: string, resp: Partial<PositionResponsibility>): void;
deletePositionResponsibility(positionId: string, respId: string): void;

// HR 同步
updateHRSyncConfig(config: HRSyncConfig): void;
getHRSyncConfig(): HRSyncConfig | undefined;
setLastSyncResult(result: HRSyncResult): void;

// 辅助查询
getDepartmentTree(): DepartmentTreeNode[];       // 返回组织树
getPositionsByDepartment(deptId: string): Position[];
getPositionsByRole(roleId: string): Position[];  // 反查：哪些岗位有此角色
getDepartmentById(deptId: string): Department | undefined;
getPositionById(positionId: string): Position | undefined;
getResponsibilityConflicts(): ResponsibilityConflict[];  // 职责重叠检测
```

### 3.3 DepartmentTreeNode 类型

```typescript
interface DepartmentTreeNode {
  department: Department;
  positions: Position[];
  children: DepartmentTreeNode[];
}

/** 职责重叠检测结果 */
interface ResponsibilityConflict {
  positionA: { id: string; name: string };
  positionB: { id: string; name: string };
  overlappingScopeRefs: string[];
  overlappingActions: string[];
  severity: 'warning' | 'info';
}
```

---

## 四、HR 同步 API

### 4.1 API 路由

#### 手动触发同步

```
POST /api/hr-sync/trigger
```

**请求体**:
```json
{
  "source": "feishu",
  "scope": {
    "syncDepartments": true,
    "syncPositions": true,
    "syncResponsibilities": false,
    "includeInactive": false
  }
}
```

**返回格式**:
```json
{
  "success": true,
  "data": {
    "syncId": "sync-xxx",
    "triggeredAt": "2026-06-15T10:00:00Z",
    "status": "success",
    "summary": {
      "departments": { "total": 45, "created": 2, "updated": 5, "deactivated": 0, "unchanged": 38 },
      "positions": { "total": 120, "created": 3, "updated": 8, "deactivated": 1, "unchanged": 108 }
    }
  }
}
```

#### 获取同步配置

```
GET /api/hr-sync/config
```

#### 更新同步配置

```
PUT /api/hr-sync/config
```

**请求体**: `HRSyncConfig`

#### 获取同步历史

```
GET /api/hr-sync/history?limit=20
```

**返回**: `HRSyncResult[]`（最近 N 次同步记录）

#### 处理同步冲突

```
POST /api/hr-sync/resolve-conflict
```

**请求体**:
```json
{
  "syncId": "sync-xxx",
  "conflicts": [
    { "type": "department", "externalId": "hr-dept-001", "resolution": "hr_wins" },
    { "type": "position", "externalId": "hr-pos-042", "resolution": "local_wins" }
  ]
}
```

### 4.2 同步流程

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  定时/手动    │───▶│  拉取 HR 数据  │───▶│  差异比对     │───▶│  执行同步     │
│  触发同步     │    │  (API调用)    │    │  (3-way diff)│    │              │
└─────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                                   │
                                              ┌────────────────────┼─────────────────┐
                                              ▼                    ▼                  ▼
                                        ┌──────────┐        ┌──────────┐       ┌──────────┐
                                        │ 新增      │        │ 更新      │       │ 停用      │
                                        │ (created) │        │ (updated) │       │(deactivated)│
                                        └──────────┘        └──────────┘       └──────────┘
                                              │                    │                  │
                                              │           ┌────────┴────────┐           │
                                              │           ▼                  ▼           │
                                              │     ┌──────────┐     ┌──────────┐     │
                                              │     │ 无冲突    │     │ 有冲突    │     │
                                              │     │ 直接更新  │     │ 按策略处理 │     │
                                              │     └──────────┘     └──────────┘     │
                                              │                                         │
                                              └──────────────┬──────────────────────────┘
                                                             ▼
                                                    ┌──────────────┐
                                                    │ 写入 Store    │
                                                    │ 更新 syncXxx  │
                                                    │ 生成 SyncResult│
                                                    └──────────────┘
```

### 4.3 差异比对算法

```
对于 HR 侧每个部门/岗位 (externalId):
  1. 查找本地: localItem = findBy(syncExternalId === externalId)
  2. 若不存在 → 新增 (created)
  3. 若存在 → 逐字段比对:
     a. 本地字段与 HR 字段一致 → unchanged
     b. 本地字段有值且与 HR 不同 → conflict (按 conflictStrategy 处理)
     c. 本地字段为空 → 填充 HR 值 (updated)
  4. HR 侧不存在的本地记录 (syncExternalId 有值) → deactivated
```

### 4.4 安全要求

| 安全项 | 要求 |
|--------|------|
| API 凭证 | HR 系统 API Key/Secret 存储在后端环境变量，**禁止**存入 Store/前端 |
| 传输加密 | 所有 HR API 调用必须 HTTPS |
| 数据脱敏 | 同步日志中不得记录员工个人信息（姓名、手机号等） |
| 权限控制 | 同步操作需管理员权限 |
| 审计 | 每次同步生成 HRSyncResult，保留完整变更记录 |

---

## 五、EPC 关联变更

### 5.1 EpcOrganizationalUnit 增强

```typescript
export interface EpcOrganizationalUnit {
  id: string;
  name: string;
  type?: EpcOrganizationalUnitType;
  responsibilities?: string;
  permissions?: string;
  // 新增：引用组织模型
  refType?: 'department' | 'position';    // 引用类型
  refId?: string;                         // Department.id 或 Position.id
}
```

### 5.2 EpcOrganizationalUnitType 扩展

```typescript
export type EpcOrganizationalUnitType = 
  | 'department'     // 部门 → 引用 OrganizationModel.Department
  | 'position'       // 岗位 → 引用 OrganizationModel.Position  
  | 'role'           // 角色 → 引用 GovernanceModel.GovernanceRole
  | 'system'         // 系统角色
  | 'external_party'; // 外部参与方
```

---

## 六、指标体系与 EPC 关联

### 6.1 现状

`MetricsModel` 已存在，但 EPC 中的 `EpcKpiDefinition` 与 `Metric` 没有关联——两套独立定义。

### 6.2 关联方案

```typescript
export interface EpcKpiDefinition {
  id: string;
  name: string;
  target: string;
  measurement: string;
  // 新增：引用指标模型
  metricId?: string;         // → Metric.id
  metricNameEn?: string;     // → Metric.nameEn (冗余，便于展示)
}

export interface Metric {
  // ... 现有字段
  // 新增：EPC 反向引用
  epcRefs?: EpcModelRef[];   // 被哪些 EPC 节点引用
}
```

### 6.3 指标体系在 EPC 中的展现

| EPC 节点 | 关联指标 | 展示 |
|---------|---------|------|
| Function 节点 | 该活动的 KPI | 节点下方 Badge 显示指标名+目标值 |
| Event 节点 | 触发后更新的指标 | 节点下方 Badge |
| Info Object 节点 | 数据质量指标 | 节点下方 Badge |

---

## 七、双向校验规则新增

### 7.1 VM-O: 组织模型 → EPC 校验

| 规则ID | 严重级别 | 规则 | 说明 |
|--------|---------|------|------|
| VM-O-01 | warning | 部门覆盖 | active 部门应至少被一个 EPC OrganizationalUnit 引用 |
| VM-O-02 | warning | 岗位覆盖 | active 岗位应至少被一个 EPC OrganizationalUnit 引用 |
| VM-O-03 | error | 角色关联 | Position.roleIds 中的 GovernanceRole 必须存在 |
| VM-O-04 | error | 部门树完整性 | Department.parentId 引用的上级部门必须存在且无环 |
| VM-O-05 | warning | 岗位归属 | 每个 active 岗位必须归属一个 active 部门 |
| VM-O-06 | warning | 职责冲突 | 两个岗位的 responsibilities 不应有 scopeRefs 交集 + actions 交集同时非空 |
| VM-O-07 | warning | 职责覆盖 | 有 responsibilities 的岗位，其 actions 应在对应 Entity 的 Action 中存在 |
| VM-O-08 | info | 委托链 | delegateToPositionIds 应形成有向无环图，禁止循环委托 |

### 7.2 VM-HR: HR 同步校验

| 规则ID | 严重级别 | 规则 | 说明 |
|--------|---------|------|------|
| VM-HR-01 | error | 同步引用完整性 | syncExternalId 有值时，HR 侧应能查到对应记录 |
| VM-HR-02 | warning | 同步时效 | syncUpdatedAt 距今超过 syncInterval × 3 时告警 |
| VM-HR-03 | warning | 孤儿记录 | 有 syncExternalId 但 HR 侧已不存在的记录，应标记 deactivated |
| VM-HR-04 | info | 配置完整性 | enabled=true 时 source/endpoint/syncInterval 必须有值 |

### 7.3 VM-M 增强: 指标模型 → EPC 校验

| 规则ID | 严重级别 | 规则 | 说明 |
|--------|---------|------|------|
| VM-M-03 | warning | 指标覆盖 | Metric 应至少被一个 EPC KpiDefinition 引用 |
| VM-M-04 | error | EPC指标引用 | EpcKpiDefinition.metricId 引用的 Metric 必须存在 |

### 7.4 VE 增强: EPC → 组织校验

| 规则ID | 严重级别 | 规则 | 说明 |
|--------|---------|------|------|
| VE-O-01 | error | 组织引用存在性 | EpcOrganizationalUnit.refId 引用的 Department/Position 必须存在 |
| VE-O-02 | error | 组织引用类型匹配 | refType='department' 时 refId 必须是 Department，refType='position' 时必须是 Position |

### 7.5 VX 增强: 交叉一致性

| 规则ID | 严重级别 | 规则 | 说明 |
|--------|---------|------|------|
| VX-O-01 | error | 岗位角色一致性 | EPC 中 Position 关联的 roleIds 应与 GovernanceRole 权限对齐 |
| VX-O-02 | warning | 指标对齐 | EPC KpiDefinition.metricId 关联的 Metric 的 boundActionId 应与 EPC Function 节点引用的 Action 一致 |
| VX-O-03 | warning | 职责-Lifecycle 一致 | PositionResponsibility.actions 应在 State.allowedRoles 关联的 Role 可达的 Action 范围内 |
| VX-O-04 | info | 职责-EPC 覆盖 | PositionResponsibility 中 scopeRefs 引用的 Entity/Process 应出现在 EPC 链路中 |

---

## 八、UI 组件

### 8.1 新增组件

| 组件 | 路径 | 说明 |
|------|------|------|
| OrganizationEditor | `components/ontology/organization-editor.tsx` | 组织模型编辑器（部门树 + 岗位列表） |
| DepartmentTree | `components/ontology/department-tree.tsx` | 部门树形组件（展开/折叠/拖拽排序） |
| PositionList | `components/ontology/position-list.tsx` | 岗位列表（按部门筛选，关联角色多选） |
| PositionResponsibilityEditor | `components/ontology/position-responsibility-editor.tsx` | 岗位职责编辑器（结构化） |
| HRSyncPanel | `components/ontology/hr-sync-panel.tsx` | HR 同步配置面板 + 同步历史 + 冲突处理 |

### 8.2 OrganizationEditor 布局

```
┌──────────────────────────────────────────────────────────────┐
│  组织体系与岗位模型                         [⚙ HR同步] [同步]  │
├───────────────────┬──────────────────────────────────────────┤
│  部门树            │  岗位列表 [部门: 生产部 ▾]                  │
│  ├─ 集团总部       │  ┌──────────────────────────────────┐    │
│  │  ├─ 生产管理部   │  │ 生产主管                          │    │
│  │  │  └─ 车间调度组 │  │ 部门: 车间调度组                   │    │
│  │  └─ 质量管理部   │  │ 角色: [生产经理, 调度员]            │    │
│  │  └─ 仓储物流部   │  │ 层级: 3 | 编制: 2                 │    │
│  └─ 信息技术部     │  │ 职责:                              │    │
│  [+ 添加部门]      │  │   • 采购审批 [approve] → 物料       │    │
│                   │  │   • 质量审核 [veto] → 质检流程       │    │
│                   │  └──────────────────────────────────┘    │
│                   │  [+ 添加岗位]                             │
├───────────────────┴──────────────────────────────────────────┤
│  关联视图: 岗位 × 角色 × 职责 × EPC 权限矩阵                   │
└──────────────────────────────────────────────────────────────┘
```

### 8.3 HRSyncPanel 布局

```
┌──────────────────────────────────────────────────────────────┐
│  HR 系统同步                                                  │
├──────────────────────────────────────────────────────────────┤
│  数据源: [飞书 ▾]   同步频率: [每天 ▾]   冲突策略: [HR优先 ▾]   │
│  同步范围: ☑ 部门  ☑ 岗位  ☐ 职责  ☐ 包含停用                  │
│  字段映射: [配置映射表...]                                     │
│                                                              │
│  [立即同步]    最近同步: 2026-06-15 10:00 ✓ 45部门/120岗位      │
├──────────────────────────────────────────────────────────────┤
│  同步历史                                                     │
│  ┌───────┬──────────┬────────┬───────────────────────────┐   │
│  │ 时间   │ 来源      │ 状态   │ 变更摘要                   │   │
│  │ 06-15 │ feishu    │ ✓ 成功 │ +2部门 +3岗位 -1岗位        │   │
│  │ 06-14 │ feishu    │ ⚠ 部分 │ 3个冲突待处理               │   │
│  │ 06-13 │ feishu    │ ✓ 成功 │ 无变化                      │   │
│  └───────┴──────────┴────────┴───────────────────────────┘   │
├──────────────────────────────────────────────────────────────┤
│  待处理冲突 (3)                              [批量处理]        │
│  ┌──────────────────────────────────────────────────────┐    │
│  │ 部门: 生产管理部                                      │    │
│  │ HR: "生产运营部" vs 本地: "生产管理部"                  │    │
│  │ [HR优先] [本地优先] [合并] [稍后处理]                    │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### 8.4 建模工作台 Tab 新增

```
数据 | 行为 | 规则 | 事件 | EPC | 组织 | ... | 元数据 | 指标 | 治理 | 数据源
                                      ^^^^
                                    新增Tab
```

---

## 九、Excel 导入扩展

### 9.1 概述

在现有 Excel 导入功能（6 个 Sheet: 实体/属性/关系/状态机/规则/事件）基础上，新增 **2 个 Sheet**（部门/岗位），使模板包含 8 个数据 Sheet + 1 个填写说明 Sheet。

**导入策略**：
- 组织数据（部门+岗位）与核心模型数据可**同一次导入**或**单独导入**
- 单独导入时只需上传包含部门/岗位 Sheet 的文件，其余 Sheet 可省略
- 同一次导入时，岗位的 `所属部门编码` 必须引用同一文件中部门 Sheet 的 `部门编码`

### 9.2 新增 Sheet 定义

#### 部门 Sheet

| 列名 | 必填 | 类型 | 说明 | 示例 |
|------|:---:|------|------|------|
| 部门编码 | 否 | string | 唯一编码，用于跨Sheet引用；不填则自动生成 | DEPT-PROD |
| 部门名称 | **是** | string | 中文名称 | 生产管理部 |
| 英文名称 | **是** | string | 英文名称，用于跨系统引用 | ProductionMgmt |
| 部门类型 | 否 | enum | group/business_unit/department/team/group，默认 department | department |
| 上级部门编码 | 否 | string | 引用部门编码，空表示顶级部门 | DEPT-MFG |
| 描述 | 否 | string | 部门描述 | 负责生产计划与车间调度 |
| 编制人数 | 否 | integer | 部门总编制 | 50 |
| 排序号 | 否 | integer | 同级排序，默认 0 | 1 |

**说明行**: `#DESC#部门编码: 唯一标识，用于岗位Sheet引用; 部门类型: group/business_unit/department/team/group`

**示例行**: `DEPT-PROD, 生产管理部, ProductionMgmt, department, DEPT-MFG, 负责生产计划与车间调度, 50, 1`

#### 岗位 Sheet

| 列名 | 必填 | 类型 | 说明 | 示例 |
|------|:---:|------|------|------|
| 岗位编码 | 否 | string | 唯一编码；不填则自动生成 | POS-PM-01 |
| 岗位名称 | **是** | string | 中文名称 | 生产主管 |
| 英文名称 | **是** | string | 英文名称 | ProductionSupervisor |
| 所属部门编码 | **是** | string | 引用部门Sheet的部门编码 | DEPT-PROD |
| 上级岗位编码 | 否 | string | 引用岗位编码（汇报线） | POS-MFG-01 |
| 岗位层级 | 否 | integer | 层级，默认 1 | 3 |
| 编制人数 | 否 | integer | 该岗位编制 | 2 |
| 关联角色 | 否 | string | GovernanceRole 名称，多个用分号分隔 | 生产经理;调度员 |
| 职责-范围 | 否 | string | 职责范围描述，多职责用分号分隔 | 物料;质检流程 |
| 职责-范围类型 | 否 | string | 对应scope，多个用分号分隔；默认 entity | entity;process |
| 职责-操作 | 否 | string | 对应actions，多个职责间用分号分隔，每个职责内用逗号分隔 | 采购审批,质量审核;质检确认 |
| 职责-决策权限 | 否 | string | 对应decisionAuthority，多个用分号分隔；默认 recommend | approve;veto |
| 职责-委托岗位 | 否 | string | 对应delegateToPositionIds，多个用分号分隔 | POS-PM-02 |
| 任职要求 | 否 | string | requiredCompetencies，多个用分号分隔 | 5年生产管理经验;熟悉ERP |
| 状态 | 否 | enum | active/inactive，默认 active | active |

**说明行**: `#DESC#所属部门编码: 引用部门Sheet的编码; 关联角色: GovernanceRole名称，分号分隔; 职责列: 多职责用分号分隔，同一职责内操作用逗号分隔`

**示例行**: `POS-PM-01, 生产主管, ProductionSupervisor, DEPT-PROD, POS-MFG-01, 3, 2, 生产经理;调度员, 物料;质检流程, entity;process, 采购审批,质量审核;质检确认, approve;veto, , 5年生产管理经验, active`

### 9.3 校验规则

#### 部门 Sheet 校验

| 规则ID | 严重级别 | 规则 | 说明 |
|--------|---------|------|------|
| V-XL-O01 | error | 部门名称必填 | 部门名称不能为空 |
| V-XL-O02 | error | 英文名称必填 | 英文名称不能为空 |
| V-XL-O03 | error | 英文名称唯一 | 同一Sheet内英文名称不能重复 |
| V-XL-O04 | error | 部门编码唯一 | 部门编码有值时不能重复 |
| V-XL-O05 | error | 上级部门引用存在 | 上级部门编码必须在同Sheet中存在 |
| V-XL-O06 | error | 部门类型枚举 | 部门类型必须是 group/business_unit/department/team/group 之一 |
| V-XL-O07 | error | 无环依赖 | 上级部门关系不能形成环 |
| V-XL-O08 | warning | 编制人数非负 | 编制人数应为非负整数 |

#### 岗位 Sheet 校验

| 规则ID | 严重级别 | 规则 | 说明 |
|--------|---------|------|------|
| V-XL-O09 | error | 岗位名称必填 | 岗位名称不能为空 |
| V-XL-O10 | error | 英文名称必填 | 英文名称不能为空 |
| V-XL-O11 | error | 英文名称唯一 | 同一Sheet内英文名称不能重复 |
| V-XL-O12 | error | 岗位编码唯一 | 岗位编码有值时不能重复 |
| V-XL-O13 | error | 所属部门引用存在 | 所属部门编码必须在部门Sheet中存在 |
| V-XL-O14 | error | 上级岗位引用存在 | 上级岗位编码必须在同Sheet中存在 |
| V-XL-O15 | error | 关联角色存在 | 关联角色名称必须在当前项目的 GovernanceRole 中存在 |
| V-XL-O16 | error | 职责列对齐 | 职责-范围/范围类型/操作/决策权限/委托岗位 列的分号分隔数量必须一致 |
| V-XL-O17 | error | 决策权限枚举 | decisionAuthority 必须是 none/recommend/approve/veto 之一 |
| V-XL-O18 | error | 状态枚举 | 状态必须是 active/inactive 之一 |
| V-XL-O19 | warning | 委托岗位引用存在 | 委托岗位编码应在岗位Sheet中存在 |
| V-XL-O20 | warning | 层级非负 | 岗位层级应为正整数 |

#### 跨Sheet 校验

| 规则ID | 严重级别 | 规则 | 说明 |
|--------|---------|------|------|
| V-XL-O21 | error | 岗位→部门引用 | 岗位.所属部门编码 必须在部门Sheet中存在 |
| V-XL-O22 | error | 岗位→上级岗位引用 | 岗位.上级岗位编码 必须在岗位Sheet中存在 |
| V-XL-O23 | warning | 委托岗位→岗位引用 | 职责.委托岗位编码 应在岗位Sheet中存在 |

### 9.4 解析逻辑

```typescript
/** Excel 导入解析结果扩展 */
export interface ExcelParsedData {
  // ... 现有字段
  departments?: Department[];
  positions?: Position[];
}

/** 解析部门Sheet */
function parseDepartmentsSheet(rows: any[]): {
  departments: Department[];
  errors: ExcelImportError[];
} {
  const departments: Department[] = [];
  const errors: ExcelImportError[] = [];
  const codeMap = new Map<string, Department>(); // 编码→部门，用于构建树

  for (const row of rows) {
    // 1. 跳过描述行和示例行
    if (isDescriptionRow(row) || isExampleRow(row)) continue;

    // 2. 必填校验
    if (!row['部门名称']) { errors.push(...); continue; }
    if (!row['英文名称']) { errors.push(...); continue; }

    // 3. 唯一性校验
    if (codeMap.has(row['部门编码'])) { errors.push(...); continue; }

    // 4. 枚举校验
    const deptType = row['部门类型'] || 'department';
    if (!['group','business_unit','department','team','group'].includes(deptType)) {
      errors.push(...); continue;
    }

    // 5. 构建 Department
    const dept: Department = {
      id: generateId(),
      name: row['部门名称'],
      nameEn: row['英文名称'],
      code: row['部门编码'] || autoGenerateCode('DEPT'),
      type: deptType as DepartmentType,
      parentId: undefined, // 第二轮填充
      description: row['描述'],
      headcount: row['编制人数'] ? parseInt(row['编制人数']) : undefined,
      sortOrder: row['排序号'] ? parseInt(row['排序号']) : 0,
      status: 'active',
    };

    codeMap.set(dept.code!, dept);
    departments.push(dept);
  }

  // 第二轮：填充 parentId（上级部门编码→部门ID）
  for (const row of rows) {
    if (isDescriptionRow(row) || isExampleRow(row)) continue;
    const code = row['部门编码'];
    const parentCode = row['上级部门编码'];
    if (code && parentCode) {
      const dept = codeMap.get(code);
      const parent = codeMap.get(parentCode);
      if (dept && parent) {
        dept.parentId = parent.id;
      } else if (!parent) {
        errors.push({ sheet: '部门', row, field: '上级部门编码',
          message: `上级部门编码 "${parentCode}" 不存在` });
      }
    }
  }

  // 第三轮：环检测
  detectCycles(departments, errors);

  return { departments, errors };
}

/** 解析岗位Sheet */
function parsePositionsSheet(
  rows: any[],
  departmentCodeMap: Map<string, string>,  // 编码→ID
  positionCodeMap: Map<string, string>,    // 编码→ID (两轮解析)
  existingRoles: GovernanceRole[],         // 当前项目的角色列表
): {
  positions: Position[];
  errors: ExcelImportError[];
} {
  const positions: Position[] = [];
  const errors: ExcelImportError[] = [];

  for (const row of rows) {
    if (isDescriptionRow(row) || isExampleRow(row)) continue;

    // 1. 必填校验
    if (!row['岗位名称'] || !row['英文名称'] || !row['所属部门编码']) {
      errors.push(...); continue;
    }

    // 2. 部门引用校验
    const deptId = departmentCodeMap.get(row['所属部门编码']);
    if (!deptId) {
      errors.push({ sheet: '岗位', row, field: '所属部门编码',
        message: `部门编码 "${row['所属部门编码']}" 在部门Sheet中不存在` });
      continue;
    }

    // 3. 关联角色解析
    const roleNames = (row['关联角色'] || '').split(';').map(s => s.trim()).filter(Boolean);
    const roleIds: string[] = [];
    for (const rn of roleNames) {
      const role = existingRoles.find(r => r.name === rn);
      if (role) { roleIds.push(role.id); }
      else { errors.push({ sheet: '岗位', field: '关联角色',
        message: `角色 "${rn}" 不存在于当前项目` }); }
    }

    // 4. 结构化职责解析（分号分隔多职责）
    const responsibilities = parseResponsibilities(row, positionCodeMap, errors);

    // 5. 构建 Position
    const position: Position = {
      id: generateId(),
      name: row['岗位名称'],
      nameEn: row['英文名称'],
      code: row['岗位编码'] || autoGenerateCode('POS'),
      departmentId: deptId,
      parentPositionId: undefined, // 第二轮填充
      level: row['岗位层级'] ? parseInt(row['岗位层级']) : 1,
      headcount: row['编制人数'] ? parseInt(row['编制人数']) : undefined,
      roleIds,
      responsibilities,
      requiredCompetencies: row['任职要求']
        ? row['任职要求'].split(';').map(s => s.trim()).filter(Boolean)
        : [],
      status: row['状态'] === 'inactive' ? 'inactive' : 'active',
    };

    positions.push(position);
  }

  // 第二轮：填充 parentPositionId
  for (const row of rows) {
    if (isDescriptionRow(row) || isExampleRow(row)) continue;
    const code = row['岗位编码'];
    const parentCode = row['上级岗位编码'];
    if (code && parentCode) {
      const posId = positionCodeMap.get(code);
      const parentId = positionCodeMap.get(parentCode);
      if (posId && parentId) {
        const pos = positions.find(p => p.id === posId);
        if (pos) pos.parentPositionId = parentId;
      }
    }
  }

  return { positions, errors };
}

/** 解析结构化职责（分号分隔多职责） */
function parseResponsibilities(
  row: any,
  positionCodeMap: Map<string, string>,
  errors: ExcelImportError[],
): PositionResponsibility[] {
  const scopes = (row['职责-范围'] || '').split(';').map(s => s.trim());
  const scopeTypes = (row['职责-范围类型'] || '').split(';').map(s => s.trim());
  const actions = (row['职责-操作'] || '').split(';').map(s => s.trim());
  const authorities = (row['职责-决策权限'] || '').split(';').map(s => s.trim());
  const delegates = (row['职责-委托岗位'] || '').split(';').map(s => s.trim());

  // 对齐校验
  const count = scopes.length;
  if (scopeTypes.length !== count || actions.length !== count || authorities.length !== count) {
    errors.push({ sheet: '岗位', field: '职责列',
      message: `职责各列的分号分隔数量不一致(范围=${count}, 类型=${scopeTypes.length}, 操作=${actions.length}, 权限=${authorities.length})` });
    return [];
  }

  const responsibilities: PositionResponsibility[] = [];
  for (let i = 0; i < count; i++) {
    if (!scopes[i]) continue;
    responsibilities.push({
      id: generateId(),
      name: scopes[i],
      scope: (scopeTypes[i] || 'entity') as PositionResponsibility['scope'],
      scopeRefs: [], // 需要在实体/流程创建后手动关联
      actions: actions[i] ? actions[i].split(',').map(s => s.trim()) : [],
      decisionAuthority: (authorities[i] || 'recommend') as PositionResponsibility['decisionAuthority'],
      delegateToPositionIds: delegates[i]
        ? delegates[i].split(',').map(code => positionCodeMap.get(code) || code).filter(Boolean)
        : [],
      isActive: true,
    });
  }

  return responsibilities;
}
```

### 9.5 模板 API 变更

#### GET /api/excel-template

**变更**: `TEMPLATE_SHEETS` 数组新增 2 个 Sheet 定义。

```typescript
// 新增到 TEMPLATE_SHEETS
{
  name: '部门',
  nameEn: 'Department',
  headers: [
    { key: 'code', label: '部门编码', required: false, description: '唯一编码，用于岗位Sheet引用' },
    { key: 'name', label: '部门名称', required: true, description: '中文名称' },
    { key: 'nameEn', label: '英文名称', required: true, description: '英文名称' },
    { key: 'type', label: '部门类型', required: false, description: 'group/business_unit/department/team/group' },
    { key: 'parentCode', label: '上级部门编码', required: false, description: '引用部门编码，空表示顶级' },
    { key: 'description', label: '描述', required: false, description: '部门描述' },
    { key: 'headcount', label: '编制人数', required: false, description: '部门总编制' },
    { key: 'sortOrder', label: '排序号', required: false, description: '同级排序，默认0' },
  ],
},
{
  name: '岗位',
  nameEn: 'Position',
  headers: [
    { key: 'code', label: '岗位编码', required: false, description: '唯一编码' },
    { key: 'name', label: '岗位名称', required: true, description: '中文名称' },
    { key: 'nameEn', label: '英文名称', required: true, description: '英文名称' },
    { key: 'departmentCode', label: '所属部门编码', required: true, description: '引用部门Sheet的编码' },
    { key: 'parentPositionCode', label: '上级岗位编码', required: false, description: '汇报线' },
    { key: 'level', label: '岗位层级', required: false, description: '层级' },
    { key: 'headcount', label: '编制人数', required: false, description: '该岗位编制' },
    { key: 'roleNames', label: '关联角色', required: false, description: 'GovernanceRole名称，分号分隔' },
    { key: 'respScope', label: '职责-范围', required: false, description: '职责范围描述，分号分隔多职责' },
    { key: 'respScopeType', label: '职责-范围类型', required: false, description: 'entity/process/domain/custom，分号分隔' },
    { key: 'respActions', label: '职责-操作', required: false, description: '每职责内逗号分隔，多职责间分号分隔' },
    { key: 'respAuthority', label: '职责-决策权限', required: false, description: 'none/recommend/approve/veto，分号分隔' },
    { key: 'respDelegate', label: '职责-委托岗位', required: false, description: '岗位编码，分号分隔' },
    { key: 'competencies', label: '任职要求', required: false, description: '分号分隔' },
    { key: 'status', label: '状态', required: false, description: 'active/inactive，默认active' },
  ],
},
```

**填写说明 Sheet 更新**: 新增 `7. 部门Sheet：定义组织架构树形结构` 和 `8. 岗位Sheet：定义岗位及结构化职责`。

### 9.6 导入 API 变更

#### POST /api/excel-import

**变更**: 
1. Sheet 结构校验从"必须包含 6 个 Sheet"调整为"至少包含 1 个数据 Sheet"
2. 新增部门/岗位 Sheet 的解析和校验
3. `ExcelParsedData` 新增 `departments` 和 `positions` 字段
4. 版本审核通过后，组织数据写入 `OrganizationModel`

```typescript
// parseExcelToModels() 新增逻辑
const departmentCodeMap = new Map<string, string>(); // 编码→部门ID
const positionCodeMap = new Map<string, string>();   // 编码→岗位ID

if (wb.SheetNames.includes('部门')) {
  const { departments, errors } = parseDepartmentsSheet(deptRows);
  parsedData.departments = departments;
  validation.errors.push(...errors);
  // 构建编码映射
  departments.forEach(d => { if (d.code) departmentCodeMap.set(d.code, d.id); });
}

if (wb.SheetNames.includes('岗位')) {
  if (!departmentCodeMap.size && !wb.SheetNames.includes('部门')) {
    validation.errors.push({
      sheet: '岗位', row: 0, field: '所属部门编码',
      message: '岗位Sheet引用部门编码，但未找到部门Sheet',
    });
  }
  const { positions, errors } = parsePositionsSheet(
    posRows, departmentCodeMap, positionCodeMap, existingRoles
  );
  parsedData.positions = positions;
  validation.errors.push(...errors);
}
```

### 9.7 Store 变更

`createVersionFromParsedData` 和 `approveVersion` 扩展：

```typescript
// createVersionFromParsedData 中
if (parsedData.departments?.length || parsedData.positions?.length) {
  version.organizationModel = {
    id: generateId(),
    name: '组织架构',
    departments: parsedData.departments || [],
    positions: parsedData.positions || [],
    syncConfig: undefined,
    lastSyncResult: undefined,
  };
}

// approveVersion 中应用组织数据
if (parsedData.departments?.length || parsedData.positions?.length) {
  // 合并策略：替换现有组织数据
  state.project.organizationModel = {
    id: generateId(),
    name: '组织架构',
    departments: parsedData.departments || [],
    positions: parsedData.positions || [],
    syncConfig: state.project.organizationModel?.syncConfig, // 保留同步配置
    lastSyncResult: state.project.organizationModel?.lastSyncResult,
  };
}
```

### 9.8 ExcelTemplateSheet 类型扩展

```typescript
// 在 ExcelTemplateSheet 的 nameEn 中新增
type ExcelTemplateSheetNameEn = 
  | 'Entity' | 'Attribute' | 'Relation' | 'StateMachine' | 'Rule' | 'Event'
  | 'Department' | 'Position';  // 新增
```

### 9.9 单独导入组织数据

用户可以上传**仅包含部门和岗位 Sheet** 的 Excel 文件：

- 文件格式仍为 `.xlsx`
- Sheet 结构校验：至少包含部门或岗位中的一个
- 其他 Sheet（实体/属性等）可以省略
- 导入时，现有核心模型数据**不受影响**
- 解析结果只包含 `departments` 和/或 `positions`

**导入对话框提示变更**：
```
上传 Excel 文件(.xlsx)导入数据
支持: 实体/属性/关系/状态机/规则/事件/部门/岗位
至少包含一个数据Sheet即可
```

---

## 十、User Stories

| US ID | 角色 | 需求 | 验收标准 |
|-------|------|------|---------|
| US-O-1 | 建模师 | 我要在组织Tab中管理部门和岗位 | 可以 CRUD 部门（树形）和岗位（含结构化职责） |
| US-O-2 | 建模师 | 我要为岗位定义结构化职责 | 岗位可添加多个职责项，每项含 scope/actions/decisionAuthority |
| US-O-3 | 建模师 | 我要检测职责重叠 | 系统自动检测两个岗位的职责冲突并告警 |
| US-O-4 | 管理员 | 我要从飞书/钉钉同步组织架构 | 配置 HR 同步源后，一键同步部门和岗位 |
| US-O-5 | 管理员 | 我要设置定时同步 | 配置同步频率后，系统自动按计划同步 |
| US-O-6 | 管理员 | 同步有冲突时我要手动处理 | 冲突列表可逐条或批量处理 |
| US-O-7 | 建模师 | 我要在 EPC 中引用真实部门和岗位 | EPC 组织节点可从组织模型选择 |
| US-O-8 | Agent | 我要根据岗位职责判断决策权限 | PositionResponsibility.decisionAuthority 可被 Agent 读取 |
| US-O-9 | 建模师 | 岗位可委托职责给其他岗位 | delegateToPositionIds 支持请假/离职场景 |
| US-O-10 | 建模师 | 我要通过Excel批量导入部门和岗位 | 下载含部门+岗位Sheet的模板，填写后上传自动解析校验 |
| US-O-11 | 建模师 | 我要单独导入组织数据而不影响现有模型 | 上传只含部门/岗位Sheet的Excel，现有实体/规则等不受影响 |
| US-O-12 | 建模师 | 导入的岗位职责要结构化 | Excel中职责列按分号/逗号规则解析为PositionResponsibility |

---

## 十一、实施计划

### Phase 1: 数据层 + 基础 UI
- 类型定义: Department, Position, PositionResponsibility, OrganizationModel
- Store 方法: CRUD + 查询 + 职责冲突检测
- OrganizationEditor: 部门树 + 岗位列表
- PositionResponsibilityEditor: 结构化职责编辑

### Phase 2: HR 同步
- HRSyncConfig/HRSyncResult 类型
- API: /api/hr-sync/* (trigger, config, history, resolve-conflict)
- HRSyncPanel: 配置 + 同步 + 冲突处理
- 差异比对算法 + 冲突策略
- 定时任务（Next.js API Route + 外部调度）

### Phase 3: EPC 关联 + 双向校验
- EPC 组织节点选择器 (从 OrganizationModel 选部门/岗位)
- VM-O / VM-HR / VE-O / VX-O 校验规则
- 指标关联 EpcKpiDefinition.metricId

### Phase 4: 关联矩阵 + 导出
- 岗位 × 角色 × 职责 × EPC 权限矩阵视图
- Markdown 导出含组织架构
- Excel 导入支持部门/岗位 Sheet
- 建模手册含组织架构章节

---

## 十二、与 EPC-Upgrade-Spec 的对齐

| EPC-Upgrade-Spec 中的概念 | 本规格对齐 |
|--------------------------|----------|
| EpcOrganizationalUnit | refType/refId 引用 OrganizationModel |
| VM-G 治理校验 | Position.roleIds → GovernanceRole 桥接 |
| VM-M 指标校验 | EpcKpiDefinition.metricId → Metric 桥接 |
| 推导算法 Step 7 | 基于行为模型推导组织参与方 |
| 覆盖率报告 | 新增 Organization 覆盖率维度 |
