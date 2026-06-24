/**
 * Ralph Loop - Autonomous AI Agent Loop
 * 基于Geoffrey Huntley的Ralph方法论实现自主AI代理循环
 */

export interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'high' | 'medium' | 'low';
  assignee?: string;
  startedAt?: string;
  completedAt?: string;
  attempts: number;
  maxAttempts: number;
  errors: string[];
}

export interface RalphLoopConfig {
  maxIterations: number;
  timeoutPerIteration: number;
  retryDelay: number;
  stopOnFirstError: boolean;
  enableParallelExecution: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface RalphLoopState {
  iteration: number;
  totalStories: number;
  completedStories: number;
  failedStories: number;
  inProgressStories: number;
  startTime: string;
  lastUpdateTime: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
}

export interface RalphLoopResult {
  success: boolean;
  totalIterations: number;
  completedStories: number;
  failedStories: number;
  duration: number;
  summary: string;
  details: UserStory[];
}

/**
 * Ralph Loop管理器
 */
export class RalphLoopManager {
  private stories: Map<string, UserStory> = new Map();
  private config: RalphLoopConfig;
  private state: RalphLoopState;
  private isRunning: boolean = false;
  private pauseRequested: boolean = false;

  constructor(config?: Partial<RalphLoopConfig>) {
    this.config = {
      maxIterations: 100,
      timeoutPerIteration: 300000, // 5分钟
      retryDelay: 5000,
      stopOnFirstError: false,
      enableParallelExecution: false,
      logLevel: 'info',
      ...config,
    };

    this.state = {
      iteration: 0,
      totalStories: 0,
      completedStories: 0,
      failedStories: 0,
      inProgressStories: 0,
      startTime: new Date().toISOString(),
      lastUpdateTime: new Date().toISOString(),
      status: 'idle',
    };
  }

  /**
   * 添加用户故事
   */
  addStory(story: Omit<UserStory, 'id' | 'status' | 'attempts' | 'errors'>): string {
    const id = `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullStory: UserStory = {
      ...story,
      id,
      status: 'pending',
      attempts: 0,
      errors: [],
      maxAttempts: story.maxAttempts || 3,
    };
    
    this.stories.set(id, fullStory);
    this.updateState();
    
    return id;
  }

  /**
   * 批量添加用户故事
   */
  addStories(stories: Array<Omit<UserStory, 'id' | 'status' | 'attempts' | 'errors'>>): string[] {
    return stories.map(story => this.addStory(story));
  }

  /**
   * 获取所有用户故事
   */
  getStories(): UserStory[] {
    return Array.from(this.stories.values());
  }

  /**
   * 获取指定状态的用户故事
   */
  getStoriesByStatus(status: UserStory['status']): UserStory[] {
    return this.getStories().filter(s => s.status === status);
  }

  /**
   * 获取下一个待处理的用户故事
   */
  getNextPendingStory(): UserStory | undefined {
    return this.getStoriesByStatus('pending')
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })[0];
  }

  /**
   * 更新用户故事状态
   */
  updateStoryStatus(
    storyId: string, 
    status: UserStory['status'], 
    error?: string
  ): boolean {
    const story = this.stories.get(storyId);
    if (!story) {
      return false;
    }

    story.status = status;
    
    if (status === 'in_progress') {
      story.startedAt = new Date().toISOString();
      story.attempts++;
    } else if (status === 'completed') {
      story.completedAt = new Date().toISOString();
    } else if (status === 'failed' && error) {
      story.errors.push(error);
      if (story.attempts < story.maxAttempts) {
        story.status = 'pending'; // 允许重试
      }
    }

    this.updateState();
    return true;
  }

  /**
   * 更新循环状态
   */
  private updateState(): void {
    const stories = this.getStories();
    this.state.totalStories = stories.length;
    this.state.completedStories = stories.filter(s => s.status === 'completed').length;
    this.state.failedStories = stories.filter(s => s.status === 'failed').length;
    this.state.inProgressStories = stories.filter(s => s.status === 'in_progress').length;
    this.state.lastUpdateTime = new Date().toISOString();
  }

  /**
   * 获取当前状态
   */
  getState(): RalphLoopState {
    return { ...this.state };
  }

  /**
   * 启动Ralph Loop
   */
  async start(
    executor: (story: UserStory) => Promise<boolean>
  ): Promise<RalphLoopResult> {
    if (this.isRunning) {
      throw new Error('Ralph Loop is already running');
    }

    this.isRunning = true;
    this.pauseRequested = false;
    this.state.status = 'running';
    this.state.startTime = new Date().toISOString();

    const startTime = Date.now();
    let iteration = 0;

    try {
      while (
        iteration < this.config.maxIterations &&
        !this.pauseRequested &&
        this.getStoriesByStatus('pending').length > 0
      ) {
        iteration++;
        this.state.iteration = iteration;

        const story = this.getNextPendingStory();
        if (!story) {
          break;
        }

        this.updateStoryStatus(story.id, 'in_progress');

        try {
          const success = await this.executeWithTimeout(
            executor(story),
            this.config.timeoutPerIteration
          );

          if (success) {
            this.updateStoryStatus(story.id, 'completed');
          } else {
            this.updateStoryStatus(story.id, 'failed', 'Execution returned false');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          this.updateStoryStatus(story.id, 'failed', errorMessage);

          if (this.config.stopOnFirstError) {
            break;
          }

          await this.delay(this.config.retryDelay);
        }
      }

      this.state.status = this.getStoriesByStatus('failed').length > 0 ? 'failed' : 'completed';
    } finally {
      this.isRunning = false;
    }

    const duration = Date.now() - startTime;
    const finalStories = this.getStories();

    return {
      success: this.state.failedStories === 0,
      totalIterations: iteration,
      completedStories: this.state.completedStories,
      failedStories: this.state.failedStories,
      duration,
      summary: this.generateSummary(),
      details: finalStories,
    };
  }

  /**
   * 暂停循环
   */
  pause(): void {
    this.pauseRequested = true;
    this.state.status = 'paused';
  }

  /**
   * 恢复循环
   */
  resume(): void {
    this.pauseRequested = false;
    this.state.status = 'running';
  }

  /**
   * 停止循环
   */
  stop(): void {
    this.isRunning = false;
    this.pauseRequested = true;
    this.state.status = 'idle';
  }

  /**
   * 带超时的执行
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Execution timeout')), timeout)
      ),
    ]);
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 生成执行摘要
   */
  private generateSummary(): string {
    const completed = this.state.completedStories;
    const failed = this.state.failedStories;
    const total = this.state.totalStories;

    if (failed === 0) {
      return `✅ 所有用户故事已完成 (${completed}/${total})`;
    } else if (completed === 0) {
      return `❌ 所有用户故事执行失败 (${failed}/${total})`;
    } else {
      return `⚠️ 部分用户故事完成 (完成: ${completed}, 失败: ${failed}, 总计: ${total})`;
    }
  }

  /**
   * 清空所有用户故事
   */
  clearStories(): void {
    this.stories.clear();
    this.updateState();
  }

  /**
   * 重置循环状态
   */
  reset(): void {
    this.stop();
    this.clearStories();
    this.state = {
      iteration: 0,
      totalStories: 0,
      completedStories: 0,
      failedStories: 0,
      inProgressStories: 0,
      startTime: new Date().toISOString(),
      lastUpdateTime: new Date().toISOString(),
      status: 'idle',
    };
  }
}

// 导出单例实例
export const ralphLoopManager = new RalphLoopManager();
