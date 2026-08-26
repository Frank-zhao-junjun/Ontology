# OWL Class 建模 + NL2Ontology 查询预览 — 实施计划

> **状态**: ✅ 全部完成（2026-07-19）
> - TypeScript type-check: 零错误
> - 新增测试: 31/31 通过（4 文件）
> - 全量回归: 376 通过 / 3 预存失败（excel-export 14→13 Sheet 断言，非本次引入）

## 上下文

用户确认借鉴微软 Ontology-Playground 的两个核心能力：
1. **OWL Class 建模方法** — 将现有 E1-E8 要素以 OWL 类/属性/个体方式呈现和导出
2. **NL2Ontology 查询预览** — 自然语言输入 → 本体实体映射的可视化预览

当前项目已有完整的基础设施：Entity 类型天然映射 OWL Class、SemanticRelationType 已含 `is_a`/`equivalent_to` 等语义关系、LLM 客户端和 prompt builder 模式成熟、ManifestExportDialog 支持多格式导出。

## Part A: OWL Class 支持

### A1. 新增 OWL 类型定义

**文件**: `src/types/ontology.ts`（追加）

```typescript
// OWL 本体类型
export type OwlClassKind = 'class' | 'object_property' | 'datatype_property' | 'named_individual';

export interface OwlClass {
  id: string;                    // 类 URI 片段
  label: string;                 // rdfs:label
  labelEn?: string;
  subClassOf?: string[];         // 父类 ID 列表
  equivalentTo?: string[];       // owl:equivalentClass
  disjointWith?: string[];       // owl:disjointWith
  description?: string;          // rdfs:comment
  sourceMetaElementId?: string;  // 映射自哪个 MetaElement
}

export interface OwlObjectProperty {
  id: string;
  label: string;
  domain: string;                // rdfs:domain → OwlClass.id
  range: string;                 // rdfs:range → OwlClass.id
  subPropertyOf?: string[];
  inverseOf?: string;
  transitive?: boolean;
  symmetric?: boolean;
  functional?: boolean;
  description?: string;
}

export interface OwlDatatypeProperty {
  id: string;
  label: string;
  domain: string;                // rdfs:domain → OwlClass.id
  range: string;                 // xsd:string | xsd:integer | xsd:decimal | xsd:boolean | xsd:date | ...
  functional?: boolean;
  description?: string;
}

export interface OwlOntology {
  baseUri: string;               // eg: "http://ontology.example.com/erp/"
  ontologyIri: string;
  versionInfo?: string;
  label: string;
  classes: OwlClass[];
  objectProperties: OwlObjectProperty[];
  datatypeProperties: OwlDatatypeProperty[];
}
```

### A2. OWL 转换器

**新文件**: `src/lib/owl/convert.ts`

核心函数：
```typescript
export function projectToOwlOntology(
  project: OntologyProject,
  options?: { baseUri?: string }
): OwlOntology
```

**映射规则**：

| 来源 | → OWL 构造 | 说明 |
|------|-----------|------|
| E1 Entity (entityRole=aggregate_root) | `owl:Class` | 聚合根→独立类 |
| E1 Entity (entityRole=child_entity) | `owl:Class` + `rdfs:subClassOf parent` | 子实体→父类子类 |
| Entity.attributes | `owl:DatatypeProperty` | domain=该Entity, range=对应xsd类型 |
| Entity.relations | `owl:ObjectProperty` | domain=source, range=target |
| E5 Position | `owl:Class` | 岗位→类 |
| E5 Department | `owl:Class` | 部门→类 |
| E4 EventDefinition（`project.eventModel.events`） | `owl:Class` | 事件→类 |
| SemanticRelationType.is_a | `rdfs:subClassOf` | 语义关系 |
| SemanticRelationType.equivalent_to | `owl:equivalentClass` | 语义关系 |

> 维度约定：E1 数据 / E2 行为 / E3 规则 / E4 事件 / E5 组织 / E6 指标 / E7 约束 / E8 接口。
> SemanticRelation 的 source/target 引用 metaElement ID，映射时需解析到 OwlClass；解析失败跳过并计数（console.warn），不生成悬空 URI。

属性类型映射（AttributeDataType → xsd:type）：
- `string` → `xsd:string`
- `integer` → `xsd:integer`
- `decimal` → `xsd:decimal`
- `boolean` → `xsd:boolean`
- `date` → `xsd:date`
- `datetime` → `xsd:dateTime`
- `enum` → `xsd:string`
- `reference` → 映射为 ObjectProperty（非 DatatypeProperty），range 用 `referencedEntityId` 解析目标实体；`enumRef`、`isMasterDataRef` 本期不映射（已知限制）
- `text` → `xsd:string`

### A3. RDF 序列化器

**新文件**: `src/lib/owl/serialize-rdf.ts`

```typescript
export function serializeToRdfXml(ontology: OwlOntology): string
export function serializeToTurtle(ontology: OwlOntology): string
```

- RDF/XML: 标准 `<rdf:RDF>` 根元素，`xmlns:owl`, `xmlns:rdfs`, `xmlns:xsd` 命名空间
- Turtle: `@prefix` 声明 + 简洁三元组 `<s> <p> <o> .`
- 使用项目 domain.name 作为本体的 `rdfs:label`

### A4. 导出格式集成

**文件**: `src/lib/manifest-export.ts`

- `ManifestExportFormat` 类型扩展：添加 `'rdf' | 'ttl'`
- `buildManifestExportBundle` 中新增分支：调用 `projectToOwlOntology` + 序列化器（`validation` 置 null，`manifest` 置 null）
- 文件名：`{id}-ontology.{rdf|ttl}`，MIME：`application/rdf+xml` / `text/turtle`
- `downloadManifestExport` 对 rdf/ttl 跳过 validation 校验门槛（yaml/json 仍要求 `validation.valid`）

**文件**: `src/components/ontology/manifest-export-dialog.tsx`

- 格式按钮组新增两个按钮：`RDF/XML`、`Turtle`
- `isManifestFormat` 不含 rdf/ttl（仍仅 yaml/json/xlsx）；useMemo 预编译排除列表同步排除 rdf/ttl
- rdf/ttl 参照 xlsx/md/skill 模式走独立 `handleDownloadOwl`：按需构建 bundle 后直接 blob 下载，无校验门控

### A5. 测试

**新文件**: `tests/unit/owl-convert.spec.ts`
- Entity → OwlClass 映射测试（含 aggregate_root / child_entity 层级）
- Attribute → DatatypeProperty 类型映射测试
- Relation → ObjectProperty 测试
- 空项目和单元素边界测试

**新文件**: `tests/unit/owl-serialize-rdf.spec.ts`
- RDF/XML 输出格式正确性
- Turtle 输出格式正确性
- 命名空间声明完整性

---

## Part B: NL2Ontology 查询预览

### B1. 新 API 路由

**新文件**: `src/app/api/nl-to-ontology/route.ts`

- `POST /api/nl-to-ontology`
- 输入：`{ query: string, project: OntologyProject }`
- 复用现有 LLM 基础设施（`LLMClient`, `Config`, `HeaderUtils` from `coze-coding-dev-sdk`）
- 模型：`doubao-seed-2-0-pro-260215`，低 temperature (0.1 确保精确匹配)
- 输出：`{ entities: Array<{ elementId, dimension, name, nameEn, confidence, explanation }>, properties: Array<{ entityId, attributeId, name, confidence }>, relations: Array<{ sourceEntityId, targetEntityId, name, type, confidence }> }`

设计原则：LLM 只做语义匹配（NL → 本体实体 ID），不做创造性内容。Prompt 中传入项目中所有实体的名称+描述摘要。

### B2. Prompt 构建器

**新文件**: `src/lib/ai-draft/nl-ontology-prompt.ts`

```typescript
export interface NlOntologyPromptInput {
  query: string;
  projectSummary: string;  // 项目要素摘要（实体列表 + 关系列表）
}

export interface NlOntologyResult {
  matchedEntities: Array<{
    elementId: string;
    elementName: string;
    dimension: string;
    confidence: number;     // 0-1
    explanation: string;
  }>;
  matchedProperties: Array<{
    entityId: string;
    attributeId: string;
    attributeName: string;
    confidence: number;
  }>;
  matchedRelations: Array<{
    sourceEntityId: string;
    targetEntityId: string;
    relationName: string;
    type: string;
    confidence: number;
  }>;
}
```

Prompt 设计：提供项目本体摘要（所有 E1 实体+属性+关系）+ 用户 NL 查询 → LLM 返回结构化 JSON 匹配结果。Zod schema 校验确保输出格式。

### B3. 项目摘要构建器

**新文件**: `src/lib/ai-draft/build-project-summary.ts`

```typescript
export function buildProjectOntologySummary(project: OntologyProject): string
```

将项目中所有要素以紧凑文本格式输出，供 LLM prompt 使用：
- 所有 E1 Entity + Attributes + Relations（每行一个）
- 所有 E2 StateMachine + States
- 其他维度要素的名称列表
- 约束 2000 字以内，超长时截断并标注

### B4. UI 组件

**新文件**: `src/components/ontology/nl-ontology-preview.tsx`

组件结构：
```
┌─────────────────────────────────────────────┐
│ 🔍 NL 语义查询                               │
│ ┌───────────────────────────────────────────┐│
│ │ 输入自然语言查询...              [查询 →]  ││
│ └───────────────────────────────────────────┘│
│                                              │
│ ┌─ 匹配实体 ─────────────────────────────────┐│
│ │ 🟢 采购订单 (E1 数据)  置信度 95%          ││
│ │    "用户查询中的'订单'对应本体的采购订单实体" ││
│ │ 🟡 供应商 (E1 数据)    置信度 72%          ││
│ │ 🟢 订单状态 (E2 行为)  置信度 88%          ││
│ └────────────────────────────────────────────┘│
│ ┌─ 匹配属性 ─────────────────────────────────┐│
│ │ 采购订单.金额 (decimal)        置信度 90%  ││
│ │ 采购订单.创建日期 (date)       置信度 65%  ││
│ └────────────────────────────────────────────┘│
│ ┌─ 匹配关系 ─────────────────────────────────┐│
│ │ 采购订单 → 供应商 (many_to_one) 置信度 85% ││
│ └────────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

交互：
- 输入框 + 查询按钮（Enter 触发）
- 加载态：`Loader2` 旋转动画 + "AI 正在分析查询语义…"
- 结果分区显示：实体 → 属性 → 关系
- 每个匹配项有颜色球（绿=高置信度>80%，黄=中>50%，灰=低<=50%）
- 点击实体项 → 通过 `onNavigateToElement(elementId, dimension)` props 回调跳转；由 modeling-workspace 接线为 `setElementLibraryFocus({ elementId, dimension })` + `setActiveTab('elementLibrary')`（E1 实体不在业务链树上，不能跳 businessChain）
- 未匹配时显示 "未找到匹配要素，尝试换一种表述"
- 错误态：`toast.error` 提示

### B5. 工作区集成

**文件**: `src/components/ontology/modeling-workspace.tsx`

- ContentTab 类型添加 `'nlQuery'`
- Tab 栏新增标签：`🔍 语义查询`（lucide 图标 Sparkles）
- `activeTab === 'nlQuery'` 时渲染 `<NlOntologyPreview onNavigateToElement={...} />`
- 位置放在 TABS 数组最后（agent 之后）

### B6. 测试

**新文件**: `tests/unit/nl-ontology-prompt.spec.ts`
- prompt 构建正确性
- JSON 解析 schema 校验

**新文件**: `tests/unit/build-project-summary.spec.ts`
- 摘要构建边界测试
- 超长项目截断

---

## 涉及文件总览（全部已完成 ✅）

| 文件 | 改动 | 说明 | 状态 |
|------|------|------|------|
| `src/types/ontology.ts` | 追加 ~90 行 | OwlClass/OwlOntology 等类型定义 + OWL_NS/ATTRIBUTE_TO_XSD | ✅ |
| `src/lib/owl/convert.ts` | **新建** | project → OwlOntology 转换 | ✅ |
| `src/lib/owl/serialize-rdf.ts` | **新建** | RDF/XML + Turtle 序列化 | ✅ |
| `src/lib/owl/index.ts` | **新建** | barrel export | ✅ |
| `src/lib/manifest-export.ts` | 小改 ~20 行 | 添加 rdf/ttl 格式分支 + downloadManifestExport 免校验 | ✅ |
| `src/components/ontology/manifest-export-dialog.tsx` | 小改 ~40 行 | RDF/XML、Turtle 按钮 + handleDownloadOwl | ✅ |
| `src/app/api/nl-to-ontology/route.ts` | **新建** | NL→Ontology API（POST，LLM 语义匹配） | ✅ |
| `src/lib/ai-draft/nl-ontology-prompt.ts` | **新建** | Prompt + Zod Schema + parseNlOntologyResult | ✅ |
| `src/lib/ai-draft/build-project-summary.ts` | **新建** | 项目本体摘要构建（E1-E8，2000 字截断） | ✅ |
| `src/components/ontology/nl-ontology-preview.tsx` | **新建** | NL 查询预览 UI 组件（输入/结果/置信度/跳转） | ✅ |
| `src/components/ontology/modeling-workspace.tsx` | 小改 ~10 行 | Tab 栏 + ContentTab 加 nlQuery + onNavigateToElement | ✅ |
| `tests/unit/owl-convert.spec.ts` | **新建** | OWL 转换测试（13 tests） | ✅ |
| `tests/unit/owl-serialize-rdf.spec.ts` | **新建** | RDF 序列化测试（6 tests） | ✅ |
| `tests/unit/nl-ontology-prompt.spec.ts` | **新建** | NL prompt 测试（6 tests） | ✅ |
| `tests/unit/build-project-summary.spec.ts` | **新建** | 摘要构建测试（5 tests） | ✅ |

## 范围外（本期不映射 / 不实现）

- **E2 状态机**、**E6 指标**、**E7 约束**、**E8 接口**：不映射为 OWL 构造，OWL 导出仅覆盖 E1/E4/E5 + 语义关系
- Attribute 的 `enumRef`、`isMasterDataRef`：不映射（已知限制）
- SemanticRelation 中除 `is_a` / `equivalent_to` 外的其余 8 种关系类型：不映射

## 不变内容

- 现有 E1-E8 要素结构和业务逻辑
- Store 和状态管理
- 业务链树 (A→B→C→EPC) 结构
- 所有现有导出格式 (YAML/JSON/XLSX/Markdown/Skill)
- Copilot 聊天功能
- 现有 API 路由

## 验证方式（已执行 ✅）

1. ✅ `pnpm ts-check` — TypeScript 编译通过（零错误）
2. ✅ `pnpm test:run` — 全量回归 376 通过 / 3 预存失败（excel-export 14 vs 13 Sheet，非本次引入）；新增 31/31 通过
3. ⬜ `pnpm dev` → 打开导出对话框，确认 RDF/XML 和 Turtle 格式可下载
4. ⬜ 新建 "语义查询" tab → 输入 NL 查询 → 验证匹配结果展示
5. ⬜ 验证 RDF/XML 文件在 Protege/其他 OWL 工具中可正确打开
