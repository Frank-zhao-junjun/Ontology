import type { EpcProcess, MetaDimension } from '@/types/ontology';

const META_DIMENSIONS = new Set<MetaDimension>(['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8']);

export function validateSaveEpcInput(epc: EpcProcess): void {
  if (!epc.id?.trim()) {
    throw new Error('EPC id 不能为空');
  }
  if (!epc.parentId?.trim()) {
    throw new Error('EPC 必须归属业务场景 (parentId)');
  }

  for (const step of epc.steps) {
    const ref = step.elementRef;
    if (!ref) continue;

    if (!META_DIMENSIONS.has(ref.dimension)) {
      throw new Error(`无效的要素维度: ${ref.dimension}`);
    }

    if (ref.inlineNew) {
      if (ref.inlinePayload === undefined || ref.inlinePayload === null) {
        throw new Error('inlineNew 步骤必须提供 inlinePayload');
      }
      continue;
    }

    if (!ref.elementId?.trim()) {
      throw new Error('非内联引用的 elementId 不能为空');
    }
  }
}
