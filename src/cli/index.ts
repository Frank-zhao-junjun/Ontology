#!/usr/bin/env node
/**
 * Ontology CLI — 本体建模命令行工具
 *
 * 用法:
 *   pnpm ontology <command> [options]
 *   npx ontology-cli <command> [options]
 *
 * 命令:
 *   projects            列出所有项目
 *   project <id>        查看项目详情
 *   metadata            列出元数据字段
 *   generate <名称>     AI生成模型建议
 *   export <id>         导出项目JSON
 *   import <file>       导入Excel文件
 *   template            下载Excel模板
 *   chat [消息]         AI对话（SSE流式）
 *   skills [type]       列出Agent技能
 *   chain-add <项目ID>  创建业务链节点（支持EPC自动元模型）
 *   chain-add <项目ID>  创建业务链节点（支持EPC自动元模型）
 *   sync <source>       触发HR同步
 *   interactive         交互式菜单模式
 *   help                显示帮助
 */

const API_BASE = process.env.ONTOLOGY_API_BASE || 'https://Ontology1.coze.site';

// ── Colors (no external deps) ──
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m',
};

function info(msg: string) { console.log(`${c.cyan}i${c.reset} ${msg}`); }
function success(msg: string) { console.log(`${c.green}\u2713${c.reset} ${msg}`); }
function error(msg: string) { console.error(`${c.red}\u2717${c.reset} ${msg}`); }
function warn(msg: string) { console.log(`${c.yellow}!${c.reset} ${msg}`); }

// ── HTTP helper ──
async function api(path: string, options: RequestInit = {}): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { success: false, error: text, status: res.status };
    }
  } catch {
    error(`\u65e0\u6cd5\u8fde\u63a5\u5230 ${API_BASE}\uff0c\u8bf7\u786e\u4fdd\u670d\u52a1\u5df2\u542f\u52a8`);
    process.exit(1);
  }
}

// ── Commands ──

async function cmdProjects() {
  info('\u6b63\u5728\u83b7\u53d6\u9879\u76ee\u5217\u8868...');
  const data = await api('/api/projects');
  if (data.success !== false && data.data) {
    const projects = Array.isArray(data.data) ? data.data : (data.data.projects || []);
    if (projects.length === 0) {
      console.log(`${c.gray}\u6682\u65e0\u9879\u76ee${c.reset}`);
      return;
    }
    console.log(`\n${c.bold}\u9879\u76ee\u5217\u8868 (${projects.length})${c.reset}\n`);
    console.log(`${c.dim}ID                       \u540d\u79f0                 \u9886\u57df             \u5b9e\u4f53\u6570${c.reset}`);
    console.log(`${c.dim}\u2500`.repeat(80) + c.reset);
    for (const p of projects) {
      const id = (p.id || '').padEnd(24);
      const name = (p.name || '').padEnd(20);
      const domain = (p.domain?.name || p.domain || '').padEnd(16);
      const count = String(p.entities?.length || 0).padStart(4);
      console.log(`${id} ${name} ${domain} ${count}`);
    }
    console.log();
  } else {
    error(data.error || '\u83b7\u53d6\u5931\u8d25');
  }
}

async function cmdProject(id: string) {
  if (!id) { error('\u8bf7\u63d0\u4f9b\u9879\u76eeID'); return; }
  info(`\u6b63\u5728\u83b7\u53d6\u9879\u76ee ${id} ...`);
  const data = await api(`/api/projects/${id}`);
  if (data.success !== false) {
    const p = data.data || data;
    console.log(`\n${c.bold}${c.cyan}${p.name || '\u672a\u547d\u540d'}${c.reset}`);
    console.log(`${c.dim}ID: ${p.id}${c.reset}`);
    console.log(`${c.dim}\u9886\u57df: ${p.domain?.name || p.domain || '-'}${c.reset}`);
    console.log(`${c.dim}\u63cf\u8ff0: ${p.description || '-'}${c.reset}`);
    if (p.entities?.length) {
      console.log(`\n${c.bold}\u5b9e\u4f53 (${p.entities.length})${c.reset}`);
      for (const e of p.entities) {
        console.log(`  ${c.green}\u25cf${c.reset} ${e.name} (${e.nameEn || '-'}) [${e.role || 'entity'}]`);
        if (e.attributes?.length) {
          console.log(`    ${c.dim}\u5c5e\u6027: ${e.attributes.map((a: any) => a.name).join(', ')}${c.reset}`);
        }
      }
    }
    console.log();
  } else {
    error(data.error || '\u9879\u76ee\u4e0d\u5b58\u5728');
  }
}

async function cmdMetadata() {
  info('\u6b63\u5728\u83b7\u53d6\u5143\u6570\u636e\u5217\u8868...');
  const data = await api('/api/metadata/init');
  if (data.success && data.data) {
    const list = data.data;
    console.log(`\n${c.bold}\u6807\u51c6\u5143\u6570\u636e\u5b57\u6bb5 (${list.length})${c.reset}\n`);
    console.log(`${c.dim}\u540d\u79f0                     \u82f1\u6587\u540d                 \u7c7b\u578b       \u6570\u636e\u6765\u6e90${c.reset}`);
    console.log(`${c.dim}\u2500`.repeat(80) + c.reset);
    for (const m of list) {
      const name = (m.name || '').padEnd(24);
      const nameEn = (m.nameEn || '').padEnd(22);
      const type = (m.type || '').padEnd(10);
      const source = m.source || '-';
      console.log(`${name} ${nameEn} ${type} ${source}`);
    }
    console.log();
  } else {
    error(data.error || '\u83b7\u53d6\u5931\u8d25');
  }
}

async function cmdGenerate(args: string[]) {
  const entityName = args[0];
  if (!entityName) {
    error('\u7528\u6cd5: generate <\u5b9e\u4f53\u540d\u79f0> [\u5b9e\u4f53\u82f1\u6587\u540d]');
    return;
  }
  const nameEn = args[1] || entityName.replace(/[^\x00-\x7F]/g, '').trim() || 'Entity';
  info(`\u6b63\u5728\u4e3a\u5b9e\u4f53 "${entityName}" \u751f\u6210\u6a21\u578b\u5efa\u8bae...`);
  const data = await api('/api/generate-model', {
    method: 'POST',
    body: JSON.stringify({
      entity: { name: entityName, nameEn, description: `${entityName}\u5b9e\u4f53` },
      domain: { name: '\u901a\u7528' },
    }),
  });
  if (data.success && data.data) {
    const d = data.data;
    success('\u6a21\u578b\u5efa\u8bae\u751f\u6210\u5b8c\u6210\uff01\n');
    if (d.dataModel?.suggestedAttributes?.length) {
      console.log(`${c.bold}\u6570\u636e\u6a21\u578b - \u5efa\u8bae\u5c5e\u6027${c.reset}`);
      for (const a of d.dataModel.suggestedAttributes) {
        console.log(`  ${c.green}\u25cf${c.reset} ${a.name} (${a.dataType || a.type || 'string'}) - ${a.description || ''}`);
      }
      console.log();
    }
    if (d.behaviorModel?.states?.length) {
      console.log(`${c.bold}\u884c\u4e3a\u6a21\u578b - \u72b6\u6001${c.reset}`);
      for (const s of d.behaviorModel.states) {
        const flag = s.isInitial ? ' [\u521d\u59cb]' : s.isFinal ? ' [\u7ec8\u6b62]' : '';
        console.log(`  ${c.yellow}\u25cf${c.reset} ${s.name}${flag}`);
      }
      console.log();
    }
    if (d.ruleModel?.rules?.length) {
      console.log(`${c.bold}\u89c4\u5219\u6a21\u578b${c.reset}`);
      for (const r of d.ruleModel.rules) {
        console.log(`  ${c.red}\u25cf${c.reset} [${r.severity || 'error'}] ${r.name}: ${r.description || ''}`);
      }
      console.log();
    }
    if (d.processModel?.steps?.length) {
      console.log(`${c.bold}\u6d41\u7a0b\u6a21\u578b - \u6b65\u9aa4${c.reset}`);
      for (const s of d.processModel.steps) {
        console.log(`  ${c.blue}\u25cf${c.reset} ${s.name} (${s.type || 'step'})`);
      }
      console.log();
    }
    if (d.eventModel?.events?.length) {
      console.log(`${c.bold}\u4e8b\u4ef6\u6a21\u578b${c.reset}`);
      for (const e of d.eventModel.events) {
        console.log(`  ${c.cyan}\u25cf${c.reset} ${e.name} [${e.trigger || 'trigger'}]`);
      }
      console.log();
    }
  } else {
    error(data.error || '\u751f\u6210\u5931\u8d25');
  }
}

async function cmdExport(args: string[]) {
  const projectId = args[0];
  if (!projectId) {
    error('\u7528\u6cd5: export <\u9879\u76eeID> [\u8f93\u51fa\u6587\u4ef6\u8def\u5f84]');
    console.log(`${c.dim}\u5148\u8fd0\u884c "pnpm ontology projects" \u67e5\u770b\u9879\u76eeID${c.reset}`);
    return;
  }
  const outputPath = args[1] || `project-${projectId}-${Date.now()}.json`;
  info(`\u6b63\u5728\u5bfc\u51fa\u9879\u76ee ${projectId} ...`);
  const data = await api(`/api/projects/${projectId}`);
  if (data.success !== false && (data.data || data)) {
    const projectData = data.data || data;
    const fs = await import('fs');
    const json = JSON.stringify(projectData, null, 2);
    fs.writeFileSync(outputPath, json, 'utf-8');
    success(`\u9879\u76ee\u5df2\u5bfc\u51fa: ${outputPath} (${(json.length / 1024).toFixed(1)} KB)`);
  } else {
    error(data.error || '\u5bfc\u51fa\u5931\u8d25');
  }
}

async function cmdImport(args: string[]) {
  const filePath = args[0];
  if (!filePath) {
    error('\u7528\u6cd5: import <Excel\u6587\u4ef6\u8def\u5f84>');
    console.log(`${c.dim}\u5148\u8fd0\u884c "pnpm ontology template" \u4e0b\u8f7d\u6a21\u677f${c.reset}`);
    return;
  }
  const fs = await import('fs');
  if (!fs.existsSync(filePath)) {
    error(`\u6587\u4ef6\u4e0d\u5b58\u5728: ${filePath}`);
    return;
  }
  const stat = fs.statSync(filePath);
  if (stat.size > 5 * 1024 * 1024) {
    error('\u6587\u4ef6\u8d85\u8fc7 5MB \u4e0a\u9650');
    return;
  }
  info(`\u6b63\u5728\u5bfc\u5165 ${filePath} (${(stat.size / 1024).toFixed(1)} KB) ...`);

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);
    const formData = new FormData();
    formData.append('file', blob, filePath.split('/').pop() || 'upload.xlsx');

    const res = await fetch(`${API_BASE}/api/excel-import`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (data.success) {
      success('Excel \u5bfc\u5165\u6210\u529f\uff01\n');
      const v = data.validation;
      if (v) {
        console.log(`${c.bold}\u6821\u9a8c\u7ed3\u679c${c.reset}`);
        console.log(`  ${c.green}\u25cf${c.reset} \u603b\u884c\u6570: ${v.totalRows}`);
        console.log(`  ${c.green}\u25cf${c.reset} \u6709\u6548\u884c: ${v.validRows}`);
        console.log(`  ${v.errorCount > 0 ? c.red : c.green}\u25cf${c.reset} \u9519\u8bef\u6570: ${v.errorCount}`);
      }
      if (data.versionId) {
        console.log(`\n${c.bold}\u7248\u672c${c.reset}`);
        console.log(`  ${c.cyan}\u25cf${c.reset} ID: ${data.versionId}`);
        console.log(`  ${c.cyan}\u25cf${c.reset} \u540d\u79f0: ${data.versionName || '-'}`);
        console.log(`  ${c.yellow}!${c.reset} \u7248\u672c\u5904\u4e8e\u5f85\u5ba1\u6838\u72b6\u6001\uff0c\u8bf7\u5728 Web UI \u4e2d\u5ba1\u6838\u540e\u751f\u6548`);
      }
      if (data.parsedData) {
        const p = data.parsedData;
        console.log(`\n${c.bold}\u89e3\u6790\u6570\u636e${c.reset}`);
        if (p.entities?.length) console.log(`  ${c.green}\u25cf${c.reset} \u5b9e\u4f53: ${p.entities.length}`);
        if (p.attributes?.length) console.log(`  ${c.green}\u25cf${c.reset} \u5c5e\u6027: ${p.attributes.length}`);
        if (p.relations?.length) console.log(`  ${c.green}\u25cf${c.reset} \u5173\u7cfb: ${p.relations.length}`);
        if (p.stateMachines?.length) console.log(`  ${c.green}\u25cf${c.reset} \u72b6\u6001\u673a: ${p.stateMachines.length}`);
        if (p.rules?.length) console.log(`  ${c.green}\u25cf${c.reset} \u89c4\u5219: ${p.rules.length}`);
        if (p.eventDefinitions?.length) console.log(`  ${c.green}\u25cf${c.reset} \u4e8b\u4ef6: ${p.eventDefinitions.length}`);
        if (p.departments?.length) console.log(`  ${c.green}\u25cf${c.reset} \u90e8\u95e8: ${p.departments.length}`);
        if (p.positions?.length) console.log(`  ${c.green}\u25cf${c.reset} \u5c97\u4f4d: ${p.positions.length}`);
      }
      if (v?.errors?.length) {
        console.log(`\n${c.bold}${c.red}\u9519\u8bef\u5217\u8868${c.reset}`);
        for (const e of v.errors) {
          console.log(`  ${c.red}\u25cf${c.reset} ${e}`);
        }
      }
      console.log();
    } else {
      error(data.error || '\u5bfc\u5165\u5931\u8d25');
      if (data.validation?.errors?.length) {
        for (const e of data.validation.errors) {
          console.log(`  ${c.red}\u25cf${c.reset} ${e}`);
        }
      }
    }
  } catch (e) {
    error(`\u5bfc\u5165\u5931\u8d25: ${e instanceof Error ? e.message : '\u672a\u77e5\u9519\u8bef'}`);
  }
}

async function cmdChat(args: string[]) {
  const message = args.join(' ').trim();
  if (!message) {
    error('\u7528\u6cd5: chat <\u6d88\u606f\u5185\u5bb9>');
    console.log(`${c.dim}\u793a\u4f8b: pnpm ontology chat "\u5e2e\u6211\u521b\u5efa\u4e00\u4e2a\u751f\u4ea7\u7ba1\u7406\u4ef7\u503c\u57df"${c.reset}`);
    return;
  }

  info(`\u6b63\u5728\u53d1\u9001\u6d88\u606f\u7ed9 AI ...`);
  console.log(`${c.dim}\u2500`.repeat(60) + c.reset);

  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: message }],
      }),
    });

    if (!res.ok) {
      error(`AI \u5bf9\u8bdd\u5931\u8d25: HTTP ${res.status}`);
      const text = await res.text();
      console.log(`${c.dim}${text.slice(0, 200)}${c.reset}`);
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      error('\u65e0\u6cd5\u8bfb\u53d6\u54cd\u5e94\u6d41');
      return;
    }

    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.content) {
              const text = parsed.content;
              if (!text.includes('<<<ACTION>>>') && !text.includes('<<<END_ACTION>>>')) {
                process.stdout.write(text);
                fullContent += text;
              }
            }
          } catch {
            // skip non-JSON lines
          }
        }
      }
    }

    console.log(`\n${c.dim}\u2500`.repeat(60) + c.reset);

    // Check for ACTION blocks
    const actionMatches = fullContent.match(/<<<ACTION>>>([\s\S]*?)<<<END_ACTION>>>/g);
    if (actionMatches) {
      console.log(`\n${c.bold}${c.green}\u2713 AI \u751f\u6210\u4e86 ${actionMatches.length} \u4e2a\u5efa\u6a21\u52a8\u4f5c${c.reset}`);
      for (const match of actionMatches) {
        try {
          const jsonStr = match.replace('<<<ACTION>>>', '').replace('<<<END_ACTION>>>', '').trim();
          const action = JSON.parse(jsonStr);
          console.log(`  ${c.cyan}\u25cf${c.reset} ${action.type}: ${action.name || action.description || '-'}`);
        } catch {
          // skip parse errors
        }
      }
      console.log(`${c.dim}\u52a8\u4f5c\u5df2\u4ea4\u7531\u524d\u7aef\u6267\u884c\uff0c\u8bf7\u5728 Web UI \u4e2d\u67e5\u770b${c.reset}`);
    }

    console.log();
  } catch (e) {
    error(`\u5bf9\u8bdd\u5931\u8d25: ${e instanceof Error ? e.message : '\u672a\u77e5\u9519\u8bef'}`);
  }
}

async function cmdTemplate() {
  info('\u6b63\u5728\u4e0b\u8f7dExcel\u6a21\u677f...');
  try {
    const res = await fetch(`${API_BASE}/api/excel-template`);
    if (!res.ok) { error(`\u4e0b\u8f7d\u5931\u8d25: HTTP ${res.status}`); return; }
    const buf = Buffer.from(await res.arrayBuffer());
    const filename = `ontology-template-${Date.now()}.xlsx`;
    const fs = await import('fs');
    fs.writeFileSync(filename, buf);
    success(`\u6a21\u677f\u5df2\u4fdd\u5b58: ${filename} (${(buf.length / 1024).toFixed(1)} KB)`);
  } catch (e) {
    error(`\u4e0b\u8f7d\u5931\u8d25: ${e instanceof Error ? e.message : '\u672a\u77e5\u9519\u8bef'}`);
  }
}

async function cmdSkills(type?: string) {
  info('\u6b63\u5728\u83b7\u53d6\u6280\u80fd\u5217\u8868...');
  const query = type ? `?type=${type}` : '';
  const data = await api(`/api/agent/skills${query}`);
  if (data.success && data.data) {
    const d = data.data;
    if (d.superpowers) {
      console.log(`\n${c.bold}Superpowers \u6280\u80fd${c.reset}`);
      for (const s of d.superpowers) {
        console.log(`  ${c.green}\u25cf${c.reset} ${s.name} - ${s.description || ''}`);
      }
      console.log();
    }
    if (d.gstack) {
      console.log(`${c.bold}Gstack \u5de5\u4f5c\u6d41${c.reset}`);
      for (const g of d.gstack) {
        console.log(`  ${c.blue}\u25cf${c.reset} ${g.name} - ${g.description || ''}`);
      }
      console.log();
    }
    if (d.ralph) {
      console.log(`${c.bold}Ralph Loop${c.reset}`);
      console.log(`  \u72b6\u6001: ${JSON.stringify(d.ralph.state || d.ralph)}`);
      console.log();
    }
  } else {
    error(data.error || '\u83b7\u53d6\u5931\u8d25');
  }
}

async function cmdChainAdd(args: string[]) {
  const projectId = args[0];
  if (!projectId) {
    error('用法: chain-add <项目ID> --parent <父节点ID> --name <名称> [--auto]');
    return;
  }

  const parentIdFlag = args.indexOf('--parent');
  const nameFlag = args.indexOf('--name');
  const autoFlag = args.includes('--auto');
  const parentId = parentIdFlag >= 0 ? args[parentIdFlag + 1] : '';
  const name = nameFlag >= 0 ? args[nameFlag + 1] : `EPC-${Date.now()}`;
  if (!parentId) {
    error('缺少 --parent <父节点ID>');
    return;
  }

  info(`正在获取项目 ${projectId} ...`);
  const projectRes = await api(`/api/projects/${projectId}`);
  if (projectRes.success === false || !projectRes.data) {
    error(projectRes.error || '获取项目失败');
    return;
  }

  info(`正在创建 EPC 流程 "${name}" ...`);
  const res = await api('/api/epc-processes/auto-generate', {
    method: 'POST',
    body: JSON.stringify({
      project: projectRes.data,
      parentId,
      name,
      autoGenerateMetamodels: autoFlag,
    }),
  });
  if (res.success) {
    success(`EPC 流程 "${name}" 创建成功`);
    if (autoFlag && res.data?.businessChain?.epcProcesses) {
      const epc = res.data.businessChain.epcProcesses[res.data.businessChain.epcProcesses.length - 1];
      console.log(`  ${c.green}\u25cf${c.reset} ID: ${epc.id}`);
      console.log(`  ${c.green}\u25cf${c.reset} 元模型引用: ${epc.generatedRefs?.length || 0} 个`);
    }
  } else {
    error(res.error || '创建失败');
  }
}

async function cmdSync(source?: string) {
  if (!source) {
    error('\u7528\u6cd5: sync <source> (feishu|dingtalk|wecom|sap|workday|custom)');
    return;
  }
  info(`\u6b63\u5728\u89e6\u53d1 ${source} HR\u540c\u6b65...`);
  const data = await api('/api/hr-sync/trigger', {
    method: 'POST',
    body: JSON.stringify({ source }),
  });
  if (data.success !== false) {
    success(`HR\u540c\u6b65\u5df2\u89e6\u53d1: ${JSON.stringify(data.data || data)}`);
  } else {
    error(data.error || '\u540c\u6b65\u5931\u8d25');
  }
}

async function cmdEpcConfirm(args: string[]) {
  const projectId = args[0];
  if (!projectId) {
    error('用法: epc-confirm <项目ID> --epc <EPC节点ID>');
    return;
  }
  const epcFlag = args.indexOf('--epc');
  const epcId = epcFlag >= 0 ? args[epcFlag + 1] : '';
  if (!epcId) {
    error('缺少 --epc <EPC节点ID>');
    return;
  }

  info(`正在获取项目 ${projectId} ...`);
  const projectRes = await api(`/api/projects/${projectId}`);
  if (projectRes.success === false || !projectRes.data) {
    error(projectRes.error || '获取项目失败');
    return;
  }

  info('正在从 EPC 流程提取元数据并生成 8 维元模型 ...');
  const res = await api('/api/epc-processes/auto-generate', {
    method: 'POST',
    body: JSON.stringify({
      project: projectRes.data,
      epcId,
      trigger: 'confirm',
    }),
  });
  if (res.success) {
    const epc = (res.data?.epcProcesses ?? []).find((n: { id: string }) => n.id === epcId);
    success(`EPC "${epc?.name ?? epcId}" 元模型生成完成`);
    console.log(`  ${c.green}\u25cf${c.reset} 元模型引用: ${epc?.generatedRefs?.length || 0} 个`);
    if (epc?.generatedRefs) {
      for (const ref of epc.generatedRefs) {
        const reused = ref.refRole === 'reused' ? ' (复用)' : '';
        console.log(`    ${c.dim}- ${ref.modelType} \u2192 ${ref.refName}${reused}${c.reset}`);
      }
    }
  } else {
    error(res.error || '生成失败');
  }
}

function cmdHelp() {
  console.log(`
${c.bold}${c.cyan}Ontology CLI \u2014 \u672c\u4f53\u5efa\u6a21\u547d\u4ee4\u884c\u5de5\u5177${c.reset}

${c.bold}\u7528\u6cd5:${c.reset}
  pnpm ontology <command> [options]
  npx ontology-cli <command> [options]

${c.bold}\u547d\u4ee4:${c.reset}
  ${c.green}projects${c.reset}              \u5217\u51fa\u6240\u6709\u9879\u76ee
  ${c.green}project${c.reset} <id>          \u67e5\u770b\u9879\u76ee\u8be6\u60c5
  ${c.green}metadata${c.reset}              \u5217\u51fa\u6807\u51c6\u5143\u6570\u636e\u5b57\u6bb5
  ${c.green}generate${c.reset} <\u540d\u79f0>     AI\u751f\u6210\u6a21\u578b\u5efa\u8bae
  ${c.green}export${c.reset} <id> [path]    \u5bfc\u51fa\u9879\u76eeJSON
  ${c.green}import${c.reset} <file>         \u5bfc\u5165Excel\u6587\u4ef6
  ${c.green}template${c.reset}              \u4e0b\u8f7dExcel\u5bfc\u5165\u6a21\u677f
  ${c.green}chat${c.reset} <\u6d88\u606f>          AI\u5bf9\u8bdd\uff08SSE\u6d41\u5f0f\uff09
  ${c.green}skills${c.reset} [type]         \u5217\u51faAgent\u6280\u80fd (superpowers|gstack|ralph)
  ${c.green}sync${c.reset} <source>         \u89e6\u53d1HR\u7cfb\u7edf\u540c\u6b65\n  ${c.green}chain-add${c.reset} <\u9879\u76eeID>    \u521b\u5efa\u4e1a\u52a1\u94fe\u8282\u70b9\uff08\u652f\u6301EPC\u81ea\u52a8\u5143\u6a21\u578b\uff09
  ${c.green}epc-confirm${c.reset} <\u9879\u76eeID>  EPC\u786e\u8ba4\u540e\u4ece\u6d41\u7a0b\u63d0\u53d6\u5143\u6570\u636e\u751f\u62108\u7ef4\u5143\u6a21\u578b
  ${c.green}interactive${c.reset}           \u4ea4\u4e92\u5f0f\u83dc\u5355\u6a21\u5f0f
  ${c.green}help${c.reset}                  \u663e\u793a\u6b64\u5e2e\u52a9\u4fe1\u606f

${c.bold}\u73af\u5883\u53d8\u91cf:${c.reset}
  ${c.dim}ONTOLOGY_API_BASE${c.reset}   API\u57fa\u7840\u5730\u5740 (\u9ed8\u8ba4: https://Ontology1.coze.site)

${c.bold}\u793a\u4f8b:${c.reset}
  ${c.dim}# \u5217\u51fa\u6240\u6709\u9879\u76ee${c.reset}
  pnpm ontology projects

  ${c.dim}# AI\u751f\u6210\u7269\u6599\u5b9e\u4f53\u7684\u6a21\u578b\u5efa\u8bae${c.reset}
  pnpm ontology generate \u7269\u6599 Material

  ${c.dim}# \u5bfc\u51fa\u9879\u76eeJSON${c.reset}
  pnpm ontology export proj-123 ./my-project.json

  ${c.dim}# \u5bfc\u5165Excel${c.reset}
  pnpm ontology import ./ontology-template-123.xlsx

  ${c.dim}# AI\u5bf9\u8bdd${c.reset}
  pnpm ontology chat "\u5e2e\u6211\u521b\u5efa\u4e00\u4e2a\u751f\u4ea7\u7ba1\u7406\u4ef7\u503c\u57df"

  ${c.dim}# \u4ea4\u4e92\u6a21\u5f0f${c.reset}
  pnpm ontology interactive
`);
}

// ── Interactive Mode ──
async function cmdInteractive() {
  const { select, input, confirm } = await import('@inquirer/prompts');

  console.log(`\n${c.bold}${c.cyan}Ontology CLI \u2014 \u4ea4\u4e92\u6a21\u5f0f${c.reset}\n`);

  let running = true;
  while (running) {
    const action = await select<string>({
      message: '\u8bf7\u9009\u62e9\u64cd\u4f5c',
      choices: [
        { name: '\u6d4f\u89c8\u9879\u76ee\u5217\u8868', value: 'projects' },
        { name: '\u67e5\u770b\u9879\u76ee\u8be6\u60c5', value: 'project' },
        { name: '\u6d4f\u89c8\u5143\u6570\u636e\u5b57\u6bb5', value: 'metadata' },
        { name: 'AI \u751f\u6210\u6a21\u578b\u5efa\u8bae', value: 'generate' },
        { name: '\u5bfc\u51fa\u9879\u76ee JSON', value: 'export' },
        { name: '\u5bfc\u5165 Excel \u6587\u4ef6', value: 'import' },
        { name: '\u4e0b\u8f7d Excel \u6a21\u677f', value: 'template' },
        { name: 'AI \u5bf9\u8bdd', value: 'chat' },
        { name: '\u67e5\u770b Agent \u6280\u80fd', value: 'skills' },
        { name: '\u9000\u51fa', value: 'exit' },
      ],
    });

    console.log();

    try {
      switch (action) {
        case 'projects':
          await cmdProjects();
          break;

        case 'project': {
          const projectsData = await api('/api/projects');
          const projects = Array.isArray(projectsData.data) ? projectsData.data : (projectsData.data?.projects || []);
          if (projects.length === 0) {
            warn('\u6682\u65e0\u9879\u76ee');
            break;
          }
          const projectId = await select<string>({
            message: '\u9009\u62e9\u9879\u76ee',
            choices: projects.map((p: any) => ({
              name: `${p.name} (${p.id?.slice(0, 8)}...)`,
              value: p.id,
            })),
          });
          console.log();
          await cmdProject(projectId);
          break;
        }

        case 'metadata':
          await cmdMetadata();
          break;

        case 'generate': {
          const name = await input({ message: '\u8f93\u5165\u5b9e\u4f53\u540d\u79f0:' });
          const nameEn = await input({ message: '\u8f93\u5165\u5b9e\u4f53\u82f1\u6587\u540d (\u53ef\u7559\u7a7a):' });
          console.log();
          await cmdGenerate([name, nameEn].filter(Boolean));
          break;
        }

        case 'export': {
          const projectsData = await api('/api/projects');
          const projects = Array.isArray(projectsData.data) ? projectsData.data : (projectsData.data?.projects || []);
          if (projects.length === 0) {
            warn('\u6682\u65e0\u9879\u76ee');
            break;
          }
          const projectId = await select<string>({
            message: '\u9009\u62e9\u8981\u5bfc\u51fa\u7684\u9879\u76ee',
            choices: projects.map((p: any) => ({
              name: `${p.name} (${p.id?.slice(0, 8)}...)`,
              value: p.id,
            })),
          });
          const outputPath = await input({
            message: '\u8f93\u51fa\u6587\u4ef6\u8def\u5f84 (\u53ef\u7559\u7a7a\u4f7f\u7528\u9ed8\u8ba4):',
            default: `project-${projectId?.slice(0, 8)}-${Date.now()}.json`,
          });
          console.log();
          await cmdExport([projectId, outputPath]);
          break;
        }

        case 'import': {
          const filePath = await input({ message: '\u8f93\u5165 Excel \u6587\u4ef6\u8def\u5f84:' });
          console.log();
          await cmdImport([filePath]);
          break;
        }

        case 'template':
          await cmdTemplate();
          break;

        case 'chat': {
          const message = await input({ message: '\u8f93\u5165\u6d88\u606f:' });
          console.log();
          await cmdChat([message]);
          break;
        }

        case 'skills':
          await cmdSkills();
          break;

        case 'exit':
          running = false;
          console.log(`${c.dim}\u518d\u89c1\uff01${c.reset}\n`);
          break;
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('exit')) {
        running = false;
        break;
      }
      error(e instanceof Error ? e.message : '\u64cd\u4f5c\u5931\u8d25');
    }

    if (running) {
      console.log();
    }
  }
}

// ── Main ──
async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    cmdHelp();
    return;
  }

  switch (command) {
    case 'projects':
      await cmdProjects();
      break;
    case 'project':
      await cmdProject(args[0]);
      break;
    case 'metadata':
      await cmdMetadata();
      break;
    case 'generate':
      await cmdGenerate(args);
      break;
    case 'export':
      await cmdExport(args);
      break;
    case 'import':
      await cmdImport(args);
      break;
    case 'template':
      await cmdTemplate();
      break;
    case 'chat':
      await cmdChat(args);
      break;
    case 'skills':
      await cmdSkills(args[0]);
      break;
    case 'sync':
      await cmdSync(args[0]);
      break;
    case 'chain-add':
      await cmdChainAdd(args);
      break;
    case 'epc-confirm':
      await cmdEpcConfirm(args);
      break;
    case 'interactive':
    case 'i':
      await cmdInteractive();
      break;
    default:
      error(`\u672a\u77e5\u547d\u4ee4: ${command}`);
      console.log(`\u8fd0\u884c ${c.dim}pnpm ontology help${c.reset} \u67e5\u770b\u53ef\u7528\u547d\u4ee4`);
      process.exit(1);
  }
}

main().catch((e) => {
  error(e instanceof Error ? e.message : '\u672a\u77e5\u9519\u8bef');
  process.exit(1);
});
