import type { ApiClient } from './client';
import type { CreateParentDto, UpdateParentDto } from './types';
import type { Parent } from '@/types';

export function normalizeParent(raw: any): Parent {
  if (!raw) return raw;
  const parentId = raw.parent?.id || raw.id;
  const fullName = raw.fullName || raw.user?.fullName || 'Noma’lum Ota-ona';
  const phone = raw.phone || raw.user?.phone || '';
  const address = raw.address || raw.parent?.address || '';
  const childrenIds = Array.isArray(raw.children)
    ? raw.children.map((c: any) => String(c.id || c))
    : Array.isArray(raw.childrenIds)
    ? raw.childrenIds.map(String)
    : [];

  return {
    id: String(parentId),
    fullName,
    phone,
    email: raw.email || (phone ? `${phone.replace(/[^0-9]/g, '')}@massaj.uz` : `${parentId}@massaj.uz`),
    address,
    role: 'PARENT',
    status: raw.status === 'ARCHIVED' ? 'ARCHIVED' : raw.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    childrenIds,
    createdAt: raw.createdAt || new Date().toISOString(),
    avatar: raw.avatar,
    notes: raw.notes,
  };
}

export class ParentsApi {
  constructor(private client: ApiClient) {}

  public async getAll(params?: { page?: number; limit?: number }): Promise<Parent[]> {
    const res = await this.client.get<any>('/parents', params);
    const list = Array.isArray(res) ? res : res?.data || res?.items || [];
    return list.map(normalizeParent);
  }

  public async getById(id: string): Promise<Parent> {
    const res = await this.client.get<any>(`/parents/${id}`);
    const item = res?.data || res;
    return normalizeParent(item);
  }

  public async create(dto: CreateParentDto): Promise<Parent> {
    const res = await this.client.post<any>('/parents', dto);
    const item = res?.data || res;
    return normalizeParent(item);
  }

  public async update(id: string, dto: UpdateParentDto): Promise<Parent> {
    const res = await this.client.patch<any>(`/parents/${id}`, dto);
    const item = res?.data || res;
    return normalizeParent(item);
  }

  public async getBalance(parentId: string): Promise<{ balance: number; debt: number }> {
    const res = await this.client.get<any>(`/parents/${parentId}/balance`);
    return res?.data || res || { balance: 0, debt: 0 };
  }

  public async getFinancialSummary(parentId: string): Promise<any> {
    const res = await this.client.get<any>(`/parents/${parentId}/financial-summary`);
    return res?.data || res;
  }

  public async getMe(): Promise<Parent> {
    const res = await this.client.get<any>('/parent/me');
    const item = res?.data || res;
    return normalizeParent(item);
  }
}
