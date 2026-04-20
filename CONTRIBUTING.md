# 贡贡献指南 (Contributing Guide)

> 欢迎参与 Ontology 本体模型建模工具的开发！请遵循以下规范，确保代码质量和协作效率。

---

## 一、分支策略

```
main (受保护)
  └── feature/xxx (功能开发)
  └── fix/xxx (缺陷修复)
  └── docs/xxx (文档更新)
```

### 规则

1. **禁止直接推送到 `main`**：所有变更必须通过 PR 合并
2. **分支命名**：
   - 功能开发：`feature/clear-model-data`
   - 缺陷修复：`fix/entity-delete-bug`
   - 文档更新：`docs/update-readme`
3. **从最新 main 创建**：每次开始新任务前先 `git pull origin main`

### 操作流程

```bash
# 1. 拉取最新代码
git checkout main && git pull origin main

# 2. 创建功能分支
git checkout -b feature/your-feature-name

# 3. 开发并提交（遵循小提交原则）
git add .
git commit -m "feat: 简短描述"

# 4. 推送并创建 PR
git push origin feature/your-feature-name
# 在 GitHub 上创建 Pull Request
```

---

## 二、提交规范 (Conventional Commits)

每次提交只做一件事，信息清晰：

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: add clear modeling data action` |
| `fix` | 缺陷修复 | `fix: resolve entity delete cascade issue` |
| `docs` | 文档更新 | `docs: update AGENTS.md` |
| `refactor` | 重构（不改变行为） | `refactor: extract validation logic` |
| `test` | 测试相关 | `test: add entity CRUD integration tests` |
| `chore` | 构建/配置 | `chore: update dependencies` |

### 提交格式

```
<type>(<scope>): <subject>

<body>
```

- **subject**：不超过 50 字符，使用中文或英文（统一）
- **body**（可选）：详细说明为什么做这个改动

---

## 三、开发前检查清单

在写代码之前，确保完成以下步骤：

### 3.1 环境准备

```bash
# 安装依赖
pnpm install

# 验证环境
pnpm run ci:check   # 必须全绿才能开始开发
```

### 3.2 理解现有代码

```bash
# 运行现有测试，理解当前行为
pnpm run test:unit
pnpm run test:integration

# 阅读 AGENTS.md 了解项目结构
cat AGENTS.md
```

### 3.3 任务拆分

- 将大任务拆分为小提交（每个提交可独立验证）
- 先在文档中记录计划（更新 `docs/progress.md`）

---

## 四、编码规范

### 4.1 TypeScript

- 使用严格模式（项目已启用）
- 所有函数参数必须标注类型
- 禁止 `any` 类型（除非有明确注释说明原因）
- 组件/函数使用前必须 import

### 4.2 React / Next.js

- 客户端组件必须标记 `'use client'`
- 禁止在 JSX 中直接使用动态值（`Date.now()`, `Math.random()` 等）
- 使用 shadcn/ui 组件库
- 状态管理使用 Zustand

### 4.3 测试要求

- 新功能必须有对应测试
- 测试文件与源码同目录或 `tests/` 目录下
- 测试 ID 与 TEST_CASES.md 对应

### 4.4 样式

- 使用 Tailwind CSS 类名
- 响应式设计优先

---

## 五、提交前必查

每次提交前，**必须**执行：

```bash
# 完整 CI 检查
pnpm run ci:check
```

包含以下检查项：

| 命令 | 用途 | 必须 |
|------|------|------|
| `pnpm lint` | ESLint 代码风格 | ✅ |
| `pnpm ts-check` | TypeScript 类型检查 | ✅ |
| `pnpm test:unit` | 单元测试 | ✅ |
| `pnpm test:integration` | 集成测试 | ✅ |
| `pnpm test:e2e:smoke` | E2E 冒烟测试 | ✅ |

**只有全部通过才能提交和推送。**

---

## 六、PR 流程

### 6.1 创建 PR

1. 推送分支后，在 GitHub 创建 Pull Request
2. **PR 标题**遵循提交规范格式
3. **填写 PR 模板**（仓库已配置模板）

### 6.2 PR Checklist

PR 模板中的每一项都必须勾选并提供证据：

- [ ] **Agentic Engineering Checklist**：8 项全部通过
- [ ] **CI 验证**：`pnpm run ci:check` 全绿截图或日志
- [ ] **手工验证**：关键路径的线性演练记录
- [ ] **进度同步**：`docs/progress.md` 已更新

### 6.3 Code Review

- 至少一人 Review 通过后才能合并
- Reviewer 关注点：逻辑正确性、测试覆盖、边界情况
- 作者及时响应 Review 意见

### 6.4 合并

- 使用 Squash and Merge 保持历史干净
- 合并后删除远程分支
- 本地同步：`git pull origin main && git branch -d feature/xxx`

---

## 七、真实验证原则

避免"看起来对"的陷阱：

1. **真实环境优先**：用浏览器实际操作，而非仅看测试通过
2. **线性演练**：手动走一遍用户操作路径
3. **边界情况**：空数据、异常输入、并发场景
4. **回滚方案**：考虑如果出问题如何快速恢复

---

## 八、进度外置

不要依赖对话记忆，将上下文写入仓库：

| 文件 | 用途 | 更新时机 |
|------|------|----------|
| `docs/progress.md` | 总体进度跟踪 | 每次迭代结束 |
| `docs/iteration-plan-v2.md` | 详细迭代计划 | 计划变更时 |
| `AGENTS.md` | 项目结构与规范 | 架构变更时 |
| PR Description | 单次变更详情 | 每次 PR |

---

## 九、常见问题

### Q: CI 失败怎么办？
A: 先本地复现 `pnpm run ci:check`，修复后再推送。不要跳过 CI。

### Q: 小改动也需要 PR 吗？
A: 是的。即使是 typo 修复也走 PR 流程，保持审计追踪。

### Q: 如何处理紧急 hotfix？
A: 从 main 创建 `fix/hotfix-xxx` 分支，走加急 PR，合并后立即打 tag。

---

## 相关文档

- [Agentic Engineering Checklist](docs/agentic-engineering-checklist.md) - 开发自查清单
- [迭代计划 v2.0](docs/iteration-plan-v2.md) - 产品路线图
- [AGENTS.md](AGENTS.md) - 项目技术规范
- [PR Template](.github/PULL_REQUEST_TEMPLATE.md) - PR 提交模板

---

有问题？提 Issue 或在团队群内讨论。
