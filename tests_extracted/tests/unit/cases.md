# Unit 测试用例（UT）

## 范围

- 配置导出器（ConfigExporter）
- 元模型标准化（normalizers）
- AI 基础查询服务（BasicQueryService）

## 用例清单

| ID | 优先级 | 模块 | 测试目标 | 前置条件 | 输入 | 预期结果 |
|---|---|---|---|---|---|---|
| UT-EXPORT-001 | P0 | Exporter | 版本号必填校验 | `projectVersion.version=""` | 调用 `ConfigExporter.export()` | 抛错：`导出失败：缺少版本号` |
| UT-EXPORT-002 | P0 | Exporter | 至少一个实体校验 | `metamodels.data.entities=[]` | 调用 `ConfigExporter.export()` | 抛错：`导出失败：数据模型为空` |
| UT-EXPORT-003 | P0 | Exporter | includeData=false 不生成 seed | 合法冻结版本 | `includeData=false` | 文件列表不包含 `data/seed_data.json` |
| UT-EXPORT-004 | P0 | Exporter | includeData=true 生成 seed | 合法冻结版本 | `includeData=true` | 文件列表包含 `data/seed_data.json` |
| UT-EXPORT-005 | P0 | Exporter | manifest 字段完整性 | 合法冻结版本 | 执行导出 | 含 `projectId/version/generatedAt/entityCount` |
| UT-EXPORT-006 | P1 | Exporter | generatedAt 格式校验 | 合法冻结版本 | 执行导出 | `generatedAt` 为 ISO datetime |
| UT-NORM-001 | P0 | Normalizer | `nameEn` 规范化稳定 | 多实体输入 | 重复调用标准化 | 相同输入输出一致 |
| UT-NORM-002 | P0 | Normalizer | 关系引用完整性 | 含非法 `targetEntityId` | 调用标准化 | 抛出引用不存在错误 |
| UT-NORM-003 | P1 | Normalizer | 聚合根筛选准确性 | 混合 `isAggregateRoot` | 生成上下文 | `aggregateRoots` 仅含聚合根 |
| UT-AI-001 | P0 | AI Query | 意图识别 list | 初始化服务 | `查询合同列表` | `intent=list` |
| UT-AI-002 | P1 | AI Query | 意图识别 analyze | 初始化服务 | `统计合同数量` | `intent=analyze` |
| UT-AI-003 | P0 | AI Query | 查询异常回传 | mock `_execute_query` 抛错 | 任意查询 | `message` 含 `查询失败` 且 `results=[]` |
| UT-AI-004 | P1 | AI Query | 查询成功结构 | mock 成功返回 | 任意查询 | `QueryResponse` 含 `message/results/query` |

## TDD 执行顺序

1. 先写 P0：UT-EXPORT-001/002/003/004/005。
2. 再写稳定性与完整性：UT-EXPORT-006、UT-NORM-001/002/003。
3. 最后补 AI 服务：UT-AI-001~004。
