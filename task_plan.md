# EPC页签设计任务计划

## 目标

为聚合根新增生成型EPC页签，明确字段模型、生成规则、UI交互、导出格式与实施边界。

## 阶段

| 阶段 | 状态 | 说明 |
|------|------|------|
| 1 | completed | 研读EPC业务活动规格说明书与epc-generator skill |
| 2 | completed | 输出EPC页签设计方案文档 |
| 3 | completed | 用户确认先落正式类型定义清单 |
| 4 | completed | 将EPC接口设计正式落到 ontology.ts 并完成类型校验 |
| 5 | completed | 完成第一期骨架：store、生成器stub、聚合根EPC页签、Markdown预览 |
| 6 | in_progress | 进入第二期：已完成 informationObjects、组织单元、系统补充配置、EPC 导出接入，以及页签级 Markdown/JSON/整包配置包下载入口；异常/KPI/合规仍待继续 |

## 关键决策

- EPC定位为聚合根的派生型业务活动规格说明书，不作为新的主真值元模型。
- EPC不复用当前processModel类型，避免与AI编排模型语义混淆。
- EPC页签默认只读生成，允许补充少量EPC专用元数据。
