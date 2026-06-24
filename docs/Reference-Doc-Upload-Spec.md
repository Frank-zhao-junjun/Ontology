# 参考文档上传辅助 AI 建模 Spec

> 版本：1.0  
> 日期：2025-01  
> 状态：设计完成

## 1. 背景与目标

### 1.1 当前问题

当前 AI 辅助建模仅依赖以下信息生成建议：
- Entity.name / nameEn / description
- Domain 信息
- Existing Models（已有模型）
- MetadataList / MasterDataList

**致命缺陷**：AI 完全没有企业实际业务文档的上下文，只能凭"领域知识"和"实体名称"推测，导致生成结果泛泛、不贴合实际业务。

### 1.2 目标

允许用户上传参考文档（Word / PDF / Excel / TXT / Markdown 等），AI 解析文档内容后，结合业务文档上下文生成更精准的本体模型初稿。

**核心价值**：
- 从"凭空推测"升级为"基于文档生成"
- 一次上传可影响整个项目的所有实体
- 支持"先整体后局部"：先从文档提取实体列表，再逐个生成详细模型

## 2. 功能设计

### 2.1 整体流程

```
用户上传参考文档
    ↓
后端解析文档 → 提取文本内容
    ↓
存储到项目级 ReferenceDoc[]（持久化）
    ↓
AI 生成时自动注入文档内容到 Prompt
    ↓
生成更精准的模型建议
```

### 2.2 支持的文件格式

| 格式 | 扩展名 | 解析方式 | 大小限制 |
|------|--------|---------|---------|
| Word | .docx | mammoth 提取文本+表格 | 10MB |
| PDF | .pdf | pdf-parse 提取文本 | 10MB |
| Excel | .xlsx | xlsx 提取所有 Sheet 文本 | 10MB |
| 纯文本 | .txt | 直接读取 | 5MB |
| Markdown | .md | 直接读取（保留格式标记） | 5MB |
| CSV | .csv | 逐行读取 | 5MB |

### 2.3 文档管理

参考文档是**项目级别**的资源，不属于任何单个实体：

```typescript
/** 参考文档 */
export interface ReferenceDocument {
  id: string;
  fileName: string;
  fileType: 'docx' | 'pdf' | 'xlsx' | 'txt' | 'md' | 'csv';
  fileSize: number;                     // bytes
  uploadedAt: string;                   // ISO datetime
  
  // 解析结果
  extractedText: string;                // 提取的纯文本内容
  textLength: number;                   // 文本字符数
  parseStatus: 'pending' | 'success' | 'failed';
  parseError?: string;
  
  // 文档元信息
  title?: string;                       // 文档标题（从内容提取）
  summary?: string;                     // AI 生成的文档摘要
  
  // AI 分析结果（可选，按需生成）
  extractedEntities?: ExtractedEntity[]; // 从文档提取的实体候选
  extractionStatus?: 'none' | 'processing' | 'done' | 'failed';
}

/** 从文档提取的实体候选 */
export interface ExtractedEntity {
  name: string;
  nameEn?: string;
  description: string;
  source: string;                       // 来源段落/位置
  confidence: number;                   // 0-1 置信度
  attributes?: ExtractedAttribute[];     // 提取的属性候选
}

/** 从文档提取的属性候选 */
export interface ExtractedAttribute {
  name: string;
  nameEn?: string;
  dataType: string;
  description: string;
  required?: boolean;
  source: string;
}
```

### 2.4 Store 扩展

```typescript
// OntologyProject 新增字段
interface OntologyProject {
  // ... 现有字段
  referenceDocuments: ReferenceDocument[];
}

// Store 新增方法
interface OntologyStore {
  // 参考文档管理
  addReferenceDocument(doc: ReferenceDocument): void;
  removeReferenceDocument(docId: string): void;
  updateReferenceDocument(docId: string, updates: Partial<ReferenceDocument>): void;
  clearReferenceDocuments(): void;
}
```

### 2.5 AI Prompt 注入策略

参考文档内容注入到 AI Prompt 时，需要智能截断（LLM 有 token 限制）：

**策略**：
1. **摘要优先**：如果文档有 summary，优先使用摘要
2. **分段注入**：如果文档过长（>8000 字符），按段落截取前 8000 字符 + 末尾 2000 字符
3. **相关性排序**：如果有多份文档，按与当前实体的相关性排序
4. **Token 预算**：参考文档总注入不超过 10000 字符（约 4000 tokens）

**Prompt 模板变化**：

```
## 参考文档（重要！请基于这些文档生成贴合实际的模型）

以下是用户上传的业务参考文档，生成模型时**必须优先参考**这些文档中的业务定义、字段描述、流程说明：

### 文档1: 《采购管理制度.docx》
[提取的文本内容...]

### 文档2: 《供应商管理办法.pdf》
[提取的文本内容...]

**使用规则**：
1. 属性命名优先使用文档中的术语
2. 状态流转优先使用文档中描述的业务流程
3. 规则定义优先使用文档中的业务约束
4. 如果文档中有明确的字段定义，直接采用
5. 如果文档内容与通用领域知识冲突，以文档为准
```

## 3. API 设计

### 3.1 上传参考文档

```
POST /api/reference-documents/upload
```

**请求**：multipart/form-data

| 字段 | 类型 | 必填 | 说明 |
|------|------|:---:|------|
| file | File | 是 | 参考文档文件 |
| projectId | string | 是 | 所属项目ID |

**响应**：

```json
{
  "success": true,
  "data": {
    "id": "ref-xxx",
    "fileName": "采购管理制度.docx",
    "fileType": "docx",
    "fileSize": 245760,
    "extractedText": "第一章 总则\n第一条 为规范采购行为...",
    "textLength": 15680,
    "parseStatus": "success",
    "title": "采购管理制度"
  }
}
```

**处理流程**：
1. 校验文件格式和大小
2. 根据文件类型调用对应解析器
3. 提取纯文本内容
4. 尝试提取文档标题
5. 返回解析结果

### 3.2 删除参考文档

```
DELETE /api/reference-documents/{docId}?projectId=xxx
```

### 3.3 AI 提取实体候选

```
POST /api/reference-documents/extract-entities
```

**请求体**：

```json
{
  "projectId": "xxx",
  "docId": "ref-xxx",
  "domain": { "name": "离散制造", "description": "..." }
}
```

**响应**：

```json
{
  "success": true,
  "data": {
    "entities": [
      {
        "name": "采购订单",
        "nameEn": "PurchaseOrder",
        "description": "向供应商发出的采购需求单据",
        "source": "第三章 采购执行 > 第三条",
        "confidence": 0.95,
        "attributes": [
          { "name": "订单编号", "dataType": "string", "description": "唯一标识", "required": true, "source": "第三章 第三条" },
          { "name": "供应商", "dataType": "reference", "description": "供应商主数据引用", "required": true, "source": "第三章 第三条" }
        ]
      }
    ]
  }
}
```

**说明**：
- 从一份文档中提取所有实体候选
- 每个实体附带置信度和来源定位
- 用户可选择哪些实体创建、哪些忽略
- 批量创建后可逐个调用 AI 生成详细模型

### 3.4 修改 generate-model API

现有 `/api/generate-model` 的请求体新增字段：

```typescript
interface GenerateModelRequest {
  // ... 现有字段
  referenceDocuments?: ReferenceDocument[];  // 新增：参考文档列表
}
```

AI Prompt 自动注入参考文档内容（参见 2.5 节）。

## 4. UI 设计

### 4.1 参考文档管理面板

在建模工作台顶部栏新增按钮"📎 参考文档"，点击打开侧边面板：

**面板布局**：

```
┌─────────────────────────────────────┐
│ 📎 参考文档                    [×]  │
├─────────────────────────────────────┤
│ [拖拽上传区域]                       │
│ 支持上传 Word/PDF/Excel/TXT/MD/CSV  │
│ 最大 10MB/文件，最多 10 份文档       │
├─────────────────────────────────────┤
│ 已上传文档 (3)                       │
│                                     │
│ 📄 采购管理制度.docx    15680字 ✅   │
│    上传于 2025-01-15  [提取实体] [×] │
│                                     │
│ 📄 供应商管理办法.pdf    8200字 ✅   │
│    上传于 2025-01-15  [提取实体] [×] │
│                                     │
│ 📄 物料编码规范.xlsx    3200字 ✅    │
│    上传于 2025-01-14  [提取实体] [×] │
│                                     │
├─────────────────────────────────────┤
│ 💡 使用说明                          │
│ · 上传业务文档后，AI 生成模型时会参考 │
│   文档内容，生成更贴合实际的建议      │
│ · 点击"提取实体"可从文档中自动识别   │
│   候选实体并批量创建                 │
│ · 文档仅存于浏览器本地，不上传云端   │
└─────────────────────────────────────┘
```

### 4.2 AI 生成面板增强

在 ManualGenerator（AI 建议面板）中增加参考文档提示：

```
┌─────────────────────────────────────┐
│ ✨ AI 生成建议                       │
├─────────────────────────────────────┤
│ 📎 参考文档: 3 份                   │
│ 采购管理制度.docx, 供应商管理办法.pdf│
│ , 物料编码规范.xlsx                  │
│ [管理参考文档]                       │
├─────────────────────────────────────┤
│ (现有 AI 建议内容...)               │
└─────────────────────────────────────┘
```

### 4.3 实体提取对话框

点击"提取实体"后弹出对话框：

```
┌─────────────────────────────────────────────┐
│ 🔍 从文档提取实体候选                        │
├─────────────────────────────────────────────┤
│ AI 正在分析《采购管理制度.docx》...          │
│ ████████████████████░░░░ 80%                │
├─────────────────────────────────────────────┤
│ 提取结果 (5 个实体候选)                      │
│                                             │
│ ☑ 采购订单 (PurchaseOrder)  置信度: 95%     │
│   6 个属性候选                              │
│ ☑ 供应商 (Supplier)  置信度: 92%            │
│   4 个属性候选                              │
│ ☑ 采购合同 (PurchaseContract)  置信度: 88%  │
│   5 个属性候选                              │
│ ☐ 审批记录 (ApprovalRecord)  置信度: 65%    │
│   3 个属性候选                              │
│ ☐ 通知 (Notification)  置信度: 45%          │
│   2 个属性候选                              │
│                                             │
│ [全选] [取消全选]                           │
│                                             │
│ [取消]                    [创建选中实体]     │
└─────────────────────────────────────────────┘
```

## 5. 文档解析实现

### 5.1 解析器架构

```typescript
// src/lib/document-parsers/index.ts

export interface ParseResult {
  text: string;
  title?: string;
  tables?: string[][];           // 表格数据（Excel/Word 表格）
  metadata?: Record<string, string>;
}

export async function parseDocument(
  buffer: Buffer,
  fileName: string,
  fileType: string
): Promise<ParseResult>
```

### 5.2 各格式解析方案

| 格式 | 依赖库 | 解析逻辑 |
|------|--------|---------|
| .docx | `mammoth` | 提取 HTML→纯文本 + 表格转文本 |
| .pdf | `pdf-parse` | 提取纯文本 |
| .xlsx | `xlsx`（已有） | 遍历所有 Sheet，每行拼接为文本 |
| .txt | 无 | Buffer.toString('utf-8') |
| .md | 无 | Buffer.toString('utf-8')，保留格式 |
| .csv | 无 | Buffer.toString('utf-8')，按行按列拼接 |

### 5.3 表格处理策略

Excel 和 Word 中的表格是重要的结构化信息：

```typescript
function tableToText(headers: string[], rows: string[][]): string {
  let result = '表头: ' + headers.join(' | ') + '\n';
  rows.forEach((row, i) => {
    result += `第${i+1}行: ${row.join(' | ')}\n`;
  });
  return result;
}
```

### 5.4 文本截断策略

LLM 上下文窗口有限，需要智能截断：

```typescript
function truncateForPrompt(text: string, maxChars: number = 8000): string {
  if (text.length <= maxChars) return text;
  
  const headSize = Math.floor(maxChars * 0.75);
  const tailSize = Math.floor(maxChars * 0.25);
  
  return text.substring(0, headSize) 
    + '\n\n[... 文档中间部分已省略 ...]\n\n' 
    + text.substring(text.length - tailSize);
}
```

## 6. 安全与隐私

### 6.1 数据存储

- 参考文档**仅存于浏览器 localStorage**（随项目数据持久化）
- 文件内容（extractedText）存入 Store，不上传至任何云服务
- AI 生成时，仅将 extractedText 发送到后端 API，后端转发给 LLM

### 6.2 文件大小限制

| 维度 | 限制 | 原因 |
|------|------|------|
| 单文件大小 | 10MB | 解析性能 + localStorage 空间 |
| 项目文档总数 | 10 份 | Token 预算 + 存储空间 |
| 提取文本总长 | 100,000 字符 | localStorage 单 key 约 5MB |
| AI 注入文本 | 10,000 字符/次 | LLM Token 限制 |

### 6.3 敏感信息

- 文档内容可能包含商业机密
- 上传面板明确提示：文档仅存于浏览器本地
- AI 生成请求通过 HTTPS 传输，后端不持久化文档内容

## 7. 校验规则

| 编号 | 规则 | 严重程度 | 说明 |
|------|------|---------|------|
| V-RD-01 | 文件格式校验 | error | 仅接受 .docx/.pdf/.xlsx/.txt/.md/.csv |
| V-RD-02 | 文件大小校验 | error | 单文件 ≤ 10MB |
| V-RD-03 | 文档数量校验 | error | 每个项目 ≤ 10 份 |
| V-RD-04 | 文件名唯一性 | warning | 同一项目内不允许同名文件 |
| V-RD-05 | 解析状态校验 | warning | parseStatus=failed 的文档不注入 AI Prompt |
| V-RD-06 | 文本长度校验 | warning | extractedText > 100,000 字符时提示可能影响存储 |
| V-RD-07 | 提取实体去重 | warning | 已存在的实体名称不重复创建 |

## 8. User Stories

### US-RD-1: 上传参考文档

**作为**建模人员，**我希望**上传业务参考文档（Word/PDF/Excel等），**以便**AI 生成模型时能参考实际业务文档。

**验收标准**：
- 支持拖拽上传和点击上传
- 上传后自动解析并显示文本长度
- 解析失败时显示错误信息
- 同名文件提示覆盖

### US-RD-2: 管理参考文档

**作为**建模人员，**我希望**查看、删除已上传的参考文档，**以便**维护参考文档列表。

**验收标准**：
- 侧边面板显示所有已上传文档
- 显示文件名、类型、文本长度、上传时间
- 可删除单份文档
- 可一键清空所有文档

### US-RD-3: AI 生成时参考文档

**作为**建模人员，**我希望**AI 生成模型时自动参考已上传的文档内容，**以便**生成更贴合实际业务的模型建议。

**验收标准**：
- AI 生成面板显示当前参考文档数量
- 生成的属性命名、状态流转、规则定义与文档内容一致
- 如果文档中有明确字段定义，AI 直接采用
- 多份文档内容冲突时，AI 给出提示

### US-RD-4: 从文档提取实体候选

**作为**建模人员，**我希望**从参考文档中自动提取实体候选，**以便**快速创建一批初始实体。

**验收标准**：
- 点击"提取实体"后 AI 分析文档内容
- 列出候选实体及置信度
- 可选择哪些实体创建、哪些忽略
- 批量创建后可逐个调用 AI 生成详细模型

### US-RD-5: 从文档提取属性候选

**作为**建模人员，**我希望**从参考文档中自动提取属性候选，**以便**快速补充实体属性。

**验收标准**：
- 提取实体时同时提取属性候选
- 属性候选包含名称、类型、描述、来源
- 用户可在提取结果中增删改属性
- 属性创建时优先匹配元数据列表

## 9. 实施计划

### Phase 1: 文档上传与解析

1. 安装 `mammoth`、`pdf-parse` 依赖
2. 创建 `/api/reference-documents/upload` API
3. 实现文档解析器（6种格式）
4. Store 扩展：ReferenceDocument 类型 + CRUD 方法
5. UI：参考文档管理面板

### Phase 2: AI 生成集成

1. 修改 `/api/generate-model` 注入参考文档内容
2. 实现 Prompt 截断策略
3. ManualGenerator 面板增强

### Phase 3: 实体提取

1. 创建 `/api/reference-documents/extract-entities` API
2. 实体提取对话框
3. 批量创建实体 + 属性

### Phase 4: 优化

1. 文档摘要 AI 生成
2. 多文档相关性排序
3. 提取结果与元数据自动匹配
