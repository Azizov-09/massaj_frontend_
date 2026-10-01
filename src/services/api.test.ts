import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api, ApiError } from './api';

describe('API Client Layer Tests', () => {
  beforeEach(() => {
    api.setToken(null);
  });

  it('manages access token correctly', () => {
    expect(api.getToken()).toBeNull();
    api.setToken('test-jwt-token');
    expect(api.getToken()).toBe('test-jwt-token');
    api.setToken(null);
    expect(api.getToken()).toBeNull();
  });

  it('instantiates ApiError with message and status', () => {
    const error = new ApiError('Not Found', 404, { detail: 'Missing resource' });
    expect(error.message).toBe('Not Found');
    expect(error.status).toBe(404);
    expect(error.data).toEqual({ detail: 'Missing resource' });
  });

  it('sends authorization header when token is present', async () => {
    api.setToken('mock-secret-token');

    const fakeFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'success' }),
    });

    globalThis.fetch = fakeFetch;

    const data = await api.get('/health');
    expect(data).toEqual({ status: 'success' });
    expect(fakeFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/health',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mock-secret-token',
        }),
      })
    );
  });
});
