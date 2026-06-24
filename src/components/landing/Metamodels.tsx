import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Database, 
  Workflow, 
  ShieldCheck, 
  Zap,
  GitBranch,
  Users,
  BarChart3,
  Building2,
  RefreshCw,
  Brain,
  Network,
  FileSpreadsheet
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Metamodels = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
      gsap.fromTo(
        titleRef.current,
        { scale: 0.5, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.7,
          ease: 'elastic.out(1, 0.5)',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Cards animation
      const cards = cardsRef.current?.children;
      if (cards) {
        gsap.fromTo(
          cards,
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.6,
            ease: 'expo.out',
            stagger: 0.06,
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const metamodels = [
    {
      icon: Database,
      title: '数据模型',
      category: '核心',
      description: '实体属性定义、关系定义、唯一约束',
      features: ['属性定义', '关系定义', '唯一约束', '索引定义'],
      color: '#ff6e00',
    },
    {
      icon: Workflow,
      title: '行为模型',
      category: '核心',
      description: '状态机设计，支持状态定义、转换规则、触发器',
      features: ['状态定义', '状态转换', '触发方式', '前置条件'],
      color: '#171717',
    },
    {
      icon: ShieldCheck,
      title: '规则模型',
      category: '核心',
      description: '字段验证、跨字段验证、业务约束规则',
      features: ['字段校验', '跨字段校验', '跨实体校验', '时序规则'],
      color: '#10B981',
    },
    {
      icon: Zap,
      title: '事件模型',
      category: '核心',
      description: '事件定义、事件订阅、触发器配置',
      features: ['事件定义', '事件订阅', 'DDD领域事件', '幂等性'],
      color: '#EF4444',
    },
    {
      icon: GitBranch,
      title: '流程模型',
      category: '核心',
      description: '流程编排、步骤定义、可视化流程预览',
      features: ['流程编排', '10种步骤', '流程预览', '步骤依赖'],
      color: '#8B5CF6',
    },
    {
      icon: Users,
      title: '治理模型',
      category: '治理',
      description: '角色定义、权限管理、数据Owner',
      features: ['角色定义', '权限管理', '数据Owner', '操作授权'],
      color: '#F59E0B',
    },
    {
      icon: Building2,
      title: '组织与岗位',
      category: '治理',
      description: '部门树、结构化岗位职责、HR系统定时同步',
      features: ['部门树', '岗位职责', 'HR同步', '职责委托'],
      color: '#0EA5E9',
    },
    {
      icon: BarChart3,
      title: '指标体系',
      category: '治理',
      description: '度量指标定义、数据源绑定、阈值告警',
      features: ['指标定义', '数据源', '阈值告警', '聚合计算'],
      color: '#EC4899',
    },
    {
      icon: RefreshCw,
      title: '实体生命周期',
      category: '增强',
      description: 'State增强、转换守卫、审计追溯、超时管理',
      features: ['State增强', '守卫条件', '补偿动作', '审计追溯'],
      color: '#14B8A6',
    },
    {
      icon: Brain,
      title: 'Agent语义层',
      category: '增强',
      description: '意图映射、槽位填充、术语词典、语义关系',
      features: ['意图映射', '槽位填充', '术语词典', 'Agent策略'],
      color: '#6366F1',
    },
    {
      icon: Network,
      title: 'EPC全域关联',
      category: '关联',
      description: '12模型全域关联、71条双向校验规则',
      features: ['EPC流程图', '全域关联', '双向校验', '覆盖率报告'],
      color: '#D946EF',
    },
    {
      icon: FileSpreadsheet,
      title: 'Excel导入导出',
      category: '协作',
      description: '8 Sheet模板、版本审核、组织数据导入',
      features: ['模板下载', '数据校验', '版本审核', '批量导入'],
      color: '#84CC16',
    },
  ];

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case '核心': return 'bg-[#ff6e00]/10 text-[#ff6e00]';
      case '治理': return 'bg-[#10B981]/10 text-[#10B981]';
      case '增强': return 'bg-[#6366F1]/10 text-[#6366F1]';
      case '关联': return 'bg-[#D946EF]/10 text-[#D946EF]';
      case '协作': return 'bg-[#84CC16]/10 text-[#84CC16]';
      default: return 'bg-[#f6f6f6] text-[#171717]/70';
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-24 bg-[#f6f6f6]"
    >
      <div className="section-container">
        {/* Section Title */}
        <h2
          ref={titleRef}
          className="heading-2 text-center text-[#171717] mb-4"
        >
          12大元模型<span className="text-[#ff6e00]">体系</span>
        </h2>
        <p className="text-center text-[#b7b7b7] mb-16 max-w-2xl mx-auto">
          从核心建模到Agent语义理解，构建企业级本体模型的完整能力矩阵
        </p>

        {/* Metamodel Cards */}
        <div
          ref={cardsRef}
          className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          {metamodels.map((model, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-5 shadow-lg card-hover group cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-400 group-hover:scale-110 group-hover:rotate-6"
                  style={{ backgroundColor: `${model.color}15` }}
                >
                  <model.icon 
                    className="w-6 h-6 transition-colors duration-300"
                    style={{ color: model.color }}
                  />
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryLabel(model.category)}`}>
                  {model.category}
                </span>
              </div>

              {/* Title */}
              <h3 className="heading-5 text-[#171717] mb-1.5 group-hover:text-[#ff6e00] transition-colors">
                {model.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-[#b7b7b7] mb-3 leading-relaxed">
                {model.description}
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-1.5">
                {model.features.map((feature, fIndex) => (
                  <span
                    key={fIndex}
                    className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#f6f6f6] text-[#171717]/70"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Connection Lines (Visual Decoration) */}
        <div className="hidden lg:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="800" height="400" viewBox="0 0 800 400" fill="none" className="opacity-10">
            <path
              d="M100 200 Q200 100 300 150 Q400 200 500 150 Q600 100 700 200"
              stroke="#ff6e00"
              strokeWidth="2"
              fill="none"
              strokeDasharray="8 8"
              className="animate-flow"
            />
          </svg>
        </div>
      </div>
    </section>
  );
};

export default Metamodels;
