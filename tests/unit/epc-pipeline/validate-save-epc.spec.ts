import { describe, it, expect } from 'vitest';
import { validateSaveEpcInput } from '@/lib/epc-pipeline/validate-save-epc';
import type { EpcProcess, EpcStep } from '@/types/ontology';

function step(id: string, name: string, overrides: Partial<EpcStep> = {}): EpcStep {
  return { id, name, ...overrides };
}

function epc(id: string, parentId: string, steps: EpcStep[], overrides: Partial<EpcProcess> = {}): EpcProcess {
  return { id, name: 'Test EPC', parentId, steps, ...overrides };
}

// ============================================================
// validateSaveEpcInput
// ============================================================

describe('validateSaveEpcInput', () => {
  // TC-1
  it('should pass validation for a valid EPC', () => {
    const valid = epc('epc-1', 'scenario-1', [
      step('s-1', '开始', {
        elementRef: { dimension: 'E3', elementId: 'evt-1', versionPin: 'latest_confirmed' },
      }),
      step('s-2', '执行动作', {
        elementRef: { dimension: 'E2', elementId: 'act-1', versionPin: 'latest_confirmed' },
      }),
    ]);
    expect(() => validateSaveEpcInput(valid)).not.toThrow();
  });

  // TC-2
  it('should throw when epc id is empty', () => {
    const invalid = epc('', 'scenario-1', []);
    expect(() => validateSaveEpcInput(invalid)).toThrow('EPC id 不能为空');
  });

  // TC-3
  it('should throw when epc id is whitespace-only', () => {
    const invalid = epc('   ', 'scenario-1', []);
    expect(() => validateSaveEpcInput(invalid)).toThrow('EPC id 不能为空');
  });

  // TC-4
  it('should throw when parentId is empty', () => {
    const invalid = epc('epc-1', '', []);
    expect(() => validateSaveEpcInput(invalid)).toThrow('EPC 必须归属业务场景 (parentId)');
  });

  // TC-5
  it('should throw when a step has empty id', () => {
    const invalid = epc('epc-1', 'scenario-1', [
      step('', '无名步骤'),
    ]);
    expect(() => validateSaveEpcInput(invalid)).toThrow('步骤 id 不能为空');
  });

  // TC-6
  it('should throw on duplicate step ids', () => {
    const invalid = epc('epc-1', 'scenario-1', [
      step('dup', '第一步'),
      step('dup', '第二步'),
    ]);
    expect(() => validateSaveEpcInput(invalid)).toThrow('步骤 id 重复: dup');
  });

  // TC-7
  it('should throw on invalid meta dimension in elementRef', () => {
    const invalid = epc('epc-1', 'scenario-1', [
      step('s-1', '测试', {
        elementRef: { dimension: 'E9' as never, elementId: 'x', versionPin: 'latest_confirmed' },
      }),
    ]);
    expect(() => validateSaveEpcInput(invalid)).toThrow('无效的要素维度: E9');
  });

  // TC-8
  it('should throw when inlineNew step has no inlinePayload', () => {
    const invalid = epc('epc-1', 'scenario-1', [
      step('s-1', '内联新建', {
        elementRef: { dimension: 'E1', elementId: 'e1', versionPin: 'latest_confirmed', inlineNew: true },
      }),
    ]);
    expect(() => validateSaveEpcInput(invalid)).toThrow('inlineNew 步骤必须提供 inlinePayload');
  });

  // TC-9
  it('should allow inlineNew step when inlinePayload is provided', () => {
    const valid = epc('epc-1', 'scenario-1', [
      step('s-1', '内联新建', {
        elementRef: {
          dimension: 'E1',
          elementId: 'e1',
          versionPin: 'latest_confirmed',
          inlineNew: true,
          inlinePayload: { name: '新要素' },
        },
      }),
    ]);
    expect(() => validateSaveEpcInput(valid)).not.toThrow();
  });

  // TC-10
  it('should throw when non-inline ref has empty elementId', () => {
    const invalid = epc('epc-1', 'scenario-1', [
      step('s-1', '引用', {
        elementRef: { dimension: 'E2', elementId: '  ', versionPin: 'latest_confirmed' },
      }),
    ]);
    expect(() => validateSaveEpcInput(invalid)).toThrow('非内联引用的 elementId 不能为空');
  });

  // TC-11
  it('should pass when step has no elementRef (skip validation)', () => {
    const valid = epc('epc-1', 'scenario-1', [
      step('s-1', '没有引用的步骤'),
    ]);
    expect(() => validateSaveEpcInput(valid)).not.toThrow();
  });
});
