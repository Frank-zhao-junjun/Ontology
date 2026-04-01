import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Edit3, 
  Database, 
  Server, 
  Box,
  FileCode,
  Cpu,
  Container,
  HardDrive,
  Save
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const DataFlow = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const phase1Ref = useRef<HTMLDivElement>(null);
  const phase2Ref = useRef<HTMLDivElement>(null);
  const phase3Ref = useRef<HTMLDivElement>(null);
  const arrow1Ref = useRef<HTMLDivElement>(null);
  const arrow2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
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

      // Phase 1 animation
      gsap.fromTo(
        phase1Ref.current,
        { x: -100, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: phase1Ref.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Arrow 1 animation
      gsap.fromTo(
        arrow1Ref.current,
        { scaleX: 0, opacity: 0 },
        {
          scaleX: 1,
          opacity: 1,
          duration: 0.5,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: arrow1Ref.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Phase 2 animation
      gsap.fromTo(
        phase2Ref.current,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: phase2Ref.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Arrow 2 animation
      gsap.fromTo(
        arrow2Ref.current,
        { scaleX: 0, opacity: 0 },
        {
          scaleX: 1,
          opacity: 1,
          duration: 0.5,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: arrow2Ref.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Phase 3 animation
      gsap.fromTo(
        phase3Ref.current,
        { x: 100, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: phase3Ref.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const modelingComponents = [
    { icon: Edit3, label: '可视化编辑器' },
    { icon: Database, label: '数据模型定义' },
    { icon: Box, label: '行为模型定义' },
    { icon: FileCode, label: '规则模型定义' },
    { icon: Cpu, label: '事件模型定义' },
  ];

  const publishOutputs = [
    { icon: Database, label: 'SQLite DDL' },
    { icon: Server, label: 'Flask API' },
    { icon: FileCode, label: 'React组件' },
    { icon: Cpu, label: 'AI Agent' },
    { icon: Container, label: 'Docker配置' },
  ];

  const runtimeComponents = [
    { icon: Database, label: 'SQLite数据库' },
    { icon: Server, label: 'Flask REST API' },
    { icon: FileCode, label: 'React前端' },
    { icon: Cpu, label: 'AI编排器服务' },
    { icon: Container, label: 'Docker容器' },
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
          数据流转<span className="text-[#ff6e00]">架构</span>
        </h2>

        {/* Data Flow Diagram */}
        <div className="flex flex-col lg:flex-row items-stretch gap-6">
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
                <h3 className="heading-5 text-[#171717]">建模期（设计时）</h3>
                <p className="text-sm text-[#b7b7b7]">Modeling Phase</p>
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
              <span className="text-sm text-[#b7b7b7]">Zustand状态 + localStorage</span>
            </div>
          </div>

          {/* Arrow 1 */}
          <div
            ref={arrow1Ref}
            className="hidden lg:flex items-center justify-center"
            style={{ transformOrigin: 'left center' }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-1 bg-gradient-to-r from-[#ff6e00] to-[#171717] rounded-full"/>
              <span className="text-xs text-[#b7b7b7]">发布</span>
            </div>
          </div>

          {/* Phase 2: Publish */}
          <div
            ref={phase2Ref}
            className="flex-1 bg-gradient-to-br from-[#171717]/5 to-[#171717]/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#171717] flex items-center justify-center">
                <Box className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="heading-5 text-[#171717]">发布</h3>
                <p className="text-sm text-[#b7b7b7]">Publish Phase</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {publishOutputs.map((output, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <output.icon className="w-4 h-4 text-[#171717]" />
                  <span className="text-sm text-[#171717]">{output.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-white/50 rounded-lg text-center">
              <span className="text-sm font-medium text-[#171717]">版本化代码包</span>
            </div>
          </div>

          {/* Arrow 2 */}
          <div
            ref={arrow2Ref}
            className="hidden lg:flex items-center justify-center"
            style={{ transformOrigin: 'left center' }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-1 bg-gradient-to-r from-[#171717] to-[#ff6e00] rounded-full"/>
              <span className="text-xs text-[#b7b7b7]">加载</span>
            </div>
          </div>

          {/* Phase 3: Runtime */}
          <div
            ref={phase3Ref}
            className="flex-1 bg-gradient-to-br from-[#ff6e00]/5 to-[#171717]/5 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ff6e00] to-[#171717] flex items-center justify-center">
                <Server className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="heading-5 text-[#171717]">运行期（运行时）</h3>
                <p className="text-sm text-[#b7b7b7]">Runtime Phase</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {runtimeComponents.map((comp, index) => (
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
              <HardDrive className="w-4 h-4 text-[#b7b7b7]" />
              <span className="text-sm text-[#b7b7b7]">文件监听热载 + 元模型缓存</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DataFlow;
