export type CopilotReplyKind = 'A' | 'B' | 'C' | 'EPC';

export interface CopilotCreatedItem {
  kind: CopilotReplyKind;
  name: string;
  id?: string;
  parentLabel?: string;
  stepCount?: number;
  steps?: string[];
}

export interface CopilotForkedItem {
  kind: CopilotReplyKind;
  name: string;
}

export interface CopilotElementSummary {
  inserted: number;
  updated: number;
  skipped: number;
}

export interface FormatCopilotReplyInput {
  created?: CopilotCreatedItem[];
  forked?: CopilotForkedItem[];
  skipped?: string[];
  elements?: CopilotElementSummary;
}

const KIND_LABELS: Record<CopilotReplyKind, string> = {
  A: '价值域',
  B: '能力',
  C: '场景',
  EPC: 'EPC 流程',
};

const KIND_PREFIX: Record<CopilotReplyKind, string> = {
  A: 'A',
  B: 'B',
  C: 'C',
  EPC: 'EPC',
};

function formatCreatedSection(kind: CopilotReplyKind, items: CopilotCreatedItem[]): string[] {
  if (items.length === 0) return [];
  const lines = [`**${KIND_LABELS[kind]}**`];
  for (const item of items) {
    let line = `- ${KIND_PREFIX[kind]} · ${item.name}`;
    if (item.id) line += ` \`id: ${item.id}\``;
    if (item.parentLabel) line += `（隶属于 ${item.parentLabel}）`;
    if (item.stepCount != null) line += `（${item.stepCount} 步）`;
    lines.push(line);
    if (item.steps?.length) {
      item.steps.forEach((step, index) => {
        lines.push(`  ${index + 1}. ${step}`);
      });
    }
  }
  return lines;
}

export function formatCopilotReply(input: FormatCopilotReplyInput): string {
  const created = input.created ?? [];
  const forked = input.forked ?? [];
  const skipped = input.skipped ?? [];
  const elements = input.elements;

  const lines: string[] = ['已创建以下内容（均为草稿）：', ''];

  for (const kind of ['A', 'B', 'C', 'EPC'] as const) {
    lines.push(...formatCreatedSection(kind, created.filter((item) => item.kind === kind)));
    if (created.some((item) => item.kind === kind)) lines.push('');
  }

  if (elements && (elements.inserted > 0 || elements.updated > 0 || elements.skipped > 0)) {
    lines.push(
      '**要素**',
      `- 新建 ${elements.inserted} 条 · 更新 draft ${elements.updated} 条 · 跳过 confirmed ${elements.skipped} 条`,
      '',
    );
  }

  if (skipped.length > 0) {
    lines.push('**跳过**', ...skipped.map((item) => `- ${item}`), '');
  }

  for (const item of forked) {
    lines.push(
      `> 模块「${item.name}」已有 confirmed 版本，已 fork 到 draft，原 confirmed 未改动。`,
      '',
    );
  }

  lines.push('请到左侧工作台确认，或继续补充细节。');
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
