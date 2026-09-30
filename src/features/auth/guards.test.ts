import { describe, it, expect } from 'vitest';
import { ROLE_REDIRECTS } from './guards';

describe('Auth Guards and Role Redirects', () => {
  it('maps SUPER_ADMIN to /dashboard/super-admin', () => {
    expect(ROLE_REDIRECTS.SUPER_ADMIN).toBe('/dashboard/super-admin');
  });

  it('maps ADMIN to /dashboard/super-admin', () => {
    expect(ROLE_REDIRECTS.ADMIN).toBe('/dashboard/super-admin');
  });

  it('correctly maps SPECIALIST to /dashboard/specialist without 403 redirect', () => {
    expect(ROLE_REDIRECTS.SPECIALIST).toBe('/dashboard/specialist');
  });

  it('maps PARENT to /dashboard/parent', () => {
    expect(ROLE_REDIRECTS.PARENT).toBe('/dashboard/parent');
  });
});
