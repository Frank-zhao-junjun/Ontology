import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import type { ProjectVersion } from '@/types/ontology';
import { createFrozenProject } from '../../../../tests/unit/test-helpers';

function createVersion(version = '1.0.0'): ProjectVersion {
  const project = createFrozenProject(version);

  return {
    id: 'version-1',
    projectId: project.id,
    version,
    name: `版本 ${version}`,
    description: '测试版本',
    metamodels: {
      data: project.dataModel,
      behavior: project.behaviorModel,
      rules: project.ruleModel,
      process: project.processModel,
      events: project.eventModel,
      epc: project.epcModel,
    },
    createdAt: '2026-04-02T00:00:00.000Z',
    status: 'draft',
  };
}

describe('Codegen Route', () => {
  it('GET 应返回生成器能力说明', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.name).toBe('Ontology Code Generator');
    expect(payload.capabilities).toContain('flask-backend');
    expect(payload.capabilities).toContain('react-frontend');
  });

  it('POST 缺少 version 时应返回 404', async () => {
    const request = new NextRequest('http://localhost/api/codegen', {
      method: 'POST',
      body: JSON.stringify({
        projectName: '合同管理系统',
        config: {
          target: 'download',
          includeData: false,
          aiAgentEnabled: true,
          dockerCompose: true,
        },
      }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error).toBe('Version not found');
  });

  it('POST 应返回完整代码包和 downloadUrl', async () => {
    const version = createVersion('1.2.3');
    const request = new NextRequest('http://localhost/api/codegen', {
      method: 'POST',
      body: JSON.stringify({
        versionId: version.id,
        version,
        projectName: '合同管理系统',
        config: {
          target: 'download',
          includeData: false,
          aiAgentEnabled: true,
          dockerCompose: true,
        },
      }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.downloadUrl).toMatch(/^data:application\/json;base64,/);
    expect(payload.package.version).toBe('1.2.3');

    const filePaths = payload.package.files.map((file: { path: string }) => file.path);
    expect(filePaths).toContain('backend/app.py');
    expect(filePaths).toContain('frontend/src/App.tsx');
    expect(filePaths).toContain('docker-compose.yml');
  });
});