/**
 * Superpowers Framework - Agent Skills System
 * 基于Superpowers框架的代理技能系统
 */

export type SkillCategory = 
  | 'planning' 
  | 'coding' 
  | 'testing' 
  | 'review' 
  | 'deployment'
  | 'documentation';

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  prompt: string;
  dependencies?: string[];
  enabled: boolean;
}

export interface SkillExecutionResult {
  success: boolean;
  output: string;
  artifacts?: Record<string, unknown>;
  nextSkills?: string[];
}

/**
 * 预定义的Superpowers技能
 */
export const SUPERPOWERS_SKILLS: AgentSkill[] = [
  {
    id: 'entity-design',
    name: '实体设计专家',
    description: '基于业务场景设计实体和属性',
    category: 'planning',
    prompt: `你是一个DDD领域驱动设计专家。请根据业务场景设计实体：
    
1. 识别聚合根和子实体
2. 定义核心属性和值对象
3. 建立实体间关系
4. 确保业务边界清晰

输出格式：JSON格式的实体定义`,
    enabled: true,
  },
  {
    id: 'state-machine-design',
    name: '状态机设计专家',
    description: '设计实体的状态流转和行为模型',
    category: 'planning',
    prompt: `你是一个状态机设计专家。请为实体设计状态流转：

1. 识别业务状态
2. 定义状态转换触发器
3. 设计前置条件和后置动作
4. 考虑异常处理流程

输出格式：JSON格式的状态机定义`,
    enabled: true,
  },
  {
    id: 'rule-design',
    name: '业务规则设计专家',
    description: '设计字段校验和业务规则',
    category: 'planning',
    prompt: `你是一个业务规则设计专家。请设计实体的业务规则：

1. 字段级校验规则
2. 跨字段校验规则
3. 跨实体校验规则
4. 聚合校验规则

输出格式：JSON格式的规则定义`,
    enabled: true,
  },
  {
    id: 'event-design',
    name: '事件设计专家',
    description: '设计领域事件和订阅机制',
    category: 'planning',
    prompt: `你是一个事件驱动架构专家。请设计领域事件：

1. 识别关键业务事件
2. 定义事件触发条件
3. 设计事件订阅者
4. 规划事件处理策略

输出格式：JSON格式的事件定义`,
    enabled: true,
  },
  {
    id: 'code-generation',
    name: '代码生成专家',
    description: '生成运行时代码和配置',
    category: 'coding',
    prompt: `你是一个代码生成专家。请根据模型生成代码：

1. 生成TypeScript类型定义
2. 生成数据访问层代码
3. 生成业务逻辑层代码
4. 生成API接口代码

输出格式：完整的代码文件`,
    enabled: true,
  },
  {
    id: 'test-generation',
    name: '测试生成专家',
    description: '生成单元测试和集成测试',
    category: 'testing',
    prompt: `你是一个测试专家。请为代码生成测试：

1. 单元测试用例
2. 集成测试场景
3. 边界条件测试
4. 异常处理测试

输出格式：完整的测试代码`,
    enabled: true,
  },
  {
    id: 'code-review',
    name: '代码评审专家',
    description: '评审代码质量和最佳实践',
    category: 'review',
    prompt: `你是一个代码评审专家。请评审代码：

1. 代码质量检查
2. 最佳实践建议
3. 性能优化建议
4. 安全漏洞检查

输出格式：评审报告`,
    enabled: true,
  },
  {
    id: 'documentation',
    name: '文档生成专家',
    description: '生成技术文档和API文档',
    category: 'documentation',
    prompt: `你是一个技术文档专家。请生成文档：

1. API接口文档
2. 数据模型文档
3. 业务流程文档
4. 部署运维文档

输出格式：Markdown文档`,
    enabled: true,
  },
];

/**
 * Superpowers技能管理器
 */
export class SuperpowersManager {
  private skills: Map<string, AgentSkill> = new Map();
  private executionHistory: Array<{
    skillId: string;
    timestamp: string;
    result: SkillExecutionResult;
  }> = [];

  constructor() {
    this.loadSkills();
  }

  private loadSkills(): void {
    SUPERPOWERS_SKILLS.forEach(skill => {
      this.skills.set(skill.id, skill);
    });
  }

  /**
   * 获取所有可用技能
   */
  getAvailableSkills(): AgentSkill[] {
    return Array.from(this.skills.values()).filter(s => s.enabled);
  }

  /**
   * 获取指定类别的技能
   */
  getSkillsByCategory(category: SkillCategory): AgentSkill[] {
    return this.getAvailableSkills().filter(s => s.category === category);
  }

  /**
   * 获取技能详情
   */
  getSkill(skillId: string): AgentSkill | undefined {
    return this.skills.get(skillId);
  }

  /**
   * 启用/禁用技能
   */
  toggleSkill(skillId: string, enabled: boolean): boolean {
    const skill = this.skills.get(skillId);
    if (skill) {
      skill.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * 添加自定义技能
   */
  addCustomSkill(skill: AgentSkill): void {
    this.skills.set(skill.id, skill);
  }

  /**
   * 记录执行历史
   */
  recordExecution(skillId: string, result: SkillExecutionResult): void {
    this.executionHistory.push({
      skillId,
      timestamp: new Date().toISOString(),
      result,
    });
  }

  /**
   * 获取执行历史
   */
  getExecutionHistory(limit?: number): Array<{
    skillId: string;
    timestamp: string;
    result: SkillExecutionResult;
  }> {
    const history = [...this.executionHistory].reverse();
    return limit ? history.slice(0, limit) : history;
  }
}

// 导出单例实例
export const superpowersManager = new SuperpowersManager();
