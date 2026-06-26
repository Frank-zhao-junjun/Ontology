# 开发 Backlog（后续批次：Sprint E 执行版）

版本：v1.0  
日期：2026-03-28  
适用阶段：Sprint E（Sprint D 完成后）

## 1. 目标

1. 把事件系统从进程内模型推进到跨进程可扩展架构。
2. 补齐多租户与 ABAC 扩展能力。
3. 将生成器从“模板工具”推进为“领域包平台”。
4. 建立运维控制台与观测面板。

## 2. Sprint E 进入条件

1. Sprint D 退出门槛全部满足。
2. 发布门禁脚本已在主干稳定执行。
3. 生成器最小闭环和网关治理已经上线到内部环境。

## 3. Epic 总览

| Epic | 目标输出 | 说明 |
| --- | --- | --- |
| EVT-XProcess | 跨进程事件总线替换方案与最小实现 | 替代进程内总线 |
| AUTH-MultiTenant | 多租户与 ABAC 扩展 | 从角色权限升级 |
| GEN-Platform | 领域包生成与模板平台化 | 支撑多领域扩展 |
| OPS-Console | 运维控制台与观测面板 | 面向运行维护 |
| QA-Release | 发布可靠性与回归治理强化 | 面向准生产质量 |

## 4. Sprint E 详细 Backlog

## 4.1 跨进程事件总线（EVT）

| ID | 优先级 | 任务 | 依赖 | 产出 | 验收标准 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| EVT-E-001 | P1 | 产出跨进程事件总线专题设计 | Sprint D 完成 | 设计文档 | 明确 broker、投递语义、重试、死信 | TODO |
| EVT-E-002 | P1 | 实现事件总线抽象层 | EVT-E-001 | bus abstraction | 进程内/跨进程实现可切换 | TODO |
| EVT-E-003 | P1 | 接入外部 broker 最小实现 | EVT-E-002 | broker adapter | 可完成 publish/subscribe 基本链路 | TODO |
| EVT-E-004 | P1 | 增加死信与重试队列策略 | EVT-E-003 | DLQ + retry strategy | 失败事件可进入死信队列 | TODO |
| EVT-E-005 | P2 | 事件顺序与幂等语义增强 | EVT-E-003 | ordering/idempotency controls | 幂等与顺序策略可配置 | TODO |

## 4.2 多租户与 ABAC 扩展（AUTH）

| ID | 优先级 | 任务 | 依赖 | 产出 | 验收标准 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| AUTH-E-001 | P1 | 产出多租户与 ABAC 专题设计 | Sprint D 完成 | 设计文档 | 明确租户边界、资源标签、策略模型 | TODO |
| AUTH-E-002 | P1 | 数据层增加租户隔离字段与过滤策略 | AUTH-E-001 | tenant filter layer | 读写链路均带租户隔离 | TODO |
| AUTH-E-003 | P1 | 在网关与技能路径引入 ABAC 校验器 | AUTH-E-001 | ABAC evaluator | 支持资源属性 + 用户属性判定 | TODO |
| AUTH-E-004 | P2 | 管理端权限策略配置页面 | AUTH-E-003 | policy UI | 可配置并验证策略生效 | TODO |

## 4.3 生成器平台化（GEN）

| ID | 优先级 | 任务 | 依赖 | 产出 | 验收标准 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| GEN-E-001 | P1 | 设计领域包与模板注册机制 | Sprint D 生成器闭环 | 设计文档 + registry | 支持多模板、多领域包注册 | TODO |
| GEN-E-002 | P1 | 实现模板包加载与版本管理 | GEN-E-001 | template package loader | 模板包可安装、枚举、回滚 | TODO |
| GEN-E-003 | P1 | 实现领域包生成命令与清单 | GEN-E-001 | package manifest + generate command | 可按领域一键生成骨架 |
| GEN-E-004 | P2 | 模板质量校验与兼容性检查 | GEN-E-002 | compatibility checker | 模板升级前可做兼容性校验 | TODO |

## 4.4 运维控制台与观测面板（OPS）

| ID | 优先级 | 任务 | 依赖 | 产出 | 验收标准 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| OPS-E-001 | P1 | 设计运维控制台信息架构 | Sprint D 观测基础 | IA 文档 | 指标、日志、事件、发布面板清晰 | TODO |
| OPS-E-002 | P1 | 实现系统健康总览面板 | OPS-E-001 | dashboard | 展示请求量、失败率、自愈率、事件失败率 | TODO |
| OPS-E-003 | P1 | 实现发布历史与回滚面板 | OPS-E-001 | release UI | 可查看发布链路并触发回滚 |
| OPS-E-004 | P1 | 实现事件监控与死信面板 | EVT-E-004 | event monitor UI | 可查看订阅失败与死信队列 |
| OPS-E-005 | P2 | 告警规则配置与通知通道 | OPS-E-002 | alert configuration | 支持阈值告警和通知绑定 | TODO |

## 4.5 测试与发布治理（QA）

| ID | 优先级 | 任务 | 依赖 | 产出 | 验收标准 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| QA-E-001 | P1 | 跨进程事件链路集成测试 | EVT-E-003 | integration suite | 跨进程发布/订阅链路稳定 |
| QA-E-002 | P1 | 多租户隔离与 ABAC 回归测试 | AUTH-E-003 | auth regression suite | 越权访问被稳定阻断 | TODO |
| QA-E-003 | P1 | 生成器模板兼容性测试 | GEN-E-002 | template regression suite | 模板升级不破坏现有生成物 | TODO |
| QA-E-004 | P1 | 运维面板数据一致性测试 | OPS-E-002 | dashboard consistency tests | 控制台数据与日志/指标一致 | TODO |
| QA-E-005 | P2 | 准生产演练脚本（发布/回滚/告警） | OPS-E-003,OPS-E-005 | rehearsal script | 可模拟完整运维演练 | TODO |

## 5. 执行顺序建议

1. 先做 EVT-E-001、AUTH-E-001、GEN-E-001、OPS-E-001，冻结四个专题设计。
2. 再做 EVT-E-002/003/004 与 AUTH-E-002/003，并行推进底层能力。
3. 同步推进 GEN-E-002/003 与 OPS-E-002/003/004。
4. 最后集中做 QA-E-001 到 QA-E-004，形成 Sprint E 发布门槛。

## 6. 关键依赖

1. EVT-E-001 是所有事件扩展任务前置。
2. AUTH-E-001 是多租户与 ABAC 前置。
3. GEN-E-001 是模板平台化前置。
4. OPS-E-001 是所有控制台任务前置。

## 7. Sprint E 退出门槛

1. 跨进程事件总线最小闭环可运行。
2. 多租户隔离与 ABAC 最小策略生效。
3. 领域包生成器支持至少 2 种模板包。
4. 运维控制台可查看关键运行指标与发布历史。
5. 对应回归与集成测试全部通过。

## 8. Sprint F 储备方向

1. 智能运维与自动修复建议。
2. 模板市场与插件生态。
3. 复杂审批流与组织模型扩展。
4. 多区域部署与高可用架构。
