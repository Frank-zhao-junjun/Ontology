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
        { name: 'React 18+', desc: 'Vite构建，轻量无SSR' },
        { name: 'Ant Design 5.x', desc: '企业级组件库' },
        { name: 'ECharts 5.x', desc: '统计图表' },
        { name: 'Mermaid 10.x', desc: '流程图/ER图' },
      ],
      color: '#ff6e00',
    },
    {
      title: '后端层',
      description: 'Backend Stack',
      technologies: [
        { name: 'Flask 2.3+', desc: 'Python轻量框架' },
        { name: 'SQLAlchemy 2.0+', desc: '动态模型映射' },
        { name: 'SQLite 3.x', desc: '单文件，零配置' },
      ],
      color: '#171717',
    },
    {
      title: 'AI与部署',
      description: 'AI & Deployment',
      technologies: [
        { name: 'OpenAI/DeepSeek', desc: 'Function Calling' },
        { name: 'Docker Compose', desc: '一键启动' },
      ],
      color: '#10B981',
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
