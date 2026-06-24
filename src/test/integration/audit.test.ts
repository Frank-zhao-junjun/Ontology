/**
 * 审计基础能力测试
 * 
 * 测试用例：IT-AUDIT-001 ~ IT-AUDIT-002
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ========== 审计日志类型 ==========

interface AuditLog {
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

interface QueryLog {
  id: string;
  timestamp: string;
  queryType: 'list' | 'detail' | 'analyze' | 'other';
  entityType?: string;
  inputQuery: string;
  resultCount: number;
  duration: number;
}

// ========== 审计服务模拟 ==========

class AuditService {
  private auditLogs: AuditLog[] = [];
  private queryLogs: QueryLog[] = [];
  private enabled: boolean = true;

  /**
   * 启用/禁用审计
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 记录写操作
   */
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

  /**
   * 记录查询操作
   */
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

  /**
   * 获取审计日志
   */
  getAuditLogs(): AuditLog[] {
    return [...this.auditLogs];
  }

  /**
   * 获取查询日志
   */
  getQueryLogs(): QueryLog[] {
    return [...this.queryLogs];
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.auditLogs = [];
    this.queryLogs = [];
  }
}

// ========== 测试用例 ==========

describe('审计基础能力', () => {
  let auditService: AuditService;

  beforeEach(() => {
    auditService = new AuditService();
    auditService.setEnabled(true);
  });

  describe('IT-AUDIT-001: 写操作留痕', () => {
    it('执行实体状态变更应产生审计记录', () => {
      // 模拟执行实体状态变更
      const log = auditService.logWriteOperation(
        'transition',
        'Contract',
        'contract-001',
        {
          operator: 'user-001',
          beforeValue: { status: 'draft' },
          afterValue: { status: 'approved' },
          metadata: { transition: 'submit_approval' },
        }
      );

      // 验证审计记录
      expect(log).toBeDefined();
      expect(log.operationType).toBe('transition');
      expect(log.entityType).toBe('Contract');
      expect(log.entityId).toBe('contract-001');
      expect(log.timestamp).toBeDefined();
      expect(log.operator).toBe('user-001');
      expect(log.beforeValue).toEqual({ status: 'draft' });
      expect(log.afterValue).toEqual({ status: 'approved' });
    });

    it('审计记录应包含操作时间、操作类型、操作对象', () => {
      const beforeTime = new Date().toISOString();
      
      const log = auditService.logWriteOperation(
        'update',
        'Contract',
        'contract-002'
      );
      
      const afterTime = new Date().toISOString();

      // 验证必要字段
      expect(log.timestamp >= beforeTime).toBe(true);
      expect(log.timestamp <= afterTime).toBe(true);
      expect(log.operationType).toBe('update');
      expect(log.entityType).toBe('Contract');
      expect(log.entityId).toBe('contract-002');
    });

    it('多次写操作应产生多条审计记录', () => {
      auditService.logWriteOperation('create', 'Contract', 'c1');
      auditService.logWriteOperation('update', 'Contract', 'c2');
      auditService.logWriteOperation('delete', 'Contract', 'c3');

      const logs = auditService.getAuditLogs();
      expect(logs.length).toBe(3);

      expect(logs[0].operationType).toBe('create');
      expect(logs[1].operationType).toBe('update');
      expect(logs[2].operationType).toBe('delete');
    });

    it('创建操作应正确记录', () => {
      const log = auditService.logWriteOperation(
        'create',
        'Contract',
        'new-contract',
        {
          afterValue: { contractNo: 'CT-001', amount: 10000 },
        }
      );

      expect(log.operationType).toBe('create');
      expect(log.afterValue).toBeDefined();
    });

    it('删除操作应正确记录', () => {
      const log = auditService.logWriteOperation(
        'delete',
        'Contract',
        'old-contract',
        {
          beforeValue: { contractNo: 'CT-OLD', status: 'expired' },
        }
      );

      expect(log.operationType).toBe('delete');
      expect(log.beforeValue).toBeDefined();
    });
  });

  describe('IT-AUDIT-002: 只读查询日志', () => {
    it('执行只读查询应写入查询日志', () => {
      const log = auditService.logQueryOperation(
        'list',
        '查询合同列表',
        10,
        150,
        'Contract'
      );

      // 验证查询日志
      expect(log).toBeDefined();
      expect(log.queryType).toBe('list');
      expect(log.inputQuery).toBe('查询合同列表');
      expect(log.resultCount).toBe(10);
      expect(log.duration).toBe(150);
      expect(log.entityType).toBe('Contract');
      expect(log.timestamp).toBeDefined();
    });

    it('查询日志不应产生数据变更日志', () => {
      auditService.logQueryOperation('list', '查询合同列表', 5, 100);
      auditService.logQueryOperation('analyze', '统计合同数量', 1, 50);

      // 验证只有查询日志，没有审计日志
      const auditLogs = auditService.getAuditLogs();
      const queryLogs = auditService.getQueryLogs();

      expect(auditLogs.length).toBe(0);
      expect(queryLogs.length).toBe(2);
    });

    it('分析查询应正确记录', () => {
      const log = auditService.logQueryOperation(
        'analyze',
        '统计合同数量',
        1,
        200
      );

      expect(log.queryType).toBe('analyze');
      expect(log.resultCount).toBe(1);
    });

    it('详情查询应正确记录', () => {
      const log = auditService.logQueryOperation(
        'detail',
        '查询合同详情',
        1,
        50,
        'Contract'
      );

      expect(log.queryType).toBe('detail');
      expect(log.resultCount).toBe(1);
    });
  });

  describe('额外测试：审计开关', () => {
    it('禁用审计时不应记录', () => {
      auditService.setEnabled(false);

      expect(() => {
        auditService.logWriteOperation('create', 'Contract', 'c1');
      }).toThrow('审计未启用');

      expect(() => {
        auditService.logQueryOperation('list', 'test', 0, 0);
      }).toThrow('审计未启用');
    });
  });
});
