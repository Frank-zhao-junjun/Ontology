import { describe, it, expect } from 'vitest';
import {
  parseMarkdownToModules,
  parseMarkdownImport,
  generateMarkdownTemplate,
  type MarkdownParseResult,
} from '@/lib/markdown/markdown-import';
import type { ExistingModule, MarkdownImportParams } from '@/lib/markdown/markdown-import';
import type { ModuleKind } from '@/types/ontology';

// ── Helpers ──

const ALL_KINDS: ModuleKind[] = ['A', 'B', 'C', 'EPC', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8'];

function dummyMarkdown(kind: ModuleKind, label: string, rows: string[]): string {
  return [
    `## ${label}`,
    '',
    '| ID | 名称 | 描述 |',
    '|----|------|------|',
    ...rows,
  ].join('\n');
}

// =========================================================================
// parseMarkdownToModules
// =========================================================================

describe('parseMarkdownToModules', () => {
  // ── Basic parsing ──

  it('parses a single section with one row', () => {
    const md = dummyMarkdown('A', 'A-价值域', ['| VD001 | 合同生命周期 | 管理合同从创建到归档的完整流程 |']);
    const result = parseMarkdownToModules(md);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual({
      moduleKind: 'A',
      moduleId: 'VD001',
      data: { ID: 'VD001', 名称: '合同生命周期', 描述: '管理合同从创建到归档的完整流程' },
    });
    expect(result.warnings).toHaveLength(0);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0]).toEqual({ kind: 'A', title: 'A-价值域', rowCount: 1 });
  });

  it('parses multiple sections with multiple rows', () => {
    const md = [
      '## A-价值域',
      '',
      '| ID | 名称 | 描述 |',
      '|----|------|------|',
      '| VD001 | 价值域1 | 描述1 |',
      '| VD002 | 价值域2 | 描述2 |',
      '',
      '## B-能力',
      '',
      '| ID | 名称 | 描述 | 父ID |',
      '|----|------|------|------|',
      '| CAP001 | 能力1 | 能力描述 | VD001 |',
    ].join('\n');

    const result = parseMarkdownToModules(md);

    expect(result.rows).toHaveLength(3);
    expect(result.sections).toHaveLength(2);
    expect(result.sections[0]).toEqual({ kind: 'A', title: 'A-价值域', rowCount: 2 });
    expect(result.sections[1]).toEqual({ kind: 'B', title: 'B-能力', rowCount: 1 });
  });

  it('parses all 12 module kinds', () => {
    const lines: string[] = [];
    for (const kind of ALL_KINDS) {
      const label = kindLabel(kind);
      lines.push(`## ${label}`, '', '| ID | 名称 | 描述 |', '|----|------|------|', `| ${kind}001 | ${label}条目 | 描述 |`, '');
    }
    const md = lines.join('\n');
    const result = parseMarkdownToModules(md);

    expect(result.rows).toHaveLength(12);
    expect(result.sections).toHaveLength(12);
    for (let i = 0; i < ALL_KINDS.length; i++) {
      expect(result.sections[i].kind).toBe(ALL_KINDS[i]);
      expect(result.sections[i].rowCount).toBe(1);
    }
  });

  // ── Edge cases ──

  it('handles empty input', () => {
    const result = parseMarkdownToModules('');
    expect(result.rows).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    expect(result.sections).toHaveLength(0);
  });

  it('handles input with only whitespace', () => {
    const result = parseMarkdownToModules('   \n  \n  ');
    expect(result.rows).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    expect(result.sections).toHaveLength(0);
  });

  it('handles markdown with no tables (just headings)', () => {
    const md = [
      '# Document Title',
      '',
      '## A-价值域',
      '',
      'Some descriptive text',
      '',
      '## B-能力',
      '',
      'More text here',
    ].join('\n');
    const result = parseMarkdownToModules(md);
    expect(result.rows).toHaveLength(0);
    expect(result.sections).toHaveLength(0); // no rows, so no sections recorded
    expect(result.warnings).toHaveLength(0);
  });

  it('ignores H1 headings', () => {
    const md = [
      '# Top Level Title',
      '',
      '## A-价值域',
      '',
      '| ID | 名称 | 描述 |',
      '|----|------|------|',
      '| VD001 | Test | Desc |',
    ].join('\n');
    const result = parseMarkdownToModules(md);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].moduleId).toBe('VD001');
  });

  it('skips unknown heading types', () => {
    const md = [
      '## Unknown Heading',
      '',
      '| ID | 名称 | 描述 |',
      '|----|------|------|',
      '| X001 | Test | Desc |',
    ].join('\n');
    const result = parseMarkdownToModules(md);
    expect(result.rows).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  // ── Heading label variations ──

  const LABEL_VARIANTS: { label: string; kind: ModuleKind }[] = [
    { label: 'A', kind: 'A' },
    { label: 'a', kind: 'A' },
    { label: 'A-价值域', kind: 'A' },
    { label: 'a-价值域', kind: 'A' },
    { label: 'A-价值域(Value-Domain)', kind: 'A' },
    { label: 'a-价值域(value-domain)', kind: 'A' },
    { label: 'B', kind: 'B' },
    { label: 'b', kind: 'B' },
    { label: 'B-能力', kind: 'B' },
    { label: 'b-能力(capability)', kind: 'B' },
    { label: 'C', kind: 'C' },
    { label: 'C-场景', kind: 'C' },
    { label: 'c-场景(scenario)', kind: 'C' },
    { label: 'EPC', kind: 'EPC' },
    { label: 'epc', kind: 'EPC' },
    { label: 'EPC流程', kind: 'EPC' },
    { label: 'epc-process', kind: 'EPC' },
    { label: 'E1', kind: 'E1' },
    { label: 'E1-数据', kind: 'E1' },
    { label: 'e1-数据(data)', kind: 'E1' },
    { label: 'E2', kind: 'E2' },
    { label: 'E2-行为', kind: 'E2' },
    { label: 'E3', kind: 'E3' },
    { label: 'E4', kind: 'E4' },
    { label: 'E5', kind: 'E5' },
    { label: 'E6', kind: 'E6' },
    { label: 'E7', kind: 'E7' },
    { label: 'E8', kind: 'E8' },
  ];

  for (const { label, kind } of LABEL_VARIANTS) {
    it(`recognizes heading "${label}" as kind ${kind}`, () => {
      const md = [
        `## ${label}`,
        '',
        '| ID | 名称 | 描述 |',
        '|----|------|------|',
        '| TEST001 | Item | Desc |',
      ].join('\n');
      const result = parseMarkdownToModules(md);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].moduleKind).toBe(kind);
      expect(result.sections[0].kind).toBe(kind);
    });
  }

  // ── Table parsing ──

  it('parses a table with multiple columns', () => {
    const md = [
      '## A-价值域',
      '',
      '| ID | 名称 | 描述 | 英文名 | 序号 |',
      '|----|------|------|--------|------|',
      '| VD001 | 价值域 | 描述内容 | VD-EN | 1 |',
    ].join('\n');
    const result = parseMarkdownToModules(md);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].data).toEqual({
      ID: 'VD001',
      名称: '价值域',
      描述: '描述内容',
      英文名: 'VD-EN',
      序号: '1',
    });
  });

  it('handles table with extra spaces in cells', () => {
    const md = [
      '## A-价值域',
      '',
      '| ID | 名称 | 描述 |',
      '|----|------|------|',
      '|  VD001  |  价值域  |  描述内容  |',
    ].join('\n');
    const result = parseMarkdownToModules(md);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].moduleId).toBe('VD001');
    expect(result.rows[0].data['名称']).toBe('价值域');
  });

  it('skips empty rows between sections', () => {
    const md = [
      '## A-价值域',
      '',
      '| ID | 名称 | 描述 |',
      '|----|------|------|',
      '| VD001 | Test | Desc |',
      '',
      '',
      '## B-能力',
      '',
      '| ID | 名称 | 描述 |',
      '|----|------|------|',
      '| CAP001 | Cap | Desc |',
    ].join('\n');
    const result = parseMarkdownToModules(md);
    expect(result.rows).toHaveLength(2);
    expect(result.sections).toHaveLength(2);
  });

  // ── Missing / empty ID ──

  it('warns when table has no ID column', () => {
    const md = [
      '## A-价值域',
      '',
      '| 名称 | 描述 |',
      '|------|------|',
      '| 价值域 | 描述内容 |',
    ].join('\n');
    const result = parseMarkdownToModules(md);
    expect(result.rows).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].message).toContain('缺少 ID 列');
  });

  it('warns and skips rows with empty ID', () => {
    const md = [
      '## A-价值域',
      '',
      '| ID | 名称 | 描述 |',
      '|----|------|------|',
      '|  | EmptyID | Desc |',
      '| VD002 | Valid | Desc |',
    ].join('\n');
    const result = parseMarkdownToModules(md);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].moduleId).toBe('VD002');
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].message).toContain('ID 为空');
  });

  // ── Chinese column name variants for ID ──

  it('recognizes 编号 as ID column', () => {
    const md = [
      '## A-价值域',
      '',
      '| 编号 | 名称 | 描述 |',
      '|------|------|------|',
      '| VD001 | 价值域 | 描述 |',
    ].join('\n');
    const result = parseMarkdownToModules(md);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].moduleId).toBe('VD001');
  });

  it('recognizes 模块ID as ID column', () => {
    const md = [
      '## A-价值域',
      '',
      '| 模块ID | 名称 | 描述 |',
      '|--------|------|------|',
      '| VD001 | 价值域 | 描述 |',
    ].join('\n');
    const result = parseMarkdownToModules(md);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].moduleId).toBe('VD001');
  });

  // ── JSON values ──

  it('parses JSON object values in cells', () => {
    const md = [
      '## A-价值域',
      '',
      '| ID | 名称 | 配置 |',
      '|----|------|------|',
      '| VD001 | 价值域 | {"key": "value"} |',
    ].join('\n');
    const result = parseMarkdownToModules(md);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].data['配置']).toEqual({ key: 'value' });
  });

  it('parses JSON array values in cells', () => {
    const md = [
      '## A-价值域',
      '',
      '| ID | 名称 | 标签 |',
      '|----|------|------|',
      '| VD001 | 价值域 | ["tag1","tag2"] |',
    ].join('\n');
    const result = parseMarkdownToModules(md);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].data['标签']).toEqual(['tag1', 'tag2']);
  });

  it('keeps invalid JSON as string', () => {
    const md = [
      '## A-价值域',
      '',
      '| ID | 名称 | 描述 |',
      '|----|------|------|',
      '| VD001 | 价值域 | {not json} |',
    ].join('\n');
    const result = parseMarkdownToModules(md);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].data['描述']).toBe('{not json}');
  });

  // ── Code blocks (note: fenced code blocks are NOT special-cased by the parser,
  // so `|` and `##` lines inside them are still parsed. This test documents that
  // behavior — the parser is intentionally simple.)

  it('ignores inline code', () => {
    const md = [
      '## A-价值域',
      '',
      '| ID | 名称 | 描述 |',
      '|----|------|------|',
      '| VD001 | `名称` | 描述内容 |',
    ].join('\n');
    const result = parseMarkdownToModules(md);
    expect(result.rows).toHaveLength(1);
    // inline code backticks are kept as-is in the value
    expect(result.rows[0].data['名称']).toBe('`名称`');
  });

  // ── Parent ID in data ──

  it('captures 父ID column in row data', () => {
    const md = [
      '## B-能力',
      '',
      '| ID | 名称 | 描述 | 父ID |',
      '|----|------|------|------|',
      '| CAP001 | 能力1 | 描述 | VD001 |',
    ].join('\n');
    const result = parseMarkdownToModules(md);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].data['父ID']).toBe('VD001');
  });

  it('captures parentId column in row data', () => {
    const md = [
      '## B-能力',
      '',
      '| ID | 名称 | 描述 | parentId |',
      '|----|------|------|----------|',
      '| CAP001 | 能力1 | 描述 | VD001 |',
    ].join('\n');
    const result = parseMarkdownToModules(md);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].data['parentId']).toBe('VD001');
  });

  // ── Section tracking edge cases ──

  it('does not record sections with zero rows', () => {
    const md = [
      '## A-价值域',
      '',
      'Some text, no table',
      '',
      '## B-能力',
      '',
      '| ID | 名称 | 描述 |',
      '|----|------|------|',
      '| CAP001 | Test | Desc |',
    ].join('\n');
    const result = parseMarkdownToModules(md);
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0].kind).toBe('B');
  });

  it('resets section on unknown heading and starts new section on known heading', () => {
    const md = [
      '## A-价值域',
      '',
      '| ID | 名称 | 描述 |',
      '|----|------|------|',
      '| VD001 | V1 | Desc |',
      '',
      '## Unknown Section',
      '',
      '| ID | 名称 | 描述 |',
      '|----|------|------|',
      '| BAD | Bad | Data |',
      '',
      '## B-能力',
      '',
      '| ID | 名称 | 描述 |',
      '|----|------|------|',
      '| CAP001 | C1 | Desc |',
    ].join('\n');
    const result = parseMarkdownToModules(md);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].moduleKind).toBe('A');
    expect(result.rows[1].moduleKind).toBe('B');
    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].kind).toBe('A');
    expect(result.sections[1].kind).toBe('B');
  });

  // ── Table separator line variations ──

  it('handles tables without separator line', () => {
    // The parser uses the separator detection as optional (just skips if found)
    const md = [
      '## A-价值域',
      '',
      '| ID | 名称 | 描述 |',
      '| VD001 | Test | Desc |',
    ].join('\n');
    const result = parseMarkdownToModules(md);
    // Without separator, the data row would still be parsed if it starts with |
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].moduleId).toBe('VD001');
  });

  // ── Return type structure ──

  it('returns correct MarkdownParseResult structure', () => {
    const result = parseMarkdownToModules('');
    // Verify the shape
    expect(result).toHaveProperty('rows');
    expect(result).toHaveProperty('warnings');
    expect(result).toHaveProperty('sections');
    expect(Array.isArray(result.rows)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(Array.isArray(result.sections)).toBe(true);
  });

  it('each row has moduleKind, moduleId, and data', () => {
    const md = dummyMarkdown('A', 'A-价值域', ['| VD001 | Test | Desc |']);
    const result = parseMarkdownToModules(md);
    for (const row of result.rows) {
      expect(row).toHaveProperty('moduleKind');
      expect(row).toHaveProperty('moduleId');
      expect(row).toHaveProperty('data');
      expect(typeof row.moduleKind).toBe('string');
      expect(typeof row.moduleId).toBe('string');
      expect(row.data).toBeInstanceOf(Object);
    }
  });

  it('each warning has sheet, row, column, and message', () => {
    const md = [
      '## A-价值域',
      '',
      '| 名称 | 描述 |',
      '|------|------|',
      '| Test | Desc |',
    ].join('\n');
    const result = parseMarkdownToModules(md);
    for (const w of result.warnings) {
      expect(w).toHaveProperty('sheet');
      expect(w).toHaveProperty('row');
      expect(w).toHaveProperty('column');
      expect(w).toHaveProperty('message');
    }
  });

  it('each section has kind, title, and rowCount', () => {
    const md = dummyMarkdown('A', 'A-价值域', ['| VD001 | Test | Desc |']);
    const result = parseMarkdownToModules(md);
    for (const s of result.sections) {
      expect(s).toHaveProperty('kind');
      expect(s).toHaveProperty('title');
      expect(s).toHaveProperty('rowCount');
      expect(ALL_KINDS).toContain(s.kind);
      expect(typeof s.title).toBe('string');
      expect(typeof s.rowCount).toBe('number');
    }
  });

  // ── Malformed markdown ──

  it('handles markdown with leading/trailing whitespace', () => {
    const md = [
      '  ## A-价值域  ',
      '',
      '  | ID | 名称 | 描述 |  ',
      '  |----|------|------|  ',
      '  | VD001 | Test | Desc |  ',
    ].join('\n');
    const result = parseMarkdownToModules(md);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].moduleId).toBe('VD001');
  });

  it('handles text between heading and table', () => {
    const md = [
      '## A-价值域',
      '',
      '这是一段说明文字，描述下面的表格。',
      '可以有多行文本。',
      '',
      '| ID | 名称 | 描述 |',
      '|----|------|------|',
      '| VD001 | 价值域 | 描述 |',
    ].join('\n');
    const result = parseMarkdownToModules(md);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].moduleId).toBe('VD001');
  });
});

// =========================================================================
// parseMarkdownImport
// =========================================================================

describe('parseMarkdownImport', () => {
  const basicMd = dummyMarkdown('A', 'A-价值域', ['| VD001 | 价值域 | 描述 |']);

  it('returns ImportPreview with correct structure', () => {
    const result = parseMarkdownImport({ text: basicMd, existingModules: [] });
    expect(result).toHaveProperty('changes');
    expect(result).toHaveProperty('warnings');
    expect(result).toHaveProperty('rows');
    expect(result).toHaveProperty('summary');
    expect(result.summary).toHaveProperty('newDrafts');
    expect(result.summary).toHaveProperty('updatedDrafts');
    expect(result.summary).toHaveProperty('placeholderDrafts');
    expect(result.summary).toHaveProperty('warningCount');
  });

  it('creates new_draft for modules not in existing', () => {
    const result = parseMarkdownImport({ text: basicMd, existingModules: [] });
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].action).toBe('new_draft');
    expect(result.changes[0].moduleId).toBe('VD001');
    expect(result.changes[0].moduleKind).toBe('A');
    expect(result.summary.newDrafts).toBe(1);
    expect(result.summary.updatedDrafts).toBe(0);
  });

  it('creates update_draft for existing modules', () => {
    const existing: ExistingModule[] = [
      { moduleKind: 'A', moduleId: 'VD001', status: 'draft' },
    ];
    const result = parseMarkdownImport({ text: basicMd, existingModules: existing });
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].action).toBe('update_draft');
    expect(result.changes[0].existingStatus).toBe('draft');
    expect(result.summary.updatedDrafts).toBe(1);
    expect(result.summary.newDrafts).toBe(0);
  });

  it('creates update_draft for confirmed existing modules', () => {
    const existing: ExistingModule[] = [
      { moduleKind: 'A', moduleId: 'VD001', status: 'confirmed' },
    ];
    const result = parseMarkdownImport({ text: basicMd, existingModules: existing });
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].action).toBe('update_draft');
    expect(result.changes[0].existingStatus).toBe('confirmed');
  });

  it('creates placeholder_draft for missing parent references', () => {
    const md = [
      '## B-能力',
      '',
      '| ID | 名称 | 描述 | 父ID |',
      '|----|------|------|------|',
      '| CAP001 | 能力1 | 描述 | PARENT001 |',
    ].join('\n');
    const result = parseMarkdownImport({ text: md, existingModules: [] });
    expect(result.changes).toHaveLength(2);

    const capChange = result.changes.find((c) => c.moduleId === 'CAP001');
    expect(capChange?.action).toBe('new_draft');

    const placeholder = result.changes.find((c) => c.moduleId === 'PARENT001');
    expect(placeholder?.action).toBe('placeholder_draft');
    expect(placeholder?.moduleKind).toBe('B');

    expect(result.summary.newDrafts).toBe(1);
    expect(result.summary.placeholderDrafts).toBe(1);
    expect(result.summary.warningCount).toBeGreaterThanOrEqual(1);

    const parentWarning = result.warnings.find((w) => w.message.includes('PARENT001'));
    expect(parentWarning).toBeDefined();
  });

  it('does not create placeholder for existing parent references', () => {
    const md = [
      '## B-能力',
      '',
      '| ID | 名称 | 描述 | 父ID |',
      '|----|------|------|------|',
      '| CAP001 | 能力1 | 描述 | VD001 |',
    ].join('\n');
    const existing: ExistingModule[] = [
      { moduleKind: 'B', moduleId: 'VD001', status: 'draft' },
    ];
    const result = parseMarkdownImport({ text: md, existingModules: existing });
    expect(result.changes).toHaveLength(1);
    expect(result.changes[0].moduleId).toBe('CAP001');
    expect(result.changes[0].action).toBe('new_draft');
    expect(result.summary.placeholderDrafts).toBe(0);
  });

  it('does not create placeholder when parent is in the same import', () => {
    const md = [
      '## B-能力',
      '',
      '| ID | 名称 | 描述 | 父ID |',
      '|----|------|------|------|',
      '| VD001 | Parent | Desc | |',
      '| CAP001 | Child | Desc | VD001 |',
    ].join('\n');
    const result = parseMarkdownImport({ text: md, existingModules: [] });
    expect(result.changes).toHaveLength(2);
    expect(result.changes.every((c) => c.action === 'new_draft')).toBe(true);
    expect(result.summary.placeholderDrafts).toBe(0);
  });

  it('propagates parse warnings from parseMarkdownToModules', () => {
    const md = [
      '## A-价值域',
      '',
      '| 名称 | 描述 |',
      '|------|------|',
      '| Test | Desc |',
    ].join('\n');
    const result = parseMarkdownImport({ text: md, existingModules: [] });
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.summary.warningCount).toBeGreaterThan(0);
  });

  it('filters out _REF module kind rows', () => {
    // parseMarkdownToModules should not produce _REF rows naturally,
    // but the code filters them out explicitly
    const result = parseMarkdownImport({ text: basicMd, existingModules: [] });
    expect(result.rows.every((r) => r.moduleKind !== '_REF')).toBe(true);
  });

  it('handles empty import text', () => {
    const result = parseMarkdownImport({ text: '', existingModules: [] });
    expect(result.changes).toHaveLength(0);
    expect(result.summary.newDrafts).toBe(0);
    expect(result.summary.updatedDrafts).toBe(0);
    expect(result.summary.placeholderDrafts).toBe(0);
    expect(result.summary.warningCount).toBe(0);
  });

  it('handles multiple sections with mixed new/existing', () => {
    const md = [
      '## A-价值域',
      '',
      '| ID | 名称 | 描述 |',
      '|----|------|------|',
      '| VD001 | Existing VD | Desc |',
      '| VD002 | New VD | Desc |',
      '',
      '## B-能力',
      '',
      '| ID | 名称 | 描述 |',
      '|----|------|------|',
      '| CAP001 | New Cap | Desc |',
    ].join('\n');

    const existing: ExistingModule[] = [
      { moduleKind: 'A', moduleId: 'VD001', status: 'confirmed' },
    ];

    const result = parseMarkdownImport({ text: md, existingModules: existing });
    expect(result.changes).toHaveLength(3);

    const vdExisting = result.changes.find((c) => c.moduleId === 'VD001' && c.moduleKind === 'A');
    expect(vdExisting?.action).toBe('update_draft');

    const vdNew = result.changes.find((c) => c.moduleId === 'VD002' && c.moduleKind === 'A');
    expect(vdNew?.action).toBe('new_draft');

    const capNew = result.changes.find((c) => c.moduleId === 'CAP001' && c.moduleKind === 'B');
    expect(capNew?.action).toBe('new_draft');

    expect(result.summary.newDrafts).toBe(2);
    expect(result.summary.updatedDrafts).toBe(1);
    expect(result.summary.placeholderDrafts).toBe(0);
  });

  it('sets row numbers sequentially for changes', () => {
    const md = [
      '## A-价值域',
      '',
      '| ID | 名称 | 描述 |',
      '|----|------|------|',
      '| VD001 | V1 | Desc |',
      '| VD002 | V2 | Desc |',
    ].join('\n');
    const result = parseMarkdownImport({ text: md, existingModules: [] });
    expect(result.changes[0].row).toBe(1);
    expect(result.changes[1].row).toBe(2);
  });
});

// =========================================================================
// generateMarkdownTemplate
// =========================================================================

describe('generateMarkdownTemplate', () => {
  it('returns a non-empty string', () => {
    const template = generateMarkdownTemplate();
    expect(typeof template).toBe('string');
    expect(template.length).toBeGreaterThan(0);
  });

  it('starts with an H1 heading', () => {
    const template = generateMarkdownTemplate();
    expect(template.startsWith('# ')).toBe(true);
  });

  it('contains sections for all 12 module kinds', () => {
    const template = generateMarkdownTemplate();
    for (const kind of ALL_KINDS) {
      expect(template).toContain(`## ${kind}`);
    }
  });

  it('contains a table for each section', () => {
    const template = generateMarkdownTemplate();
    // Count occurrences of '| ID |'
    const tableHeaders = template.match(/\| ID \|/g);
    expect(tableHeaders).toHaveLength(12);
  });

  it('contains example data rows', () => {
    const template = generateMarkdownTemplate();
    expect(template).toContain('VD001');
    expect(template).toContain('CAP001');
    expect(template).toContain('SCN001');
  });

  it('is valid markdown (starts with H1, has H2 sections)', () => {
    const template = generateMarkdownTemplate();
    const h2Count = (template.match(/^## /gm) || []).length;
    expect(h2Count).toBe(12);
  });
});

// =========================================================================
// Helpers
// =========================================================================

function kindLabel(kind: ModuleKind): string {
  const map: Record<ModuleKind, string> = {
    A: 'A-价值域',
    B: 'B-能力',
    C: 'C-场景',
    EPC: 'EPC流程',
    E1: 'E1-数据',
    E2: 'E2-行为',
    E3: 'E3-规则',
    E4: 'E4-事件',
    E5: 'E5-岗位角色',
    E6: 'E6-指标',
    E7: 'E7-边界约束',
    E8: 'E8-数据源',
  };
  return map[kind];
}
