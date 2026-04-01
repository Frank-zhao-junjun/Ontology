import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Database, 
  Workflow, 
  ShieldCheck, 
  Zap
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
            stagger: 0.1,
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
      description: '实体属性定义、关系定义（一对一、一对多、多对多）',
      features: ['属性定义', '关系定义', '唯一约束', '索引定义'],
      color: '#ff6e00',
    },
    {
      icon: Workflow,
      title: '行为模型',
      description: '状态机设计，支持状态定义、转换规则、触发器配置',
      features: ['状态定义', '状态转换', '触发方式', '前置条件'],
      color: '#171717',
    },
    {
      icon: ShieldCheck,
      title: '规则模型',
      description: '字段验证、跨字段验证、业务约束规则',
      features: ['字段校验', '跨字段校验', '跨实体校验', '时序规则'],
      color: '#10B981',
    },
    {
      icon: Zap,
      title: '事件模型',
      description: '事件定义、事件订阅、触发器配置',
      features: ['事件定义', '事件订阅', 'DDD领域事件', '幂等性'],
      color: '#EF4444',
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-24 bg-[#f6f6f6]"
    >
      <div className="section-container">
        {/* Section Title */}
        <h2
          ref={titleRef}
          className="heading-2 text-center text-[#171717] mb-16"
        >
          四大元模型<span className="text-[#ff6e00]">编辑</span>
        </h2>

        {/* Metamodel Cards */}
        <div
          ref={cardsRef}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {metamodels.map((model, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg card-hover group cursor-pointer"
            >
              {/* Icon */}
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-400 group-hover:scale-110 group-hover:rotate-6"
                style={{ backgroundColor: `${model.color}15` }}
              >
                <model.icon 
                  className="w-7 h-7 transition-colors duration-300"
                  style={{ color: model.color }}
                />
              </div>

              {/* Title */}
              <h3 className="heading-5 text-[#171717] mb-2 group-hover:text-[#ff6e00] transition-colors">
                {model.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-[#b7b7b7] mb-4 leading-relaxed">
                {model.description}
              </p>

              {/* Features */}
              <div className="flex flex-wrap gap-2">
                {model.features.map((feature, fIndex) => (
                  <span
                    key={fIndex}
                    className="px-3 py-1 text-xs font-medium rounded-full bg-[#f6f6f6] text-[#171717]/70"
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
