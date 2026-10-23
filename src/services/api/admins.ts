import { ApiError, type ApiClient } from './client';
import type { CreateAdminDto, UpdateAdminDto } from './types';
import type { AdminUser } from '@/types';

export function normalizeAdmin(raw: any): AdminUser {
  if (!raw || raw.id === undefined || raw.id === null || String(raw.id).trim() === '') {
    throw new ApiError("Server administrator ma'lumotini noto'g'ri formatda qaytardi.", 502, raw);
  }
  return {
    id: String(raw.id),
    fullName: raw.fullName || 'Administrator',
    phone: raw.phone || '',
    email: raw.email || `${raw.phone?.replace(/[^0-9]/g, '') || raw.id}@massaj.uz`,
    role: raw.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN',
    status: raw.status === 'ARCHIVED' ? 'ARCHIVED' : raw.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    createdAt: raw.createdAt || new Date().toISOString(),
    avatar: raw.avatar,
    lastLogin: raw.lastLogin || raw.lastLoginAt,
  };
}

export class AdminsApi {
  constructor(private client: ApiClient) {}

  public async getAll(params?: { page?: number; limit?: number }): Promise<AdminUser[]> {
    const res = await this.client.get<any>('/admins', params);
    const list = Array.isArray(res) ? res : res?.data || res?.items || [];
    return list.map(normalizeAdmin);
  }

  public async getById(id: string): Promise<AdminUser> {
    const res = await this.client.get<any>(`/admins/${id}`);
    const item = res?.data || res;
    return normalizeAdmin(item);
  }

  public async create(dto: CreateAdminDto): Promise<AdminUser> {
    const res = await this.client.post<any>('/admins', dto);
    const item = res?.data || res;
    return normalizeAdmin(item);
  }

  public async update(id: string, dto: UpdateAdminDto): Promise<AdminUser> {
    const res = await this.client.patch<any>(`/admins/${id}`, dto);
    const item = res?.data || res;
    return normalizeAdmin(item);
  }

  public async archive(id: string): Promise<void> {
    await this.client.post(`/admins/${id}/archive`);
  }
}
