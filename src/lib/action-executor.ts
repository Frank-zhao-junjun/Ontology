/**
 * @ontology/core — Copilot Action Executor
 *
 * Executes parsed ACTION blocks against the project as pure functions.
 * Returns an array of ActionResult with status per action.
 *
 * Moved from modeling-copilot-panel.tsx (~120-line switch statement).
 */

import type { OntologyProject } from '@/types/ontology';
import {
  addValueDomain,
  addCapability,
  addScenario,
  addEpcProcess,
} from '@/lib/business-chain/business-chain';

// ========== Types ==========

export interface CopilotAction {
  action: string;
  [key: string]: unknown;
}

export interface ActionResult {
  id: string;
  action: string;
  label: string;
  status: 'success' | 'error';
  detail?: string;
}

// ========== Helpers ==========

function getActionLabel(action: string, data: Record<string, unknown>): string {
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

// ========== Action executor ==========

/**
 * Execute a single action against the project, returning updated project + result.
 * 
 * This is the pure-function equivalent of the switch statement
 * in modeling-copilot-panel.tsx executeAction().
 */
export function executeOneAction(
  project: OntologyProject,
  data: CopilotAction,
): { project: OntologyProject; result: ActionResult } {
  const action = data.action;
  const actionId = `act-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const label = getActionLabel(action, data);

  try {
    switch (action) {
      case 'create_value_domain': {
        const name = data.name as string;
        const nameEn = (data.nameEn as string) || '';
        const description = (data.description as string) || '';
        if (!name) throw new Error('name 字段必填');
        const { project: nextProject, node: vd } = addValueDomain(project, { name, nameEn, description });
        return {
          project: nextProject,
          result: { id: actionId, action, label: `A-价值域: ${vd.name}`, status: 'success', detail: '已创建' },
        };
      }

      case 'create_capability': {
        const parentName = data.parentName as string;
        const name = data.name as string;
        const nameEn = (data.nameEn as string) || '';
        const description = (data.description as string) || '';
        const parent = (project.valueDomains ?? []).find((v) => v.name === parentName);
        if (!parent) throw new Error(`找不到父级价值域: ${parentName}`);
        const { project: nextProject } = addCapability(project, parent.id, { name, nameEn, description });
        return {
          project: nextProject,
          result: { id: actionId, action, label: `B-能力: ${name}`, status: 'success', detail: `挂载到「${parentName}」` },
        };
      }

      case 'create_scenario': {
        const parentName = data.parentName as string;
        const name = data.name as string;
        const nameEn = (data.nameEn as string) || '';
        const description = (data.description as string) || '';
        const parent = (project.capabilities ?? []).find((c) => c.name === parentName);
        if (!parent) throw new Error(`找不到父级能力: ${parentName}`);
        const { project: nextProject } = addScenario(project, parent.id, { name, nameEn, description });
        return {
          project: nextProject,
          result: { id: actionId, action, label: `C-场景: ${name}`, status: 'success', detail: `挂载到「${parentName}」` },
        };
      }

      case 'create_epc_process': {
        const parentName = data.parentName as string;
        const name = data.name as string;
        const nameEn = (data.nameEn as string) || '';
        const description = (data.description as string) || '';
        const parent = (project.scenarios ?? []).find((s) => s.name === parentName);
        if (!parent) throw new Error(`找不到父级场景: ${parentName}`);
        const { project: nextProject } = addEpcProcess(project, parent.id, { name, nameEn, description });
        return {
          project: nextProject,
          result: { id: actionId, action, label: `EPC: ${name}`, status: 'success', detail: `挂载到「${parentName}」` },
        };
      }

      case 'create_chain': {
        const chain = data.chain as Array<{ type: string; name: string; nameEn?: string; description?: string }>;
        if (!Array.isArray(chain) || chain.length === 0) throw new Error('chain 数组为空');

        let currentProject = project;
        const created: string[] = [];

        for (const item of chain) {
          if (item.type === 'value_domain') {
            const { project: nextP, node: vd } = addValueDomain(currentProject, {
              name: item.name, nameEn: item.nameEn ?? '', description: item.description ?? '',
            });
            currentProject = nextP;
            created.push(`A-价值域: ${vd.name}`);
          } else if (item.type === 'capability') {
            const lastA = currentProject.valueDomains?.[currentProject.valueDomains.length - 1];
            if (!lastA) throw new Error('尚无价值域，无法创建能力');
            const { project: nextP } = addCapability(currentProject, lastA.id, {
              name: item.name, nameEn: item.nameEn ?? '', description: item.description ?? '',
            });
            currentProject = nextP;
            created.push(`B-能力: ${item.name}`);
          } else if (item.type === 'scenario') {
            const lastB = currentProject.capabilities?.[currentProject.capabilities.length - 1];
            if (!lastB) throw new Error('尚无能力，无法创建场景');
            const { project: nextP } = addScenario(currentProject, lastB.id, {
              name: item.name, nameEn: item.nameEn ?? '', description: item.description ?? '',
            });
            currentProject = nextP;
            created.push(`C-场景: ${item.name}`);
          } else if (item.type === 'epc') {
            const lastC = currentProject.scenarios?.[currentProject.scenarios.length - 1];
            if (!lastC) throw new Error('尚无场景，无法创建流程');
            const { project: nextP } = addEpcProcess(currentProject, lastC.id, {
              name: item.name, nameEn: item.nameEn ?? '', description: item.description ?? '',
            });
            currentProject = nextP;
            created.push(`EPC: ${item.name}`);
          }
        }

        return {
          project: currentProject,
          result: {
            id: actionId,
            action,
            label: `业务链 (${created.length} 个节点)`,
            status: 'success',
            detail: created.join(' / '),
          },
        };
      }

      default:
        return {
          project,
          result: {
            id: actionId,
            action,
            label: `未知动作: ${action}`,
            status: 'error',
            detail: '不支持的动作类型',
          },
        };
    }
  } catch (err) {
    return {
      project,
      result: {
        id: actionId,
        action,
        label: label || action,
        status: 'error',
        detail: err instanceof Error ? err.message : '执行失败',
      },
    };
  }
}

/**
 * Execute multiple actions sequentially against the project.
 * Each action sees the project state after previous actions.
 */
export function executeActions(
  project: OntologyProject,
  actions: CopilotAction[],
): { project: OntologyProject; results: ActionResult[] } {
  let currentProject = project;
  const results: ActionResult[] = [];

  for (const action of actions) {
    const { project: nextProject, result } = executeOneAction(currentProject, action);
    currentProject = nextProject;
    results.push(result);
  }

  return { project: currentProject, results };
}
