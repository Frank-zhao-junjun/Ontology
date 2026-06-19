import { describe, it, expect } from 'vitest';
import type { EpcProcess } from '@/types/ontology';
import { validateSaveEpcInput } from '@/lib/epc-pipeline/validate-save-epc';

describe('validateSaveEpcInput (US-S05-U05)', () => {
  const base: EpcProcess = {
    id: 'epc-1',
    name: '流程',
    parentId: 'c-1',
    steps: [],
  };

  it('should pass valid epc', () => {
    expect(() => validateSaveEpcInput({
      ...base,
      steps: [{
        id: 's1',
        name: 'S',
        elementRef: {
          dimension: 'E1',
          elementId: 'el-1',
          versionPin: 'latest_confirmed',
        },
      }],
    })).not.toThrow();
  });

  it('should throw when inlineNew without payload', () => {
    expect(() => validateSaveEpcInput({
      ...base,
      steps: [{
        id: 's1',
        name: 'S',
        elementRef: {
          dimension: 'E1',
          elementId: '',
          versionPin: 'latest_confirmed',
          inlineNew: true,
        },
      }],
    })).toThrow();
  });

  it('should throw when non-inline ref has empty elementId', () => {
    expect(() => validateSaveEpcInput({
      ...base,
      steps: [{
        id: 's1',
        name: 'S',
        elementRef: {
          dimension: 'E1',
          elementId: '',
          versionPin: 'latest_confirmed',
        },
      }],
    })).toThrow();
  });

  it('should throw when step ids are duplicated', () => {
    expect(() => validateSaveEpcInput({
      ...base,
      steps: [
        { id: 'dup', name: 'S1', elementRef: undefined },
        { id: 'dup', name: 'S2', elementRef: undefined },
      ],
    })).toThrow(/重复/);
  });

  it('should throw when step id is empty', () => {
    expect(() => validateSaveEpcInput({
      ...base,
      steps: [{ id: '  ', name: 'S', elementRef: undefined }],
    })).toThrow(/步骤 id 不能为空/);
  });
});
