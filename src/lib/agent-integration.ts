/**
 * Agent Integration Configuration
 * 代理集成配置
 */

import { superpowersManager, AgentSkill } from './superpowers/skills';
import { gstackManager, GstackWorkflow } from './gstack/workflows';
import { ralphLoopManager } from './ralph-loop/agent-loop';

export interface AgentIntegrationConfig {
  superpowers: {
    enabled: boolean;
    autoExecute: boolean;
    maxConcurrentSkills: number;
  };
  gstack: {
    enabled: boolean;
    autoStart: boolean;
    defaultRole: string;
  };
  ralphLoop: {
    enabled: boolean;
    maxIterations: number;
    timeoutPerIteration: number;
    stopOnFirstError: boolean;
  };
}

/**
 * 默认配置
 */
export const DEFAULT_AGENT_CONFIG: AgentIntegrationConfig = {
  superpowers: {
    enabled: true,
    autoExecute: false,
    maxConcurrentSkills: 3,
  },
  gstack: {
    enabled: true,
    autoStart: false,
    defaultRole: 'eng_manager',
  },
  ralphLoop: {
    enabled: true,
    maxIterations: 100,
    timeoutPerIteration: 300000,
    stopOnFirstError: false,
  },
};

/**
 * 代理集成管理器
 */
export class AgentIntegrationManager {
  private config: AgentIntegrationConfig;

  constructor(config: Partial<AgentIntegrationConfig> = {}) {
    this.config = { ...DEFAULT_AGENT_CONFIG, ...config };
  }

  /**
   * 获取配置
   */
  getConfig(): AgentIntegrationConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<AgentIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取所有可用的代理能力
   */
  getAvailableCapabilities() {
    return {
      superpowers: this.config.superpowers.enabled 
        ? superpowersManager.getAvailableSkills() 
        : [],
      gstack: this.config.gstack.enabled 
        ? gstackManager.getAvailableWorkflows() 
        : [],
      ralphLoop: this.config.ralphLoop.enabled 
        ? ralphLoopManager.getState() 
        : null,
    };
  }

  /**
   * 根据业务场景推荐技能
   */
  recommendSkills(scenario: string): {
    superpowers: AgentSkill[];
    gstack: GstackWorkflow[];
  } {
    const superpowersSkills = superpowersManager.getAvailableSkills();
    const gstackWorkflows = gstackManager.getAvailableWorkflows();

    // 根据场景关键词匹配技能
    const keywords = scenario.toLowerCase();
    
    const matchedSuperpowers = superpowersSkills.filter((skill) => {
      const skillText = `${skill.name} ${skill.description}`.toLowerCase();
      return (
        (keywords.includes('实体') && skill.category === 'planning') ||
        (keywords.includes('状态') && skill.id === 'state-machine-design') ||
        (keywords.includes('规则') && skill.id === 'rule-design') ||
        (keywords.includes('事件') && skill.id === 'event-design') ||
        (keywords.includes('代码') && skill.category === 'coding') ||
        (keywords.includes('测试') && skill.category === 'testing') ||
        skillText.split(/\s+/).some((token) => token.length > 1 && keywords.includes(token))
      );
    });

    const matchedGstack = gstackWorkflows.filter((workflow) => {
      const workflowText = `${workflow.name} ${workflow.description}`.toLowerCase();
      return (
        (keywords.includes('评审') && workflow.id.includes('review')) ||
        (keywords.includes('部署') && workflow.id.includes('ship')) ||
        (keywords.includes('文档') && workflow.id.includes('doc')) ||
        (keywords.includes('测试') && workflow.id.includes('browser')) ||
        workflowText.split(/\s+/).some((token) => token.length > 1 && keywords.includes(token))
      );
    });

    return {
      superpowers: matchedSuperpowers.length > 0 ? matchedSuperpowers : superpowersSkills.slice(0, 3),
      gstack: matchedGstack.length > 0 ? matchedGstack : gstackWorkflows.slice(0, 2),
    };
  }

  /**
   * 创建自动化建模任务
   */
  createModelingTasks(entityName: string, description: string): string[] {
    const storyIds: string[] = [];

    // 创建实体设计任务
    storyIds.push(ralphLoopManager.addStory({
      title: `设计实体: ${entityName}`,
      description: `为实体 ${entityName} 设计数据模型、属性和关系。${description}`,
      acceptanceCriteria: [
        '实体定义完整，包含所有必要属性',
        '属性类型正确，符合业务需求',
        '实体关系清晰，符合DDD原则',
      ],
      priority: 'high',
      maxAttempts: 3,
    }));

    // 创建状态机设计任务
    storyIds.push(ralphLoopManager.addStory({
      title: `设计状态机: ${entityName}`,
      description: `为实体 ${entityName} 设计状态流转和行为模型`,
      acceptanceCriteria: [
        '状态定义完整，覆盖所有业务状态',
        '状态转换逻辑正确',
        '触发器和动作配置合理',
      ],
      priority: 'medium',
      maxAttempts: 3,
    }));

    // 创建规则设计任务
    storyIds.push(ralphLoopManager.addStory({
      title: `设计业务规则: ${entityName}`,
      description: `为实体 ${entityName} 设计字段校验和业务规则`,
      acceptanceCriteria: [
        '字段校验规则完整',
        '跨字段校验逻辑正确',
        '错误消息清晰明确',
      ],
      priority: 'medium',
      maxAttempts: 3,
    }));

    // 创建事件设计任务
    storyIds.push(ralphLoopManager.addStory({
      title: `设计领域事件: ${entityName}`,
      description: `为实体 ${entityName} 设计领域事件和订阅机制`,
      acceptanceCriteria: [
        '关键业务事件识别完整',
        '事件订阅者配置正确',
        '事件处理策略合理',
      ],
      priority: 'low',
      maxAttempts: 3,
    }));

    return storyIds;
  }

  /**
   * 获取集成状态报告
   */
  getStatusReport(): {
    superpowers: {
      enabled: boolean;
      totalSkills: number;
      enabledSkills: number;
    };
    gstack: {
      enabled: boolean;
      totalWorkflows: number;
      enabledWorkflows: number;
      activeExecutions: number;
    };
    ralphLoop: {
      enabled: boolean;
      state: ReturnType<typeof ralphLoopManager.getState>;
    };
  } {
    const superpowersSkills = superpowersManager.getAvailableSkills();
    const gstackWorkflows = gstackManager.getAvailableWorkflows();
    const gstackExecutions = gstackManager.getActiveExecutions();
    const ralphState = ralphLoopManager.getState();

    return {
      superpowers: {
        enabled: this.config.superpowers.enabled,
        totalSkills: superpowersSkills.length,
        enabledSkills: superpowersSkills.filter(s => s.enabled).length,
      },
      gstack: {
        enabled: this.config.gstack.enabled,
        totalWorkflows: gstackWorkflows.length,
        enabledWorkflows: gstackWorkflows.filter(w => w.enabled).length,
        activeExecutions: gstackExecutions.length,
      },
      ralphLoop: {
        enabled: this.config.ralphLoop.enabled,
        state: ralphState,
      },
    };
  }
}

// 导出单例实例
export const agentIntegrationManager = new AgentIntegrationManager();
