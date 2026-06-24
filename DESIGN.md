# DESIGN.md

## 气质与意象

建筑师的工作台 — 蓝图纸铺在深色台面上，每一层图纸都有清晰的标注和刻度。工具排列整齐，随时可取。光线从左侧打来，投下柔和的阴影。整个空间克制、精确，信息密度高但不压迫。

## 视觉策略

- 克制而精确：减少装饰，增加信息密度。用线条和间距代替色块和阴影
- 工作台 = 浅暖灰底 + 白色面板 + 1px border 分割
- Landing 页品牌色（#ff6e00）仅在工作台中作强调色使用（选中态、关键操作按钮），不泛滥

## Design Tokens

### 色彩

- 主色（强调）：#ff6e00 — 来自 Landing 品牌色，仅用于选中态边框、主按钮、关键指标
- 工作台背景：#fafaf9（暖灰白，比纯白减少屏幕疲劳）
- 面板/卡片：#ffffff + border #e7e5e4
- 暗色模式背景：oklch(0.145 0 0) → 保持现有
- 状态色：success #16a34a / warning #d97706 / danger #dc2626 / info #2563eb
- Tab 选中指示线：2px solid #ff6e00

### 字体

- 字体族：'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Inter, system-ui, sans-serif
- 标题：font-weight 600，size 14-18px
- 正文：font-weight 400，size 13px
- 辅助文字：text-muted-foreground，size 12px
- 数字统计：tabular-nums，font-weight 600

### 间距与圆角

- 圆角：6px（--radius-sm），不使用大圆角
- 面板内边距：16px（p-4）
- Tab 内边距：px-4 py-2.5
- 组件间距：12px（gap-3）

### 图标

- 统一使用 Lucide Icons，禁止 emoji
- Tab 图标 16x16，按钮图标 14x14
- Footer 统计图标用 Lucide 替换 emoji

## 布局与响应式

- Header：单行布局，左侧项目信息 + 右侧操作按钮组
- Tab Bar：水平排列，带图标 + 文字 + 可选 Badge
- 主内容区：ResizablePanelGroup 水平分栏（业务链模式）或全宽（其他 Tab）
- Footer：单行状态栏，左统计右操作
- 最小宽度：1024px，低于此宽度 Tab 可横向滚动

## 组件规范

### Tab Bar

- 每个 Tab 含图标 + 中文标签 + 可选 Badge（警示数）
- 选中态：文字加深 + 底部 2px 橙色指示线
- 未选中态：text-muted-foreground + hover 变深
- 图标对应：Network(业务链) / Library(要素库) / AlertTriangle(警示) / Gauge(指标) / ShieldCheck(治理) / Database(数据源)

### 业务链树

- 缩进式树形，每级 12px
- 节点行高 28px，hover 浅灰背景
- 选中态：浅橙背景 + 左侧 2px 橙色边
- 类型标签用不同颜色的 Badge：价值域(蓝) / 能力(紫) / 场景(青) / EPC(橙)

### 状态栏

- 左侧：Lucide 图标 + 数字，用分隔点（·）分隔
- 右侧：清空数据按钮（文字链接，红色 hover）

## 交互与状态

- 过渡动画：150ms ease-out（颜色、背景）
- 无入场动画（工作台是工具，不是展示）
- hover：背景色变化 100ms
- active/selected：橙色强调

## 设计禁忌

- 禁止 emoji 作为 UI 图标
- 禁止大圆角（>8px）
- 禁止多层阴影堆叠（最多一层 subtle shadow）
- 禁止 Landing 页的 GSAP 动画出现在工作台
- 禁止渐变背景填充大面积区域
