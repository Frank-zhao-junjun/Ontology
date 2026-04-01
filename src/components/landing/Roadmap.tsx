import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  CheckCircle2, 
  Code2, 
  Brain, 
  Layout,
  Wrench,
  Calendar
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const Roadmap = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

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

      // Timeline animation
      const milestones = timelineRef.current?.querySelectorAll('.milestone');
      if (milestones) {
        milestones.forEach((milestone, index) => {
          const isLeft = index % 2 === 0;
          gsap.fromTo(
            milestone,
            { x: isLeft ? -50 : 50, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.5,
              ease: 'expo.out',
              scrollTrigger: {
                trigger: milestone,
                start: 'top 80%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        });
      }

      // Node animation
      const nodes = timelineRef.current?.querySelectorAll('.milestone-node');
      if (nodes) {
        gsap.fromTo(
          nodes,
          { scale: 0 },
          {
            scale: 1,
            duration: 0.4,
            ease: 'elastic.out(1, 0.5)',
            stagger: 0.15,
            scrollTrigger: {
              trigger: timelineRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const milestones = [
    {
      phase: 'M1',
      weeks: 'Week 1-4',
      title: '建模工具增强',
      description: '版本管理功能、发布对话框、聚合根标记',
      icon: Code2,
      deliverables: ['版本管理功能', '发布对话框', '聚合根标记'],
      status: 'completed',
    },
    {
      phase: 'M2',
      weeks: 'Week 5-8',
      title: '代码生成器',
      description: '后端生成器（Flask模型/API）、前端生成器（React组件）',
      icon: Code2,
      deliverables: ['后端生成器', '前端生成器', 'Docker配置'],
      status: 'in-progress',
    },
    {
      phase: 'M3',
      weeks: 'Week 9-12',
      title: 'AI编排器核心',
      description: '意图识别、按需注入、混合格式Prompt、工具执行',
      icon: Brain,
      deliverables: ['意图识别', '按需注入', '工具执行'],
      status: 'pending',
    },
    {
      phase: 'M4',
      weeks: 'Week 13-16',
      title: '运行时框架',
      description: '三栏式布局、6种数据视图、对话界面、版本切换',
      icon: Layout,
      deliverables: ['三栏式布局', '6种数据视图', '版本切换'],
      status: 'pending',
    },
    {
      phase: 'M5',
      weeks: 'Week 17-20',
      title: '自愈机制+可视化',
      description: '错误修正循环、ECharts/Mermaid渲染、详细展示',
      icon: Wrench,
      deliverables: ['自愈机制', '可视化渲染', '详细展示'],
      status: 'pending',
    },
    {
      phase: 'M6',
      weeks: 'Week 21-24',
      title: 'DDD事件增强',
      description: '聚合根约束、事务边界、精简模式、幂等性',
      icon: Calendar,
      deliverables: ['聚合根约束', '事务边界', '幂等性'],
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
          <span className="block text-lg font-normal text-[#b7b7b7] mt-2">(16-24周)</span>
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
                        <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#ff6e00] text-white">
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
                      className={`milestone-node w-12 h-12 rounded-full flex items-center justify-center shadow-lg animate-node-pulse ${
                        milestone.status === 'completed'
                          ? 'bg-[#ff6e00]'
                          : milestone.status === 'in-progress'
                          ? 'bg-[#171717]'
                          : 'bg-white border-2 border-[#cfcfcf]'
                      }`}
                    >
                      {milestone.status === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : (
                        <milestone.icon 
                          className={`w-5 h-5 ${
                            milestone.status === 'in-progress' ? 'text-white' : 'text-[#b7b7b7]'
                          }`} 
                        />
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
