import type { MetaDimension } from '@/types/ontology';

export const META_DIMENSION_ORDER: MetaDimension[] = [
  'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8',
];

export const META_DIMENSION_LABELS: Record<MetaDimension, string> = {
  E1: 'E1 数据',
  E2: 'E2 行为',
  E3: 'E3 事件',
  E4: 'E4 规则',
  E5: 'E5 岗位角色',
  E6: 'E6 指标',
  E7: 'E7 约束',
  E8: 'E8 接口',
};

export type { MetaDimension };
