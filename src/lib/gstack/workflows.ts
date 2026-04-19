/**
 * Gstack Integration - Claude Code Workflow Skills
 * 基于Garry Tan的Gstack框架集成
 */

export type GstackRole = 
  | 'ceo' 
  | 'designer' 
  | 'eng_manager' 
  | 'release_manager' 
  | 'doc_engineer' 
  | 'qa';

export interface GstackWorkflow {
  id: string;
  name: string;
  role: GstackRole;
  description: string;
  steps: WorkflowStep[];
  enabled: boolean;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'planning' | 'review' | 'execution' | 'validation';
  prompt: string;
  timeout?: number;
  retryCount?: number;
}

export interface WorkflowExecution {
  workflowId: string;
  currentStep: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: Array<{
    stepId: string;
    output: string;
    timestamp: string;
  }>;
  startedAt: string;
  completedAt?: string;
}

/**
 * Gstack预定义工作流
 */
export const GSTACK_WORKFLOWS: GstackWorkflow[] = [
  {
    id: 'plan-review',
    name: '计划评审工作流',
    role: 'ceo',
    description: '评审产品计划和需求文档',
    enabled: true,
    steps: [
      {
        id: 'analyze-requirements',
        name: '分析需求',
        type: 'planning',
        prompt: '分析需求文档，识别核心业务场景和实体',
        timeout: 30000,
      },
      {
        id: 'validate-feasibility',
        name: '验证可行性',
        type: 'validation',
        prompt: '验证技术可行性和资源需求',
        timeout: 20000,
      },
      {
        id: 'generate-plan',
        name: '生成计划',
        type: 'execution',
        prompt: '生成详细的实施计划和时间表',
        timeout: 30000,
      },
    ],
  },
  {
    id: 'code-review',
    name: '代码评审工作流',
    role: 'eng_manager',
    description: '评审代码质量和架构设计',
    enabled: true,
    steps: [
      {
        id: 'static-analysis',
        name: '静态分析',
        type: 'review',
        prompt: '执行代码静态分析，检查代码规范',
        timeout: 60000,
      },
      {
        id: 'architecture-review',
        name: '架构评审',
        type: 'review',
        prompt: '评审架构设计，确保符合DDD原则',
        timeout: 45000,
      },
      {
        id: 'security-audit',
        name: '安全审计',
        type: 'validation',
        prompt: '执行安全审计，识别潜在风险',
        timeout: 30000,
      },
    ],
  },
  {
    id: 'one-command-ship',
    name: '一键部署工作流',
    role: 'release_manager',
    description: '自动化部署和发布流程',
    enabled: true,
    steps: [
      {
        id: 'pre-deploy-check',
        name: '部署前检查',
        type: 'validation',
        prompt: '执行部署前检查，确保所有测试通过',
        timeout: 120000,
      },
      {
        id: 'build-artifacts',
        name: '构建产物',
        type: 'execution',
        prompt: '构建部署产物，生成配置文件',
        timeout: 180000,
      },
      {
        id: 'deploy',
        name: '执行部署',
        type: 'execution',
        prompt: '执行部署操作，更新运行环境',
        timeout: 300000,
      },
      {
        id: 'post-deploy-verify',
        name: '部署后验证',
        type: 'validation',
        prompt: '验证部署结果，执行冒烟测试',
        timeout: 60000,
      },
    ],
  },
  {
    id: 'browser-automation',
    name: '浏览器自动化工作流',
    role: 'qa',
    description: '自动化UI测试和交互验证',
    enabled: true,
    steps: [
      {
        id: 'setup-test-env',
        name: '设置测试环境',
        type: 'planning',
        prompt: '准备浏览器自动化测试环境',
        timeout: 30000,
      },
      {
        id: 'execute-tests',
        name: '执行测试',
        type: 'execution',
        prompt: '执行UI自动化测试脚本',
        timeout: 180000,
      },
      {
        id: 'generate-report',
        name: '生成报告',
        type: 'execution',
        prompt: '生成测试报告和截图',
        timeout: 20000,
      },
    ],
  },
  {
    id: 'engineering-retro',
    name: '工程回顾工作流',
    role: 'eng_manager',
    description: '回顾迭代过程，总结经验教训',
    enabled: true,
    steps: [
      {
        id: 'collect-metrics',
        name: '收集指标',
        type: 'planning',
        prompt: '收集项目指标和统计数据',
        timeout: 30000,
      },
      {
        id: 'analyze-issues',
        name: '分析问题',
        type: 'review',
        prompt: '分析遇到的问题和解决方案',
        timeout: 45000,
      },
      {
        id: 'generate-retro-report',
        name: '生成回顾报告',
        type: 'execution',
        prompt: '生成回顾报告和改进建议',
        timeout: 30000,
      },
    ],
  },
  {
    id: 'doc-generation',
    name: '文档生成工作流',
    role: 'doc_engineer',
    description: '自动生成技术文档',
    enabled: true,
    steps: [
      {
        id: 'extract-api-specs',
        name: '提取API规格',
        type: 'planning',
        prompt: '从代码中提取API接口规格',
        timeout: 45000,
      },
      {
        id: 'generate-api-docs',
        name: '生成API文档',
        type: 'execution',
        prompt: '生成API接口文档',
        timeout: 30000,
      },
      {
        id: 'generate-model-docs',
        name: '生成模型文档',
        type: 'execution',
        prompt: '生成数据模型和业务流程文档',
        timeout: 30000,
      },
    ],
  },
];

/**
 * Gstack工作流管理器
 */
export class GstackManager {
  private workflows: Map<string, GstackWorkflow> = new Map();
  private activeExecutions: Map<string, WorkflowExecution> = new Map();

  constructor() {
    this.loadWorkflows();
  }

  private loadWorkflows(): void {
    GSTACK_WORKFLOWS.forEach(workflow => {
      this.workflows.set(workflow.id, workflow);
    });
  }

  /**
   * 获取所有可用工作流
   */
  getAvailableWorkflows(): GstackWorkflow[] {
    return Array.from(this.workflows.values()).filter(w => w.enabled);
  }

  /**
   * 获取指定角色的工作流
   */
  getWorkflowsByRole(role: GstackRole): GstackWorkflow[] {
    return this.getAvailableWorkflows().filter(w => w.role === role);
  }

  /**
   * 获取工作流详情
   */
  getWorkflow(workflowId: string): GstackWorkflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * 启动工作流执行
   */
  startExecution(workflowId: string): WorkflowExecution | null {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || !workflow.enabled) {
      return null;
    }

    const execution: WorkflowExecution = {
      workflowId,
      currentStep: 0,
      status: 'pending',
      results: [],
      startedAt: new Date().toISOString(),
    };

    this.activeExecutions.set(execution.startedAt, execution);
    return execution;
  }

  /**
   * 获取活跃的执行
   */
  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values())
      .filter(e => e.status === 'running' || e.status === 'pending');
  }

  /**
   * 更新执行状态
   */
  updateExecution(
    executionId: string, 
    stepId: string, 
    output: string
  ): boolean {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return false;
    }

    execution.results.push({
      stepId,
      output,
      timestamp: new Date().toISOString(),
    });

    const workflow = this.workflows.get(execution.workflowId);
    if (workflow) {
      const stepIndex = workflow.steps.findIndex(s => s.id === stepId);
      if (stepIndex >= 0) {
        execution.currentStep = stepIndex + 1;
        if (execution.currentStep >= workflow.steps.length) {
          execution.status = 'completed';
          execution.completedAt = new Date().toISOString();
        }
      }
    }

    return true;
  }

  /**
   * 添加自定义工作流
   */
  addCustomWorkflow(workflow: GstackWorkflow): void {
    this.workflows.set(workflow.id, workflow);
  }
}

// 导出单例实例
export const gstackManager = new GstackManager();
