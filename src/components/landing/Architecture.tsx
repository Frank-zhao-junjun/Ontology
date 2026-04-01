import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Code, 
  Server, 
  Layers, 
  Sparkles, 
  Users, 
  Box,
  ArrowRight,
  Database,
  Workflow
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Architecture = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardARef = useRef<HTMLDivElement>(null);
  const cardBRef = useRef<HTMLDivElement>(null);
  const bridgeRef = useRef<HTMLDivElement>(null);

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

      // Card A animation
      gsap.fromTo(
        cardARef.current,
        { rotateY: -90, opacity: 0 },
        {
          rotateY: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: cardARef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Card B animation
      gsap.fromTo(
        cardBRef.current,
        { rotateY: 90, opacity: 0 },
        {
          rotateY: 0,
          opacity: 1,
          duration: 0.7,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: cardBRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Bridge animation
      gsap.fromTo(
        bridgeRef.current,
        { scale: 0.5, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          ease: 'elastic.out(1, 0.5)',
          scrollTrigger: {
            trigger: bridgeRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const systemAFeatures = [
    { icon: Box, label: '部署', value: 'Coze Studio' },
    { icon: Code, label: '技术', value: 'Next.js 16' },
    { icon: Layers, label: '功能', value: '四大元模型可视化编辑' },
    { icon: Sparkles, label: 'AI', value: '设计时辅助生成' },
    { icon: Users, label: '用户', value: '业务架构师/系统设计师' },
  ];

  const systemBFeatures = [
    { icon: Box, label: '部署', value: 'Docker Compose' },
    { icon: Code, label: '技术', value: 'React+Vite+Flask' },
    { icon: Workflow, label: '功能', value: '自然语言操作业务数据' },
    { icon: Sparkles, label: 'AI', value: '运行时动态编排执行' },
    { icon: Users, label: '用户', value: '业务操作员/最终用户' },
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
          双系统架构<span className="text-[#ff6e00]">全景</span>
        </h2>

        {/* Architecture Cards */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12" style={{ perspective: '1000px' }}>
          {/* System A Card */}
          <div
            ref={cardARef}
            className="bg-white rounded-2xl p-8 shadow-lg card-hover gpu-accelerated"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-[#ff6e00]/10 flex items-center justify-center">
                <Database className="w-7 h-7 text-[#ff6e00]" />
              </div>
              <div>
                <h3 className="heading-4 text-[#171717]">系统A：建模工具</h3>
                <p className="text-sm text-[#b7b7b7]">Ontology Modeling Tool</p>
              </div>
            </div>

            <div className="space-y-4">
              {systemAFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#f6f6f6] transition-colors duration-300"
                >
                  <feature.icon className="w-5 h-5 text-[#ff6e00]" />
                  <span className="text-sm font-medium text-[#b7b7b7] w-16">{feature.label}</span>
                  <span className="text-[#171717] font-medium">{feature.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System B Card */}
          <div
            ref={cardBRef}
            className="bg-white rounded-2xl p-8 shadow-lg card-hover gpu-accelerated"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-[#171717]/10 flex items-center justify-center">
                <Server className="w-7 h-7 text-[#171717]" />
              </div>
              <div>
                <h3 className="heading-4 text-[#171717]">系统B：运行时框架</h3>
                <p className="text-sm text-[#b7b7b7]">Ontology Runtime Engine</p>
              </div>
            </div>

            <div className="space-y-4">
              {systemBFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#f6f6f6] transition-colors duration-300"
                >
                  <feature.icon className="w-5 h-5 text-[#171717]" />
                  <span className="text-sm font-medium text-[#b7b7b7] w-16">{feature.label}</span>
                  <span className="text-[#171717] font-medium">{feature.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bridge Section */}
        <div
          ref={bridgeRef}
          className="bg-gradient-to-r from-[#ff6e00]/10 to-[#171717]/10 rounded-2xl p-8"
        >
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ff6e00] flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-[#171717]">桥接机制：版本发布</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-[#cfcfcf]"/>
            <p className="text-[#171717]/70 text-center md:text-left">
              建模工具&quot;发布&quot;按钮 → 生成代码包（React+Flask+SQLite）→ Docker启动
            </p>
          </div>
          <p className="text-sm text-[#b7b7b7] text-center mt-4">
            版本管理：建模工具保存多版本 → 运行时选择版本切换
          </p>
        </div>
      </div>
    </section>
  );
};

export default Architecture;
