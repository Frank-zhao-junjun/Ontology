import { describe, expect, it } from 'vitest';
import { generateId, generatePrefixedId } from '@/lib/id';

describe('generateId', () => {
  it('returns a non-empty string', () => {
    expect(generateId()).toBeTruthy();
    expect(typeof generateId()).toBe('string');
  });

  it('returns a UUID-like format (alphanumeric with dashes)', () => {
    const id = generateId();
    expect(id).toMatch(/^[a-f0-9-]+$/);
  });

  it('produces unique IDs on consecutive calls', () => {
    const ids = new Set(Array.from({ length: 10 }, () => generateId()));
    expect(ids.size).toBe(10);
  });
});

describe('generatePrefixedId', () => {
  it('returns string starting with prefix_', () => {
    const id = generatePrefixedId('prefix');
    expect(id.startsWith('prefix_')).toBe(true);
  });

  it('produces unique IDs on consecutive calls', () => {
    const ids = new Set(Array.from({ length: 5 }, () => generatePrefixedId('test')));
    expect(ids.size).toBe(5);
  });
});
