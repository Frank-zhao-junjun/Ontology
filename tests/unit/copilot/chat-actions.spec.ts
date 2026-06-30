import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain } from '@/types/ontology';
import {
  extractActionBlocks,
  executeAction,
  getActionLabel,
  buildProjectContext,
} from '@/lib/copilot/chat-actions';

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Manufacturing',
  description: 'test',
  icon: 'factory',
  color: '#000',
};

function resetStore(withProject = true) {
  useOntologyStore.setState({
    project: null,
    metadataList: [],
    masterDataList: [],
    masterDataRecords: {},
    versions: [],
    activeModelType: null,
    selectedBusinessChainNode: null,
  });
  if (withProject) {
    useOntologyStore.getState().createProject('Copilot 测试', domain);
  }
}

describe('chat-actions / extractActionBlocks', () => {
  it('extracts a single action block and strips it from display text', () => {
    const text =
      '我来创建价值域。\n<<<ACTION>>>\n{"action":"create_value_domain","name":"物料"}\n<<<END_ACTION>>>\n完成。';
    const { cleanText, rawActions } = extractActionBlocks(text);
    expect(rawActions).toHaveLength(1);
    expect(rawActions[0]).toMatchObject({ action: 'create_value_domain', name: '物料' });
    expect(cleanText).not.toContain('<<<ACTION>>>');
    expect(cleanText).toContain('我来创建价值域');
    expect(cleanText).toContain('完成');
  });

  it('extracts multiple action blocks in order', () => {
    const text =
      '<<<ACTION>>>{"action":"create_value_domain","name":"A1"}<<<END_ACTION>>>' +
      '<<<ACTION>>>{"action":"create_capability","name":"B1","parentName":"A1"}<<<END_ACTION>>>';
    const { rawActions } = extractActionBlocks(text);
    expect(rawActions.map((a) => a.action)).toEqual(['create_value_domain', 'create_capability']);
  });

  it('skips malformed JSON and blocks missing an action field', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const text =
      '<<<ACTION>>>{not valid json}<<<END_ACTION>>>' +
      '<<<ACTION>>>{"foo":"bar"}<<<END_ACTION>>>' +
      '<<<ACTION>>>{"action":"create_value_domain","name":"OK"}<<<END_ACTION>>>';
    const { rawActions } = extractActionBlocks(text);
    expect(rawActions).toHaveLength(1);
    expect(rawActions[0].action).toBe('create_value_domain');
    warn.mockRestore();
  });

  it('returns no actions for plain text', () => {
    const { cleanText, rawActions } = extractActionBlocks('就是一段普通文字');
    expect(rawActions).toHaveLength(0);
    expect(cleanText).toBe('就是一段普通文字');
  });
});

describe('chat-actions / getActionLabel', () => {
  it('produces human labels per action type', () => {
    expect(getActionLabel('create_value_domain', { name: 'X' })).toBe('A-价值域: X');
    expect(getActionLabel('create_capability', { name: 'Y' })).toBe('B-能力: Y');
    expect(getActionLabel('create_scenario', { name: 'Z' })).toBe('C-场景: Z');
    expect(getActionLabel('create_epc_process', { name: 'P' })).toBe('EPC: P');
    expect(getActionLabel('create_chain', {})).toBe('业务链');
    expect(getActionLabel('mystery', {})).toBe('mystery');
  });
});

describe('chat-actions / executeAction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-30T12:00:00.000Z'));
    resetStore(true);
  });

  it('errors when there is no active project', () => {
    resetStore(false);
    const result = executeAction({ action: 'create_value_domain', name: '物料' });
    expect(result.status).toBe('error');
    expect(result.detail).toContain('没有活动项目');
  });

  it('creates a value domain', () => {
    const result = executeAction({ action: 'create_value_domain', name: '物料域', nameEn: 'MaterialDomain' });
    expect(result.status).toBe('success');
    const project = useOntologyStore.getState().project!;
    expect(project.valueDomains?.map((v) => v.name)).toContain('物料域');
  });

  it('errors when create_value_domain has no name', () => {
    const result = executeAction({ action: 'create_value_domain' });
    expect(result.status).toBe('error');
    expect(result.detail).toContain('name');
  });

  it('creates a capability under an existing value domain', () => {
    executeAction({ action: 'create_value_domain', name: '采购域' });
    const result = executeAction({ action: 'create_capability', parentName: '采购域', name: '供应商管理' });
    expect(result.status).toBe('success');
    const project = useOntologyStore.getState().project!;
    expect(project.capabilities?.map((c) => c.name)).toContain('供应商管理');
  });

  it('errors when capability parent is missing', () => {
    const result = executeAction({ action: 'create_capability', parentName: '不存在', name: '能力' });
    expect(result.status).toBe('error');
    expect(result.detail).toContain('找不到父级价值域');
  });

  it('errors on unknown action type', () => {
    const result = executeAction({ action: 'delete_everything' });
    expect(result.status).toBe('error');
    expect(result.detail).toContain('不支持的动作类型');
  });

  it('creates a full chain A→B→C→EPC via create_chain', () => {
    const result = executeAction({
      action: 'create_chain',
      chain: [
        { type: 'value_domain', name: '生产域' },
        { type: 'capability', name: '排产能力' },
        { type: 'scenario', name: '排产场景' },
        { type: 'epc', name: '排产流程' },
      ],
    });
    expect(result.status).toBe('success');
    expect(result.label).toContain('4');
    const project = useOntologyStore.getState().project!;
    expect(project.valueDomains).toHaveLength(1);
    expect(project.capabilities).toHaveLength(1);
    expect(project.scenarios).toHaveLength(1);
    expect(project.epcProcesses).toHaveLength(1);
  });

  it('reports skipped nodes when chain order is partially invalid', () => {
    const result = executeAction({
      action: 'create_chain',
      chain: [
        { type: 'value_domain', name: '域A' },
        // scenario before a capability exists → skipped
        { type: 'scenario', name: '孤立场景' },
      ],
    });
    expect(result.status).toBe('success');
    expect(result.detail).toContain('跳过');
    const project = useOntologyStore.getState().project!;
    expect(project.valueDomains).toHaveLength(1);
    expect(project.scenarios ?? []).toHaveLength(0);
  });

  it('errors when create_chain creates nothing (fully invalid order)', () => {
    const result = executeAction({
      action: 'create_chain',
      chain: [{ type: 'epc', name: '无主流程' }],
    });
    expect(result.status).toBe('error');
    expect(result.detail).toContain('顺序无效');
  });

  it('errors when create_chain has an empty array', () => {
    const result = executeAction({ action: 'create_chain', chain: [] });
    expect(result.status).toBe('error');
    expect(result.detail).toContain('chain 数组为空');
  });
});

describe('chat-actions / buildProjectContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-30T12:00:00.000Z'));
    resetStore(true);
  });

  it('summarizes an empty project', () => {
    const ctx = buildProjectContext();
    expect(ctx).toContain('项目名称: Copilot 测试');
    expect(ctx).toContain('领域: 离散制造');
    expect(ctx).not.toContain('已有 A-价值域');
  });

  it('lists existing chain nodes', () => {
    executeAction({
      action: 'create_chain',
      chain: [
        { type: 'value_domain', name: '生产域', nameEn: 'ProdDomain' },
        { type: 'capability', name: '排产能力' },
        { type: 'scenario', name: '排产场景' },
        { type: 'epc', name: '排产流程' },
      ],
    });
    const ctx = buildProjectContext();
    expect(ctx).toContain('已有 A-价值域 (1)');
    expect(ctx).toContain('生产域 (ProdDomain)');
    expect(ctx).toContain('已有 B-能力 (1)');
    expect(ctx).toContain('已有 C-场景 (1)');
    expect(ctx).toContain('已有 EPC 流程 (1)');
  });
});
