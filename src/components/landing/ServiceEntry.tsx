'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Monitor, Plug, Terminal, Sparkles, ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const services = [
  {
    id: 'ui',
    icon: Monitor,
    title: 'Web UI',
    subtitle: '可视化建模工作台',
    description: '完整的图形化建模界面，支持五大元模型可视化编辑、AI智能生成、Excel导入导出、建模手册输出。',
    action: { label: '进入工作台', href: '/tool' },
    color: '#ff6e00',
    features: ['可视化编辑', 'AI智能建模', 'Excel导入导出', '建模手册生成'],
  },
  {
    id: 'mcp',
    icon: Plug,
    title: 'MCP Server',
    subtitle: 'Model Context Protocol',
    description: '标准MCP协议服务端，支持Claude Desktop、Cursor等AI客户端直接调用本体建模工具的全部能力。',
    action: { label: '查看配置', href: '#mcp-config' },
    color: '#2563eb',
    features: ['12个建模工具', 'Stdio传输', 'AI客户端直连', '自然语言建模'],
  },
  {
    id: 'cli',
    icon: Terminal,
    title: 'CLI',
    subtitle: '命令行工具',
    description: '轻量级命令行接口，适合脚本自动化、CI/CD集成和批量操作。零依赖纯Node.js实现。',
    action: { label: '使用指南', href: '#cli-guide' },
    color: '#16a34a',
    features: ['项目查询', 'AI生成', 'Excel模板', 'HR同步'],
  },
  {
    id: 'skill',
    icon: Sparkles,
    title: 'Agent Skill',
    subtitle: 'API技能执行层',
    description: '统一的REST API执行入口，支持编程式调用全部建模操作，可集成到任意Agent框架或工作流引擎。',
    action: { label: 'API文档', href: '#skill-api' },
    color: '#9333ea',
    features: ['REST API', '统一入口', '12种操作', 'SSE流式'],
  },
];

const ServiceEntry = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section ref={sectionRef} className="relative w-full bg-[#fafaf9] py-24 border-y border-[#e7e5e4]">
      <div className="section-container">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ff6e00]/10 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-[#ff6e00]" />
            <span className="text-sm font-medium text-[#ff6e00]">四种服务接入方式</span>
          </div>
          <h2 className="heading-2 text-[#171717] mb-4">
            全场景覆盖的建模服务
          </h2>
          <p className="body-text text-[#171717]/60 max-w-2xl mx-auto">
            无论你是产品经理、开发者、还是AI Agent，都能找到最适合的接入方式
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div
                key={service.id}
                className="group relative bg-white rounded-[6px] border border-[#e7e5e4] p-6 transition-all duration-150 hover:shadow-lg hover:border-[#e7e5e4]/0 flex flex-col"
                style={{ minHeight: '380px' }}
              >
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-[6px] flex items-center justify-center mb-5 transition-transform duration-150 group-hover:scale-110"
                  style={{ backgroundColor: `${service.color}15` }}
                >
                  <Icon className="w-6 h-6" style={{ color: service.color }} />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-[#171717] mb-1">
                  {service.title}
                </h3>
                <p className="text-xs text-[#b7b7b7] font-medium mb-3">
                  {service.subtitle}
                </p>

                {/* Description */}
                <p className="text-sm text-[#171717]/60 leading-relaxed mb-4 flex-1">
                  {service.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {service.features.map((f) => (
                    <span
                      key={f}
                      className="inline-block px-2 py-0.5 text-[11px] rounded bg-[#f5f5f4] text-[#737373] font-medium"
                    >
                      {f}
                    </span>
                  ))}
                </div>

                {/* Action */}
                {service.action.href.startsWith('/') ? (
                  <Link
                    href={service.action.href}
                    className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-150"
                    style={{ color: service.color }}
                  >
                    {service.action.label}
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </Link>
                ) : (
                  <button
                    onClick={() => scrollToSection(service.action.href.replace('#', ''))}
                    className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-150"
                    style={{ color: service.color }}
                  >
                    {service.action.label}
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* MCP Config Section */}
        <div id="mcp-config" className="mt-20 max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold text-[#171717] mb-3 flex items-center gap-2">
            <Plug className="w-5 h-5 text-[#2563eb]" />
            MCP Server 配置
          </h3>
          <p className="text-sm text-[#171717]/60 mb-4">
            将以下配置添加到你的 MCP 客户端（Claude Desktop / Cursor）配置文件中：
          </p>
          <div className="bg-[#1a1a1a] rounded-[6px] p-4 overflow-x-auto">
            <pre className="text-xs text-[#e7e5e4] font-mono leading-relaxed">{`{
  "mcpServers": {
    "ontology-mcp": {
      "command": "pnpm",
      "args": ["tsx", "packages/ontology-mcp/src/index.ts"],
      "env": {
        "ONTOLOGY_API_BASE": "http://localhost:5000"
      }
    }
  }
}`}</pre>
          </div>
          <p className="text-xs text-[#b7b7b7] mt-2">
            可用工具：list_projects, get_project, list_metadata, ai_generate_model, ai_chat, create_model, excel_template, export_manifest, list_skills, execute_skill, hr_sync_status, hr_sync_trigger
          </p>
        </div>

        {/* CLI Guide Section */}
        <div id="cli-guide" className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold text-[#171717] mb-3 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#16a34a]" />
            CLI 使用指南
          </h3>
          <div className="bg-[#1a1a1a] rounded-[6px] p-4 overflow-x-auto">
            <pre className="text-xs text-[#e7e5e4] font-mono leading-relaxed">{`# 列出所有项目
pnpm ontology projects

# 查看项目详情
pnpm ontology project <projectId>

# 列出元数据字段
pnpm ontology metadata

# AI生成模型建议
pnpm ontology generate 物料 Material

# 下载Excel模板
pnpm ontology template

# 列出Agent技能
pnpm ontology skills [superpowers|gstack|ralph]

# 触发HR系统同步
pnpm ontology sync feishu`}</pre>
          </div>
        </div>

        {/* Skill API Section */}
        <div id="skill-api" className="mt-16 max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold text-[#171717] mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#9333ea]" />
            Agent Skill API
          </h3>
          <p className="text-sm text-[#171717]/60 mb-4">
            统一的 REST API 执行入口，所有操作通过 POST /api/agent/skills/execute 调用：
          </p>
          <div className="bg-[#1a1a1a] rounded-[6px] p-4 overflow-x-auto">
            <pre className="text-xs text-[#e7e5e4] font-mono leading-relaxed">{`# 列出可用操作
curl http://localhost:5000/api/agent/skills/execute

# 列出项目
curl -X POST http://localhost:5000/api/agent/skills/execute \\
  -H 'Content-Type: application/json' \\
  -d '{"operation": "list_projects", "params": {}}'

# AI生成模型
curl -X POST http://localhost:5000/api/agent/skills/execute \\
  -H 'Content-Type: application/json' \\
  -d '{
    "operation": "ai_generate",
    "params": {
      "entity": {"name": "物料", "nameEn": "Material"}
    }
  }'`}</pre>
          </div>
          <p className="text-xs text-[#b7b7b7] mt-2">
            可用操作：list_projects, get_project, list_metadata, ai_generate, ai_chat, create_model, excel_template, export_manifest, list_skills, execute_skill, hr_sync_status, hr_sync_trigger
          </p>
        </div>
      </div>
    </section>
  );
};

export default ServiceEntry;
