# US-S19-U03：要素库 AI 对话框 + 文档上传

| Unit ID | US-S19-U03 | 状态 | 📝 草稿 |
| 所属 US | [US-S19](../us/US-S19-doc-element-draft.md) |
| 文件 | `src/components/ontology/element-library.tsx`（扩展） |

## 1. 目标

在要素库面板顶部添加「AI 解析文档」按钮，打开上传对话框，调用 `POST /api/generate-element-draft` AI 生成 E1~E8 要素后增量写入要素库。

## 2. 范围

### In Scope

- 要素库面板顶部新增「AI 解析文档」按钮
- 上传对话框：支持 .txt/.md/.csv/.json/.docx/.pdf，≤50000 字符
- 调用新 API `POST /api/generate-element-draft`
- 成功后调用 `applyAiElementDrafts` 写入 store
- 显示插入结果（如"已新增 5 个要素草稿，跳过 1 个重复"）
- 加载状态、错误处理、进度条

### Out of Scope

- EPC 编辑器 AI（US-S11b）
- 单个实体 AI 建模（3.6.3）

## 3. 技术设计

```typescript
// element-library.tsx 新增状态
const [aiDialogOpen, setAiDialogOpen] = useState(false);
const [aiLoading, setAiLoading] = useState(false);

// AJ 解析文档按钮
<Button onClick={() => setAiDialogOpen(true)}>
  AI 解析文档
</Button>

// 对话框提交:
const response = await fetch('/api/generate-element-draft', {
  method: 'POST',
  body: JSON.stringify({
    projectId: project.id,
    documentText,
    existingElementNames: project.metaElements.map(e => ({
      dimension: e.dimension,
      name: e.name,
    })),
  }),
});
const { elements } = await response.json();
const inserted = applyAiElementDrafts(elements);
toast.success(`已新增 ${inserted} 个要素草稿`);
```

## 4. AC

| # | 验收项 | 验证 |
|---|--------|------|
| AC-1 | 要素库顶部显示「AI 解析文档」按钮 | integration |
| AC-2 | 点击按钮打开上传对话框 | integration |
| AC-3 | 上传文档后调 API 并写入要素库 | integration |
| AC-4 | 重复要素跳过并提示用户 | integration |
| AC-5 | 加载中显示进度 | integration |
| AC-6 | 非法文件格式提示 | integration |

## 5. 测试计划

| 类型 | 文件 | 说明 |
|------|------|------|
| Unit | `tests/unit/ai-draft/element-dialog.spec.ts` | 3 TC |
| Integration | `tests/integration/ai-draft/element-dialog.spec.tsx` | 6 TC |

## 6. 依赖

- **前置 Unit**：US-S19-U02（Store）
- **阻塞 US**：US-S19-U04

## 7. 六步检查

| 步骤 | 完成 | 说明 |
|------|------|------|
| ① Unit Spec | [x] | |
| ② PRD AC | [ ] | |
| ③ Testing case | [ ] | |
| ④ Coding | [ ] | |
| ⑤ Unit test | [ ] | |
| ⑥ E2E | [ ] | |
