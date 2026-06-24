import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  GitBranch, 
  Shield, 
  FileSearch, 
  Users, 
  ArrowRightLeft, 
  Clock
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const DDDEvents = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        tabsRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: tabsRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        contentRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.5,
          ease: 'smooth',
          scrollTrigger: {
            trigger: contentRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const decisions = [
    {
      id: 'E1',
      icon: GitBranch,
      title: 'EPC全域关联',
      decision: '模型即关联',
      description: 'EPC 将 12 大元模型通过 EpcModelRef 全域关联，EpcChain 串联完整业务链路',
      details: '每个 EPC 节点（Event/Function/Connector/InfoObject/OrgUnit）通过 refs 引用具体模型元素，支持 12 种 modelType 和 13 种 refRole。一条 EpcChain 从起点到终点，自动推导涉及的实体、状态、规则、事件、角色。',
      code: `interface EpcModelRef {
  modelType: 'data' | 'behavior' | 'rule' 
    | 'event' | 'process' | 'governance'
    | 'lifecycle' | 'semantic' | ...;
  elementId: string;
  refRole: 'primary' | 'guard' 
    | 'compensate' | 'intent' | ...;
}`,
    },
    {
      id: 'E2',
      icon: Shield,
      title: '双向校验',
      decision: '71条一致性规则',
      description: 'EPC→模型(VE)、模型→EPC(VM)、交叉一致性(VX) 三维度双向校验',
      details: 'VE-17 条确保 EPC 引用的模型元素真实存在；VM-39 条确保每个模型元素被 EPC 覆盖；VX-15 条确保 EPC 与模型之间逻辑不矛盾。包括 Lifecycle 和 Semantic Layer 的完整校验。',
      code: `// 校验示例
VE-15: EPC Function 引用 Action,
  但 Action 不在当前 State 
  的 availableActions 中 → warning
VM-LC01: 非初始/终止 State 
  应出现在 EPC 链路中 → warning
VX-09: EPC Function 引用 Action,
  但无 Intent 指向该 Action → error`,
    },
    {
      id: 'E3',
      icon: FileSearch,
      title: '语义完备性',
      decision: 'Agent可理解',
      description: 'Agent Semantic Layer 让 AI Agent 精准理解企业语义并正确执行任务',
      details: '9 大子模型覆盖意图映射(Intent)、槽位填充(SlotFilling)、对话上下文(DialogContext)、语义关系(SemanticRelation)、术语词典(BusinessTerm)、错误恢复(ErrorRecovery)、时效性(TemporalValidity)、字段映射(SemanticFieldMapping)、Agent策略(AgentPolicy)。',
      code: `interface Intent {
  triggerPhrases: string[]; 
    // "创建采购订单"
  actionId: string;      
    // → CreatePurchaseOrder
  slots: SlotFillingStrategy;
    // 追问供应商/物料/数量
  contextConstraints: string[];
    // 需要当前状态为 "draft"
}`,
    },
    {
      id: 'E4',
      icon: Users,
      title: '组织与岗位',
      decision: '结构化职责',
      description: 'Department 树形组织 + Position 结构化职责 + HR系统定时同步',
      details: 'Position.responsibilities 从 string 升级为 PositionResponsibility[]，包含 scope(职责范围)、actions(可执行操作)、decisionAuthority(决策权限)、delegateToPositionIds(委托链)。支持飞书/钉钉/企微/SAP/Workday 定时同步，4种冲突策略。',
      code: `interface PositionResponsibility {
  scope: 'entity' | 'process' 
    | 'domain' | 'custom';
  scopeRefs: string[];    
  actions: string[];       
  decisionAuthority: 'none' 
    | 'recommend' | 'approve' | 'veto';
  delegateToPositionIds: string[];
}`,
    },
    {
      id: 'E5',
      icon: ArrowRightLeft,
      title: '生命周期增强',
      decision: 'State即一等公民',
      description: 'State 从标签升级为一等公民，11个增强字段让 Agent 无需跨模型拼凑',
      details: 'State 新增 entryActions/exitActions/availableActions/constraints/allowedRoles/timeout/dataVisibility/semanticTag/triggerableEvents。Transition 新增 guardCondition/compensationAction/publishEventId/requiresApproval/auditLog。EntityLifecycle 聚合视图一站式查看。',
      code: `interface EnhancedState {
  availableActions: string[];
  constraints: string[];     // Rule IDs
  allowedRoles: string[];    // Role IDs
  timeout: StateTimeout;     // 超时自动转换
  dataVisibility: {          // 字段可见性
    fieldId: string;
    visibility: 'visible' 
      | 'readonly' | 'hidden';
  }[];
}`,
    },
    {
      id: 'E6',
      icon: Clock,
      title: '参考文档驱动',
      decision: '文档即需求源',
      description: '上传 Word/PDF/Excel 参考文档，AI 基于文档生成更精准的模型初稿',
      details: '支持 6 种文件格式，mammoth/pdf-parse/xlsx 自动提取文本+表格。AI Prompt 自动注入文档内容（智能截断≤10000字符），生成建议优先与文档一致。还可从文档自动提取实体候选，含置信度和来源定位，支持批量创建。',
      code: `interface ReferenceDocument {
  fileName: string;
  fileType: 'docx' | 'pdf' 
    | 'xlsx' | 'txt' | 'md' | 'csv';
  extractedText: string;  
  parseStatus: 'pending' 
    | 'success' | 'failed';
}
// AI生成时自动注入:
// "请参考以下业务文档..."`,
    },
  ];

  const handleTabChange = (index: number) => {
    if (index === activeTab) return;
    
    gsap.to(contentRef.current, {
      opacity: 0,
      x: index > activeTab ? -30 : 30,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        setActiveTab(index);
        gsap.fromTo(
          contentRef.current,
          { opacity: 0, x: index > activeTab ? 30 : -30 },
          { opacity: 1, x: 0, duration: 0.3, ease: 'expo.out' }
        );
      },
    });
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-24 bg-white"
    >
      <div className="section-container">
        {/* Section Title */}
        <h2
          ref={titleRef}
          className="heading-2 text-center text-[#171717] mb-12"
        >
          核心设计<span className="text-[#ff6e00]">决策</span>
        </h2>

        {/* Tabs */}
        <div
          ref={tabsRef}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {decisions.map((decision, index) => (
            <button
              key={decision.id}
              onClick={() => handleTabChange(index)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === index
                  ? 'bg-[#ff6e00] text-white shadow-lg'
                  : 'bg-[#f6f6f6] text-[#171717]/70 hover:bg-[#e9e9e9]'
              }`}
            >
              <span className="mr-1">{decision.id}:</span>
              {decision.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-[#f6f6f6] rounded-2xl p-8">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-[#ff6e00]/10 flex items-center justify-center flex-shrink-0">
                {(() => {
                  const IconComponent = decisions[activeTab].icon;
                  return <IconComponent className="w-7 h-7 text-[#ff6e00]" />;
                })()}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#ff6e00] text-white">
                    {decisions[activeTab].id}
                  </span>
                  <h3 className="heading-4 text-[#171717]">{decisions[activeTab].title}</h3>
                </div>
                <p className="text-lg font-medium text-[#ff6e00]">
                  决策: {decisions[activeTab].decision}
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="body-text text-[#171717]/70 mb-6">
              {decisions[activeTab].description}
            </p>

            {/* Details */}
            <div className="bg-white rounded-xl p-5 mb-6">
              <h4 className="heading-5 text-[#171717] mb-3">详细说明</h4>
              <p className="text-[#171717]/70 leading-relaxed">
                {decisions[activeTab].details}
              </p>
            </div>

            {/* Code Example */}
            <div className="bg-[#171717] rounded-xl p-5 overflow-x-auto">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-[#ff6e00]"/>
                <span className="text-sm text-[#b7b7b7]">Code Example</span>
              </div>
              <pre className="text-sm text-[#e9e9e9] font-mono leading-relaxed">
                <code>{decisions[activeTab].code}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DDDEvents;
