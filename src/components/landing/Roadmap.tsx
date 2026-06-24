import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  CheckCircle2, 
  Database,
  Workflow,
  ShieldCheck,
  Zap,
  GitBranch,
  Brain,
  Network,
  Building2,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Roadmap = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out',
          scrollTrigger: { trigger: titleRef.current, start: 'top 80%', toggleActions: 'play none none reverse' },
        }
      );

      const milestones = timelineRef.current?.querySelectorAll('.milestone');
      if (milestones) {
        milestones.forEach((milestone, index) => {
          const isLeft = index % 2 === 0;
          gsap.fromTo(
            milestone,
            { x: isLeft ? -50 : 50, opacity: 0 },
            { x: 0, opacity: 1, duration: 0.5, ease: 'expo.out',
              scrollTrigger: { trigger: milestone, start: 'top 80%', toggleActions: 'play none none reverse' },
            }
          );
        });
      }

      const nodes = timelineRef.current?.querySelectorAll('.milestone-node');
      if (nodes) {
        gsap.fromTo(
          nodes,
          { scale: 0 },
          { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.5)', stagger: 0.15,
            scrollTrigger: { trigger: timelineRef.current, start: 'top 75%', toggleActions: 'play none none reverse' },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const milestones = [
    {
      phase: 'P1',
      weeks: 'Phase 1',
      title: '核心元模型',
      description: '数据、行为、规则、事件、流程五大核心模型',
      icon: Database,
      deliverables: ['数据模型', '行为模型', '规则模型', '事件模型', '流程模型'],
      status: 'completed',
    },
    {
      phase: 'P2',
      weeks: 'Phase 2',
      title: '治理与协作',
      description: '治理模型、版本管理、AI辅助建模、元数据',
      icon: ShieldCheck,
      deliverables: ['治理角色', '版本管理', 'AI生成', '57条元数据'],
      status: 'completed',
    },
    {
      phase: 'P3',
      weeks: 'Phase 3',
      title: 'EPC全域关联',
      description: 'EPC流程图、12模型关联、71条双向校验规则',
      icon: Network,
      deliverables: ['EPC流程图', '全域关联矩阵', '71条校验规则', '覆盖率报告'],
      status: 'completed',
    },
    {
      phase: 'P4',
      weeks: 'Phase 4',
      title: '组织与Excel',
      description: '部门岗位模型、结构化职责、HR同步、Excel导入',
      icon: Building2,
      deliverables: ['组织模型', '岗位职责', 'HR同步', '8 Sheet导入'],
      status: 'completed',
    },
    {
      phase: 'P5',
      weeks: 'Phase 5',
      title: '生命周期与语义',
      description: 'Entity Lifecycle增强、Agent语义层、建模手册',
      icon: Brain,
      deliverables: ['State增强', '意图映射', '术语词典', 'Agent策略'],
      status: 'completed',
    },
    {
      phase: 'P6',
      weeks: 'Phase 6',
      title: '持续增强',
      description: '指标体系增强、多领域模板、协作与导出',
      icon: GitBranch,
      deliverables: ['指标增强', '领域模板', '协作功能', '导出优化'],
      status: 'pending',
    },
  ];

  return (
    <section
      id="roadmap"
      ref={sectionRef}
      className="relative w-full py-24 bg-[#f6f6f6]"
    >
      <div className="section-container">
        {/* Section Title */}
        <h2
          ref={titleRef}
          className="heading-2 text-center text-[#171717] mb-16"
        >
          实施路线<span className="text-[#ff6e00]">图</span>
        </h2>

        {/* Timeline */}
        <div ref={timelineRef} className="relative max-w-4xl mx-auto">
          {/* Central Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-[#ff6e00] via-[#171717] to-[#ff6e00]/30 rounded-full"/>

          {/* Milestones */}
          <div className="space-y-12">
            {milestones.map((milestone, index) => {
              const isLeft = index % 2 === 0;
              return (
                <div
                  key={index}
                  className={`milestone relative flex items-center ${
                    isLeft ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  {/* Content Card */}
                  <div className={`w-5/12 ${isLeft ? 'pr-8 text-right' : 'pl-8 text-left'}`}>
                    <div className="bg-white rounded-xl p-5 shadow-lg card-hover">
                      {/* Header */}
                      <div className={`flex items-center gap-3 mb-3 ${isLeft ? 'justify-end' : 'justify-start'}`}>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full text-white ${
                          milestone.status === 'completed' ? 'bg-[#ff6e00]' : 'bg-[#cfcfcf]'
                        }`}>
                          {milestone.phase}
                        </span>
                        <span className="text-sm text-[#b7b7b7]">{milestone.weeks}</span>
                      </div>

                      {/* Title */}
                      <h3 className="heading-5 text-[#171717] mb-2">{milestone.title}</h3>

                      {/* Description */}
                      <p className="text-sm text-[#b7b7b7] mb-3">{milestone.description}</p>

                      {/* Deliverables */}
                      <div className={`flex flex-wrap gap-2 ${isLeft ? 'justify-end' : 'justify-start'}`}>
                        {milestone.deliverables.map((item, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 text-xs rounded-md bg-[#f6f6f6] text-[#171717]/70"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Center Node */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 z-10">
                    <div 
                      className={`milestone-node w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                        milestone.status === 'completed'
                          ? 'bg-[#ff6e00]'
                          : 'bg-white border-2 border-[#cfcfcf]'
                      }`}
                    >
                      {milestone.status === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : (
                        <milestone.icon className="w-5 h-5 text-[#b7b7b7]" />
                      )}
                    </div>
                  </div>

                  {/* Empty Space */}
                  <div className="w-5/12"/>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Roadmap;
