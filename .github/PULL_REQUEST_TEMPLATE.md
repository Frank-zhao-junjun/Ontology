## Summary

- 

## Agentic Engineering Checklist (Simon Willison, 2026-04)

- [ ] 红绿 TDD：先写失败测试，再写实现
- [ ] 先跑测试：接手任务先跑当前测试
- [ ] 线性演练：关键路径手工逐步验证
- [ ] 分支策略：本 PR 来自 feature branch
- [ ] 小提交：每次提交单一目标，且通过检查
- [ ] 上下文外置：进度同步到文件或 git 记录
- [ ] 真实验证：在真实环境完成主要验证
- [ ] 收敛心态：本迭代只解决一个核心问题

## Verification

- [ ] `pnpm run lint`
- [ ] `pnpm run ts-check`
- [ ] `pnpm run test:unit`
- [ ] `pnpm run test:integration`
- [ ] `pnpm run test:e2e:smoke`
- [ ] `pnpm run ci:check`

## Evidence

- 测试/验证输出：
- 手工验证步骤：
- 风险与回滚方案：

## Related Docs

- [Agentic Engineering Patterns 检查清单](../docs/agentic-engineering-checklist.md)
