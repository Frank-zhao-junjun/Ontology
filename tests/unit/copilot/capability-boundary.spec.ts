import { describe, expect, it } from 'vitest';
import { buildBoundaryReply } from '@/lib/copilot/capability-boundary';

describe('buildBoundaryReply — TC-08', () => {
  it('returns export guidance', () => {
    expect(buildBoundaryReply('export')).toMatch(/导出/);
    expect(buildBoundaryReply('export')).toMatch(/顶部/);
  });

  it('returns delete guidance', () => {
    expect(buildBoundaryReply('delete')).toMatch(/不执行任何删除/);
    expect(buildBoundaryReply('delete')).toMatch(/左侧/);
  });

  it('returns unknown capability message with suggestions', () => {
    const reply = buildBoundaryReply('unknown');
    expect(reply).toMatch(/超出 Copilot 建模能力/);
    expect(reply).toMatch(/创建价值域/);
  });
});
