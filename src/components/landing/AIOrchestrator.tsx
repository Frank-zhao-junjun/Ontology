import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Brain, 
  MessageSquare,
  BookOpen,
  Network,
  Shield,
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
      gsap.fromTo(
        titleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out',
          scrollTrigger: { trigger: titleRef.current, start: 'top 80%', toggleActions: 'play none none reverse' },
        }
      );

      gsap.fromTo(
        centerRef.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.7, ease: 'elastic.out(1, 0.5)',
          scrollTrigger: { trigger: centerRef.current, start: 'top 75%', toggleActions: 'play none none reverse' },
        }
      );

      const components = componentsRef.current?.querySelectorAll('.orchestrator-component');
      if (components) {
        gsap.fromTo(
          components,
          { y: -50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'expo.out', stagger: 0.1,
            scrollTrigger: { trigger: componentsRef.current, start: 'top 75%', toggleActions: 'play none none reverse' },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const components = [
    {
      icon: MessageSquare,
      title: '意图映射',
      features: ['自然语言→Action映射', 'triggerPhrases触发短语', 'contextConstraints上下文约束', 'slotFilling槽位填充'],
      position: 'top-left',
    },
    {
      icon: BookOpen,
      title: '业务术语词典',
      features: ['BusinessTerm统一术语', '同义词/歧义说明', '模型引用关联', '领域分类'],
      position: 'top',
    },
    {
      icon: Network,
      title: '语义关系网络',
      features: ['10种语义关系(is-a/part-of等)', '跨实体字段映射', '语义等价推断', '关联传播'],
      position: 'top-right',
    },
    {
      icon: Brain,
      title: '对话上下文',
      features: ['聚焦实体追踪', '最近操作记录', '指代消解', '多轮对话状态'],
      position: 'bottom-left',
    },
    {
      icon: Shield,
      title: 'Agent策略',
      features: ['允许/拒绝/确认/升级', '角色行为边界', '意图处理权限', '人工确认触发'],
      position: 'bottom',
    },
    {
      icon: Sparkles,
      title: '错误恢复',
      features: ['重试/回退/升级/补偿', 'fallbackActionId链', '时效性标记', '完备性仪表盘'],
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
          className="heading-2 text-center text-[#171717] mb-4"
        >
          Agent语义层<span className="text-[#ff6e00]">架构</span>
        </h2>
        <p className="text-center text-[#b7b7b7] mb-16 max-w-2xl mx-auto">
          让 AI Agent 精准理解企业语义，从&ldquo;这是什么&rdquo;到&ldquo;我该做什么&rdquo;的完整映射
        </p>

        {/* Orchestrator Diagram */}
        <div className="relative max-w-5xl mx-auto">
          {/* Center Core */}
          <div className="flex justify-center mb-12">
            <div
              ref={centerRef}
              className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#6366F1] to-[#818CF8] flex items-center justify-center shadow-2xl animate-center-pulse"
            >
              <div className="text-center text-white">
                <Brain className="w-8 h-8 mx-auto mb-1" />
                <span className="text-sm font-bold">语义层</span>
              </div>
              
              {/* Orbiting dots */}
              <div className="absolute inset-0 animate-rotate" style={{ animationDuration: '20s' }}>
                <div className="absolute -top-2 left-1/2 w-4 h-4 rounded-full bg-white shadow-lg"/>
              </div>
              <div className="absolute inset-0 animate-rotate" style={{ animationDuration: '15s', animationDirection: 'reverse' }}>
                <div className="absolute top-1/2 -right-2 w-3 h-3 rounded-full bg-[#ff6e00] shadow-lg"/>
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
                <div className="w-12 h-12 rounded-lg bg-[#6366F1]/10 flex items-center justify-center mb-4 group-hover:bg-[#6366F1] transition-colors duration-300">
                  <comp.icon className="w-6 h-6 text-[#6366F1] group-hover:text-white transition-colors duration-300" />
                </div>

                {/* Title */}
                <h3 className="heading-5 text-[#171717] mb-3 group-hover:text-[#6366F1] transition-colors">
                  {comp.title}
                </h3>

                {/* Features */}
                <ul className="space-y-2">
                  {comp.features.map((feature, fIndex) => (
                    <li
                      key={fIndex}
                      className="flex items-start gap-2 text-sm text-[#171717]/70"
                    >
                      <ArrowRight className="w-4 h-4 text-[#6366F1] flex-shrink-0 mt-0.5" />
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
                <stop offset="0%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#ff6e00" />
              </linearGradient>
            </defs>
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
