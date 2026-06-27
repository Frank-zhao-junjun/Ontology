---
name: goal-loop
description: >-
  Goal-Loop methodology for multi-step agent work: strategy exploration, GOAL/GOALS/REPORT
  files, sub-goal state machine, iteration budgets, rollback, and decision logs. Use when
  the user asks for Goal-Loop, Goal Kit, GOAL.md, GOALS.md, REPORT.md, .hermes planning,
  multi-phase delivery with checkpoints, or structured goal decomposition before execution.
---

# Goal-Loop 方法论（改进版）

基于 Vincent Logic 原版 + Chris Hayduk 实践经验 + Goal Kit 状态机优化。

**改进要点：** 策略探索层 · 实验/决策日志 · 回溯机制 · 迭代预算 · 子目标状态表 · 变更版本管理（Changelog）

**Announce at start:** "I'm using the goal-loop skill to set up GOAL/GOALS/REPORT."

**Default output directory:** `.hermes/` (override if user specifies another path)

**Related skills:**
- `brainstorming` — before Goal-Loop when requirements are fuzzy
- `writing-plans` — after GOALS confirmed, for code-level implementation plans
- `executing-plans` / `subagent-driven-development` — during execution phase
- `verification-before-completion` — before marking sub-goals complete

---

## When to Use

Use Goal-Loop when **all** apply:

1. Task spans multiple sessions or sub-agents
2. Success criteria must be verifiable (tests, metrics, artifacts)
3. User wants explicit scope boundaries (allowed / forbidden)
4. Risk of wrong approach → need strategy comparison before coding

**Do NOT use** for single-file fixes, one-shot questions, or tasks with no acceptance criteria.

---

## State Machine (子目标)

| 状态 | 含义 | 允许动作 |
|------|------|----------|
| `未开始` | 尚未开工 | 排期、依赖检查 |
| `进行中` | 当前迭代 | 实现、实验、更新 REPORT |
| `阻塞` | 外部依赖或未决决策 | 记录阻塞，**停止该子目标**，等用户确认 |
| `已完成` | 完成标准已验证 | 只读；变更需 Changelog + 用户确认 |
| `需回溯` | 触发回溯条件 | 报告影响范围，**暂停执行**，修订 GOALS/GOAL |

**Transitions:**
- `未开始` → `进行中`：开始该子目标当前迭代
- `进行中` → `已完成`：完成标准 **全部** 可验证通过
- `进行中` → `阻塞`：缺信息 / 环境 / 权限
- `进行中` → `需回溯`：命中该子目标或全局「回溯条件」
- `需回溯` → `进行中`：用户确认修订后的 GOALS/GOAL

---

## Mandatory Workflow (5 phases)

### Phase 1 — 对齐总目标

向用户确认（缺项则 AskQuestion）：

- 最终要完成什么（一句话）
- 交付物清单
- 完成标准（可验证）
- 允许修改范围 / 禁止事项
- 验收方式

**Do not write files until Phase 1 answers exist.**

### Phase 2 — 生成 GOAL.md

1. 探索 **2–3 种候选策略**（S1/S2/S3），每项含：概述 · 优势 · 劣势
2. 选定策略 + 理由
3. 写入 `GOAL.md`（模板见 [templates.md](templates.md)）
4. **用户确认 GOAL.md** 后再进入 Phase 3

### Phase 3 — 拆解 GOALS.md

1. 按选定策略拆分子目标 G1, G2, …（执行顺序 + 依赖）
2. 每个子目标必须含：**回溯条件** · **迭代/资源预算**
3. 标注可并行子目标
4. 写入 `GOALS.md`
5. **用户确认 GOALS.md** 后再进入 Phase 4

### Phase 4 — 生成 REPORT.md 模板

1. 初始化子目标状态总览（全部 `未开始`，进度 0%，迭代 0）
2. 空：已完成 / 阻塞 / 风险 / 决策实验 / 下一步 / 待确认
3. **用户确认三文件齐全** 后开始执行（Phase 5）

### Phase 5 — 执行循环

每轮结束 **必须** 更新 `REPORT.md`：

1. 更新子目标状态表（状态 · 进度 · 迭代次数 · 备注）
2. 追加「已完成事项」（日期 + 产出路径）
3. 更新「当前进度」一段话
4. 记录「决策与实验」（防重复踩坑）
5. 更新「下一步计划」

**During execution:**

| 事件 | 动作 |
|------|------|
| 子目标迭代 +1 | 更新状态表迭代次数；检查是否超预算 |
| 迭代超限 | **停止**该子目标，REPORT 阻塞节报告，等用户确认 |
| 触发回溯条件 | 状态 → `需回溯`，说明影响 G?，**暂停**直到用户确认修订 |
| 完成标准满足 | 状态 → `已完成`，附验证证据（命令输出 / 文件路径） |
| GOAL/GOALS 变更 | 写 Changelog（日期 · 内容 · 原因），用户确认后生效 |

---

## File Templates

**Use verbatim structure from** [templates.md](templates.md) — do not omit sections.

Quick paths:

| 文件 | 路径 |
|------|------|
| 总目标 | `.hermes/GOAL.md` |
| 子目标 | `.hermes/GOALS.md` |
| 进度 | `.hermes/REPORT.md` |

---

## REPORT Update Checklist (每轮)

```
- [ ] 子目标状态总览已更新
- [ ] 本轮完成事项已追加（含日期）
- [ ] 决策/实验记录已追加（如有）
- [ ] 阻塞/风险已更新
- [ ] 下一步计划明确且可执行
- [ ] 待确认问题列出建议选项
- [ ] Changelog 已更新（如有 GOAL/GOALS 变更）
```

---

## Integration with Code Work

| Goal-Loop 阶段 | 代码库动作 |
|----------------|------------|
| GOAL 策略 S? 选定 | 决定并行 vs 串行、测试优先 vs 功能优先 |
| G? 执行中 | 对应 `writing-plans` 或 scoped tasks |
| 完成标准含 CI | 运行 `ci:check` 等，证据写入 REPORT |
| 验收 | GOAL「验收方式」中的命令 + git push 等 |

---

## Anti-Patterns

- ❌ 跳过策略探索直接写 GOALS
- ❌ 未确认 GOAL/GOALS 就开始改代码
- ❌ 超迭代预算仍 silent continue
- ❌ 标记「已完成」无验证证据
- ❌ 改 GOAL/GOALS 不写 Changelog
- ❌ REPORT 只更新勾选不更新状态表

---

## Example

见 [examples.md](examples.md)（Ontology 覆盖率冲刺 `.hermes/` 实例）。
