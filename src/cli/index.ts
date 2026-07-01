#!/usr/bin/env node
/**
 * Ontology CLI — 本体建模命令行工具
 *
 * 用法:
 *   node dist/cli/index.js <command> [options]
 *   pnpm ontology <command> [options]
 *
 * 命令:
 *   projects          列出所有项目
 *   project <id>      查看项目详情
 *   metadata          列出元数据字段
 *   generate          AI生成模型建议
 *   export            导出Excel
 *   template          下载Excel模板
 *   skills [type]     列出Agent技能
 *   sync <source>     触发HR同步
 *   help              显示帮助
 */

const API_BASE = process.env.ONTOLOGY_API_BASE || `http://localhost:${process.env.DEPLOY_RUN_PORT || 5000}`;

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
};

function info(msg: string) { console.log(`${c.cyan}ℹ${c.reset} ${msg}`); }
function success(msg: string) { console.log(`${c.green}✓${c.reset} ${msg}`); }
function error(msg: string) { console.error(`${c.red}✗${c.reset} ${msg}`); }

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
  } catch (e) {
    error(`无法连接到 ${API_BASE}，请确保服务已启动`);
    process.exit(1);
  }
}

// ── Commands ──

async function cmdProjects() {
  info('正在获取项目列表...');
  const data = await api('/api/projects');
  if (data.success !== false && data.data) {
    const projects = Array.isArray(data.data) ? data.data : (data.data.projects || []);
    if (projects.length === 0) {
      console.log(`${c.gray}暂无项目${c.reset}`);
      return;
    }
    console.log(`\n${c.bold}项目列表 (${projects.length})${c.reset}\n`);
    console.log(`${c.dim}ID                       名称                 领域             实体数${c.reset}`);
    console.log(`${c.dim}─`.repeat(80) + c.reset);
    for (const p of projects) {
      const id = (p.id || '').padEnd(24);
      const name = (p.name || '').padEnd(20);
      const domain = (p.domain?.name || p.domain || '').padEnd(16);
      const count = String(p.entities?.length || 0).padStart(4);
      console.log(`${id} ${name} ${domain} ${count}`);
    }
    console.log();
  } else {
    error(data.error || '获取失败');
  }
}

async function cmdProject(id: string) {
  if (!id) { error('请提供项目ID'); return; }
  info(`正在获取项目 ${id} ...`);
  const data = await api(`/api/projects/${id}`);
  if (data.success !== false) {
    const p = data.data || data;
    console.log(`\n${c.bold}${c.cyan}${p.name || '未命名'}${c.reset}`);
    console.log(`${c.dim}ID: ${p.id}${c.reset}`);
    console.log(`${c.dim}领域: ${p.domain?.name || p.domain || '-'}${c.reset}`);
    console.log(`${c.dim}描述: ${p.description || '-'}${c.reset}`);
    if (p.entities?.length) {
      console.log(`\n${c.bold}实体 (${p.entities.length})${c.reset}`);
      for (const e of p.entities) {
        console.log(`  ${c.green}●${c.reset} ${e.name} (${e.nameEn || '-'}) [${e.role || 'entity'}]`);
        if (e.attributes?.length) {
          console.log(`    ${c.dim}属性: ${e.attributes.map((a: any) => a.name).join(', ')}${c.reset}`);
        }
      }
    }
    console.log();
  } else {
    error(data.error || '项目不存在');
  }
}

async function cmdMetadata() {
  info('正在获取元数据列表...');
  const data = await api('/api/metadata/init');
  if (data.success && data.data) {
    const list = data.data;
    console.log(`\n${c.bold}标准元数据字段 (${list.length})${c.reset}\n`);
    console.log(`${c.dim}名称                     英文名                 类型       数据来源${c.reset}`);
    console.log(`${c.dim}─`.repeat(80) + c.reset);
    for (const m of list) {
      const name = (m.name || '').padEnd(24);
      const nameEn = (m.nameEn || '').padEnd(22);
      const type = (m.type || '').padEnd(10);
      const source = m.source || '-';
      console.log(`${name} ${nameEn} ${type} ${source}`);
    }
    console.log();
  } else {
    error(data.error || '获取失败');
  }
}

async function cmdGenerate(args: string[]) {
  const entityName = args[0];
  if (!entityName) {
    error('用法: generate <实体名称> [实体英文名]');
    return;
  }
  const nameEn = args[1] || entityName.replace(/[^\x00-\x7F]/g, '').trim() || 'Entity';
  info(`正在为实体 "${entityName}" 生成模型建议...`);
  const data = await api('/api/generate-model', {
    method: 'POST',
    body: JSON.stringify({
      entity: { name: entityName, nameEn, description: `${entityName}实体` },
      domain: { name: '通用' },
    }),
  });
  if (data.success && data.data) {
    const d = data.data;
    success('模型建议生成完成！\n');
    if (d.dataModel?.suggestedAttributes?.length) {
      console.log(`${c.bold}数据模型 - 建议属性${c.reset}`);
      for (const a of d.dataModel.suggestedAttributes) {
        console.log(`  ${c.green}●${c.reset} ${a.name} (${a.dataType || a.type || 'string'}) - ${a.description || ''}`);
      }
      console.log();
    }
    if (d.behaviorModel?.states?.length) {
      console.log(`${c.bold}行为模型 - 状态${c.reset}`);
      for (const s of d.behaviorModel.states) {
        const flag = s.isInitial ? ' [初始]' : s.isFinal ? ' [终止]' : '';
        console.log(`  ${c.yellow}●${c.reset} ${s.name}${flag}`);
      }
      console.log();
    }
    if (d.ruleModel?.rules?.length) {
      console.log(`${c.bold}规则模型${c.reset}`);
      for (const r of d.ruleModel.rules) {
        console.log(`  ${c.red}●${c.reset} [${r.severity || 'error'}] ${r.name}: ${r.description || ''}`);
      }
      console.log();
    }
    if (d.processModel?.steps?.length) {
      console.log(`${c.bold}流程模型 - 步骤${c.reset}`);
      for (const s of d.processModel.steps) {
        console.log(`  ${c.blue}●${c.reset} ${s.name} (${s.type || 'step'})`);
      }
      console.log();
    }
    if (d.eventModel?.events?.length) {
      console.log(`${c.bold}事件模型${c.reset}`);
      for (const e of d.eventModel.events) {
        console.log(`  ${c.cyan}●${c.reset} ${e.name} [${e.trigger || 'trigger'}]`);
      }
      console.log();
    }
  } else {
    error(data.error || '生成失败');
  }
}

async function cmdTemplate() {
  info('正在下载Excel模板...');
  try {
    const res = await fetch(`${API_BASE}/api/excel-template`);
    if (!res.ok) { error(`下载失败: HTTP ${res.status}`); return; }
    const buf = Buffer.from(await res.arrayBuffer());
    const filename = `ontology-template-${Date.now()}.xlsx`;
    const fs = await import('fs');
    fs.writeFileSync(filename, buf);
    success(`模板已保存: ${filename} (${(buf.length / 1024).toFixed(1)} KB)`);
  } catch (e) {
    error(`下载失败: ${e instanceof Error ? e.message : '未知错误'}`);
  }
}

async function cmdSkills(type?: string) {
  info('正在获取技能列表...');
  const query = type ? `?type=${type}` : '';
  const data = await api(`/api/agent/skills${query}`);
  if (data.success && data.data) {
    const d = data.data;
    if (d.superpowers) {
      console.log(`\n${c.bold}Superpowers 技能${c.reset}`);
      for (const s of d.superpowers) {
        console.log(`  ${c.green}●${c.reset} ${s.name} - ${s.description || ''}`);
      }
      console.log();
    }
    if (d.gstack) {
      console.log(`${c.bold}Gstack 工作流${c.reset}`);
      for (const g of d.gstack) {
        console.log(`  ${c.blue}●${c.reset} ${g.name} - ${g.description || ''}`);
      }
      console.log();
    }
    if (d.ralph) {
      console.log(`${c.bold}Ralph Loop${c.reset}`);
      console.log(`  状态: ${JSON.stringify(d.ralph.state || d.ralph)}`);
      console.log();
    }
  } else {
    error(data.error || '获取失败');
  }
}

async function cmdSync(source?: string) {
  if (!source) {
    error('用法: sync <source> (feishu|dingtalk|wecom|sap|workday|custom)');
    return;
  }
  info(`正在触发 ${source} HR同步...`);
  const data = await api('/api/hr-sync/trigger', {
    method: 'POST',
    body: JSON.stringify({ source }),
  });
  if (data.success !== false) {
    success(`HR同步已触发: ${JSON.stringify(data.data || data)}`);
  } else {
    error(data.error || '同步失败');
  }
}

function cmdHelp() {
  console.log(`
${c.bold}${c.cyan}Ontology CLI — 本体建模命令行工具${c.reset}

${c.bold}用法:${c.reset}
  pnpm ontology <command> [options]
  node dist/cli/index.js <command> [options]

${c.bold}命令:${c.reset}
  ${c.green}projects${c.reset}              列出所有项目
  ${c.green}project${c.reset} <id>          查看项目详情
  ${c.green}metadata${c.reset}              列出标准元数据字段
  ${c.green}generate${c.reset} <名称> [英文名]  AI生成模型建议
  ${c.green}template${c.reset}              下载Excel导入模板
  ${c.green}skills${c.reset} [type]         列出Agent技能 (superpowers|gstack|ralph)
  ${c.green}sync${c.reset} <source>         触发HR系统同步
  ${c.green}help${c.reset}                  显示此帮助信息

${c.bold}环境变量:${c.reset}
  ${c.dim}ONTOLOGY_API_BASE${c.reset}   API基础地址 (默认: http://localhost:5000)
  ${c.dim}DEPLOY_RUN_PORT${c.reset}     服务端口 (默认: 5000)

${c.bold}示例:${c.reset}
  ${c.dim}# 列出所有项目${c.reset}
  pnpm ontology projects

  ${c.dim}# AI生成物料实体的模型建议${c.reset}
  pnpm ontology generate 物料 Material

  ${c.dim}# 下载Excel模板${c.reset}
  pnpm ontology template
`);
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
    case 'template':
      await cmdTemplate();
      break;
    case 'skills':
      await cmdSkills(args[0]);
      break;
    case 'sync':
      await cmdSync(args[0]);
      break;
    default:
      error(`未知命令: ${command}`);
      console.log(`运行 ${c.dim}pnpm ontology help${c.reset} 查看可用命令`);
      process.exit(1);
  }
}

main().catch((e) => {
  error(e instanceof Error ? e.message : '未知错误');
  process.exit(1);
});
