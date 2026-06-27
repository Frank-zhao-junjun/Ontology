import type { OntologyProject, ReferenceDocument } from '@/types/ontology';

export type ReferenceDocumentSummary = Pick<
  ReferenceDocument,
  'id' | 'fileName' | 'fileType' | 'title' | 'summary' | 'textLength' | 'parseStatus' | 'uploadedAt'
>;

export function buildReferenceDocumentSummaries(
  project: OntologyProject,
): ReferenceDocumentSummary[] {
  return (project.referenceDocuments ?? []).map((doc) => ({
    id: doc.id,
    fileName: doc.fileName,
    fileType: doc.fileType,
    title: doc.title,
    summary: doc.summary,
    textLength: doc.textLength,
    parseStatus: doc.parseStatus,
    uploadedAt: doc.uploadedAt,
  }));
}

export function runGetReferenceDocuments(project: OntologyProject): string {
  return JSON.stringify(buildReferenceDocumentSummaries(project));
}
