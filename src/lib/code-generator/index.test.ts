import { describe, expect, it } from 'vitest';
import { generateCodePackage } from './index';
import type { ProjectVersion } from '@/types/ontology';
import { createFrozenProject } from '../../../tests/unit/test-helpers';

function createVersion(version = '1.0.0'): ProjectVersion {
  const project = createFrozenProject(version);

  return {
    id: `version-${version}`,
    projectId: project.id,
    version,
    name: `版本 ${version}`,
    description: '代码生成器测试快照',
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

function pickFile(files: { path: string; content: string; language: string }[], path: string) {
  const file = files.find((item) => item.path === path);
  expect(file).toBeDefined();
  return file!;
}

describe('Code Generator Structure', () => {
  it('启用 docker 与 AI 时应生成完整包结构', () => {
    const codePackage = generateCodePackage(
      createVersion('2.0.0'),
      {
        target: 'download',
        includeData: false,
        aiAgentEnabled: true,
        dockerCompose: true,
      },
      '合同管理系统'
    );

    const filePaths = codePackage.files.map((file) => file.path).sort();

    expect(codePackage.version).toBe('2.0.0');
    expect(filePaths).toEqual(expect.arrayContaining([
      'docker-compose.yml',
      'backend/app.py',
      'backend/api/entities.py',
      'backend/ai/orchestrator.py',
      'backend/requirements.txt',
      'frontend/package.json',
      'frontend/src/App.tsx',
      'frontend/src/components/chat/ChatInterface.tsx',
      'README.md',
    ]));
    expect(filePaths.length).toBeGreaterThan(20);

    const backendApp = pickFile(codePackage.files, 'backend/app.py').content;
    const frontendPackage = JSON.parse(pickFile(codePackage.files, 'frontend/package.json').content);
    const readme = pickFile(codePackage.files, 'README.md').content;

    expect(backendApp).toContain("app.register_blueprint(entities_bp, url_prefix='/api/entities')");
    expect(frontendPackage).toMatchObject({
      name: '合同管理系统',
      scripts: expect.objectContaining({ dev: 'vite', build: 'tsc && vite build' }),
    });
    expect(readme).toContain('合同管理系统');
    expect(readme).toContain('# Start with Docker Compose');
    expect(readme).toContain('docker-compose up -d');
  });

  it('关闭 docker 与 AI 时应裁剪可选生成物并保持核心文件稳定', () => {
    const codePackage = generateCodePackage(
      createVersion('2.1.0'),
      {
        target: 'download',
        includeData: false,
        aiAgentEnabled: false,
        dockerCompose: false,
      },
      '合同管理系统'
    );

    const filePaths = codePackage.files.map((file) => file.path);

    expect(filePaths).not.toContain('docker-compose.yml');
    expect(filePaths).not.toContain('backend/ai/orchestrator.py');
    expect(filePaths).not.toContain('backend/ai/tool_executor.py');
    expect(filePaths).toContain('backend/app.py');
    expect(filePaths).toContain('frontend/src/App.tsx');
    expect(filePaths).toContain('backend/state_machine/engine.py');

    const entityApi = pickFile(codePackage.files, 'frontend/src/services/entityApi.ts').content;
    const backendRulesApi = pickFile(codePackage.files, 'backend/api/rules.py').content;
    const ruleEvaluator = pickFile(codePackage.files, 'backend/rules/evaluator.py').content;

    expect(entityApi).toContain('export const entityApi');
    expect(entityApi).toContain("baseURL: '/api'");
    expect(entityApi).toContain('`/entities/${entityType}`');
    expect(backendRulesApi).toContain("@rules_bp.route('/validate'");
    expect(ruleEvaluator).toContain('class RuleEvaluator');
  });
});