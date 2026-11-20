import { type ApiClient } from './client';
import type { CreateAdminDto, UpdateAdminDto } from './types';
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

  /** Activate an admin account */
  public async activate(id: string): Promise<void> {
    await this.client.patch(`/admins/${id}/activate`);
  }

  /** Deactivate an admin account */
  public async deactivate(id: string): Promise<void> {
    await this.client.patch(`/admins/${id}/deactivate`);
  }

  /** Archive (soft-delete) an admin */
  public async archive(id: string): Promise<void> {
    await this.client.post(`/admins/${id}/archive`);
  }

  /** Restore a previously archived admin */
  public async restore(id: string): Promise<void> {
    await this.client.post(`/admins/${id}/restore`);
  }

  /** Safe delete maps to archive */
  public async delete(id: string): Promise<void> {
    await this.archive(id);
  }
}
