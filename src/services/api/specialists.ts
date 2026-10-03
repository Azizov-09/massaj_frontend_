import type { ApiClient } from './client';
import type { CreateSpecialistDto, UpdateSpecialistDto } from './types';
import type { Specialist } from '@/types';

export function normalizeSpecialist(raw: any): Specialist {
  if (!raw) return raw;
  return {
    id: String(raw.id),
    fullName: raw.fullName || 'Noma’lum Mutaxassis',
    phone: raw.phone || '',
    email: raw.email || `${raw.phone?.replace(/[^0-9]/g, '') || raw.id}@massaj.uz`,
    role: 'SPECIALIST',
    specialization: raw.specialization || 'Pediatriya massaji va reabilitatsiya',
    experience: Number(raw.experienceYears ?? raw.experience ?? 3),
    workingDays: raw.workingDays || [1, 2, 3, 4, 5, 6],
    workingHours: raw.workingHours || { start: '09:00', end: '18:00' },
    bio: raw.bio || '',
    rating: Number(raw.rating ?? 4.9),
    status: raw.status === 'ARCHIVED' ? 'ARCHIVED' : raw.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    createdAt: raw.createdAt || new Date().toISOString(),
    avatar: raw.avatar,
  };
}

export class SpecialistsApi {
  constructor(private client: ApiClient) {}

  public async getAll(params?: { page?: number; limit?: number }): Promise<Specialist[]> {
    const res = await this.client.get<any>('/specialists', params);
    const list = Array.isArray(res) ? res : res?.data || res?.items || [];
    return list.map(normalizeSpecialist);
  }

  public async getById(id: string): Promise<Specialist> {
    const res = await this.client.get<any>(`/specialists/${id}`);
    const item = res?.data || res;
    return normalizeSpecialist(item);
  }

  public async create(dto: CreateSpecialistDto): Promise<Specialist> {
    const res = await this.client.post<any>('/specialists', dto);
    const item = res?.data || res;
    return normalizeSpecialist(item);
  }

  public async update(id: string, dto: UpdateSpecialistDto): Promise<Specialist> {
    const res = await this.client.patch<any>(`/specialists/${id}`, dto);
    const item = res?.data || res;
    return normalizeSpecialist(item);
  }

  public async archive(id: string): Promise<void> {
    await this.client.post(`/specialists/${id}/archive`);
  }

  public async getMe(): Promise<Specialist> {
    const res = await this.client.get<any>('/specialist/me');
    const item = res?.data || res;
    return normalizeSpecialist(item);
  }
}
