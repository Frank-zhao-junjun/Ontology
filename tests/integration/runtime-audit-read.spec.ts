/**
 * 运行时审计只读查询测试
 * 
 * 测试用例：
 * - IT-AUDIT-002: 只读查询日志
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AuditService } from './test-helpers';

describe('Runtime Audit Read', () => {
  let auditService: AuditService;

  beforeEach(() => {
    auditService = new AuditService();
    auditService.setEnabled(true);
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

    it('其他类型查询应正确记录', () => {
      const log = auditService.logQueryOperation(
        'other',
        '其他查询',
        0,
        10
      );

      expect(log.queryType).toBe('other');
    });
  });

  describe('查询日志字段完整性', () => {
    it('查询日志应包含所有必需字段', () => {
      const log = auditService.logQueryOperation(
        'list',
        '查询合同列表',
        10,
        150,
        'Contract'
      );

      expect(log).toHaveProperty('id');
      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('queryType');
      expect(log).toHaveProperty('inputQuery');
      expect(log).toHaveProperty('resultCount');
      expect(log).toHaveProperty('duration');
      expect(log).toHaveProperty('entityType');
    });

    it('查询日志 ID 应唯一', () => {
      const log1 = auditService.logQueryOperation('list', '查询1', 1, 10);
      const log2 = auditService.logQueryOperation('list', '查询2', 2, 20);

      expect(log1.id).not.toBe(log2.id);
    });
  });
});
