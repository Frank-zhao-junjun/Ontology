# Ontology UI 优化建议书

> 生成时间：2026-06-24  
> 对应审计报告：`docs/UI_AUDIT.md`  
> 目标：将当前可用的 UI 提升到产品级一致性与可维护性

---

## 一、优化目标

1. **消除产品级不一致**：让“五大元模型”宣传与实际 UI 对齐，统一反馈机制与视觉语言。
2. **提升可维护性**：拆分巨型 store、统一工具函数、统一 API 层。
3. **改善用户体验**：移除阻塞式原生弹窗、增加主题切换、优化加载与错误处理。
4. **降低技术债**：清理废弃状态、重复代码、emoji 图标与 console 输出。

---

## 二、按优先级排序的优化建议

### 🥇 第一优先级：立即可做，收益最大

#### 1. 接入主题与修正语言配置
**问题**：`next-themes` 已安装但未使用，`html lang="en"` 与中文产品不符。  
**建议**：
- 在 `src/app/layout.tsx` 中接入 `ThemeProvider`，支持跟随系统/手动切换。
- 将 `html lang="en"` 改为 `lang="zh-CN"`。
- body 显式应用 `bg-background text-foreground`。
- 在 `modeling-workspace` 右上角新增主题切换按钮（Sun/Moon 图标）。

**预期收益**：暗色模式可用、SEO 与屏幕阅读器正确、与 shadcn 设计系统一致。

#### 2. 用 Sonner Toast + Confirm Dialog 替换原生弹窗
**问题**：9 个组件共 31 处 `alert()` / `confirm()`，阻塞主线程且视觉突兀。  
**建议**：
- 使用已安装的 `sonner` 组件做非阻塞提示（成功/错误/警告）。
- 新增 `ConfirmDialog` 组件或 `useConfirm()` hook，统一二次确认交互。
- 高危操作（删除项目、清空数据）要求二次确认，并可考虑输入项目名称二次校验。

**预期收益**：体验现代化、不阻塞用户、与 shadcn 视觉统一。

#### 3. 补齐 ProcessModel 流程模型或调整产品文案
**问题**：产品宣传“五大元模型”，UI 只有数据/行为/规则/事件四个编辑器。  
**建议**：
- 方案 A（推荐）：恢复/新增 `process-model-editor.tsx`，在工作台提供入口，与 `processModel` 数据对接。
- 方案 B：若流程模型已弃用，更新 `AGENTS.md`、`layout.tsx` metadata、创建项目提示文案，统一改为“四大元模型”。

**预期收益**：消除需求与实现之间的明显断层，避免用户困惑。

---

### 🥈 第二优先级：架构与可维护性

#### 4. 拆分 Zustand Store
**问题**：`src/store/ontology-store.ts` 4,432 行，所有逻辑耦合。  
**建议**：
- 按领域拆分为独立 slice：
  - `slices/projectSlice.ts`
  - `slices/dataModelSlice.ts`
  - `slices/behaviorModelSlice.ts`
  - `slices/ruleModelSlice.ts`
  - `slices/eventModelSlice.ts`
  - `slices/uiSlice.ts`
- 通过 `combine` 或 `create` + `immer` 组合。
- 保持现有外部 API 不变，逐步迁移内部实现。

**预期收益**：降低冲突概率、提升可读性、便于单元测试。

#### 5. 统一工具函数与 ID 生成
**问题**：10 个组件各自定义 `generateId`，长度不一致。  
**建议**：
- 在 `lib/utils.ts` 中提供统一 `generateId()`。
- 浏览器端优先使用 `crypto.randomUUID()`，SSR 场景使用 `nanoid` 或自实现。
- 全项目替换，删除组件内重复定义。

**预期收益**：消除重复代码、避免 ID 长度不一致导致的潜在问题。

#### 6. 统一 API Client
**问题**：组件内直接调用 `fetch('/api/...')`，错误处理、类型、loading 各自为政。  
**建议**：
- 新增 `lib/api-client.ts`，封装 `get/post/put/delete`。
- 统一错误解析与 toast 提示。
- 将 `/api/generate-model`、`/api/metadata/init`、`/api/excel-import` 等调用集中到 `services/`。

**预期收益**：错误处理一致、便于 mock 测试、减少样板代码。

---

### 🥉 第三优先级：细节打磨

#### 7. 图标规范化（移除 emoji）
**问题**：菜单、按钮、空状态、统计徽章大量使用 emoji，各平台渲染不一致。  
**建议**：
- 左侧菜单使用 Lucide 图标（如 `GitBranch`、`Box`、`AlertTriangle`、`BarChart3`、`Shield`、`Plug`）。
- 空状态使用 `Ghost`、`FileX`、`ClipboardList` 等图标 + 统一文案。
- 统计徽章使用带颜色的小图标 + 数字。

**预期收益**：视觉专业、可自定义颜色大小、可访问性更好。

#### 8. 加载状态与空状态规范
**问题**：多处使用“加载中...”文字，列表/卡片加载时视觉跳动。  
**建议**：
- 列表/表格使用 `Skeleton` 占位。
- 全局提供 `LoadingOverlay` 或 `Spinner` 组件。
- 空状态统一使用 `EmptyState` 组件（图标 + 标题 + 描述 + 操作按钮）。

**预期收益**：减少感知加载时间、提升界面质感。

#### 9. 表单组件规范化
**问题**：部分表单使用原生 `<label>` 和 `<textarea>`。  
**建议**：
- 全部替换为 shadcn `Label`、`Textarea`、`Input`。
- 统一表单间距与错误提示样式。

**预期收益**：聚焦样式、禁用态、错误态一致。

#### 10. 全局错误边界
**问题**：组件抛错会导致整个工具白屏。  
**建议**：
- 新增 `src/app/error.tsx` 作为全局错误边界。
- 在复杂模块（建模工作台、手册生成器）增加局部 Error Boundary。
- 错误页面提供“刷新页面”和“返回首页”按钮。

**预期收益**：提升系统健壮性、用户可恢复。

---

## 三、推荐实施路线图

### 第 1 周：基础体验（快速见效）
1. 接入 ThemeProvider + 主题切换按钮
2. 修正 `lang="zh-CN"` 和 body 背景色
3. 替换所有 `alert()` / `confirm()` 为 Toast + ConfirmDialog
4. 替换原生 `<textarea>` 和 `<label>` 为 shadcn 组件

### 第 2 周：可维护性（技术债清理）
1. 统一 `generateId` 到 `lib/utils.ts`
2. 统一 API client，收敛分散的 `fetch`
3. 清理 `console.log/error`，引入 logger
4. 清理 `activeModelType` 废弃状态

### 第 3 周：视觉与功能补齐
1. 决策并补齐 ProcessModel 编辑器或调整文案
2. 将 emoji 菜单/按钮替换为 Lucide 图标
3. 统一加载/空状态为 Skeleton + EmptyState
4. 新增全局 Error Boundary

### 第 4 周：架构重构
1. 拆分 `ontology-store.ts` 为多个 Zustand slices
2. 响应式优化（侧边栏折叠、header 操作分组）
3. PDF 导出真正落地或文案降级
4. 全量回归：`pnpm run ci:check`

---

## 四、快速 wins（1 天内可完成）

| 优化项 | 文件 | 改动量 | 效果 |
|---|---|---|---|
| 改 `lang="zh-CN"` | `layout.tsx` | 1 行 | SEO/可访问性 |
| body 加 `bg-background text-foreground` | `layout.tsx` | 1 行 | 主题正确 |
| 接入 ThemeProvider | `layout.tsx` + 新增 provider | ~20 行 | 暗色模式可用 |
| 合并重复 body 规则 | `globals.css` | 删 3 行 | 代码整洁 |
| 合并重复 keyframes | `globals.css` | 删 10+ 行 | 代码整洁 |
| 替换 `metadata-manager` 刷新 emoji | `metadata-manager.tsx` | 1 处 | 视觉统一 |
| 为 header 图标按钮加 aria-label | `modeling-workspace.tsx` | 2 处 | 可访问性 |

---

## 五、设计规范建议

### 5.1 反馈层级
- **成功操作**：Sonner toast，默认位置 bottom-right。
- **错误/异常**：Sonner toast，variant = destructive，包含可点击的“查看详情”。
- **二次确认**：`ConfirmDialog`，危险操作用红色按钮。
- **表单校验**：字段级 inline error，不弹窗。

### 5.2 图标映射（emoji → Lucide）
| emoji | 当前用途 | 建议 Lucide 图标 |
|---|---|---|
| 🌳 | 业务链 | `GitBranch` |
| 📦 | 要素库/EPC | `Box` / `Layers` |
| ⚠️ | 警示 | `AlertTriangle` |
| 📊 | 指标/主数据 | `BarChart3` / `Database` |
| 🛡️ | 治理 | `Shield` |
| 🔌 | 数据源 | `Plug` |
| ⚡ | 行为模型 | `Zap` |
| 📋 | 规则模型 | `ClipboardList` |
| 🔔 | 事件订阅 | `Bell` |
| 🗑️ | 清空/删除 | `Trash2` |
| ✨ | AI 建议 | `Sparkles` |

### 5.3 加载规范
- 整页加载：`Spinner` 居中 + 遮罩。
- 列表/表格：3-5 行 `Skeleton`。
- 卡片：与卡片等尺寸的 `Skeleton`。
- 按钮操作：按钮内 `Loader2` 图标 + `disabled`。

---

## 六、验收标准

完成上述优化后，应满足：

1. `grep -rn "alert(\|confirm(" src/components/ontology --include="*.tsx"` 返回空。
2. `grep -rn "console\." src/components/ontology --include="*.tsx"` 仅剩 logger 调用。
3. `npx tsc --noEmit` 与 `pnpm lint` 均 0 error。
4. 所有菜单/按钮无 emoji，统一使用 Lucide 图标。
5. 主题切换可用，dark 模式下所有组件可读。
6. ProcessModel 要么有编辑器入口，要么产品文案统一为四大元模型。

---

## 七、相关文件

- 完整问题清单：`docs/UI_AUDIT.md`
- 项目规范：`AGENTS.md`
- 类型定义：`src/types/ontology.ts`
- 状态管理：`src/store/ontology-store.ts`
- 全局样式：`src/app/globals.css`
- 根布局：`src/app/layout.tsx`
