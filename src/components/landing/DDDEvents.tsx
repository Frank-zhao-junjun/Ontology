import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  Layers, 
  Clock, 
  FileText, 
  Shield, 
  Globe, 
  History
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const DDDEvents = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState(0);

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

      // Tabs animation
      gsap.fromTo(
        tabsRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: 'expo.out',
          scrollTrigger: {
            trigger: tabsRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Content animation
      gsap.fromTo(
        contentRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.5,
          ease: 'smooth',
          scrollTrigger: {
            trigger: contentRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const decisions = [
    {
      id: 'E1',
      icon: Layers,
      title: '聚合根约束',
      decision: '标记聚合根',
      description: '数据模型使用 `entityRole` / `parentAggregateId`，仅聚合根可发布事件',
      details: '在Ontology建模中，实体通过 `entityRole` 明确区分 `aggregate_root` 与 `child_entity`。只有聚合根可以发布领域事件；聚合内子实体需要通过 `parentAggregateId` 归属到对应聚合。',
      code: `interface Entity {
  id: string;
  name: string;
  entityRole: 'aggregate_root' | 'child_entity';
  parentAggregateId?: string; // 子实体时必填
}`,
    },
    {
      id: 'E2',
      icon: Clock,
      title: '事务边界',
      decision: '默认AFTER_COMMIT',
      description: '事务提交后发布（默认），事务内执行（高级BEFORE_COMMIT）',
      details: '领域事件默认在事务提交后发布（AFTER_COMMIT），确保数据持久化成功后才触发事件。对于需要事务内执行的校验或审计场景，可选择BEFORE_COMMIT。',
      code: `interface EventDefinition {
  trigger: 'create' | 'update' | 'delete' | 'state_change';
  transactionPhase: 'AFTER_COMMIT' | 'BEFORE_COMMIT';
  // 默认AFTER_COMMIT
}`,
    },
    {
      id: 'E3',
      icon: FileText,
      title: '事件内容',
      decision: '强制精简模式',
      description: '领域事件模式开关，限制5个字段，强制ID+关键字段',
      details: '开启"领域事件模式"后，事件载荷限制最多5个字段，强制包含聚合ID和关联聚合ID。这避免了事件过于臃肿，同时保证必要信息的传递。',
      code: `interface EventPayload {
  mandatory: ['entity_id', 'related_aggregate_id'];
  optional: string[]; // 最多3个可选字段
  // 总计最多5个字段
}`,
    },
    {
      id: 'E4',
      icon: Shield,
      title: '幂等性',
      decision: '事件ID去重',
      description: '运行时生成唯一事件ID，订阅者记录已处理ID',
      details: '每个领域事件生成唯一的UUID作为事件ID。订阅者处理事件时，使用"{event_id}:{handler_id}"作为幂等键，确保同一事件不会被重复处理。',
      code: `class EventSubscriber {
  handle(event: DomainEvent) {
    const idempotencyKey = 
      \`\${event.id}:\${this.handlerId}\`;
    // INSERT IGNORE语义
    // 防止重复处理
  }
}`,
    },
    {
      id: 'E5',
      icon: Globe,
      title: '跨上下文',
      decision: '保持现状',
      description: 'MVP阶段webhook作为跨系统方式',
      details: '在MVP阶段，跨限界上下文的通信通过webhook实现。订阅者可以配置webhook URL，当事件触发时，系统会向指定的URL发送HTTP请求。',
      code: `interface EventSubscription {
  actionType: 'webhook';
  actionRef: 'https://api.example.com/webhook';
  // 跨系统通知
}`,
    },
    {
      id: 'E6',
      icon: History,
      title: '事件溯源',
      decision: '不支持',
      description: 'MVP阶段事件仅作为通知，状态存储于实体表',
      details: 'MVP阶段不实现完整的事件溯源（Event Sourcing）。领域事件仅作为通知机制使用，系统状态仍然存储在实体表中。这简化了实现复杂度，同时满足基本需求。',
      code: `// 事件仅作为通知
// 状态存储于实体表
class Contract {
  private _state: ContractState; // 状态存储
  // 非事件溯源
}`,
    },
  ];

  const handleTabChange = (index: number) => {
    if (index === activeTab) return;
    
    // Animate content transition
    gsap.to(contentRef.current, {
      opacity: 0,
      x: index > activeTab ? -30 : 30,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        setActiveTab(index);
        gsap.fromTo(
          contentRef.current,
          { opacity: 0, x: index > activeTab ? 30 : -30 },
          { opacity: 1, x: 0, duration: 0.3, ease: 'expo.out' }
        );
      },
    });
  };

  return (
    <section
      ref={sectionRef}
      className="relative w-full py-24 bg-white"
    >
      <div className="section-container">
        {/* Section Title */}
        <h2
          ref={titleRef}
          className="heading-2 text-center text-[#171717] mb-12"
        >
          DDD领域事件<span className="text-[#ff6e00]">设计</span>
        </h2>

        {/* Tabs */}
        <div
          ref={tabsRef}
          className="flex flex-wrap justify-center gap-2 mb-8"
        >
          {decisions.map((decision, index) => (
            <button
              key={decision.id}
              onClick={() => handleTabChange(index)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                activeTab === index
                  ? 'bg-[#ff6e00] text-white shadow-lg'
                  : 'bg-[#f6f6f6] text-[#171717]/70 hover:bg-[#e9e9e9]'
              }`}
            >
              <span className="mr-1">{decision.id}:</span>
              {decision.title}
            </button>
          ))}
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-[#f6f6f6] rounded-2xl p-8">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-[#ff6e00]/10 flex items-center justify-center flex-shrink-0">
                {(() => {
                  const IconComponent = decisions[activeTab].icon;
                  return <IconComponent className="w-7 h-7 text-[#ff6e00]" />;
                })()}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#ff6e00] text-white">
                    {decisions[activeTab].id}
                  </span>
                  <h3 className="heading-4 text-[#171717]">{decisions[activeTab].title}</h3>
                </div>
                <p className="text-lg font-medium text-[#ff6e00]">
                  决策: {decisions[activeTab].decision}
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="body-text text-[#171717]/70 mb-6">
              {decisions[activeTab].description}
            </p>

            {/* Details */}
            <div className="bg-white rounded-xl p-5 mb-6">
              <h4 className="heading-5 text-[#171717] mb-3">详细说明</h4>
              <p className="text-[#171717]/70 leading-relaxed">
                {decisions[activeTab].details}
              </p>
            </div>

            {/* Code Example */}
            <div className="bg-[#171717] rounded-xl p-5 overflow-x-auto">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-[#ff6e00]"/>
                <span className="text-sm text-[#b7b7b7]">Code Example</span>
              </div>
              <pre className="text-sm text-[#e9e9e9] font-mono leading-relaxed">
                <code>{decisions[activeTab].code}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DDDEvents;
