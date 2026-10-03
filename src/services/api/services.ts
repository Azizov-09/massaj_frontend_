import type { ApiClient } from './client';
import type { CreateServiceDto, UpdateServiceDto } from './types';
import type { Service } from '@/types';

export function normalizeService(raw: any): Service {
  if (!raw) return raw;
  return {
    id: String(raw.id),
    name: raw.name || 'Noma’lum xizmat',
    description: raw.description || '',
    durationMinutes: Number(raw.durationMinutes || 45),
    price: Number(raw.price || 0),
    status: raw.status === 'ARCHIVED' ? 'ARCHIVED' : raw.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    createdAt: raw.createdAt || new Date().toISOString(),
    color: raw.color || 'blue',
    category: raw.category || 'Reabilitatsiya',
    ageMin: raw.ageMin,
    ageMax: raw.ageMax,
  };
}

export class ServicesApi {
  constructor(private client: ApiClient) {}

  public async getAll(params?: { status?: string }): Promise<Service[]> {
    const res = await this.client.get<any>('/services', params);
    const list = Array.isArray(res) ? res : res?.data || res?.items || [];
    return list.map(normalizeService);
  }

  public async getById(id: string): Promise<Service> {
    const res = await this.client.get<any>(`/services/${id}`);
    const item = res?.data || res;
    return normalizeService(item);
  }

  public async create(dto: CreateServiceDto): Promise<Service> {
    const res = await this.client.post<any>('/services', dto);
    const item = res?.data || res;
    return normalizeService(item);
  }

  public async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    const res = await this.client.patch<any>(`/services/${id}`, dto);
    const item = res?.data || res;
    return normalizeService(item);
  }

  public async archive(id: string): Promise<void> {
    await this.client.post(`/services/${id}/archive`);
  }

  public async restore(id: string): Promise<void> {
    await this.client.post(`/services/${id}/restore`);
  }
}
