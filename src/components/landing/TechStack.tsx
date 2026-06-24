import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TechStack = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const layersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
      gsap.fromTo(
        titleRef.current,
        { y: -50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'bounce.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Layers animation
      const layers = layersRef.current?.children;
      if (layers) {
        gsap.fromTo(
          layers,
          { y: 100, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'expo.out',
            stagger: 0.15,
            scrollTrigger: {
              trigger: layersRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        );

        // Tags animation
        Array.from(layers).forEach((layer) => {
          const tags = layer.querySelectorAll('.tech-tag');
          gsap.fromTo(
            tags,
            { scale: 0 },
            {
              scale: 1,
              duration: 0.4,
              ease: 'elastic.out(1, 0.5)',
              stagger: 0.05,
              scrollTrigger: {
                trigger: layer,
                start: 'top 70%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const techLayers = [
    {
      title: '前端层',
      description: 'Frontend Stack',
      technologies: [
        { name: 'Next.js 16', desc: 'App Router, React 19' },
        { name: 'shadcn/ui', desc: 'Radix UI 组件库' },
        { name: 'Tailwind CSS 4', desc: '原子化样式' },
        { name: 'Zustand', desc: '轻量状态管理' },
      ],
      color: '#ff6e00',
    },
    {
      title: '建模与校验',
      description: 'Modeling & Validation',
      technologies: [
        { name: '12大元模型', desc: '5核心+3治理+2增强+2协作' },
        { name: 'EPC全域关联', desc: '71条双向校验规则' },
        { name: 'Excel导入', desc: '8 Sheet模板' },
        { name: '版本审核', desc: '待审核/通过/驳回' },
      ],
      color: '#171717',
    },
    {
      title: 'AI与语义层',
      description: 'AI & Semantic',
      technologies: [
        { name: 'coze-coding-dev-sdk', desc: '豆包大模型' },
        { name: 'Agent语义层', desc: '意图映射+术语+策略' },
        { name: '参考文档上传', desc: 'Word/PDF/Excel' },
        { name: 'HR系统同步', desc: '飞书/钉钉/企微/SAP' },
      ],
      color: '#6366F1',
    },
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
          技术<span className="text-[#ff6e00]">栈</span>
        </h2>

        {/* Tech Layers */}
        <div
          ref={layersRef}
          className="max-w-4xl mx-auto space-y-6"
          style={{ perspective: '800px' }}
        >
          {techLayers.map((layer, index) => (
            <div
              key={index}
              className="bg-[#f6f6f6] rounded-2xl p-6 transition-all duration-400 hover:scale-[1.02] hover:shadow-lg"
              style={{ 
                transform: 'rotateX(5deg)',
                transformOrigin: 'center bottom',
              }}
            >
              {/* Layer Header */}
              <div className="flex items-center gap-4 mb-4">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: layer.color }}
                />
                <div>
                  <h3 className="heading-5 text-[#171717]">{layer.title}</h3>
                  <p className="text-sm text-[#b7b7b7]">{layer.description}</p>
                </div>
              </div>

              {/* Technologies */}
              <div className="flex flex-wrap gap-3">
                {layer.technologies.map((tech, tIndex) => (
                  <div
                    key={tIndex}
                    className="tech-tag group px-4 py-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                  >
                    <span 
                      className="font-semibold text-[#171717] group-hover:text-[#ff6e00] transition-colors"
                    >
                      {tech.name}
                    </span>
                    <span className="text-xs text-[#b7b7b7] ml-2">
                      {tech.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TechStack;
