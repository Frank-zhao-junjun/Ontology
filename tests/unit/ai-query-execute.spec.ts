/**
 * AI 查询执行测试
 * 
 * 测试用例：
 * - UT-AI-003: 查询异常回传
 * - UT-AI-004: 查询成功结构
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BasicQueryService, type QueryRequest } from '@/lib/ai/query-service';

describe('AI Query Execute', () => {
  let service: BasicQueryService;

  beforeEach(() => {
    service = new BasicQueryService();
  });

  describe('UT-AI-003: 查询异常回传', () => {
    it('当执行查询抛出错误时应返回正确的错误信息', async () => {
      // 创建一个会抛出错误的 mock 服务
      class FailingQueryService extends BasicQueryService {
        protected override async _execute_query(): Promise<unknown[]> {
          throw new Error('数据库连接失败');
        }
      }

      const failingService = new FailingQueryService();
      const request: QueryRequest = {
        input: '查询合同列表',
      };

      const response = await failingService.query(request);

      // 验证返回结构
      expect(response.message).toContain('查询失败');
      expect(response.results).toEqual([]);
      expect(response.error).toContain('数据库连接失败');
    });

    it('错误信息应包含原始错误详情', async () => {
      class FailingQueryService extends BasicQueryService {
        protected override async _execute_query(): Promise<unknown[]> {
          throw new Error('表不存在: contract_table');
        }
      }

      const failingService = new FailingQueryService();
      const response = await failingService.query({ input: '查询合同列表' });

      expect(response.error).toContain('表不存在');
      expect(response.error).toContain('contract_table');
    });

    it('网络错误应被正确捕获', async () => {
      class NetworkErrorService extends BasicQueryService {
        protected override async _execute_query(): Promise<unknown[]> {
          throw new Error('Network error: Connection timeout');
        }
      }

      const networkService = new NetworkErrorService();
      const response = await networkService.query({ input: '查询合同列表' });

      expect(response.message).toContain('查询失败');
      expect(response.error).toContain('Network error');
    });
  });

  describe('UT-AI-004: 查询成功结构', () => {
    it('查询成功时应返回正确的结构', async () => {
      // 创建一个返回测试数据的 mock 服务
      class MockQueryService extends BasicQueryService {
        protected override async _execute_query(): Promise<unknown[]> {
          return [
            { id: 1, name: '合同A' },
            { id: 2, name: '合同B' },
          ];
        }
      }

      const mockService = new MockQueryService();
      const request: QueryRequest = {
        input: '查询合同列表',
      };

      const response = await mockService.query(request);

      // 验证返回结构
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('results');
      expect(response).toHaveProperty('query');
      expect(response.message).toBe('查询成功');
      expect(response.results).toHaveLength(2);
      expect(response.query?.intent).toBe('list');
    });

    it('query 对象应包含 intent 和 entity', async () => {
      class MockQueryService extends BasicQueryService {
        protected override async _execute_query(): Promise<unknown[]> {
          return [];
        }
      }

      const mockService = new MockQueryService();
      const response = await mockService.query({ input: '查询合同列表' });

      expect(response.query).toHaveProperty('intent');
      expect(response.query).toHaveProperty('entity');
      expect(response.query?.intent).toBe('list');
      expect(response.query?.entity).toBe('Contract');
    });

    it('空结果应返回空数组', async () => {
      class MockQueryService extends BasicQueryService {
        protected override async _execute_query(): Promise<unknown[]> {
          return [];
        }
      }

      const mockService = new MockQueryService();
      const response = await mockService.query({ input: '查询合同列表' });

      expect(response.results).toEqual([]);
      expect(response.message).toBe('查询成功');
    });
  });

  describe('额外测试：其他意图识别', () => {
    it('应正确识别详情查询意图', () => {
      const testCases = [
        { input: '查询合同详情', expected: 'detail' },
        { input: '获取合同详情', expected: 'detail' },
        { input: '查看合同详情', expected: 'detail' },
        { input: '合同详细信息', expected: 'detail' },
      ];

      for (const { input, expected } of testCases) {
        const intent = service.recognizeIntent(input);
        expect(intent).toBe(expected);
      }
    });

    it('应正确识别创建意图', () => {
      const testCases = [
        { input: '创建合同', expected: 'create' },
        { input: '新增合同', expected: 'create' },
        { input: '添加合同', expected: 'create' },
        { input: '新建合同', expected: 'create' },
      ];

      for (const { input, expected } of testCases) {
        const intent = service.recognizeIntent(input);
        expect(intent).toBe(expected);
      }
    });

    it('应正确识别更新意图', () => {
      const testCases = [
        { input: '更新合同', expected: 'update' },
        { input: '修改合同', expected: 'update' },
        { input: '编辑合同', expected: 'update' },
        { input: '更改合同', expected: 'update' },
      ];

      for (const { input, expected } of testCases) {
        const intent = service.recognizeIntent(input);
        expect(intent).toBe(expected);
      }
    });

    it('应正确识别删除意图', () => {
      const testCases = [
        { input: '删除合同', expected: 'delete' },
        { input: '移除合同', expected: 'delete' },
        { input: '取消合同', expected: 'delete' },
      ];

      for (const { input, expected } of testCases) {
        const intent = service.recognizeIntent(input);
        expect(intent).toBe(expected);
      }
    });

    it('无法识别意图时应返回 unknown', () => {
      const testCases = [
        { input: '随便说点什么' },
        { input: 'hello world' },
        { input: '12345' },
      ];

      for (const { input } of testCases) {
        const intent = service.recognizeIntent(input);
        expect(intent).toBe('unknown');
      }
    });
  });
});
