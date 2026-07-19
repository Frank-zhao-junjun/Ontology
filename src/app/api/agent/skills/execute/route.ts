import { addEpcProcess } from '@/lib/business-chain/business-chain';
import type { SkillExportScope } from '@/lib/skill-export/types';
import { OntologyProject } from '@/types/ontology';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/agent/skills/execute
 * 执行建模操作 — Skill/MCP/CLI 的统一后端入口
 *
 * 所有操作通过 HTTP 调用内部 API 路由实现，不直接操作 store
 * （store 只在浏览器端，服务端通过 API 路由间互相调用）
 *
 * 请求体:
 * {
 *   "operation": "list_projects" | "create_project" | "list_domains" | "create_value_domain" | ...,
 *   "params": { ... }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operation, params = {} } = body;

    if (!operation) {
      return NextResponse.json(
        { success: false, error: '缺少 operation 参数' },
        { status: 400 }
      );
    }

    const base = request.nextUrl.origin;

    switch (operation) {
      // ── 项目管理 ──
      case 'list_projects': {
        const res = await fetch(`${base}/api/projects`);
        const data = await res.json();
        return NextResponse.json({ success: true, data });
      }

      case 'get_project': {
        const { projectId } = params;
        if (!projectId) return error('缺少 projectId');
        const res = await fetch(`${base}/api/projects/${projectId}`);
        const data = await res.json();
        return NextResponse.json({ success: true, data });
      }

      // ── 元数据 ──
      case 'list_metadata': {
        const res = await fetch(`${base}/api/metadata/init`);
        const data = await res.json();
        return NextResponse.json({ success: true, data });
      }

      // ── AI 建模 ──
      case 'ai_generate': {
        const { entity, domain, project, existingModels, metadataList } = params;
        if (!entity) return error('缺少 entity 参数');
        const res = await fetch(`${base}/api/generate-model`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity, domain, project, existingModels, metadataList }),
        });
        const data = await res.json();
        return NextResponse.json({ success: true, data });
      }

      case 'ai_chat': {
        const { messages } = params;
        if (!messages || !Array.isArray(messages)) return error('缺少 messages 数组');
        // 返回 SSE 流的 URL，由调用方自行 fetch
        return NextResponse.json({
          success: true,
          data: {
            endpoint: '/api/chat',
            method: 'POST',
            body: { messages },
            stream: true,
          },
        });
      }

      // ── Excel 导入导出 ──
      case 'excel_template': {
        const res = await fetch(`${base}/api/excel-template`);
        const buf = await res.arrayBuffer();
        return NextResponse.json({
          success: true,
          data: {
            size: buf.byteLength,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            endpoint: '/api/excel-template',
          },
        });
      }

      case 'export_manifest': {
        const { manifest, format = 'excel', scope = 'all', includeExamples = true, includeSemanticLayer = true, project, projectId } = params;

        // Skill ZIP: needs project data, calls /api/export/skill
        if (format === 'skill') {
          const projectData = project || (projectId ? await (async () => {
            const projRes = await fetch(`${base}/api/projects/${projectId}`);
            const projJson = await projRes.json();
            return projJson.data || projJson;
          })() : null);
          if (!projectData) return error('Skill 导出需要 project 或 projectId');
          const res = await fetch(`${base}/api/export/skill`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project: projectData, scope, includeExamples, includeSemanticLayer }),
          });
          const buf = await res.arrayBuffer();
          const filename = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'ontology-model-skill.zip';
          return NextResponse.json({
            success: true,
            data: {
              format: 'skill',
              filename,
              size: buf.byteLength,
              downloadUrl: `${base}/api/export/skill`,
              mimeType: 'application/zip',
              message: 'Use downloadUrl with POST and the same params to download the ZIP.',
            },
          });
        }

        // Markdown
        if (format === 'md') {
          const projectData = project || (projectId ? await (async () => {
            const projRes = await fetch(`${base}/api/projects/${projectId}`);
            const projJson = await projRes.json();
            return projJson.data || projJson;
          })() : null);
          if (!projectData) return error('Markdown 导出需要 project 或 projectId');
          const { buildOntologyJson } = await import('@/lib/skill-export/build-ontology-json');
          const { renderOntologyMarkdown } = await import('@/lib/skill-export/markdown-renderer');
          const onto = buildOntologyJson(projectData, {
            scope: scope as SkillExportScope, includeSemanticLayer,
            exportedAt: new Date().toISOString(),
            version: projectData.version || '1.0.0',
          });
          return NextResponse.json({
            success: true,
            data: { format: 'md', content: renderOntologyMarkdown(onto) },
          });
        }

        // JSON: return manifest as-is
        if (format === 'json') {
          if (!manifest) return error('缺少 manifest 参数');
          return NextResponse.json({
            success: true,
            data: { format: 'json', content: JSON.stringify(manifest, null, 2) },
          });
        }

        // YAML: compile manifest to YAML
        if (format === 'yaml') {
          if (!manifest) return error('缺少 manifest 参数');
          const { stringify } = await import('yaml');
          return NextResponse.json({
            success: true,
            data: { format: 'yaml', content: stringify(manifest, { lineWidth: 0 }) },
          });
        }

        // Excel (default): existing behavior
        if (!manifest) return error('缺少 manifest 参数');
        const res = await fetch(`${base}/api/export/xlsx-from-manifest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(manifest),
        });
        const buf = await res.arrayBuffer();
        return NextResponse.json({
          success: true,
          data: {
            format: 'excel',
            size: buf.byteLength,
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        });
      }

      // ── Agent Skills ──
      case 'list_skills': {
        const { type } = params;
        const url = new URL(`${base}/api/agent/skills`);
        if (type) url.searchParams.set('type', type);
        const res = await fetch(url);
        const data = await res.json();
        return NextResponse.json({ success: true, data });
      }

      case 'execute_skill': {
        const { skillType, action, skillData } = params;
        const res = await fetch(`${base}/api/agent/skills`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, type: skillType, data: skillData }),
        });
        const data = await res.json();
        return NextResponse.json({ success: true, data });
      }

      // ── HR 同步 ──
      case 'hr_sync_status': {
        const res = await fetch(`${base}/api/hr-sync/status`);
        const data = await res.json();
        return NextResponse.json({ success: true, data });
      }

      case 'hr_sync_trigger': {
        const { source } = params;
        const res = await fetch(`${base}/api/hr-sync/trigger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source }),
        });
        const data = await res.json();
        return NextResponse.json({ success: true, data });
      }

      // ── 建模操作（通过 AI chat 间接执行） ──
      case 'create_model': {
        const { description, domain, projectInfo } = params;
        if (!description) return error('缺少 description 参数');
        const messages = [
          {
            role: 'user',
            content: `请在当前项目中创建以下建模要素：${description}`,
          },
        ];
        return NextResponse.json({
          success: true,
          data: {
            endpoint: '/api/chat',
            method: 'POST',
            body: { messages },
            stream: true,
            note: 'AI 将返回 <<<ACTION>>> 块，由调用方解析并执行',
          },
        });
      }

      case 'create_epc_process': {
        const { project, parentId, name, nameEn, description, autoGenerateMetamodels } = params;
        if (!project) return error('缺少 project 参数');
        if (!parentId) return error('缺少 parentId 参数');
        if (!name) return error('缺少 name 参数');
        const updated = addEpcProcess(project as OntologyProject, parentId, {
          name,
          nameEn,
          description,
          autoGenerateMetamodels,
        });
        if (!autoGenerateMetamodels) {
          return NextResponse.json({ success: true, data: updated.project });
        }
        const epcId = updated.node.id;
        const res = await fetch(`${base}/api/epc-processes/auto-generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project: updated.project, epcId }),
        });
        const autoData = await res.json();
        if (!autoData.success) {
          return NextResponse.json({ success: false, error: autoData.error || '自动生成元模型失败', data: updated });
        }
        return NextResponse.json({ success: true, data: autoData.data });
      }

      case 'confirm_epc_metamodels': {
        const project = body.params?.project as OntologyProject | undefined;
        const epcId = body.params?.epcId as string | undefined;
        if (!project) return NextResponse.json({ success: false, error: '缺少 project 参数' });
        if (!epcId) return NextResponse.json({ success: false, error: '缺少 epcId 参数' });
        const base = process.env.COZE_PROJECT_DOMAIN_DEFAULT || `http://localhost:${process.env.DEPLOY_RUN_PORT || 5000}`;
        const res = await fetch(`${base}/api/epc-processes/auto-generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project, epcId, trigger: 'confirm' }),
        });
        const autoData = await res.json();
        if (!autoData.success) {
          return NextResponse.json({ success: false, error: autoData.error || '确认后生成元模型失败' });
        }
        return NextResponse.json({ success: true, data: autoData.data });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `未知操作: ${operation}`,
            available: [
              'list_projects', 'get_project', 'list_metadata',
              'ai_generate', 'ai_chat', 'create_model', 'create_epc_process',
              'confirm_epc_metamodels',
              'excel_template', 'export_manifest',
              'list_skills', 'execute_skill',
              'hr_sync_status', 'hr_sync_trigger',
            ],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Skill execute error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '执行失败' },
      { status: 500 }
    );
  }
}

function error(msg: string) {
  return NextResponse.json({ success: false, error: msg }, { status: 400 });
}

/**
 * GET /api/agent/skills/execute
 * 返回所有可用操作列表
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    operations: [
      { name: 'list_projects', desc: '列出所有项目', params: {} },
      { name: 'get_project', desc: '获取项目详情', params: { projectId: 'string' } },
      { name: 'list_metadata', desc: '获取元数据列表', params: {} },
      { name: 'ai_generate', desc: 'AI生成模型建议', params: { entity: 'object', domain: 'object', project: 'object', existingModels: 'object', metadataList: 'array' } },
      { name: 'ai_chat', desc: 'AI对话（SSE流式）', params: { messages: 'array' } },
      { name: 'create_model', desc: '通过AI创建建模要素', params: { description: 'string', domain: 'object', projectInfo: 'object' } },
      { name: 'create_epc_process', desc: '创建EPC流程并可自动生成8个元模型', params: { project: 'object', parentId: 'string', name: 'string', nameEn: 'string?', description: 'string?', autoGenerateMetamodels: 'boolean?' } },
      { name: 'confirm_epc_metamodels', desc: 'EPC确认后从流程步骤提取元数据，AI生成8维元模型', params: { project: 'object', epcId: 'string' } },
      { name: 'excel_template', desc: '获取Excel模板', params: {} },
      { name: 'export_manifest', desc: '导出Manifest为Excel', params: { manifest: 'object' } },
      { name: 'list_skills', desc: '列出Agent技能', params: { type: 'string?' } },
      { name: 'execute_skill', desc: '执行Agent技能', params: { skillType: 'string', action: 'string', skillData: 'object' } },
      { name: 'hr_sync_status', desc: 'HR同步状态', params: {} },
      { name: 'hr_sync_trigger', desc: '触发HR同步', params: { source: 'string' } },
    ],
  });
}
