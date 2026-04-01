import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Database, 
  Brain, 
  FileCode, 
  Cpu, 
  Wrench, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const AIOrchestrator = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const centerRef = useRef<HTMLDivElement>(null);
  const componentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
      gsap.fromTo(
        titleRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: titleRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Center animation
      gsap.fromTo(
        centerRef.current,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.7,
          ease: 'elastic.out(1, 0.5)',
          scrollTrigger: {
            trigger: centerRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Components animation
      const components = componentsRef.current?.querySelectorAll('.orchestrator-component');
      if (components) {
        gsap.fromTo(
          components,
          { y: -50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            ease: 'expo.out',
            stagger: 0.1,
            scrollTrigger: {
              trigger: componentsRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const components = [
    {
      icon: Database,
      title: '上下文管理器',
      features: ['会话历史（SQLite）', '当前聚焦实体追踪', '元模型语义缓存'],
      position: 'top-left',
    },
    {
      icon: Brain,
      title: '意图分析器',
      features: ['分类：query/analyze/operate/navigate', '实体链接：识别涉及的实体类型', '操作提取：CRUD、聚合、时序等'],
      position: 'top',
    },
    {
      icon: FileCode,
      title: '语义注入器',
      features: ['按需注入：仅直接关联实体', '混合格式：JSON Schema + 自然语言', '缓存：元模型文件监听热载'],
      position: 'top-right',
    },
    {
      icon: Cpu,
      title: 'LLM策略引擎',
      features: ['单模型：DeepSeek-V3/豆包', 'Function Calling：结构化工具调用', '温度：0.3（低随机性）'],
      position: 'bottom-left',
    },
    {
      icon: Wrench,
      title: '工具执行器',
      features: ['execute_query: 只读SQL', 'call_skill: 领域技能', 'open_ui: 路由跳转', 'generate_chart: 图表配置'],
      position: 'bottom',
    },
    {
      icon: Sparkles,
      title: '自愈机制',
      features: ['错误捕获：SQL/工具执行异常', '修正Prompt：错误信息+元模型', '最多2次重试'],
      position: 'bottom-right',
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
          AI编排器<span className="text-[#ff6e00]">详细设计</span>
        </h2>

        {/* Orchestrator Diagram */}
        <div className="relative max-w-5xl mx-auto">
          {/* Center Core */}
          <div className="flex justify-center mb-12">
            <div
              ref={centerRef}
              className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#ff6e00] to-[#ff9a44] flex items-center justify-center shadow-2xl animate-center-pulse"
            >
              <div className="text-center text-white">
                <Sparkles className="w-8 h-8 mx-auto mb-1" />
                <span className="text-sm font-bold">编排器</span>
              </div>
              
              {/* Orbiting dots */}
              <div className="absolute inset-0 animate-rotate" style={{ animationDuration: '20s' }}>
                <div className="absolute -top-2 left-1/2 w-4 h-4 rounded-full bg-white shadow-lg"/>
              </div>
              <div className="absolute inset-0 animate-rotate" style={{ animationDuration: '15s', animationDirection: 'reverse' }}>
                <div className="absolute top-1/2 -right-2 w-3 h-3 rounded-full bg-[#171717] shadow-lg"/>
              </div>
            </div>
          </div>

          {/* Components Grid */}
          <div
            ref={componentsRef}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {components.map((comp, index) => (
              <div
                key={index}
                className="orchestrator-component bg-white rounded-xl p-5 shadow-lg card-hover group"
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-lg bg-[#ff6e00]/10 flex items-center justify-center mb-4 group-hover:bg-[#ff6e00] transition-colors duration-300">
                  <comp.icon className="w-6 h-6 text-[#ff6e00] group-hover:text-white transition-colors duration-300" />
                </div>

                {/* Title */}
                <h3 className="heading-5 text-[#171717] mb-3 group-hover:text-[#ff6e00] transition-colors">
                  {comp.title}
                </h3>

                {/* Features */}
                <ul className="space-y-2">
                  {comp.features.map((feature, fIndex) => (
                    <li
                      key={fIndex}
                      className="flex items-start gap-2 text-sm text-[#171717]/70"
                    >
                      <ArrowRight className="w-4 h-4 text-[#ff6e00] flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Connection Lines SVG */}
          <svg
            className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10"
            viewBox="0 0 1000 600"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff6e00" />
                <stop offset="100%" stopColor="#171717" />
              </linearGradient>
            </defs>
            {/* Lines from center to components */}
            <line x1="500" y1="100" x2="200" y2="250" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="8 8" className="animate-data-flow"/>
            <line x1="500" y1="100" x2="500" y2="250" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="8 8" className="animate-data-flow" style={{ animationDelay: '0.3s' }}/>
            <line x1="500" y1="100" x2="800" y2="250" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="8 8" className="animate-data-flow" style={{ animationDelay: '0.6s' }}/>
          </svg>
        </div>
      </div>
    </section>
  );
};

export default AIOrchestrator;
