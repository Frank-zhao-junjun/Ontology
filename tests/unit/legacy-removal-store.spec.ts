import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain } from '@/types/ontology';

const domain: Domain = {
  id: 'd1',
  name: '测试域',
  nameEn: 'Test',
  description: '',
  icon: 'factory',
  color: '#000',
};

describe('process model legacy removal (US-S12-U02)', () => {
  it('should not expose orchestration CRUD on store', () => {
    const storePath = join(process.cwd(), 'src/store/ontology-store.ts');
    const source = readFileSync(storePath, 'utf8');
    expect(source).not.toMatch(/\baddOrchestration\b/);
    expect(source).not.toMatch(/\bupdateOrchestration\b/);
    expect(source).not.toMatch(/\bdeleteOrchestration\b/);
  });

  it('should keep processModel field on project for JSON import compat', () => {
    useOntologyStore.getState().createProject('Process 兼容', domain);
    useOntologyStore.getState().importProject(
      JSON.stringify({
        ...useOntologyStore.getState().project,
        processModel: {
          id: 'pm1',
          name: '流程',
          version: '1.0.0',
          domain: domain.id,
          orchestrations: [],
          createdAt: '2026-06-18T12:00:00.000Z',
          updatedAt: '2026-06-18T12:00:00.000Z',
        },
      }),
    );
    expect(useOntologyStore.getState().project?.processModel?.id).toBe('pm1');
  });
});

describe('legacy business scenario migration store (US-S12-U04)', () => {
  beforeEach(() => {
    useOntologyStore.setState({
      project: null,
      metadataList: [],
      masterDataList: [],
      masterDataRecords: {},
      versions: [],
      activeModelType: null,
      selectedBusinessChainNode: null,
    });
    useOntologyStore.getState().createProject('迁移测试', domain);
  });

  it('should migrate legacy business scenarios via store API', () => {
    const projectId = useOntologyStore.getState().project!.id;
    useOntologyStore.setState((state) => ({
      project: state.project
        ? {
            ...state.project,
            dataModel: {
              id: 'dm-legacy',
              name: '数据模型',
              version: '1.0.0',
              domain: state.project.domain.id,
              projects: [],
              businessScenarios: [
                {
                  id: 'legacy-sc-1',
                  name: '遗留场景',
                  nameEn: 'LegacyScenario',
                  projectId,
                },
              ],
              entities: [],
              createdAt: '2026-06-18T12:00:00.000Z',
              updatedAt: '2026-06-18T12:00:00.000Z',
            },
          }
        : null,
    }));

    const result = useOntologyStore.getState().migrateLegacyBusinessScenariosToChain();
    const project = useOntologyStore.getState().project!;

    expect(result.migratedCount).toBe(1);
    expect(project.scenarios).toHaveLength(1);
    expect(project.scenarios![0].id).toBe('legacy-sc-1');
    expect(project.valueDomains).toHaveLength(1);
    expect(project.capabilities).toHaveLength(1);
  });
});
