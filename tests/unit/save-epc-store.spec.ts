import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import { filterUnreferencedElements, isUnreferencedElement } from '@/lib/element-library';
import type { Domain, EpcProcess } from '@/types/ontology';

const domain: Domain = {
  id: 'd1',
  name: '离散制造',
  nameEn: 'Mfg',
  description: '',
  icon: 'factory',
  color: '#000',
};

describe('saveEpc store (US-S05-U04)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-18T12:00:00.000Z'));
    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('EPC流水线', domain);
    const store = useOntologyStore.getState();
    const a = store.addValueDomain({ name: 'A' });
    const b = store.addCapability(a.id, { name: 'B' });
    const c = store.addScenario(b.id, { name: 'C' });
    store.addEpcProcess(c.id, { name: 'EPC-1' });
  });

  it('should save epc with inline element and rebuild usageRefs', () => {
    const epcId = useOntologyStore.getState().project?.epcProcesses?.[0]?.id as string;
    const epc: EpcProcess = {
      id: epcId,
      name: 'EPC-1',
      parentId: useOntologyStore.getState().project?.epcProcesses?.[0]?.parentId as string,
      steps: [{
        id: 'step-1',
        name: '挂接',
        elementRef: {
          dimension: 'E1',
          elementId: '',
          versionPin: 'latest_confirmed',
          inlineNew: true,
          inlinePayload: { name: '物料' },
        },
      }],
    };

    useOntologyStore.getState().saveEpc(epcId, epc);
    const project = useOntologyStore.getState().project!;

    expect(project.metaElements).toHaveLength(1);
    expect(project.metaElements![0].usageRefs).toHaveLength(1);
    expect(project.moduleVersionRecords?.some((r) => r.moduleKind === 'EPC' && r.moduleId === epcId && r.status === 'draft')).toBe(true);
    expect(project.moduleVersionRecords?.some((r) => r.moduleKind === 'E1' && r.status === 'draft')).toBe(true);
  });

  it('should return usage refs via getElementUsageRefs', () => {
    const store = useOntologyStore.getState();
    const epc = store.project?.epcProcesses?.[0];
    if (!epc) throw new Error('missing epc');

    store.saveEpc(epc.id, {
      ...epc,
      steps: [{
        id: 's1',
        name: 'S',
        elementRef: {
          dimension: 'E2',
          elementId: '',
          versionPin: 'latest_confirmed',
          inlineNew: true,
          inlinePayload: { name: '行为' },
        },
      }],
    });

    const elementId = useOntologyStore.getState().project?.metaElements?.[0]?.id;
    expect(elementId).toBeTruthy();
    const refs = useOntologyStore.getState().getElementUsageRefs(elementId!);
    expect(refs).toHaveLength(1);
    expect(refs[0].epcId).toBe(epc.id);
  });

  it('should sync usageRefs with element-library unreferenced filter', () => {
    const store = useOntologyStore.getState();
    const epc = store.project?.epcProcesses?.[0];
    if (!epc) throw new Error('missing epc');

    store.saveEpc(epc.id, {
      ...epc,
      steps: [{
        id: 's1',
        name: 'S',
        elementRef: {
          dimension: 'E1',
          elementId: '',
          versionPin: 'latest_confirmed',
          inlineNew: true,
          inlinePayload: { name: '已引用要素' },
        },
      }],
    });

    const project = useOntologyStore.getState().project!;
    const referencedFresh = project.metaElements!.find((el) => el.name === '已引用要素')!;
    expect(referencedFresh.usageRefs).toHaveLength(1);

    useOntologyStore.setState({
      project: {
        ...project,
        metaElements: [
          ...(project.metaElements ?? []),
          {
            id: 'orphan-el',
            name: '未引用',
            dimension: 'E1' as const,
            usageRefs: [],
          },
        ],
      },
    });

    const elements = useOntologyStore.getState().project!.metaElements!;
    const referencedInStore = elements.find((el) => el.name === '已引用要素')!;
    expect(isUnreferencedElement(referencedInStore)).toBe(false);
    expect(filterUnreferencedElements(elements, true)).toHaveLength(1);
    expect(filterUnreferencedElements(elements, true)[0].id).toBe('orphan-el');
  });
});
