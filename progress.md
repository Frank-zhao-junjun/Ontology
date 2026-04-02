# EPC页签设计进度

## 2026-04-01

- 读取EPC业务活动规格说明书，确认目标输出是企业级EPC业务活动规格说明书，而非简化流程图。
- 解压并检查epc-generator skill，确认其提供模板、示例与基础validator。
- 对照当前仓库的建模工作区与四大元模型，确认EPC应作为聚合根下的生成型页签接入。
- 开始编写EPC页签设计方案文档。
- 将EPC设计方案收敛为正式接口清单，开始落地到 `src/types/ontology.ts`。
- EPC正式接口已落地，`pnpm ts-check` 通过，当前类型层未被打断。
- 完成第一期骨架实现：新增 `src/lib/epc-generator/index.ts`、`src/components/ontology/epc-tab.tsx`，并在 `modeling-workspace` 与 `ontology-store` 中接入。
- 补充 EPC 生成器单测与 EPC 页签集成测试，针对性测试通过。
- 全量验证通过：`pnpm ts-check`、`pnpm test:run`、`pnpm exec next build`。
- 输出 `EPC信息对象建模规则.md`，将 EPC 信息对象与数据模型、元数据、主数据的边界正式文档化。
- 开始实现第二阶段 informationObjects 编辑规则：派生对象只读、手工对象可补充、重生成保留手工对象。
- 完成第二阶段 option 1：新增组织单元与执行系统编辑区，保存后即时重生成 EPC 文档，并补充缺口校验与预览输出。
- 完成第二阶段 option 2：将 EPC 接入配置导出链路，新增 EPC Markdown/JSON 导出、manifest 扩展与导出相关测试，并通过全量 `pnpm ts-check`、`pnpm test:run`、`pnpm exec next build`。
- 完成第二阶段 option 3：在 EPC 页签预览区新增 Markdown / JSON 下载按钮，直接导出当前聚合根 EPC 文档与结构化结果。
- 完成第二阶段 option 4：在 EPC 页签预览区新增整包配置包下载按钮，直接调用 `/api/export` 下载当前项目完整 config package。
