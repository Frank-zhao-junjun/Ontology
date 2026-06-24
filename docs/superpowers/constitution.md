# 项目宪法 (Constitution)

> **不可变更**：本文档中的原则是所有 Spec 必须遵守的"宪法"。
> 如需修改，必须经过团队评审并更新所有相关 Spec。
> **固化团队决策**：将重复性约束从各 Spec 提取到此，避免反复声明。

---

## 1. API 设计规范

### 1.1 通用规范

| 规则 | 标准 |
|------|------|
| **协议** | HTTP/HTTPS，RESTful 风格 |
| **Base Path** | `/api` 前缀 |
| **版本化** | 通过请求头或 URL 前缀，当前 v1 不强制 |
| **Content-Type** | 请求: `application/json`；响应: `application/json` |
| **编码** | 全部 UTF-8 |
| **鉴权** | 所有 `/api` 端点必须有鉴权（公开健康检查除外） |

### 1.2 错误响应格式

所有错误响应统一结构：

```json
{
  "error": {
    "code": "U4xxx",
    "details": {},
    "message": "human readable description"
  },
  "trace_id": "uuid"
}
```

| 错误码 | 含义 |
|--------|------|
| U4001 | 请求参数缺失或格式错误 |
| U4011 | 认证缺失 |
| U4012 | 认证失败（用户名或密码错误） |
| U4031 | 权限不足 |
| M4001 | 业务逻辑校验失败 |
| M4002 | 资源不存在或引用错误 |
| M5001 | 服务器内部错误 |

### 1.3 命名规范

| 资源 | 命名规则 | 示例 |
|------|---------|------|
| 路由路径 | 小写、复数、连词符 | `/api/domains`, `/api/meta-models` |
| JSON 字段 | camelCase | `modelType`, `releaseNo` |
| 数据库字段 | snake_case | `model_type`, `release_no` |
| Python 函数 | snake_case | `create_definition`, `publish_release` |

---

## 2. 安全基线

### 2.1 认证与授权

| 要求 | 标准 |
|------|------|
| **密码存储** | 禁止 SHA-256 无盐。使用 `werkzeug.security.generate_password_hash` (pbkdf2/scrypt) |
| **Token** | 必须包含随机成分（`secrets.token_hex`），禁止确定性生成 |
| **Token 过期** | Token 必须有过期机制（如 24h），到期后要求重新登录 |
| **Token 存储** | 禁止 `localStorage`。使用 HTTP-only Cookie |
| **默认密码** | 仅限开发环境。生产环境必须从环境变量注入 |

### 2.2 输入校验

| 规则 | 说明 |
|------|------|
| **所有用户输入必须校验** | 前端校验 + 后端双重校验 |
| **禁止 `force=True` 绕过 Content-Type** | `request.get_json(force=True)` 仅限于兼容场景，主流路径使用标准解析 |
| **参数化查询** | 所有数据库查询禁止字符串拼接，必须使用 ORM 参数化查询 |
| **敏感数据** | 密码、Token、密钥等禁止出现在日志、错误消息、URL 参数中 |

### 2.3 依赖安全

| 规则 | 说明 |
|------|------|
| **第三方库审计** | 引入新依赖前检查已知 CVE |
| **最小依赖原则** | 不引入"可能用得上"的依赖 |

---

## 3. 代码质量标准

### 3.1 测试要求

| 指标 | 目标值 |
|------|--------|
| 后端测试覆盖率 | ≥ 80% |
| 前端测试覆盖率 | ≥ 70% |
| 核心路径测试 | 100% — 登录、发布、导出、5维 CRUD |
| 新代码测试 | 每个 Task 必须有对应测试（TDD 原则） |

### 3.2 TypeScript 规范

| 规则 | 说明 |
|------|------|
| **禁止 `any`** | 除 Ant Design render 回调外，不允许使用 `any` 类型 |
| **API 响应类型** | 所有 API 调用必须有响应类型泛型，不可使用 `AxiosResponse<any>` |
| **接口定义** | 共享类型定义在 `types/` 或 `services/api.ts`，不散布在各组件中 |

### 3.3 Python 规范

| 规则 | 说明 |
|------|------|
| **类型注解** | 所有公共函数必须有类型注解 |
| **异常处理** | 禁止裸 `raise ValueError`。使用自定义异常类或结构化 error code |
| **代码重复** | 重复超过 3 次的模式必须提取为共享函数/基类 |

### 3.4 前端规范

| 规则 | 说明 |
|------|------|
| **禁止 `catch(() => {})`** | 所有错误必须展示给用户（`message.error`），不可静默吞掉 |
| **禁止 `prompt()`/`alert()`** | 使用 Ant Design Modal 替代浏览器原生对话框 |
| **数据流** | 写操作必须调用后端 API，不可仅停留在 React 本地状态 |
| **UI 反馈** | 成功提示必须对应真实 API 响应，不可先于 API 返回前显示 |

---

## 4. 基础设施规范

### 4.1 配置管理

| 配置项 | 方式 | 默认值 |
|--------|------|--------|
| 数据库路径 | 环境变量 `SQLALCHEMY_DATABASE_URI` | `sqlite:///instance/ontology.db` |
| AI 可用性 | `AI_AVAILABLE` | `True` |
| Flask 环境 | `FLASK_ENV` | `development` |
| 默认密码注入 | 环境变量 | 生产环境必设 |

### 4.2 数据库

| 规则 | 说明 |
|------|------|
| **ORM** | SQLAlchemy，不使用裸 SQL |
| **迁移** | v1 使用 `db.create_all()`，v2 迁至 Alembic |
| **SQLite** | 仅限 v1 原型，Roadmap 迁至 PostgreSQL |

### 4.3 日志

| 规则 | 说明 |
|------|------|
| **敏感过滤** | 日志自动过滤密码、Token、密钥 |
| **trace_id** | 每个请求带 trace_id，关联前端请求与后端日志 |
| **级别** | 开发环境 DEBUG，生产环境 INFO |

---

## 5. 项目结构规范

```
ontology/
├── backend/               # Flask 后端
│   ├── __init__.py        # App factory
│   ├── models.py          # 数据库模型
│   ├── auth.py            # 认证与授权
│   ├── routes_*.py        # 按资源分组的路由
│   ├── meta_model_service.py  # 业务逻辑层
│   ├── extensions.py      # SQLAlchemy 实例
│   └── api_response.py    # 统一响应格式
├── frontend-react/        # React 前端
│   └── src/
│       ├── components/    # UI 组件
│       │   ├── layout/    # 布局组件（三栏）
│       │   ├── review/    # 确认面板（5维表单）
│       │   ├── tree/      # 实体树
│       │   ├── chat/      # 对话
│       │   ├── epc/       # EPC 编辑器
│       │   └── export/    # 导出与版本
│       ├── store/         # Zustand 状态管理
│       └── services/      # API 服务层
├── docs/
│   └── superpowers/
│       ├── specs/         # Spec 文档
│       └── plans/         # 实施计划
└── tests/                 # 后端测试
```

---

## 6. 变更管理

| 变更类型 | 处理方式 | 判断标准 |
|---------|---------|---------|
| **重大变更** | 完整 SDD 流程：增量 Spec → Review → 更新 Plan → 生成 Tasks | 可能影响其他模块的行为、修改数据模型、变更 API 接口 |
| **微小变更** | 直接修改，不走完整流程 | 纯局部修改（改文案、调样式、修 typo） |

**防漂移规则**：代码变更必须同步更新 Spec。Spec 版本与代码版本联动，禁止"代码迭代十几个版本，Spec 停留在 v1"。

---

> 本文档于 2026-06-13 创建，初始版本 v1.0。
> 所有新功能 Spec 必须在开头声明"本 Spec 遵守宪法 §X、§Y"。
