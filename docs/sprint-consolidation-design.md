# Sprint: 项目1 巩固与打磨设计文档

> 日期: 2026-06-26
> 来源: 团队头脑风暴 (Hermes subagents ×3)

## 一、概述

基于项目1（Ontology）当前成熟度——EPC v3.1 全部完成、技术债务清零——下个 sprint 聚焦**巩固/打磨**方向，三个 Feature 全量实施。

## 二、Feature 1：测试基础设施修复

### 目标
修正覆盖率配置，使 80% 目标可度量、可追踪。

### 具体任务
1. **修正 vitest.config.ts** — 将 `src/components/**`、`src/hooks/**`、`src/app/api/**` 加入 `coverage.include`
2. **运行基准报告** — 建立真实覆盖率基线（预计 ~15-20%）
3. **设置 CI 门槛** — 在 `vitest.config.ts` 中添加 `coverage.threshold`，防止回归
4. **创建覆盖率看板入口** — 在 TODO.md 的 Q-T3 项增加覆盖率追踪

### 验收标准
- `npx vitest run --coverage` 产出真实报表，组件/API 覆盖率不再为 0%
- `ci:check` 中覆盖率低于基线时失败
- TODO.md 显示实际覆盖率数值及目标差距

### 预估投入
~2h

---

## 三、Feature 2：UI 韧性 + 代码健康

### 目标
消除白屏崩溃风险，统一低质量重复模式，提升感知体验。

### 具体任务

#### 2.1 全局 Error Boundary
- 新增 `src/app/error.tsx` — App Router 原生错误边界，含重试按钮 + 返回首页
- 新增 `src/app/not-found.tsx` — 404 页面
- 确保建模工作台等关键模块有局部 Error Boundary

#### 2.2 Loading / Skeleton
- 新增 `src/app/tool/[id]/loading.tsx` — 路由级骨架屏
- 在列表/表格/编辑器中使用 shadcn `Skeleton` 组件（已存在但零使用）
- 按钮操作使用 `Loader2` 图标 + disabled 状态

#### 2.3 统一 generateId
- 创建 `src/lib/id.ts`，使用 `crypto.randomUUID()`
- 替换全部 13 处重复 `generateId` 定义（ID 长度 8 vs 13 不一致）
- EPC generator 的 prefix 变体保留为 `generatePrefixedId(prefix)`

### 验收标准
- `app/tool/[id]/error.tsx` — 渲染异常时显示友好错误页，不白屏
- `app/tool/[id]/loading.tsx` — 路由跳转时显示骨架屏
- `grep -rn "const generateId\|function generateId\|generateId = ()" src/ --include="*.ts" --include="*.tsx"` 仅返回 `src/lib/id.ts` 一处定义
- `npx tsc --noEmit` 0 error

### 预估投入
~3h

---

## 四、Feature 3：新代码质量门禁

### 目标
为昨日新增的 1300+ 行零测试代码（HR 同步管理器 + Agent 技能管理器 + Markdown 导入/导出 + Excel 导入/导出路由）建立测试防护。

### 具体任务

#### 3.1 HR 同步集成测试
- `src/app/api/hr-sync/` 4 个路由（config/history/resolve/trigger）的请求解析 + 错误处理
- `hr-sync-manager.tsx` 组件的挂载/渲染/交互
- MSW mock API 模拟拖拽触发、历史列表加载、冲突解决 UI、错误状态

#### 3.2 Agent 技能集成测试
- `src/app/api/agent/skills/` 路由的 CRUD 操作
- `agent-skills-manager.tsx` 的技能列表渲染、搜索/过滤、CRUD UI

#### 3.3 Markdown 导入/导出测试
- `src/lib/markdown/markdown-import.ts` 纯函数测试（491 行）
- Excel 导入/导出路由测试（数据序列化完整性）

### 验收标准
- HR sync：至少覆盖成功路径 + 4 种错误状态 + 冲突解决流程
- Agent skills：至少覆盖列表渲染、新增、删除、搜索过滤
- Markdown 导入：核心解析函数单元测试，边界情况覆盖
- 所有测试通过 `pnpm run ci:check`
- 覆盖率报告中新代码区块不再为 0%

### 预估投入
~4-6h

---

## 五、风险与依赖

| 风险 | 缓解措施 |
|------|---------|
| 覆盖率配置修改可能暴露大量未覆盖代码 | 首次运行仅做基准，不设硬性 threshold，下个 sprint 再收紧 |
| `generateId` 统一改 `crypto.randomUUID()` 可能 SSR 不兼容 | 纯浏览器端项目，SSR 场景极少；可备选 `nanoid` fallback |
| HR/Agent 组件 mock 接口复杂 | 使用 MSW v2 模式，与现有测试模式一致 |

## 六、总计

| Feature | 投入 | 优先级 |
|---------|------|--------|
| 测试基础设施 | ~2h | P0 — 必须先做，后续依赖 |
| UI 韧性 + 代码健康 | ~3h | P0 — 可并行 |
| 新代码质量门禁 | ~4-6h | P0 — 可并行 |

**总计：~8-11h · 3 features 全量并行**
