# Integration 测试用例（IT）

## 范围

- 建模工具导出 API 与配置产物一致性
- 运行时加载与版本切换
- 审计留痕最小能力

## 用例清单

| ID | 优先级 | 模块 | 测试目标 | 前置条件 | 步骤 | 预期结果 |
|---|---|---|---|---|---|---|
| IT-API-EXPORT-001 | P0 | Export API | `POST /api/export` 成功导出 | 存在冻结版本 `v1.0.0` | 调用导出接口 | 返回 200 且包含 `downloadUrl` |
| IT-API-EXPORT-002 | P0 | Export Artifact | 导出包结构完整 | 已成功导出 | 解压导出包 | 含 `config.json`、`manifest.json`、`data/*.json` |
| IT-API-EXPORT-003 | P0 | Export Schema | Schema 校验通过 | 导出包已解压 | 校验 `manifest/config/entities` | 全部通过 |
| IT-API-EXPORT-004 | P1 | Export Toggle | includeData 开关正确 | 两次导出 true/false | 对比文件列表 | true 有 seed，false 无 seed |
| IT-RUNTIME-001 | P0 | Runtime Load | 加载配置包成功 | 准备 v1.0.0 包 | 启动并加载 | 运行时状态为 `loaded` |
| IT-RUNTIME-002 | P0 | Runtime Version | 版本切换正确 | v1.0.0 与 v1.0.1 可加载 | 切换版本 | 当前版本更新且视图重渲染 |
| IT-RUNTIME-003 | P1 | Runtime Guard | 无效配置包拒绝加载 | 构造缺失字段包 | 尝试加载 | 返回明确错误码与错误信息 |
| IT-AUDIT-001 | P0 | Audit | 写操作留痕 | 已启用审计 | 执行状态变更 | 日志含时间/类型/对象 |
| IT-AUDIT-002 | P1 | Audit | 只读查询日志 | 已启用审计 | 执行 `查询合同列表` | 写查询日志且无数据变更日志 |

## TDD 执行顺序

1. 先打通导出链路：IT-API-EXPORT-001~003。
2. 再验证运行时链路：IT-RUNTIME-001~002。
3. 最后补开关与审计：IT-API-EXPORT-004、IT-RUNTIME-003、IT-AUDIT-001~002。
