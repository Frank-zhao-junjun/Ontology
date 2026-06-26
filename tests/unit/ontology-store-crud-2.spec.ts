import { describe, expect, it, beforeEach } from 'vitest';
import { useOntologyStore } from '@/store/ontology-store';
import type { Domain } from '@/types/ontology';

const domain: Domain = { id: 'd1', name: 'Mfg', nameEn: 'Mfg', icon: 'factory', color: '#000', description: '' };

describe('createProject', () => {
  beforeEach(() => useOntologyStore.setState({ project: null }));
  it('create project + update name + update description', () => {
    useOntologyStore.getState().createProject('Test', domain);
    const p = useOntologyStore.getState().project!;
    expect(p.name).toBe('Test');
    expect(p.domain.name).toBe('Mfg');
    useOntologyStore.getState().updateProjectName('NewName');
    expect(useOntologyStore.getState().project!.name).toBe('NewName');
    useOntologyStore.getState().updateProjectDescription('NewDesc');
    expect(useOntologyStore.getState().project!.description).toBe('NewDesc');
  });
});
