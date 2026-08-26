import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Target,
  Puzzle,
  Map,
  GitBranch,
  Database,
  Activity,
  Bell,
  Scale,
  Users,
  BarChart3,
  Shield,
  Plug,
  ArrowRight
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Architecture = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const chainRef = useRef<HTMLDivElement>(null);
  const metamodelsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        '.architecture-chain-item',
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.12,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: chainRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        '.architecture-m8-item',
        { scale: 0.9, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          stagger: 0.06,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: metamodelsRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const chainItems = [
    { icon: Target, label: 'A', title: '业务价值域', desc: '识别企业价值链与目标' },
    { icon: Puzzle, label: 'B', title: '业务能力', desc: '拆解能力域与能力项' },
    { icon: Map, label: 'C', title: '业务场景', desc: '定义场景与关键流程' },
    { icon: GitBranch, label: 'EPC', title: '流程建模', desc: '事件-功能-控制流' },
  ];

  const metamodelItems = [
    { id: 'E1', icon: Database, title: '数据模型', desc: '实体/属性/关系' },
    { id: 'E2', icon: Activity, title: '行为模型', desc: '状态机/动作' },
    { id: 'E3', icon: Bell, title: '事件模型', desc: '事件定义/订阅' },
    { id: 'E4', icon: Scale, title: '规则模型', desc: '校验/聚合规则' },
    { id: 'E5', icon: Users, title: '岗位角色', desc: '组织/岗位/职责' },
    { id: 'E6', icon: BarChart3, title: '指标模型', desc: '指标/维度/口径' },
    { id: 'E7', icon: Shield, title: '约束模型', desc: '一致性/完整性' },
    { id: 'E8', icon: Plug, title: '接口模型', desc: '系统接口契约' },
  ];

  return (
    <section
      id="architecture"
      ref={sectionRef}
      className="relative w-full py-24 bg-[#f6f6f6]"
      style={{ clipPath: 'polygon(0 5%, 100% 0, 100% 95%, 0 100%)' }}
    >
      <div className="section-container">
        {/* Section Title */}
        <h2
          ref={titleRef}
          className="heading-2 text-center text-[#171717] mb-16"
        >
          本体模型架构<span className="text-[#ff6e00]">全景</span>
        </h2>

        {/* A -> B -> C -> EPC Chain */}
        <div
          ref={chainRef}
          className="flex flex-col lg:flex-row items-center justify-center gap-4 mb-16"
        >
          {chainItems.map((item, index) => (
            <div key={item.label} className="flex items-center gap-4">
              <div className="architecture-chain-item bg-white rounded-xl p-5 shadow-md card-hover min-w-[200px]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-[#ff6e00]/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-[#ff6e00]" />
                  </div>
                  <span className="text-xs font-bold text-[#ff6e00] border border-[#ff6e00]/20 px-2 py-0.5 rounded">
                    {item.label}
                  </span>
                </div>
                <h3 className="text-[#171717] font-semibold">{item.title}</h3>
                <p className="text-xs text-[#b7b7b7] mt-1">{item.desc}</p>
              </div>
              {index < chainItems.length - 1 && (
                <ArrowRight className="hidden lg:block w-5 h-5 text-[#b7b7b7]" />
              )}
            </div>
          ))}
        </div>

        {/* E1-E8 Metamodels */}
        <div className="text-center mb-8">
          <h3 className="text-lg font-semibold text-[#171717]">八维元模型体系</h3>
          <p className="text-sm text-[#b7b7b7] mt-1">支撑业务链落地的完整建模能力矩阵</p>
        </div>

        <div
          ref={metamodelsRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {metamodelItems.map((item) => (
            <div
              key={item.id}
              className="architecture-m8-item bg-white rounded-xl p-4 shadow-sm border border-[#f0f0f0] hover:border-[#ff6e00]/30 transition-colors duration-300"
            >
              <div className="flex items-center gap-2 mb-2">
                <item.icon className="w-4 h-4 text-[#ff6e00]" />
                <span className="text-xs font-bold text-[#ff6e00]">{item.id}</span>
              </div>
              <h4 className="text-[#171717] font-medium text-sm">{item.title}</h4>
              <p className="text-xs text-[#b7b7b7] mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Architecture;
