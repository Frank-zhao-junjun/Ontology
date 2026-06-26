import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/hr-sync/config', () => HttpResponse.json({ enabled: true, syncInterval: 3600 })),
  http.post('/api/hr-sync/trigger', () => HttpResponse.json({ status: 'started', jobId: 'mock-job-001' })),
  http.get('/api/hr-sync/history', () => HttpResponse.json({
    records: [
      { id: 'h1', timestamp: '2026-06-26T10:00:00Z', status: 'success', recordsSynced: 42 },
      { id: 'h2', timestamp: '2026-06-25T10:00:00Z', status: 'failed', error: 'Connection timeout' },
    ],
  })),
  http.post('/api/hr-sync/resolve', () => HttpResponse.json({ status: 'resolved' })),
  http.get('/api/agent/skills', () => HttpResponse.json({
    skills: [
      { id: 'sk-1', name: 'DataModel Query', enabled: true },
      { id: 'sk-2', name: 'EPC Linter', enabled: true },
      { id: 'sk-3', name: 'Document Generator', enabled: false },
    ],
  })),
  http.post('/api/agent/skills', async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({ id: 'sk-new', ...body, enabled: true }, { status: 201 });
  }),
  http.delete('/api/agent/skills/:id', () => new HttpResponse(null, { status: 204 })),
  http.post('/api/excel-import', () => HttpResponse.json({ status: 'success', imported: { entities: 15, relations: 8 } })),
];
