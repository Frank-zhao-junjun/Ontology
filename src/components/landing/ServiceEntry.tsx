'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Plug, Terminal, Sparkles, ArrowRight, Download, Copy, Check, Monitor } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

type TabId = 'mcp' | 'cli' | 'skill';

const tabs: { id: TabId; label: string; icon: typeof Plug; color: string }[] = [
  { id: 'mcp', label: 'MCP', icon: Plug, color: '#2563eb' },
  { id: 'cli', label: 'CLI', icon: Terminal, color: '#16a34a' },
  { id: 'skill', label: 'Skill', icon: Sparkles, color: '#9333ea' },
];

const DOMAIN = 'https://Ontology1.coze.site';

const ServiceEntry = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabId>('mcp');
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const handleDownload = useCallback(() => {
    window.open(`${DOMAIN}/api/agent/skills/download`, '_blank');
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full bg-[#fafaf9] py-24 border-y border-[#e7e5e4]">
      <div className="section-container">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff6e00]/10 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-[#ff6e00]" />
            <span className="text-sm font-medium text-[#ff6e00]">Agent 接入方式</span>
          </div>
          <h2 className="heading-2 text-[#171717] mb-4">
            让你的 AI Agent 具备建模能力
          </h2>
          <p className="body-text text-[#171717]/60 max-w-2xl mx-auto">
            三种接入方式，满足不同场景需求 — 协议直连、命令行调用、技能包下载
          </p>
        </div>

        {/* Web UI Entry (above tabs) */}
        <div className="max-w-5xl mx-auto mb-10">
          <Link
            href="/tool"
            className="group flex items-center justify-between bg-white rounded-[6px] border border-[#e7e5e4] px-6 py-5 transition-all duration-150 hover:shadow-md hover:border-[#ff6e00]/30"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-[6px] bg-[#ff6e00]/10 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-[#ff6e00]" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#171717]">Web UI 建模工作台</h3>
                <p className="text-sm text-[#171717]/50">可视化建模 — 五大元模型、AI智能生成、Excel导入导出</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#ff6e00]">
              进入工作台
              <ArrowRight className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-1 bg-white rounded-[6px] border border-[#e7e5e4] p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-[4px] text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'text-white'
                      : 'text-[#737373] hover:text-[#171717]'
                  }`}
                  style={isActive ? { backgroundColor: tab.color } : {}}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-3xl mx-auto">
          {/* MCP Tab */}
          {activeTab === 'mcp' && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#171717] mb-1">MCP Server</h3>
                  <p className="text-sm text-[#171717]/60">
                    标准 MCP 协议（Streamable HTTP），支持 Claude Desktop、Cursor 等 AI 客户端直接调用。8 个建模工具，互联网可达。
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(`{\n  "mcpServers": {\n    "ontology-mcp": {\n      "url": "${DOMAIN}/api/mcp"\n    }\n  }\n}`)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] border border-[#e7e5e4] text-xs font-medium text-[#737373] hover:text-[#171717] hover:border-[#d6d3d1] transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#16a34a]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? '已复制' : '复制配置'}
                </button>
              </div>
              <div className="bg-[#1a1a1a] rounded-[6px] p-4 overflow-x-auto">
                <pre className="text-xs text-[#e7e5e4] font-mono leading-relaxed">{`{
  "mcpServers": {
    "ontology-mcp": {
      "url": "${DOMAIN}/api/mcp"
    }
  }
}`}</pre>
              </div>
              <div className="flex flex-wrap gap-2">
                {['list_projects', 'get_project', 'create_project', 'export_project', 'add_value_domain', 'add_capability', 'add_scenario', 'add_epc_process'].map((tool) => (
                  <span key={tool} className="inline-block px-2.5 py-1 text-[11px] rounded bg-[#2563eb]/8 text-[#2563eb] font-medium font-mono">
                    {tool}
                  </span>
                ))}
              </div>
              <p className="text-xs text-[#b7b7b7]">
                也支持本地 Stdio 模式：pnpm tsx packages/ontology-mcp/src/index.ts
              </p>
            </div>
          )}

          {/* CLI Tab */}
          {activeTab === 'cli' && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#171717] mb-1">CLI 命令行工具</h3>
                  <p className="text-sm text-[#171717]/60">
                    轻量级命令行接口，适合脚本自动化和 CI/CD 集成。NPM 包发布，npx 直接使用。
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(`export ONTOLOGY_API_BASE=${DOMAIN}\nnpx ontology-cli projects`)}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] border border-[#e7e5e4] text-xs font-medium text-[#737373] hover:text-[#171717] hover:border-[#d6d3d1] transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#16a34a]" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? '已复制' : '复制命令'}
                </button>
              </div>
              <div className="bg-[#1a1a1a] rounded-[6px] p-4 overflow-x-auto">
                <pre className="text-xs text-[#e7e5e4] font-mono leading-relaxed">{`# 设置环境变量
export ONTOLOGY_API_BASE=${DOMAIN}

# 列出所有项目
npx ontology-cli projects

# 查看项目详情
npx ontology-cli project <id>

# AI 生成模型建议
npx ontology-cli generate 物料 Material

# AI 对话建模（SSE 流式）
npx ontology-cli chat "帮我创建一个生产管理价值域"

# 下载 Excel 模板
npx ontology-cli template

# 导出项目 JSON
npx ontology-cli export <id> ./project.json

# 导入 Excel 文件
npx ontology-cli import ./data.xlsx

# 交互模式（菜单选择）
npx ontology-cli interactive`}</pre>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {['projects', 'project', 'metadata', 'generate', 'export', 'import', 'template', 'chat', 'skills', 'sync', 'interactive', 'help'].map((cmd) => (
                  <span key={cmd} className="inline-block px-2.5 py-1 text-[11px] rounded bg-[#16a34a]/8 text-[#16a34a] font-medium font-mono">
                    {cmd}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skill Tab */}
          {activeTab === 'skill' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[#171717] mb-1">Agent Skill 技能包</h3>
                <p className="text-sm text-[#171717]/60">
                  下载 ZIP 技能包，导入到你的 Agent 框架，即刻具备本体建模能力。包含技能清单、MCP配置、CLI配置、curl示例、OpenAPI规范。
                </p>
              </div>

              {/* Download Card */}
              <div className="bg-white rounded-[6px] border border-[#9333ea]/20 p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[6px] bg-[#9333ea]/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-[#9333ea]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#171717]">ontology-skill.zip</p>
                    <p className="text-xs text-[#737373]">skill.json + README.md + config/ + examples/ + openapi.yaml</p>
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-[6px] bg-[#9333ea] text-white text-sm font-medium hover:bg-[#9333ea]/90 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  下载技能包
                </button>
              </div>

              {/* Skill Contents */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-[6px] border border-[#e7e5e4] p-3 text-center">
                  <p className="text-2xl font-semibold text-[#9333ea] tabular-nums">12</p>
                  <p className="text-xs text-[#737373] mt-0.5">种操作</p>
                </div>
                <div className="bg-white rounded-[6px] border border-[#e7e5e4] p-3 text-center">
                  <p className="text-2xl font-semibold text-[#9333ea] tabular-nums">3</p>
                  <p className="text-xs text-[#737373] mt-0.5">种接入方式</p>
                </div>
                <div className="bg-white rounded-[6px] border border-[#e7e5e4] p-3 text-center">
                  <p className="text-2xl font-semibold text-[#9333ea] tabular-nums">8</p>
                  <p className="text-xs text-[#737373] mt-0.5">个MCP工具</p>
                </div>
              </div>

              {/* REST API Preview */}
              <div>
                <p className="text-xs font-medium text-[#737373] mb-2">REST API 快速调用：</p>
                <div className="bg-[#1a1a1a] rounded-[6px] p-4 overflow-x-auto">
                  <pre className="text-xs text-[#e7e5e4] font-mono leading-relaxed">{`# 列出所有项目
curl -X POST ${DOMAIN}/api/agent/skills/execute \\
  -H 'Content-Type: application/json' \\
  -d '{"operation": "list_projects", "params": {}}'

# AI 生成模型建议
curl -X POST ${DOMAIN}/api/agent/skills/execute \\
  -H 'Content-Type: application/json' \\
  -d '{"operation": "ai_generate", "params": {"entity": {"name": "物料", "nameEn": "Material"}}}'`}</pre>
                </div>
              </div>

              <p className="text-xs text-[#b7b7b7]">
                可用操作：list_projects, get_project, list_metadata, ai_generate, ai_chat, create_model, excel_template, export_manifest, list_skills, execute_skill, hr_sync_status, hr_sync_trigger
              </p>
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="max-w-4xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Plug, title: '协议直连', desc: 'MCP 标准协议，AI 客户端零配置接入', color: '#2563eb' },
            { icon: Terminal, title: '命令行驱动', desc: 'CLI 工具适合脚本自动化和 CI/CD', color: '#16a34a' },
            { icon: Sparkles, title: '技能包下载', desc: 'ZIP 一键下载，导入即用', color: '#9333ea' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="text-center">
                <div
                  className="w-10 h-10 rounded-[6px] flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <h4 className="text-sm font-semibold text-[#171717] mb-1">{item.title}</h4>
                <p className="text-xs text-[#737373]">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServiceEntry;
