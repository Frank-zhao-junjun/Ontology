import { describe, expect, it } from 'vitest';
import { formatCopilotReply } from '@/lib/copilot/format-copilot-reply';

describe('formatCopilotReply', () => {
  it('renders created sections with kind headings', () => {
    const reply = formatCopilotReply({
      created: [
        { kind: 'A', name: '生产制造', id: 'vd-1' },
        { kind: 'B', name: '计划管理', id: 'cap-1', parentLabel: 'A-生产制造' },
      ],
      forked: [{ kind: 'B', name: '计划管理' }],
      elements: { inserted: 3, updated: 1, skipped: 1 },
    });

    expect(reply).toContain('**价值域**');
    expect(reply).toContain('**能力**');
    expect(reply).toContain('A · 生产制造');
    expect(reply).toContain('B · 计划管理');
    expect(reply).toContain('已 fork 到 draft');
    expect(reply).toContain('新建 3 条');
    expect(reply).toContain('请到左侧工作台确认');
  });

  it('includes EPC steps when provided', () => {
    const reply = formatCopilotReply({
      created: [
        {
          kind: 'EPC',
          name: '订单处理',
          stepCount: 2,
          steps: ['接收订单', '审核'],
        },
      ],
    });

    expect(reply).toContain('**EPC 流程**');
    expect(reply).toContain('（2 步）');
    expect(reply).toContain('1. 接收订单');
  });
});
