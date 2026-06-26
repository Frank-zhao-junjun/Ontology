# P1 Gap-Fill: 事件层 + 治理层 + 语义层

## 概述
此 PR 完成 P1 缺口填补工作，覆盖事件层（E03/E04/E05）、治理层（G03/G05）和语义层（S09/S10）三个层级。

## 变更内容

### 事件层 (E03/E04/E05)
- **E03 `EventSourcingConfig`**: 快照间隔、保留天数、存储类型
- **E05 `DeadLetterPolicy`**: 最大重试次数、队列名、耗尽策略
- **E04 `Subscription.deadLetterPolicyId`**: 订阅引用死信策略
- **ManifestEventHandler**: 替换 `Array<{ id: string }>` 为完整类型
- 编译器：`event-sourcing.ts` / `dead-letter.ts` mappers
- UI：`event-model-editor.tsx` 新增 EventSourcingConfig 卡片 + DeadLetterPolicy 管理 + Subscription deadLetterPolicyId 选择器

### 治理层 (G03/G05)
- **G03 `DataMaskingPolicy`**: 字段级数据脱敏（hash/mask/redact/tokenize）
- **G05 `ComplianceRule`**: 合规标准绑定（GDPR/HIPAA/ISO27001/PCI-DSS/GB·T35273/custom）
- Store actions：`addDataMaskingPolicy/updateDataMaskingPolicy/deleteDataMaskingPolicy`、`addComplianceRule/updateComplianceRule/deleteComplianceRule`
- UI：`governance-editor.tsx` 新增 G03 脱敏策略区 + G05 合规规则区（Dialog CRUD）
- 编译器：`governance.ts` 映射 `dataMaskingPolicies` + `complianceRules`

### 语义层 (S09/S10)
- **S09 `EntityRole` 扩展**: 新增 `'value_object'`，`resolveEntityRole()` / `mapEntityRoleToObjectTypeKind()` 支持 value_object 映射
- **S09 `ManifestValueObject`**: 值对象 manifest 类型，编译时从 entityRole=value_object 的实体提取，不再出现在 objectTypes
- **S10 `OntologyEnumDef` / `OntologyEnumValue`**: 枚举定义类型（id/name/nameEn/combinationPolicy/values）
- **S10 `ManifestEnumDef` / `ManifestEnumValue`**: manifest 输出类型，code→id、label→name 映射
- **S10 Store actions**: `addEnumDef` / `updateEnumDef` / `deleteEnumDef`
- 编译器：`semantic.ts` 新增 `mapValueObjects()` + `mapEnumDefs()`

## 测试
- 新增 20 个测试文件、新增 32 个测试用例
- 完整测试套件：98 个文件，392 个测试全部通过
- `tsc --noEmit` 零错误

## 检查清单
- [x] `tsc --noEmit` 零错误
- [x] 全量测试通过（392/392）
- [x] 新增 golden compiler 测试覆盖 E03/E04/E05/G03/G05/S09/S10
- [x] UI 组件完整（EventModelEditor + GovernanceEditor）
- [x] Store actions 完整（事件层 10 个 + 治理层 6 个 + 语义层 3 个）
- [x] Manifest 类型对齐 spec（manifest-validator/types.ts）
