# 仓库目录结构提案（占位）

**状态**：待 PM/架构评审后定稿。对齐 HLD「推荐目录逻辑」与《最终需求文档》附录 C。

## 建议单仓根目录（示例）

```
repository-root/
  ontology/              # 五类元模型 YAML/JSON 源与发布配置
  generated/             # 生成物（可选与手写代码分离）
  backend/               # 或 app/：Flask/API、领域技能、规则、状态机、事件总线（与 HLD 画像一致）
  frontend/              # Vue3 三栏与动作协议
  docs/                  # 运行时文档；需求基线仍以 Ontology 根目录为准时可仅放链接
  scripts/               # 迁移、本地启动、CI 辅助
```

## 待决问题

- [ ] monorepo 是否包含 `frontend` + `backend` 同仓
- [ ] `generated/` 是否进版本库或仅 CI 产物
- [ ] Python 包名与 `app/core`（HLD §11）映射

---

*占位 v0.1 | 由 PM 工作区初始化*
