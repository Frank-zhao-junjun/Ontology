import { describe, it, expect } from 'vitest';
import { useAppStore } from '../useAppStore';

describe('useAppStore', () => {
  it('starts with null entity', () => {
    expect(useAppStore.getState().currentEntity).toBeNull();
  });

  it('setCurrentEntity updates entity', () => {
    useAppStore.getState().setCurrentEntity('lead');
    expect(useAppStore.getState().currentEntity).toBe('lead');
  });

  it('all 5 dims start as pending', () => {
    const d = useAppStore.getState().dimensionStatus;
    expect(d.structural).toBe('pending');
    expect(d.behavioral).toBe('pending');
    expect(d.rules).toBe('pending');
    expect(d.events).toBe('pending');
    expect(d.interfaces).toBe('pending');
  });
});
