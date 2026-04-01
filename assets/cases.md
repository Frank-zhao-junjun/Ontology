# E2E 测试用例（端到端）

## 范围

- 从建模导出到运行时加载的完整业务链路
- 建模阶段聚合角色约束
- 自然语言查询业务可用性
- 版本切换后的界面与实体渲染一致性

## Gherkin 场景

```gherkin
Feature: 导出并加载运行时
  Scenario: 从建模到运行时加载成功
    Given 用户在建模工具中完成合同域项目并冻结版本 "v1.0.0"
    When 用户点击“导出新版本”并下载配置包
    And 在运行时系统中加载该配置包
    Then 系统显示当前版本为 "v1.0.0"
    And 数据视图可查看 Contract 实体数据
```

```gherkin
Feature: 运行时自然语言查询
  Scenario: 查询合同列表成功返回
    Given 运行时已加载版本 "v1.0.0"
    And Contract 实体中存在至少 1 条数据
    When 用户输入 "查询合同列表"
    Then 返回消息为 "查询成功"
    And 返回结果记录数大于 0
```

```gherkin
Feature: 聚合角色约束
  Scenario: 创建子实体时必须指定所属聚合根
    Given 用户在建模工具中创建实体 "OrderLine"
    When 用户将 `entityRole` 选择为 `child_entity` 且未填写 `parentAggregateId`
    Then 系统阻止保存
    And 提示信息包含 "子实体必须指定所属聚合根"

  Scenario: 非聚合根实体不能发布领域事件
    Given 用户已创建实体 "OrderLine" 且其角色为 `child_entity`
    When 用户尝试在该实体上配置事件模型
    Then 系统阻止配置或导出
    And 提示信息包含 "仅聚合根可发布领域事件"
```

```gherkin
Feature: 版本切换
  Scenario: 从 v1.0.0 切换到 v1.0.1
    Given 运行时已加载版本 "v1.0.0"
    And 可选版本列表包含 "v1.0.1"
    When 用户选择版本 "v1.0.1"
    Then 页面版本标识更新为 "v1.0.1"
    And Contract 实体视图按 v1.0.1 模型展示
```

## E2E 数据基线

- 固定版本：`v1.0.0`、`v1.0.1`。
- 固定实体：`Contract`、`ContractClause`、`ApprovalInstance`、`PaymentSchedule`、`ContractAttachment`。
- 固定查询：`查询合同列表`、`统计合同数量`。

## 通过标准

- 主链路与聚合角色约束场景全部通过。
- 任一 P0 场景失败即阻断合入。
