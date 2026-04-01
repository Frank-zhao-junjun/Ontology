/**
 * 运行时审计写操作测试
 * 
 * 测试用例：
 * - IT-AUDIT-001: 写操作留痕
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AuditService } from './test-helpers';

describe('Runtime Audit Write', () => {
  let auditService: AuditService;

  beforeEach(() => {
    auditService = new AuditService();
    auditService.setEnabled(true);
  });

  describe('IT-AUDIT-001: 写操作留痕', () => {
    it('执行实体状态变更应产生审计记录', () => {
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

  describe('审计开关', () => {
    it('禁用审计时不应记录写操作', () => {
      auditService.setEnabled(false);

      expect(() => {
        auditService.logWriteOperation('create', 'Contract', 'c1');
      }).toThrow('审计未启用');
    });

    it('启用审计后应能正常记录', () => {
      auditService.setEnabled(false);
      auditService.setEnabled(true);

      const log = auditService.logWriteOperation('create', 'Contract', 'c1');
      expect(log).toBeDefined();
      expect(log.operationType).toBe('create');
    });
  });
});
