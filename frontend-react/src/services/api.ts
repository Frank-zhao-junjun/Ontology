import axios from 'axios';

/* ── response type interfaces ── */
export interface DomainData { id: number; name: string; description: string; tags?: string; created_at?: string; }
export interface EntityData { id: number; name: string; domain_id: number; subDomain?: string; scenario?: string; content: unknown; }
export interface ModelDefinition { id: number; model_type: string; name: string; version: string; content: unknown; status: string; created_at: string; }
export interface TreeNode { key: string; title: string; children?: TreeNode[]; data?: { dimsConfirmed: number }; }

/* grouped-entity response (used by RightSidebar) */
export interface GroupedEntity { id: number; name: string; dimsConfirmed: number; }
export interface GroupedScenario { name: string; entities: GroupedEntity[]; }
export interface GroupedSubDomain { name: string; scenarios: GroupedScenario[]; }
export interface GroupedDomain { domainId: number; domainName: string; subDomains: GroupedSubDomain[]; }

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});

/* ── typed API functions ── */
export const login = (u: string, p: string) =>
  api.post<{ token: string }>('/auth/login', { username: u, password: p });

export const chatExecute = (msg: string, sid: string, dim?: string) =>
  api.post<{ reply: string }>('/chat/execute', { message: msg, session_id: sid, dimension: dim });

export const getMetaModels = () =>
  api.get<{ models?: ModelDefinition[]; items?: ModelDefinition[]; definitions?: ModelDefinition[] }>('/meta-models/definitions');

export const createMetaModel = (mt: string, name: string, content: object) =>
  api.post<ModelDefinition>('/meta-models/definitions', { model_type: mt, name, version: '1.0.0', content });

export const publishRelease = (rno: string, ids: number[], op: string) =>
  api.post<{ release_id: number; status: string }>('/meta-models/publish', { release_no: rno, model_ids: ids, operator: op });

export const getDomains = () =>
  api.get<{ items: DomainData[] }>('/domains');

export const createDomain = (name: string, description: string) =>
  api.post<DomainData>('/domains', { name, description });

export const getEntitiesGrouped = () =>
  api.get<GroupedDomain[]>('/entities/grouped');

export const getVersions = () =>
  api.get('/versions');

export const getVersionDiff = (from: string, to: string) =>
  api.get('/versions/diff', { params: { from, to } });

export const exportJson = (rno: string) =>
  api.get<Record<string, unknown>>('/export/json/' + rno);

export default api;
