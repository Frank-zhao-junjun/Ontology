import { describe, expect, it } from 'vitest';
import { runGetReferenceDocuments } from '@/lib/copilot/actions/get-reference-documents';
import { createMockProject } from '../test-helpers';
import type { OntologyProject } from '@/types/ontology';

describe('runGetReferenceDocuments', () => {
  it('returns uploaded document summaries', () => {
    const project = createMockProject({
      referenceDocuments: [
        {
          id: 'doc-1',
          fileName: 'sop.txt',
          fileType: 'txt',
          fileSize: 120,
          uploadedAt: '2026-06-18T12:00:00.000Z',
          extractedText: '流程说明',
          textLength: 4,
          parseStatus: 'success',
          title: 'SOP',
          summary: '标准作业',
        },
      ],
    } as Partial<OntologyProject>);

    const result = JSON.parse(runGetReferenceDocuments(project));

    expect(result).toHaveLength(1);
    expect(result[0].fileName).toBe('sop.txt');
    expect(result[0].summary).toBe('标准作业');
  });
});
