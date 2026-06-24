# Ontology UI 问题清单与改进任务分配

> 生成时间：2026-06-24  
> 基于 commit：`main` 分支当前工作区  
> 审计范围：`src/app/`、`src/components/ontology/`、`src/store/ontology-store.ts`、`src/app/globals.css`

## 一、执行摘要

本次审计共识别 **6 大类 28 项 UI/UX 问题**，其中：

| 严重级别 | 数量 | 说明 |
|---|---|---|
| 🔴 P0（阻塞/重大不一致） | 5 | 功能缺失、文案与实际不符、基础配置错误 |
| 🟡 P1（明显体验问题） | 12 | 原生弹窗、样式不一致、可维护性问题 |
| 🟢 P2（细节优化） | 11 | emoji、加载占位、响应式、可访问性 |

**最紧迫的 5 件事：**
1. 补齐 ProcessModel 流程模型 UI 入口（或从需求/文案中移除“五大元模型”）。
2. 用 `sonner` Toast + shadcn Dialog 替换所有 `alert()` / `confirm()`。
3. 接入 `next-themes` ThemeProvider 并修正 `lang="zh-CN"`。
4. 拆分 `ontology-store.ts`（4,432 行）为多个 Zustand slices。
5. 统一 `generateId`、`fetch`、空状态、加载状态等基础模式。

---

## 二、问题清单（可分配任务）

### P0 — 阻塞/重大不一致

| ID | 标题 | 文件 | 行号 | 描述 | 验收标准 | 预估 |
|---|---|---|---|---|---|---|
| P0-01 | 流程模型（ProcessModel）编辑器缺失 | `project-setup.tsx:69` | 69 | 初始化项目时 `processModel: null`，且 `src/components/ontology/` 下无 `process-model-editor.tsx`。需求文档与 `AGENTS.md` 仍宣称“五大元模型”。 | ① 确认是否保留流程模型；② 若保留，新增 `process-model-editor.tsx` 并在工作台提供入口；③ 若废弃，更新 `AGENTS.md`、`project-setup.tsx` 文案及 metadata 描述。 | 2-3d |
| P0-02 | `alert()` / `confirm()` 泛滥 | 见下表 | 多处 | 9 个组件共 31 处原生弹窗，与 shadcn UI 视觉语言冲突，阻塞主线程，移动端体验差。 | ① 建立 `useConfirm()` hook 或 `ConfirmDialog` 组件；② 建立 `toast` 错误/成功提示规范；③ 全部替换，保留相同文案与分支逻辑。 | 1-2d |
| P0-03 | `next-themes` 已安装但未接入 | `layout.tsx` | 67 | `package.json` 有 `next-themes@^0.4.6`，但 `layout.tsx` 未包裹 `ThemeProvider`，`.dark` 主题变量无法生效。 | ① 在 `layout.tsx` 接入 `ThemeProvider`（可跟随系统/手动切换）；② 在 `modeling-workspace` header 或设置入口新增主题切换按钮。 | 0.5d |
| P0-04 | 页面语言属性错误 | `layout.tsx` | 67 | `html lang="en"`，但产品内容全中文，影响 SEO、屏幕阅读器、字体回退。 | `lang="zh-CN"`，并确认 metadata 中 `openGraph.locale` 一致。 | 0.1d |
| P0-05 | Store 单文件 4,432 行 | `store/ontology-store.ts` | 全文件 | 所有业务逻辑、UI 状态、持久化挤在一个文件，维护困难，冲突频发。 | ① 拆分为 `projectSlice`、`dataModelSlice`、`behaviorModelSlice`、`ruleModelSlice`、`eventModelSlice`、`uiSlice` 等；② 保持现有 API 不变；③ 所有现有测试通过。 | 2-3d |

### P1 — 明显体验/质量问题

| ID | 标题 | 文件 | 行号 | 描述 | 验收标准 | 预估 |
|---|---|---|---|---|---|---|
| P1-01 | `console.log/error` 未清理 | 9 个组件 | 见 5.1 | 生产环境直接输出错误信息，污染控制台。 | ① 统一封装 `logger`；② 替换所有 `console.error/log/warn`；③ 保留开发环境可选调试。 | 0.5d |
| P1-02 | `generateId()` 重复定义 | 10 个组件 | 见 5.2 | 10 个组件各自实现 `generateId`，长度还不一致（8/10/15），维护风险高。 | ① 提取到 `lib/utils.ts`；② 统一为 `crypto.randomUUID()` 或 `nanoid` 风格；③ 全项目替换。 | 0.5d |
| P1-03 | 原生 `<textarea>` 未使用 shadcn 组件 | `modeling-workspace.tsx:430`、`excel-import-dialog.tsx:300` | 430、300 | 手写样式 textarea 与 Design System 不一致， focus ring、disabled、error 状态不完整。 | 统一使用 `src/components/ui/textarea.tsx`，删除自定义样式。 | 0.3d |
| P1-04 | 加载状态仅为文字“加载中...” | `tool/page.tsx:15`、`project-list.tsx:161`、`masterdata-manager.tsx:355` 等 | 多处 | 无骨架屏，长列表/大数据加载时视觉跳动。 | ① 对列表/表格使用 `Skeleton`；② 对主区域提供 `LoadingOverlay` 或 `Spinner` 规范。 | 1d |
| P1-05 | 无全局错误边界 | — | — | 组件抛错会导致整个工具白屏，用户无法恢复。 | 新增 `error.tsx`（App Router 全局）+ 关键模块局部 Error Boundary。 | 0.5d |
| P1-06 | `fetch` 调用分散，未统一 API client | 多个组件 | 见 5.3 | 直接调用 `fetch('/api/...')`，错误处理、loading、类型推导各自为政。 | ① 新增 `lib/api-client.ts`；② 集中 `/api/generate-model`、`/api/metadata/init` 等调用；③ 统一错误转换。 | 1-2d |
| P1-07 | PDF 导出实为 Markdown 下载 | `epc-tab.tsx:99` | 99 | 代码注释明确 TODO，当前导出 `.md` 文件但 UI 文案可能写“导出 PDF”。 | ① 接入 `html2pdf.js` 或服务端 Puppeteer；② 或临时将按钮文案改为“导出 Markdown”。 | 1-2d |
| P1-08 | `activeModelType` 状态废弃未清理 | `store/ontology-store.ts:151` 等 | 151、845、870、3148、3153、3181、3195 | 该状态仅在创建项目时设为 `data`，之后未被任何组件消费，属于“死状态”。 | 确认 `workspaceScope` / `activeDimension` 已取代它后，从 store 类型、初始值、setter 中移除。 | 0.5d |
| P1-09 | 原生 emoji 作为功能图标 | `modeling-workspace.tsx` 菜单、`project-setup.tsx` 领域卡片等 | 见 5.4 | Windows/macOS 渲染差异大，可访问性差，无法自定义颜色/大小。 | 统一替换为 `lucide-react` 图标，并为纯图标按钮补充 `aria-label`。 | 1d |
| P1-10 | 落地页与工具页两套视觉语言 | `page.tsx` vs `tool/page.tsx` | — | 落地页使用橙色品牌色与自定义按钮/卡片样式，工具页使用 shadcn neutral 主题，切换时割裂。 | ① 统一 primary 色或提供品牌到 shadcn 的映射；② 复用组件库按钮/卡片。 | 1-2d |
| P1-11 | `layout.tsx` body 未应用主题背景 | `layout.tsx` | 68 | `<body className={`antialiased`}>` 未写 `bg-background text-foreground`，依赖 globals.css 的 base 规则。 | body 显式加上 `bg-background text-foreground`（与 shadcn 模板一致）。 | 0.1d |
| P1-12 | OpenGraph/Twitter 图片注释掉 | `layout.tsx` | 37-52 | 分享卡片无图，不利于传播。 | 提供默认 OG 图片并取消注释，或删除无用配置。 | 0.3d |

### P2 — 细节优化

| ID | 标题 | 文件 | 行号 | 描述 | 验收标准 | 预估 |
|---|---|---|---|---|---|---|
| P2-01 | 工作台左侧菜单宽度固定 56/80px | `modeling-workspace.tsx` | 278 | 小屏可能溢出，且无响应式折叠。 | 增加 `md:` 断点，小屏隐藏文字仅保留图标或改为可折叠 Sidebar。 | 1d |
| P2-02 | 按钮/空状态 emoji 未替换 | `data-model-editor.tsx:899`、 `behavior-model-editor.tsx` 多处、 `event-model-editor.tsx:229/593` 等 | 见 5.4 | 空状态、统计徽章、按钮使用 emoji。 | 替换为 Lucide 图标 + 规范的空状态插画/文案。 | 0.5d |
| P2-03 | 无国际化（i18n）预留 | 所有组件 | — | 全部中文硬编码，后续出海/多语言成本高。 | 评估是否引入 `next-intl` 或至少抽取文案到 `locales/zh.ts`。 | 2-3d |
| P2-04 | 删除/危险操作缺少二次确认规范 | `project-list.tsx:71`、 `modeling-workspace.tsx:116/415` | 71、116、415 | 有的用 `confirm()`，有的内联 if，体验不统一。 | 统一为 `ConfirmDialog`，要求用户输入项目名或勾选确认才能删除高危操作。 | 0.5d |
| P2-05 | `metadata-manager` 按钮 emoji | `metadata-manager.tsx:150` | 150 | “🔄 从Excel重载” 使用 emoji。 | 替换为 `<RefreshCw />` 图标。 | 0.1d |
| P2-06 | `modeling-workspace` header 按钮过多换行 | `modeling-workspace.tsx` | 228-245 | 小屏时“元数据管理、主数据管理、导出 JSON、Excel、生成手册、新建项目”全部平铺，易换行。 | 将次要操作收入 DropdownMenu 或分组。 | 0.5d |
| P2-07 | 表单 label 使用原生 `<label>` | `modeling-workspace.tsx:421/429`、`excel-import-dialog.tsx:299` | 421、429、299 | 应使用 shadcn `Label` 组件以统一间距、聚焦、禁用态。 | 替换为 `src/components/ui/label.tsx`。 | 0.2d |
| P2-08 | 动画 keyframes 重复 | `globals.css` | 177-195 | `flow-line` 与 `data-flow` 定义完全相同。 | 合并或删除重复 keyframes。 | 0.1d |
| P2-09 | globals.css body 规则重复 | `globals.css` | 127-138 | `@layer base` 内已有 `body { @apply bg-background text-foreground; }`，外部又重复 `body { @apply font-sans; }`。 | 合并到同一 `body` 规则内。 | 0.1d |
| P2-10 | 部分图标按钮缺少 aria-label | `modeling-workspace.tsx:209/217` 编辑/删除项目按钮 | 209、217 | 仅图标无文本说明，屏幕阅读器无法识别。 | 为所有纯图标按钮补充 `aria-label`。 | 0.2d |
| P2-11 | Excel 导入对话框 Sheet 数量文案错误 | `excel-import-dialog.tsx` | 需确认 | `AGENTS.md` 写 8 个 Sheet，但旧版 `excel-import-dialog` 说明仍写 6 个。 | 统一文案，或废弃旧版组件仅保留 `excel-import-export-dialog.tsx`。 | 0.2d |

---

## 三、关键代码证据

### 3.1 `alert()` / `confirm()` 分布（31 处）

| 组件 | 行号 | 类型 | 当前文案/用途 |
|---|---|---|---|
| `behavior-model-editor.tsx` | 125、158、163、192、210 | alert | 状态/转换保存、删除引用校验 |
| `data-model-editor.tsx` | 156、161、1109、1113、1742、1789、1795 | alert/confirm | 主数据、引用实体、关系校验、索引选择、领域事件 |
| `e1-entity-panel.tsx` | 75 | alert | 创建实体失败 |
| `event-model-editor.tsx` | 102、129、170 | alert | 聚合根校验、保存事件/订阅失败 |
| `modeling-workspace.tsx` | 116、124、130、151、415 | alert/confirm | 删除项目、保存项目、清空数据 |
| `project-list.tsx` | 66、71、80、99、106、144 | alert/confirm | 打开/删除/更新项目 |
| `project-setup.tsx` | 82 | alert | 创建项目失败 |
| `publish-dialog.tsx` | 72 | alert | 请输入快照名称 |
| `version-manager.tsx` | 56、225 | alert/confirm | 版本名称、删除版本 |

### 3.2 `console.log/error` 分布（16 处）

```
manifest-export-dialog.tsx:84  console.error('XLSX 导出失败:', err);
manual-generator.tsx:134,335,443  console.error/log
masterdata-manager.tsx:110,190  console.error
metadata-manager.tsx:52        console.error('初始化元数据失败:', error);
modeling-workspace.tsx:123,150  console.error
project-list.tsx:43,65,79,98,143  console.error
project-setup.tsx:81           console.error('创建项目失败:', error);
publish-dialog.tsx:148         console.error('保存快照失败:', error);
```

### 3.3 `generateId()` 重复定义（10 处）

```
behavior-model-editor.tsx:22    substring(2, 10)
business-chain-detail.tsx:25    substring(2, 15)
e1-entity-panel.tsx:40          substring(2, 10)
event-model-editor.tsx:22       substring(2, 10)
data-model-editor.tsx:47        substring(2, 10)
manual-generator.tsx:60         substring(2, 10)
metadata-manager.tsx:29         substring(2, 10)
masterdata-manager.tsx:53       substring(2, 10)
metrics-editor.tsx:16           substring(2, 10)
rule-model-editor.tsx:23        substring(2, 10)
```

### 3.4 emoji 图标分布（主要位置）

```
modeling-workspace.tsx:  🌳 📦 ⚠️ 📊 🛡️ 🔌 🗄️ ⚡ 📋 📨 🔔 🗑️
e1-entity-panel.tsx:      ⚡ 📋
project-setup.tsx:        📄 📦 📊 ⚙️ ⚡ 📋
data-model-editor.tsx:    📝 🔗
behavior-model-editor.tsx: ⚡（空状态多处）
event-model-editor.tsx:   🔔
metadata-manager.tsx:     🔄
metrics-editor.tsx:       📊
lifecycle-tab.tsx:        🔄
masterdata-manager.tsx:   📊
organization-editor.tsx:  🏢 ✅ ❌
manual-generator.tsx:     ✨ 🔗 ⚡ 📋 🔄
version-manager.tsx:      📦
publish-dialog.tsx:       ✅ ❌
```

---

## 四、组件清单与状态（40 个）

| 组件 | 行数 | 状态 | 备注 |
|---|---|---|---|
| `modeling-workspace.tsx` | 451 | ✅ 可用 | 含 P0/P1 问题 |
| `project-setup.tsx` | 250 | ✅ 可用 | 领域卡片 emoji |
| `project-list.tsx` | 268 | ✅ 可用 | alert/confirm |
| `e1-entity-panel.tsx` | 262 | ✅ 可用 | emoji、alert |
| `data-model-editor.tsx` | 1,847 | ✅ 较完整 | alert/confirm |
| `behavior-model-editor.tsx` | 1,490 | ✅ 完整 | alert、generateId |
| `rule-model-editor.tsx` | 705 | ✅ 可用 | 空状态 emoji |
| `event-model-editor.tsx` | 647 | ✅ 可用 | alert、emoji |
| `process-model-editor.tsx` | — | ❌ 缺失 | P0-01 |
| `governance-editor.tsx` | — | ✅ 可用 |  |
| `organization-editor.tsx` | — | ✅ 可用 | emoji |
| `data-source-editor.tsx` | — | ✅ 可用 |  |
| `metrics-editor.tsx` | — | ✅ 可用 | emoji |
| `masterdata-manager.tsx` | — | ✅ 可用 | alert、console |
| `metadata-manager.tsx` | — | ✅ 可用 | console、emoji |
| `manual-generator.tsx` | 1,050 | ✅ 可用 | console、any |
| `excel-import-dialog.tsx` | 327 | ⚠️ 旧版 | 原生 textarea、文案 |
| `excel-import-export-dialog.tsx` | — | ✅ 新版 | 优先使用 |
| `business-chain-tree.tsx` | — | ✅ 可用 |  |
| `business-chain-detail.tsx` | — | ✅ 可用 | generateId |
| `element-library.tsx` | — | ✅ 可用 |  |
| `element-selector.tsx` | — | ✅ 可用 |  |
| `scenario-workspace.tsx` | — | ✅ 可用 |  |
| `epc-steps-editor.tsx` | — | ✅ 可用 |  |
| `epc-tab.tsx` | — | ✅ 可用 | PDF TODO |
| `epc-coverage-panel.tsx` | — | ✅ 可用 |  |
| `epc-validation-panel.tsx` | — | ✅ 可用 |  |
| `ai-draft-fill-dialog.tsx` | — | ✅ 可用 |  |
| `version-manager.tsx` | — | ✅ 可用 | alert/confirm |
| `version-history-panel.tsx` | — | ✅ 可用 |  |
| `module-detail-actions.tsx` | — | ✅ 可用 |  |
| `module-status-badge.tsx` | — | ✅ 可用 |  |
| `module-reference-list.tsx` | — | ✅ 可用 |  |
| `warning-center.tsx` | — | ✅ 可用 |  |
| `manifest-export-dialog.tsx` | — | ✅ 可用 | console |
| `publish-dialog.tsx` | — | ✅ 可用 | alert/console |
| `reference-doc-panel.tsx` | — | ✅ 可用 |  |
| `lifecycle-tab.tsx` | — | ✅ 可用 | emoji |
| `semantic-layer-tab.tsx` | — | ✅ 可用 |  |
| `side-effect-section.tsx` | — | ✅ 可用 |  |

---

## 五、推荐任务拆分（可按人分配）

### Sprint A：基础体验与规范（2-3 天）
- **P0-03** 接入 ThemeProvider + 主题切换
- **P0-04** 修正 `lang="zh-CN"`
- **P1-11** body 应用 `bg-background text-foreground`
- **P1-03** 替换原生 textarea 为 shadcn Textarea
- **P2-07** 替换原生 label 为 shadcn Label
- **P2-09** 合并重复 body 规则
- **P2-08** 合并重复 keyframes

### Sprint B：反馈机制统一（2-3 天）
- **P0-02** 替换所有 `alert()` / `confirm()`（含 P1-04 危险操作二次确认规范）
- **P1-01** 统一 logger 替代 console
- **P1-05** 新增全局 Error Boundary
- **P1-04** 加载状态 Skeleton 规范

### Sprint C：视觉一致性与图标（2 天）
- **P1-09** 将 emoji 菜单/领域卡片图标替换为 Lucide
- **P2-02** 替换空状态/按钮 emoji
- **P2-05** `metadata-manager` 刷新按钮图标化
- **P2-10** 补充图标按钮 `aria-label`
- **P1-10** 统一落地页与工具页视觉语言（可选）

### Sprint D：架构与可维护性（3-4 天）
- **P0-05** 拆分 Zustand store 为 slices
- **P1-02** 统一 `generateId` 到 `lib/utils`
- **P1-06** 统一 API client
- **P1-08** 清理 `activeModelType` 死状态

### Sprint E：功能补齐（3-5 天）
- **P0-01** 补齐 ProcessModel 编辑器或调整需求
- **P1-07** 真正 PDF 导出或文案降级
- **P2-11** 统一 Excel 导入 Sheet 文案/组件
- **P2-06** header 操作折叠优化
- **P2-01** 响应式侧边栏

---

## 六、附录：运行中可快速验证的命令

```bash
# 1. 类型检查
npx tsc --noEmit

# 2. lint
pnpm lint

# 3. 查找剩余 alert/confirm
grep -rn "alert(\|confirm(" src/components/ontology --include="*.tsx"

# 4. 查找剩余 console
grep -rn "console\." src/components/ontology --include="*.tsx"

# 5. 查找剩余 emoji（粗略）
grep -rn "[🌳📦⚠️📊🛡️🔌💾🤖⚙️🏢👤📄🔄✅❌📝🔍⚡📋🗑️🎯🏠🔧📈🔔📎🚀💡🔗📁✨🎨]" src/components/ontology --include="*.tsx"

# 6. 开发预览
pnpm dev
```

---

## 七、风险与依赖

1. **P0-01 流程模型**：需要先和产品/架构确认是否保留流程模型，再决定是“新增编辑器”还是“清理文案”。
2. **P0-05 Store 拆分**：改动面大，建议在测试覆盖率较高的时机进行，且必须跑通 `pnpm run ci:check`。
3. **P1-02 generateId**：若改为 `crypto.randomUUID()`，需确认 SSR/服务端调用场景是否兼容；纯浏览器端无问题。
4. **P1-07 PDF 导出**：若走服务端 Puppeteer，需确认部署环境是否支持；走客户端 `html2pdf.js` 更轻量但样式兼容性差。
5. **P2-03 i18n**：属于长期投入，短期不建议做，但可预留文案抽取结构。
