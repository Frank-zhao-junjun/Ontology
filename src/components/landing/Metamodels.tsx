import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Database, 
  Workflow, 
  Zap,
  ShieldCheck,
  Users,
  BarChart3,
  Lock,
  Plug
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
      title: 'E1 数据模型',
      category: 'E1',
      description: '实体、属性、关系、元数据管理，构建领域核心数据视图',
      features: ['实体定义', '属性约束', '关系建模', '元数据'],
      color: '#3B82F6',
    },
    {
      icon: Workflow,
      title: 'E2 行为模型',
      category: 'E2',
      description: '状态机、状态转换、动作定义，描述实体的动态行为',
      features: ['状态机', '状态转换', '动作定义', '生命周期'],
      color: '#10B981',
    },
    {
      icon: Zap,
      title: 'E3 事件模型',
      category: 'E3',
      description: '事件定义、订阅管理、触发时机，支撑领域事件驱动',
      features: ['事件定义', '事件订阅', '触发时机', '幂等性'],
      color: '#EF4444',
    },
    {
      icon: ShieldCheck,
      title: 'E4 规则模型',
      category: 'E4',
      description: '字段校验、跨字段/实体校验、聚合与时序规则',
      features: ['字段校验', '跨实体', '聚合规则', '时序规则'],
      color: '#F97316',
    },
    {
      icon: Users,
      title: 'E5 岗位角色',
      category: 'E5',
      description: '部门树、岗位定义、职责结构化，映射组织治理结构',
      features: ['部门树', '岗位职责', 'HR同步', '职责委托'],
      color: '#0EA5E9',
    },
    {
      icon: BarChart3,
      title: 'E6 指标模型',
      category: 'E6',
      description: '度量指标定义、数据源绑定、阈值告警与聚合计算',
      features: ['指标定义', '数据源', '阈值告警', '聚合计算'],
      color: '#EC4899',
    },
    {
      icon: Lock,
      title: 'E7 约束模型',
      category: 'E7',
      description: '业务约束、合规规则、数据质量治理与访问控制',
      features: ['业务约束', '合规规则', '数据质量', '访问控制'],
      color: '#8B5CF6',
    },
    {
      icon: Plug,
      title: 'E8 接口模型',
      category: 'E8',
      description: '系统接口、协议契约、集成点定义，打通内外系统边界',
      features: ['接口定义', '协议契约', '集成点', '版本管理'],
      color: '#14B8A6',
    },
  ];

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'E1': return 'bg-[#ff6e00]/10 text-[#ff6e00]';
      case 'E2': return 'bg-[#F59E0B]/10 text-[#F59E0B]';
      case 'E3': return 'bg-[#10B981]/10 text-[#10B981]';
      case 'E4': return 'bg-[#06B6D4]/10 text-[#06B6D4]';
      case 'E5': return 'bg-[#6366F1]/10 text-[#6366F1]';
      case 'E6': return 'bg-[#8B5CF6]/10 text-[#8B5CF6]';
      case 'E7': return 'bg-[#D946EF]/10 text-[#D946EF]';
      case 'E8': return 'bg-[#84CC16]/10 text-[#84CC16]';
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
          8大元模型<span className="text-[#ff6e00]">体系</span>
        </h2>
        <p className="text-center text-[#b7b7b7] mb-16 max-w-2xl mx-auto">
          从数据到接口，覆盖企业本体建模的八大维度
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
