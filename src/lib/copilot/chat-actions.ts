/**
 * Chat copilot action layer.
 *
 * The modeling copilot instructs the LLM to emit structured action blocks
 * (`<<<ACTION>>>{json}<<<END_ACTION>>>`). This module owns the pure-ish logic
 * for extracting those blocks, executing them against the Zustand store, and
 * building the project context string sent to the model.
 *
 * Kept free of React so it can be unit-tested directly. `executeAction` and
 * `buildProjectContext` read/write the store via `useOntologyStore.getState()`.
 */
import { useOntologyStore } from '@/store/ontology-store';

export interface ParsedAction {
  id: string;
  action: string;
  label: string;
  status: 'pending' | 'success' | 'error';
  detail?: string;
}

const ACTION_BLOCK_REGEX = /<<<ACTION>>>\s*([\s\S]*?)\s*<<<END_ACTION>>>/g;

/** Extract `<<<ACTION>>>...<<<END_ACTION>>>` blocks, returning cleaned text + parsed JSON actions. */
export function extractActionBlocks(text: string): {
  cleanText: string;
  rawActions: Record<string, unknown>[];
} {
  const actions: Record<string, unknown>[] = [];
  const regex = new RegExp(ACTION_BLOCK_REGEX.source, 'g');

  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const jsonStr = match[1].trim();
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object' && typeof parsed.action === 'string') {
        actions.push(parsed);
      }
    } catch {
      console.warn('[Copilot] Failed to parse ACTION block JSON:', jsonStr.slice(0, 120));
    }
  }

  const cleanText = text.replace(regex, '').replace(/\n{3,}/g, '\n\n').trim();

  return { cleanText, rawActions: actions };
}

export function getActionLabel(action: string, data: Record<string, unknown>): string {
  const name = (data.name as string) || '';
  switch (action) {
    case 'create_value_domain': return `A-价值域: ${name}`;
    case 'create_capability': return `B-能力: ${name}`;
    case 'create_scenario': return `C-场景: ${name}`;
    case 'create_epc_process': return `EPC: ${name}`;
    case 'create_chain': return `业务链`;
    default: return action;
  }
}

function newActionId(): string {
  return `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Execute a single parsed action against the store, returning a status result. */
export function executeAction(data: Record<string, unknown>): ParsedAction {
  const action = data.action as string;
  const store = useOntologyStore.getState();
  const project = store.project;
  const actionId = newActionId();

  if (!project) {
    return {
      id: actionId,
      action,
      label: getActionLabel(action, data),
      status: 'error',
      detail: '没有活动项目，请先创建项目',
    };
  }

  try {
    switch (action) {
      case 'create_value_domain': {
        const name = data.name as string;
        const nameEn = (data.nameEn as string) || '';
        const description = (data.description as string) || '';
        if (!name) throw new Error('name 字段必填');
        store.addValueDomain({ name, nameEn, description });
        return { id: actionId, action, label: `A-价值域: ${name}`, status: 'success', detail: '已创建' };
      }

      case 'create_capability': {
        const parentName = data.parentName as string;
        const name = data.name as string;
        const nameEn = (data.nameEn as string) || '';
        const description = (data.description as string) || '';
        if (!name) throw new Error('name 字段必填');
        const parent = (project.valueDomains ?? []).find((v) => v.name === parentName);
        if (!parent) throw new Error(`找不到父级价值域: ${parentName}`);
        store.addCapability(parent.id, { name, nameEn, description });
        return { id: actionId, action, label: `B-能力: ${name}`, status: 'success', detail: `挂载到「${parentName}」` };
      }

      case 'create_scenario': {
        const parentName = data.parentName as string;
        const name = data.name as string;
        const nameEn = (data.nameEn as string) || '';
        const description = (data.description as string) || '';
        if (!name) throw new Error('name 字段必填');
        const parent = (project.capabilities ?? []).find((c) => c.name === parentName);
        if (!parent) throw new Error(`找不到父级能力: ${parentName}`);
        store.addScenario(parent.id, { name, nameEn, description });
        return { id: actionId, action, label: `C-场景: ${name}`, status: 'success', detail: `挂载到「${parentName}」` };
      }

      case 'create_epc_process': {
        const parentName = data.parentName as string;
        const name = data.name as string;
        const nameEn = (data.nameEn as string) || '';
        const description = (data.description as string) || '';
        if (!name) throw new Error('name 字段必填');
        const parent = (project.scenarios ?? []).find((s) => s.name === parentName);
        if (!parent) throw new Error(`找不到父级场景: ${parentName}`);
        store.addEpcProcess(parent.id, { name, nameEn, description });
        return { id: actionId, action, label: `EPC: ${name}`, status: 'success', detail: `挂载到「${parentName}」` };
      }

      case 'create_chain': {
        const chain = data.chain as Array<{ type: string; name: string; nameEn?: string; description?: string }>;
        if (!Array.isArray(chain) || chain.length === 0) throw new Error('chain 数组为空');

        let valueDomainId: string | null = null;
        let capabilityId: string | null = null;
        let scenarioId: string | null = null;
        const created: string[] = [];
        const skipped: string[] = [];

        for (const item of chain) {
          if (!useOntologyStore.getState().project) throw new Error('项目状态丢失');

          if (item.type === 'value_domain') {
            const vd = store.addValueDomain({ name: item.name, nameEn: item.nameEn ?? '', description: item.description ?? '' });
            valueDomainId = vd.id;
            created.push(`A-价值域: ${item.name}`);
          } else if (item.type === 'capability' && valueDomainId) {
            const cap = store.addCapability(valueDomainId, { name: item.name, nameEn: item.nameEn ?? '', description: item.description ?? '' });
            capabilityId = cap.id;
            created.push(`B-能力: ${item.name}`);
          } else if (item.type === 'scenario' && capabilityId) {
            const sc = store.addScenario(capabilityId, { name: item.name, nameEn: item.nameEn ?? '', description: item.description ?? '' });
            scenarioId = sc.id;
            created.push(`C-场景: ${item.name}`);
          } else if (item.type === 'epc' && scenarioId) {
            store.addEpcProcess(scenarioId, { name: item.name, nameEn: item.nameEn ?? '', description: item.description ?? '' });
            created.push(`EPC: ${item.name}`);
          } else {
            skipped.push(`${item.type}: ${item.name}`);
          }
        }

        if (created.length === 0) {
          throw new Error('链路顺序无效，未创建任何节点（应为 value_domain → capability → scenario → epc）');
        }

        const detailParts = [created.join(' / ')];
        if (skipped.length > 0) {
          detailParts.push(`（已跳过 ${skipped.length} 个顺序无效节点: ${skipped.join(', ')}）`);
        }

        return {
          id: actionId,
          action,
          label: `业务链 (${created.length} 个节点)`,
          status: 'success',
          detail: detailParts.join(' '),
        };
      }

      default:
        return {
          id: actionId,
          action,
          label: `未知动作: ${action}`,
          status: 'error',
          detail: '不支持的动作类型',
        };
    }
  } catch (err) {
    return {
      id: actionId,
      action,
      label: getActionLabel(action, data),
      status: 'error',
      detail: err instanceof Error ? err.message : '执行失败',
    };
  }
}

/** Build the project-context string injected into the system prompt. */
export function buildProjectContext(): string {
  const store = useOntologyStore.getState();
  const project = store.project;
  const valueDomains = project?.valueDomains ?? [];
  const capabilities = project?.capabilities ?? [];
  const scenarios = project?.scenarios ?? [];
  const epcProcesses = project?.epcProcesses ?? [];

  const lines: string[] = [];
  lines.push(`项目名称: ${project?.name ?? '未命名'}`);
  lines.push(`领域: ${project?.domain?.name ?? '未指定'}`);

  if (valueDomains.length > 0) {
    lines.push(`\n已有 A-价值域 (${valueDomains.length}):`);
    for (const v of valueDomains) {
      lines.push(`  - ${v.name}${v.nameEn ? ` (${v.nameEn})` : ''}`);
    }
  }

  if (capabilities.length > 0) {
    lines.push(`\n已有 B-能力 (${capabilities.length}):`);
    for (const c of capabilities) {
      lines.push(`  - ${c.name}${c.nameEn ? ` (${c.nameEn})` : ''}`);
    }
  }

  if (scenarios.length > 0) {
    lines.push(`\n已有 C-场景 (${scenarios.length}):`);
    for (const s of scenarios) {
      lines.push(`  - ${s.name}`);
    }
  }

  if (epcProcesses.length > 0) {
    lines.push(`\n已有 EPC 流程 (${epcProcesses.length}):`);
    for (const p of epcProcesses) {
      lines.push(`  - ${p.name}`);
    }
  }

  return lines.join('\n');
}
