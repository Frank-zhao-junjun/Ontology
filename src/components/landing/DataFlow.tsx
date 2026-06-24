import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Edit3, 
  Database, 
  Brain,
  Network,
  FileSpreadsheet,
  ShieldCheck,
  RefreshCw,
  Save
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const DataFlow = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const phase1Ref = useRef<HTMLDivElement>(null);
  const phase2Ref = useRef<HTMLDivElement>(null);
  const arrow1Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out',
          scrollTrigger: { trigger: titleRef.current, start: 'top 80%', toggleActions: 'play none none reverse' },
        }
      );

      gsap.fromTo(
        phase1Ref.current,
        { x: -100, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, ease: 'expo.out',
          scrollTrigger: { trigger: phase1Ref.current, start: 'top 75%', toggleActions: 'play none none reverse' },
        }
      );

      gsap.fromTo(
        arrow1Ref.current,
        { scaleX: 0, opacity: 0 },
        { scaleX: 1, opacity: 1, duration: 0.5, ease: 'expo.out',
          scrollTrigger: { trigger: arrow1Ref.current, start: 'top 75%', toggleActions: 'play none none reverse' },
        }
      );

      gsap.fromTo(
        phase2Ref.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out',
          scrollTrigger: { trigger: phase2Ref.current, start: 'top 75%', toggleActions: 'play none none reverse' },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const modelingComponents = [
    { icon: Edit3, label: '可视化编辑器' },
    { icon: Database, label: '数据/行为/规则/事件' },
    { icon: ShieldCheck, label: '组织与岗位模型' },
    { icon: RefreshCw, label: '实体生命周期' },
    { icon: Brain, label: 'Agent语义层' },
  ];

  const integrationComponents = [
    { icon: Network, label: 'EPC全域关联(71条规则)' },
    { icon: Brain, label: 'AI智能生成' },
    { icon: FileSpreadsheet, label: 'Excel导入(8 Sheet)' },
    { icon: Database, label: '57条元数据初始化' },
    { icon: ShieldCheck, label: '版本管理与审核' },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-24 bg-white"
    >
      <div className="section-container">
        {/* Section Title */}
        <h2
          ref={titleRef}
          className="heading-2 text-center text-[#171717] mb-16"
        >
          建模工作<span className="text-[#ff6e00]">流程</span>
        </h2>

        {/* Data Flow Diagram */}
        <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-stretch gap-6">
          {/* Phase 1: Modeling */}
          <div
            ref={phase1Ref}
            className="flex-1 bg-gradient-to-br from-[#ff6e00]/5 to-[#ff6e00]/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#ff6e00] flex items-center justify-center">
                <Edit3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="heading-5 text-[#171717]">本体建模</h3>
                <p className="text-sm text-[#b7b7b7]">Ontology Modeling</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {modelingComponents.map((comp, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <comp.icon className="w-4 h-4 text-[#ff6e00]" />
                  <span className="text-sm text-[#171717]">{comp.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-white/50 rounded-lg flex items-center gap-2">
              <Save className="w-4 h-4 text-[#b7b7b7]" />
              <span className="text-sm text-[#b7b7b7]">Zustand 状态 + localStorage</span>
            </div>
          </div>

          {/* Arrow */}
          <div
            ref={arrow1Ref}
            className="hidden lg:flex items-center justify-center"
            style={{ transformOrigin: 'left center' }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-1 bg-gradient-to-r from-[#ff6e00] to-[#171717] rounded-full"/>
              <span className="text-xs text-[#b7b7b7]">关联</span>
            </div>
          </div>

          {/* Phase 2: Integration */}
          <div
            ref={phase2Ref}
            className="flex-1 bg-gradient-to-br from-[#171717]/5 to-[#171717]/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#171717] flex items-center justify-center">
                <Network className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="heading-5 text-[#171717]">全域关联与集成</h3>
                <p className="text-sm text-[#b7b7b7]">Integration & Validation</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {integrationComponents.map((comp, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <comp.icon className="w-4 h-4 text-[#171717]" />
                  <span className="text-sm text-[#171717]">{comp.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-white/50 rounded-lg text-center">
              <span className="text-sm font-medium text-[#171717]">71 条双向校验规则 + Agent 语义完备性评估</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DataFlow;
