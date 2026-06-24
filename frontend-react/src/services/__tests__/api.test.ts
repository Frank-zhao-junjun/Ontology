import { describe, it, expect } from 'vitest';
import api from '../api';
describe('api service', () => {
  it('has baseURL configured', () => {
    expect(api.defaults.baseURL).toBe('http://localhost:5000/api');
  });
});
