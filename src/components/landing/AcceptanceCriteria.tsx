import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Package, 
  Brain,
  Network,
  Building2,
  FileSpreadsheet,
  ShieldCheck,
  RefreshCw,
  GitBranch,
  BarChart3,
  Users,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const AcceptanceCriteria = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out',
          scrollTrigger: { trigger: titleRef.current, start: 'top 80%', toggleActions: 'play none none reverse' },
        }
      );

      const cards = cardsRef.current?.querySelectorAll('.criteria-card');
      if (cards) {
        gsap.fromTo(
          cards,
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: 'expo.out', stagger: 0.08,
            scrollTrigger: { trigger: cardsRef.current, start: 'top 75%', toggleActions: 'play none none reverse' },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const criteria = [
    {
      icon: Package,
      title: '版本管理与审核',
      description: '版本快照→待审核→审核通过应用；支持版本回溯和差异对比',
    },
    {
      icon: Brain,
      title: 'AI智能生成',
      description: '输入实体信息+参考文档→AI生成12大模型建议→一键应用到当前实体',
    },
    {
      icon: Network,
      title: 'EPC全域关联',
      description: '12大模型→EPC流程图自动关联→71条双向校验规则→覆盖率报告',
    },
    {
      icon: Building2,
      title: '组织与岗位',
      description: '部门树+结构化岗位职责→HR系统定时同步→4种冲突策略自动处理',
    },
    {
      icon: FileSpreadsheet,
      title: 'Excel导入',
      description: '下载8 Sheet模板→填写上传→23条校验规则→生成待审核版本',
    },
    {
      icon: RefreshCw,
      title: '实体生命周期',
      description: 'State增强11个字段→守卫条件→补偿动作→审计追溯完整记录',
    },
    {
      icon: Sparkles,
      title: 'Agent语义层',
      description: '意图→Action映射→槽位填充策略→术语词典→Agent行为策略',
    },
    {
      icon: ShieldCheck,
      title: '双向校验',
      description: 'EPC→模型引用完整性+模型→EPC覆盖度+交叉一致性自动检测',
    },
    {
      icon: GitBranch,
      title: '职责重叠检测',
      description: '两个岗位的职责scopeRefs+actions交集非空→自动预警冲突',
    },
    {
      icon: BarChart3,
      title: '语义完备性评估',
      description: '10维度评分→意图覆盖率→术语数→关系数→缺失提醒→仪表盘',
    },
    {
      icon: Users,
      title: '元数据优先匹配',
      description: 'AI生成属性时优先从57条元数据匹配→保证术语一致性',
    },
    {
      icon: AlertTriangle,
      title: '校验规则覆盖',
      description: 'V-LC×15 + V-AS×15 + V-XL×23 + VE×17 + VM×39 + VX×15 完整校验',
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
