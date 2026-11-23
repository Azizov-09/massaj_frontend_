import type { UserRole } from '@/types';

export const ROLE_REDIRECTS: Record<UserRole, string> = {
  SUPER_ADMIN: '/dashboard/super-admin',
  ADMIN: '/dashboard/super-admin',
  SPECIALIST: '/403',
  PARENT: '/dashboard/parent',
};
