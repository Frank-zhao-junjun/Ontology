/**
 * 集成测试辅助函数
 */

import type { ConfigPackage } from '@/lib/configexporter';

export type { ConfigPackage } from '@/lib/configexporter';

export interface RuntimeState {
  status: 'idle' | 'loaded' | 'error';
  currentVersion: string | null;
  config: ConfigPackage | null;
  error: string | null;
}

export class RuntimeLoader {
  private state: RuntimeState = {
    status: 'idle',
    currentVersion: null,
    config: null,
    error: null,
  };

  load(config: ConfigPackage): void {
    try {
      this.validateConfig(config);
      
      this.state = {
        status: 'loaded',
        currentVersion: config.manifest.version,
        config,
        error: null,
      };
    } catch (error) {
      this.state = {
        status: 'error',
        currentVersion: null,
        config: null,
        error: error instanceof Error ? error.message : '加载失败',
      };
      throw error;
    }
  }

  private validateConfig(config: ConfigPackage): void {
    if (!config.manifest) {
      throw new Error('缺少 manifest');
    }
    if (!config.manifest.version) {
      throw new Error('缺少版本号');
    }
    if (!config.manifest.projectId) {
      throw new Error('缺少项目ID');
    }

    if (!config.files || config.files.length === 0) {
      throw new Error('配置包文件为空');
    }

    const filePaths = config.files.map(f => f.path);
    if (!filePaths.includes('config.json')) {
      throw new Error('缺少 config.json');
    }
    if (!filePaths.includes('data/entities.json')) {
      throw new Error('缺少 data/entities.json');
    }
  }

  getState(): RuntimeState {
    return { ...this.state };
  }

  switchVersion(newConfig: ConfigPackage): void {
    if (this.state.status !== 'loaded') {
      throw new Error('当前未加载任何配置');
    }
    this.load(newConfig);
  }
}

// ========== 审计服务 ==========

export interface AuditLog {
  id: string;
  timestamp: string;
  operationType: 'create' | 'update' | 'delete' | 'read' | 'transition';
  entityType: string;
  entityId: string;
  operator?: string;
  beforeValue?: unknown;
  afterValue?: unknown;
  metadata?: Record<string, unknown>;
}

export interface QueryLog {
  id: string;
  timestamp: string;
  queryType: 'list' | 'detail' | 'analyze' | 'other';
  entityType?: string;
  inputQuery: string;
  resultCount: number;
  duration: number;
}

export class AuditService {
  private auditLogs: AuditLog[] = [];
  private queryLogs: QueryLog[] = [];
  private enabled: boolean = true;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  logWriteOperation(
    operationType: 'create' | 'update' | 'delete' | 'transition',
    entityType: string,
    entityId: string,
    options: {
      operator?: string;
      beforeValue?: unknown;
      afterValue?: unknown;
      metadata?: Record<string, unknown>;
    } = {}
  ): AuditLog {
    if (!this.enabled) {
      throw new Error('审计未启用');
    }

    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      operationType,
      entityType,
      entityId,
      ...options,
    };

    this.auditLogs.push(log);
    return log;
  }

  logQueryOperation(
    queryType: 'list' | 'detail' | 'analyze' | 'other',
    inputQuery: string,
    resultCount: number,
    duration: number,
    entityType?: string
  ): QueryLog {
    if (!this.enabled) {
      throw new Error('审计未启用');
    }

    const log: QueryLog = {
      id: `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      queryType,
      inputQuery,
      resultCount,
      duration,
      entityType,
    };

    this.queryLogs.push(log);
    return log;
  }

  getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  getQueryLogs(): QueryLog[] {
    return [...this.queryLogs];
  }

  clearLogs(): void {
    this.auditLogs = [];
    this.queryLogs = [];
  }
}
