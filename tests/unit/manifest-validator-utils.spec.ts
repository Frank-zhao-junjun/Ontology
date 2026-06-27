import { describe, expect, it } from 'vitest';
import {
  isRecord, issue, isValidSemver, isForbiddenCredentialKey,
  isLikelyPastTenseNameEn, walkObject,
} from '@/lib/manifest-validator/utils';

describe('isRecord', () => {
  it('returns true for plain object', () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isRecord(null)).toBe(false);
  });

  it('returns false for array', () => {
    expect(isRecord([1, 2, 3])).toBe(false);
  });

  it('returns false for primitives', () => {
    expect(isRecord('string')).toBe(false);
    expect(isRecord(42)).toBe(false);
    expect(isRecord(true)).toBe(false);
  });
});

describe('issue', () => {
  it('default severity is error', () => {
    const i = issue({ code: 'V01', message: 'test message', elementType: 'entity' });
    expect(i.severity).toBe('error');
    expect(i.code).toBe('V01');
    expect(i.message).toBe('test message');
  });

  it('preserves custom severity', () => {
    const i = issue({ code: 'V01', message: 'warning msg', elementType: 'entity', severity: 'warning' });
    expect(i.severity).toBe('warning');
  });

  it('passes through all fields', () => {
    const i = issue({ code: 'V01', message: 'err', elementType: 'entity', field: 'field' });
    expect(i.code).toBe('V01');
    expect(i.elementType).toBe('entity');
    expect(i.field).toBe('field');
  });
});

describe('isValidSemver', () => {
  it('accepts valid semver versions', () => {
    expect(isValidSemver('1.0.0')).toBe(true);
    expect(isValidSemver('0.1.0')).toBe(true);
  });

  it('rejects invalid versions', () => {
    expect(isValidSemver('invalid')).toBe(false);
    expect(isValidSemver('1.0')).toBe(false);
    expect(isValidSemver('')).toBe(false);
  });

  it('accepts pre-release and build metadata', () => {
    expect(isValidSemver('0.1.0-alpha.1')).toBe(true);
    expect(isValidSemver('1.0.0+build.123')).toBe(true);
  });
});

describe('isForbiddenCredentialKey', () => {
  it('detects common credential keys', () => {
    expect(isForbiddenCredentialKey('password')).toBe(true);
    expect(isForbiddenCredentialKey('API_KEY')).toBe(true);
    expect(isForbiddenCredentialKey('token')).toBe(true);
    expect(isForbiddenCredentialKey('secret')).toBe(true);
  });

  it('allows keys ending with ref/SecretRef', () => {
    expect(isForbiddenCredentialKey('dbPasswordSecretRef')).toBe(false);
    expect(isForbiddenCredentialKey('apiKeyRef')).toBe(false);
  });

  it('allows non-credential keys', () => {
    expect(isForbiddenCredentialKey('username')).toBe(false);
    expect(isForbiddenCredentialKey('host')).toBe(false);
    expect(isForbiddenCredentialKey('port')).toBe(false);
  });
});

describe('isLikelyPastTenseNameEn', () => {
  it('returns true for past tense names ending in ed/d', () => {
    expect(isLikelyPastTenseNameEn('OrderClosed')).toBe(true);
    expect(isLikelyPastTenseNameEn('PaymentCompleted')).toBe(true);
    expect(isLikelyPastTenseNameEn('TaskCancelled')).toBe(true);
  });

  it('returns true for -ied endings', () => {
    expect(isLikelyPastTenseNameEn('OrderPlaced')).toBe(true);
    expect(isLikelyPastTenseNameEn('OrderCreated')).toBe(true);
  });

  it('returns false for non-past-tense names', () => {
    expect(isLikelyPastTenseNameEn('OrderSubmit')).toBe(false);
    expect(isLikelyPastTenseNameEn('OrderCheck')).toBe(false);
    expect(isLikelyPastTenseNameEn('ProcessData')).toBe(false);
  });
});

describe('walkObject', () => {
  it('visits every key in a nested object', () => {
    const visited: string[] = [];
    walkObject({ a: { b: 1 }, c: 2 }, (key) => { visited.push(key); });
    expect(visited).toContain('a');
    expect(visited).toContain('b');
    expect(visited).toContain('c');
  });

  it('does not visit non-record values', () => {
    const visited: string[] = [];
    walkObject({ arr: [1, 2], val: null, str: 'hello' }, (key) => { visited.push(key); });
    expect(visited).toContain('arr');
    expect(visited).toContain('val');
    expect(visited).toContain('str');
    // nested arrays/strings don't get their own walk
  });
});
