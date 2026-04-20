# Agentic Engineering Patterns 检查清单

> 参考：[Simon Willison - Early stage AI-assisted programming](https://simonwillison.net/2025/Mar/11/early-tdd/)
> 版本：2026-04
>
> 与仓库内 Superpowers / Ralph Loop / GStack 实践高度吻合，可作为开发前和评审时的统一自查清单。

## 开发前必查（8 项）

- [ ] **红绿 TDD**：先写失败测试，再写实现让测试通过。
- [ ] **先跑测试**：接手任务先运行现有测试，理解当前行为。
- [ ] **线性演练**：新功能先手工一步步验证，不让 AI 脑补流程。
- [ ] **分支策略**：在 feature branch 开发，主分支保持干净。
- [ ] **小提交**：每次提交只做一件事，提交前通过所有测试。
- [ ] **上下文外置**：进度写入文件或 git 记录，不依赖对话记忆。
- [ ] **真实验证**：优先真实环境验证，不依赖模拟器猜测。
- [ ] **收敛心态**：一次迭代只解决一个问题，避免目标扩张。

## 与方法论映射

| Pattern | 对应方法论 | 验证方式 |
| --- | --- | --- |
| 红绿 TDD | Superpowers | 未测代码会被删除 |
| 先跑测试 | GStack `/qa` | 测试报告 |
| 线性演练 | Ralph Loop | 一次一件事 |
| 分支策略 | Ralph Loop diff | `git log` |
| 小提交 | Ralph Loop 背压 | 测试 + lint 通过 |
| 上下文外置 | Ralph Loop | 进度文件存在 |
| 真实验证 | GStack | 真实浏览器 QA |
| 收敛心态 | 三者共性 | 每迭代有产出 |

## 使用场景

- 开发新功能前：过一遍 8 项清单。
- Code Review 时：逐项检查是否遵循，并要求证据。
- 项目交接时：用清单确认状态和剩余风险。

## 建议证据清单

- 测试命令输出（例如 `pnpm run ci:check`）。
- 对应分支和提交历史（单次提交目标清晰）。
- 手工线性演练记录（关键路径截图或步骤）。
- 进度文件更新（例如 `progress.md`、`task_plan.md`）。
