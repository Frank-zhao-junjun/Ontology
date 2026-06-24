import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Code, 
  Layers, 
  Sparkles, 
  Users, 
  Box,
  Database
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Architecture = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardARef = useRef<HTMLDivElement>(null);

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

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const systemAFeatures = [
    { icon: Box, label: '平台', value: 'Web SaaS' },
    { icon: Code, label: '技术', value: 'Next.js 16 + React 19' },
    { icon: Layers, label: '元模型', value: '12大元模型可视化建模' },
    { icon: Sparkles, label: 'AI', value: 'AI辅助建模+语义层生成' },
    { icon: Users, label: '用户', value: '业务架构师/系统设计师' },
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
          建模系统架构<span className="text-[#ff6e00]">全景</span>
        </h2>

        {/* Architecture Cards */}
        <div className="max-w-3xl mx-auto" style={{ perspective: '1000px' }}>
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
        </div>
      </div>
    </section>
  );
};

export default Architecture;
