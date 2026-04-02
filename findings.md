# EPC页签设计发现

- EPC规格说明书要求输出事件、功能、规则、组织单元、信息对象、流程链、矩阵、异常、KPI、系统集成、合规要求、自检等完整章节。
- 当前仓库已有四大元模型：数据、行为、规则、事件；前台已不暴露旧流程模型。
- 当前processModel是AI编排步骤模型，不适合作为EPC业务流程真值模型。
- EPC skill可复用的核心价值是模板结构、命名规范、完整性检查项与企业级文档框架。
- 现有四大元模型无法单独完整推出组织单元、执行系统、输入输出、SLA、KPI、合规项，需要补充EPC专用元数据层。
- EPC正式类型定义应以 `EpcModel -> EpcAggregateProfile` 为中心，并与 `OntologyProject` / `ProjectVersion.metamodels` 形成弱耦合集成。
- 为避免打断现有可运行状态，`epcModel` 与版本快照中的 `epc` 字段先按可选字段接入。
- 第一阶段骨架已验证可行：聚合根详情可显示 EPC 页签，store 能自动初始化/再生成 profile，预览可输出 Markdown 规格说明草案。
- 第一阶段仍是“文档级补充字段”模型，尚未开放组织单元、系统、信息对象、连接器、KPI、合规项的精细编辑。
- EPC信息对象的正确边界是“流程视角下的信息载体”，不是新的数据模型、元数据或主数据真值层。
- 第二阶段信息对象编辑规则应遵循：派生对象结构只读、手工对象可增删改、重生成刷新派生对象并保留手工对象与流程说明。
- 组织单元与执行系统同样属于 EPC 补充元数据，不应从四大元模型臆造；当前实现改为手工维护并纳入 Markdown 与完整性校验。
- EPC 导出已按设计方案接入 config package：导出 `data/epc.json` 结构化快照、`epc/{aggregate}.json`、`epc/{aggregate}.md`，并在 manifest 中追加 `epcCount`、`epcAggregates`、`generatedEpcAt`。
- EPC 页签级下载入口可直接复用配置包中的 EPC 文件形态：页签内直接下载 `{aggregate}.md` 与 `{aggregate}.json`，避免用户必须先走整包导出。
- EPC 页签整包下载入口直接复用 `/api/export`，这样页签下载与系统导出结果完全同构，不需要在前端维护额外打包逻辑。
