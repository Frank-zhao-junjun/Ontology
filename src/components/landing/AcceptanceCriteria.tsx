import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Package, 
  ShieldAlert, 
  Clock, 
  FileText, 
  MessageSquare, 
  BarChart3,
  Settings,
  Wrench,
  GitBranch,
  ShieldCheck
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const AcceptanceCriteria = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

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

      // Cards animation
      const cards = cardsRef.current?.querySelectorAll('.criteria-card');
      if (cards) {
        gsap.fromTo(
          cards,
          { scale: 0.8, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: 'expo.out',
            stagger: 0.08,
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const criteria = [
    {
      icon: Package,
      title: '版本发布',
      description: '建模工具点击"发布"→生成代码包→Docker Compose启动→浏览器访问运行时',
    },
    {
      icon: ShieldAlert,
      title: '聚合根约束',
      description: '非聚合根实体尝试定义事件→系统警告"仅聚合根可发布领域事件"',
    },
    {
      icon: Clock,
      title: '事务边界',
      description: '状态流转事件默认AFTER_COMMIT→数据库事务提交后才触发订阅者',
    },
    {
      icon: FileText,
      title: '事件精简',
      description: '开启"领域事件模式"→字段选择器限制5个→强制包含ID字段',
    },
    {
      icon: MessageSquare,
      title: '自然语言查询',
      description: '运行时输入"列出张三的合同"→AI生成SQL→返回表格→右栏自动显示上下文',
    },
    {
      icon: BarChart3,
      title: '自然语言分析',
      description: '运行时输入"按部门统计合同金额"→AI生成饼图→中栏显示ECharts',
    },
    {
      icon: Settings,
      title: '自然语言操作',
      description: '运行时输入"将合同2025-001状态改为生效"→AI调用Skill→状态变更成功',
    },
    {
      icon: Wrench,
      title: '自愈机制',
      description: '运行时输入错误字段名→AI首次SQL失败→自动修正→成功执行→详细展示修正过程',
    },
    {
      icon: GitBranch,
      title: '版本切换',
      description: '运行时界面切换至v1.0.0→数据模型回退→操作旧版本数据',
    },
    {
      icon: ShieldCheck,
      title: '事件订阅幂等',
      description: '同一事件被订阅者处理两次→第二次检测到已处理ID→跳过不重复执行',
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
          验收<span className="text-[#ff6e00]">标准</span>
        </h2>

        {/* Criteria Cards */}
        <div
          ref={cardsRef}
          className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        >
          {criteria.map((item, index) => (
            <div
              key={index}
              className="criteria-card bg-[#f6f6f6] rounded-xl p-5 card-hover group cursor-pointer"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center mb-4 shadow-sm group-hover:bg-[#ff6e00] transition-colors duration-300">
                <item.icon className="w-6 h-6 text-[#ff6e00] group-hover:text-white transition-colors duration-300" />
              </div>

              {/* Title */}
              <h3 className="heading-5 text-[#171717] mb-2 group-hover:text-[#ff6e00] transition-colors">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-[#171717]/60 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AcceptanceCriteria;
