import type { OntologyProject } from '@/types/ontology';

export type ProjectStatus = 'draft' | 'review' | 'confirmed' | 'archived';
export type ObjectStatus = 'draft' | 'confirmed' | 'archived' | 'unknown';

const VALID_PROJECT_STATUSES: ProjectStatus[] = ['draft', 'review', 'confirmed', 'archived'];
const VALID_OBJECT_STATUSES: ObjectStatus[] = ['draft', 'confirmed', 'archived', 'unknown'];

/**
 * 确定项目状态。
 * 若 project.status 缺失或无效，默认返回 'draft'。
 */
export function resolveProjectStatus(project: OntologyProject): ProjectStatus {
  const status = (project as { status?: string }).status;
  if (status && VALID_PROJECT_STATUSES.includes(status as ProjectStatus)) {
    return status as ProjectStatus;
  }
  return 'draft';
}

/**
 * 确定对象级状态。
 * 若对象无 status 或状态无效，默认返回 'unknown'。
 */
export function resolveObjectStatus(obj: { status?: string } | null | undefined): ObjectStatus {
  if (!obj) return 'unknown';
  const status = obj.status;
  if (status && VALID_OBJECT_STATUSES.includes(status as ObjectStatus)) {
    return status as ObjectStatus;
  }
  return 'unknown';
}

/**
 * 为单个对象添加 / 规范化 status 字段。
 */
export function annotateObjectStatus<T extends object>(
  obj: T | null | undefined
): T & { status: ObjectStatus } {
  if (!obj) {
    return { status: 'unknown' } as T & { status: ObjectStatus };
  }
  return {
    ...obj,
    status: resolveObjectStatus(obj as { status?: string }),
  } as T & { status: ObjectStatus };
}

/**
 * 为对象数组批量标注状态。
 */
export function annotateArrayStatus<T extends object>(
  items: T[] | null | undefined
): (T & { status: ObjectStatus })[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => annotateObjectStatus(item));
}
