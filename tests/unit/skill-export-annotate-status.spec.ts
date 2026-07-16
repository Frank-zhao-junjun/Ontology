import { describe, expect, it } from 'vitest';
import {
  resolveProjectStatus,
  resolveObjectStatus,
  annotateObjectStatus,
  annotateArrayStatus,
} from '@/lib/skill-export/annotate-status';
import type { OntologyProject } from '@/types/ontology';

describe('skill-export/annotate-status', () => {
  describe('resolveProjectStatus', () => {
    it('returns project.status when valid', () => {
      const project = { status: 'confirmed' } as unknown as OntologyProject;
      expect(resolveProjectStatus(project)).toBe('confirmed');
    });

    it('defaults to draft when status is missing', () => {
      const project = {} as unknown as OntologyProject;
      expect(resolveProjectStatus(project)).toBe('draft');
    });

    it('defaults to draft when status is invalid', () => {
      const project = { status: 'deleted' } as unknown as OntologyProject;
      expect(resolveProjectStatus(project)).toBe('draft');
    });
  });

  describe('resolveObjectStatus', () => {
    it('returns status when valid', () => {
      expect(resolveObjectStatus({ status: 'confirmed' })).toBe('confirmed');
    });

    it('returns unknown when status is missing', () => {
      expect(resolveObjectStatus({})).toBe('unknown');
    });

    it('returns unknown when status is invalid', () => {
      expect(resolveObjectStatus({ status: 'pending' })).toBe('unknown');
    });

    it('returns unknown for null/undefined', () => {
      expect(resolveObjectStatus(null)).toBe('unknown');
      expect(resolveObjectStatus(undefined)).toBe('unknown');
    });
  });

  describe('annotateObjectStatus', () => {
    it('adds status to object', () => {
      const result = annotateObjectStatus({ id: '1', name: '物料' });
      expect(result.status).toBe('unknown');
      expect(result.id).toBe('1');
      expect(result.name).toBe('物料');
    });

    it('preserves valid status', () => {
      const result = annotateObjectStatus({ id: '1', status: 'confirmed' });
      expect(result.status).toBe('confirmed');
    });

    it('returns unknown-only object for null', () => {
      const result = annotateObjectStatus(null);
      expect(result).toEqual({ status: 'unknown' });
    });
  });

  describe('annotateArrayStatus', () => {
    it('annotates each item', () => {
      const result = annotateArrayStatus([
        { id: '1', status: 'confirmed' },
        { id: '2' },
      ]);
      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('confirmed');
      expect(result[1].status).toBe('unknown');
    });

    it('returns empty array for null/undefined', () => {
      expect(annotateArrayStatus(null)).toEqual([]);
      expect(annotateArrayStatus(undefined)).toEqual([]);
    });
  });
});
