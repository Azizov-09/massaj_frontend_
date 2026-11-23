import { type ApiClient } from './client';
import type { UpdateAdminDto } from './types';
import type { AdminUser } from '@/types';
import { ApiError } from './client';

export function normalizeAdmin(raw: any): AdminUser {
  if (!raw || raw.id === undefined || raw.id === null || String(raw.id).trim() === '') {
    throw new ApiError("Server administrator ma'lumotini noto'g'ri formatda qaytardi.", 502, raw);
  }
  return {
    id: String(raw.id),
    fullName: raw.fullName || 'Administrator',
    phone: raw.phone || '',
    role: raw.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
    status:
      raw.status === 'ARCHIVED'
        ? 'ARCHIVED'
        : raw.status === 'INACTIVE'
        ? 'INACTIVE'
        : 'ACTIVE',
    createdAt: raw.createdAt || new Date().toISOString(),
    avatar: raw.avatar,
    lastLogin: raw.lastLogin || raw.lastLoginAt,
  };
}

export class AdminsApi {
  constructor(private client: ApiClient) {}

  public async update(id: string, dto: UpdateAdminDto): Promise<AdminUser> {
    const res = await this.client.patch<any>(`/admins/${id}`, dto);
    const item = res?.data || res;
    return normalizeAdmin(item);
  }
}
