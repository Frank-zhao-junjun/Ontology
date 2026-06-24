import { describe, it, expect } from 'vitest';
import type { 
  Action, 
  BehaviorModel, 
  FunctionDefinition 
} from '../../src/types/ontology';

describe('Ontology Phase 2: Action & Rule Layer Models', () => {
  it('should support Palantir-style Action definitions with 10 types and parameters', () => {
    const mockAction: Action = {
      id: 'act_101',
      name: 'Create Order',
      nameEn: 'create_order',
      description: 'Creates a new customer order',
      actionType: 'create',
      targetEntityId: 'ent_order',
      executionType: 'sync',
      requiredRoles: ['sales_rep', 'admin'],
      parameters: [
        {
          id: 'param_1',
          name: 'Customer ID',
          nameEn: 'customerId',
          dataType: 'string',
          required: true
        }
      ],
      preConditions: ['rule_1'], // Rule IDs
      postEffects: ['evt_order_created']
    };

    expect(mockAction.actionType).toBe('create');
    expect(mockAction.parameters!.length).toBe(1);
    expect(mockAction.parameters![0].dataType).toBe('string');
  });

  it('should support Function binding (API integrations)', () => {
    const mockFunction: FunctionDefinition = {
      id: 'func_1',
      name: 'Verify Credit Limit',
      nameEn: 'verify_credit',
      description: 'Calls external ERP to verify credit',
      apiEndpoint: '/api/erp/credit-check',
      httpMethod: 'POST',
      parameters: [
        {
          id: 'param_f1',
          name: 'Customer ID',
          nameEn: 'customerId',
          dataType: 'string',
          required: true
        },
        {
          id: 'param_f2',
          name: 'Amount',
          nameEn: 'amount',
          dataType: 'decimal',
          required: true
        }
      ],
      returnType: 'boolean'
    };

    expect(mockFunction.httpMethod).toBe('POST');
    expect(mockFunction.parameters.length).toBe(2);
  });

  it('should integrate Actions and Functions into BehaviorModel', () => {
    const mockBehavior: BehaviorModel = {
      id: 'bm_1',
      name: 'Order Behaviors',
      version: '1.0',
      domain: 'Sales',
      stateMachines: [], // existing
      actions: [
        {
          id: 'act_1',
          name: 'Create',
          nameEn: 'create',
          actionType: 'create',
          targetEntityId: 'ent_1',
          executionType: 'sync',
          parameters: [],
          requiredRoles: []
        }
      ],
      functions: [],
      createdAt: '2026-04-21T00:00:00Z',
      updatedAt: '2026-04-21T00:00:00Z'
    };

    expect(mockBehavior.actions).toBeDefined();
    expect(mockBehavior.actions!.length).toBe(1);
  });
});
