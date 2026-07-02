/**
 * buildSkillZip 集成测试 — 完整的 ZIP 生成链路
 */
import { describe, expect, it } from 'vitest';
import JSZip from 'jszip';
import { buildSkillZip, buildSkillExportFilename } from '@/lib/skill-export/index';
import type { SkillExportScope } from '@/lib/skill-export/types';
import { createFrozenProject, createMockProject } from './test-helpers';

async function readZip(buffer: Buffer): Promise<Record<string, string>> {
  const zip = await JSZip.loadAsync(buffer);
  const files: Record<string, string> = {};
  for (const [name, file] of Object.entries(zip.files)) {
    if (!file.dir) files[name] = await file.async('string');
  }
  return files;
}

describe('buildSkillZip', () => {
  it('生成完整 ZIP 含 7 个文件', async () => {
    const project = createFrozenProject('1.0.0');
    const { buffer, filename, projectStatus } = await buildSkillZip(project, {
      scope: 'all',
      includeExamples: true,
      includeSemanticLayer: true,
    });

    expect(filename).toMatch(/\.zip$/);
    expect(projectStatus).toBe('draft');

    const files = await readZip(buffer);
    expect(Object.keys(files)).toHaveLength(7);
    expect(files['skill.json']).toBeDefined();
    expect(files['SKILL.md']).toBeDefined();
    expect(files['README.md']).toBeDefined();
    expect(files['ontology.json']).toBeDefined();
    expect(files['intents.json']).toBeDefined();
    expect(files['examples/query-examples.md']).toBeDefined();
    expect(files['examples/reasoning-examples.md']).toBeDefined();
  });

  it('includeExamples=false 生成 5 个文件', async () => {
    const project = createFrozenProject('1.0.0');
    const { buffer } = await buildSkillZip(project, {
      scope: 'all',
      includeExamples: false,
      includeSemanticLayer: true,
    });

    const files = await readZip(buffer);
    expect(Object.keys(files)).toHaveLength(5);
    expect(files['examples/query-examples.md']).toBeUndefined();
    expect(files['examples/reasoning-examples.md']).toBeUndefined();
  });

  it('scope=data 仅包含 dataModel', async () => {
    const project = createFrozenProject('1.0.0');
    const { buffer } = await buildSkillZip(project, {
      scope: 'data',
      includeExamples: false,
      includeSemanticLayer: false,
    });

    const files = await readZip(buffer);
    const onto = JSON.parse(files['ontology.json']);
    expect(onto.dataModel).toBeDefined();
    expect(onto.behaviorModel).toBeUndefined();
    expect(onto.ruleModel).toBeUndefined();
  });

  it('空数据模型抛出 EMPTY_SCOPE', async () => {
    const emptyProject = createMockProject({
      dataModel: null, behaviorModel: null, ruleModel: null, processModel: null, eventModel: null,
    });
    await expect(buildSkillZip(emptyProject, { scope: 'all' })).rejects.toThrow('EMPTY_SCOPE');
  });

  it('所有 scope 值均有效', async () => {
    const project = createFrozenProject('1.0.0');
    const scopes: SkillExportScope[] = ['all', 'data', 'behavior', 'rule', 'process', 'event'];
    for (const scope of scopes) {
      if (scope === 'process') {
        // processModel is null in frozen project, expect EMPTY_SCOPE
        await expect(buildSkillZip(project, { scope, includeExamples: false })).rejects.toThrow('EMPTY_SCOPE');
      } else {
        const result = await buildSkillZip(project, { scope, includeExamples: false });
        expect(result.buffer).toBeInstanceOf(Buffer);
      }
    }
  });

  it('skill.json 内容可解析', async () => {
    const project = createFrozenProject('1.0.0');
    const { buffer } = await buildSkillZip(project, { scope: 'all', includeExamples: true, includeSemanticLayer: true });

    const files = await readZip(buffer);
    const skill = JSON.parse(files['skill.json']);
    expect(skill.format.type).toBe('ontology-model-skill');
    expect(skill.capabilities).toHaveLength(5);
    expect(skill.source.projectId).toBe(project.id);
  });

  it('intents.json 含实体生成的意图', async () => {
    const project = createFrozenProject('1.0.0');
    const { buffer } = await buildSkillZip(project, { scope: 'all', includeExamples: true, includeSemanticLayer: true });

    const files = await readZip(buffer);
    const intents = JSON.parse(files['intents.json']);
    expect(intents.intents.length).toBeGreaterThan(0);
    // 合同 + 合同条款 = 2 entities × 2 intents = 4
    expect(intents.intents.length).toBeGreaterThanOrEqual(4);
  });

  it('SKILL.md 含领域与状态信息', async () => {
    const project = createFrozenProject('1.0.0');
    const { buffer } = await buildSkillZip(project, { scope: 'all', includeExamples: true, includeSemanticLayer: true });

    const files = await readZip(buffer);
    expect(files['SKILL.md']).toContain('合同管理');
    expect(files['SKILL.md']).toContain('draft');
    expect(files['SKILL.md']).toContain('confirmed');
  });

  it('README.md 含项目名称', async () => {
    const project = createFrozenProject('1.0.0');
    const { buffer } = await buildSkillZip(project, { scope: 'all', includeExamples: true, includeSemanticLayer: true });

    const files = await readZip(buffer);
    expect(files['README.md']).toContain('合同管理系统');
  });
});

describe('buildSkillExportFilename', () => {
  it('生成含项目名和版本的文件名', () => {
    const project = createFrozenProject('1.0.0');
    const name = buildSkillExportFilename(project, '2.0.0');
    expect(name).toContain('ontology-model-skill');
    expect(name).toContain('合同管理系统');
    expect(name).toContain('v2.0.0');
    expect(name).toMatch(/\.zip$/);
  });

  it('version 无 v 前缀时自动添加', () => {
    const project = createFrozenProject('1.0.0');
    const name = buildSkillExportFilename(project, '1.0.0');
    expect(name).toContain('v1.0.0');
  });

  it('version 已有 v 前缀时不重复添加', () => {
    const project = createFrozenProject('1.0.0');
    const name = buildSkillExportFilename(project, 'v3.0.0');
    expect(name).toContain('v3.0.0');
    expect(name).not.toContain('vv');
  });
});
