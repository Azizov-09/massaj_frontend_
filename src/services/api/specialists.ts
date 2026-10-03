import type { ApiClient } from './client';
import type { CreateSpecialistDto, UpdateSpecialistDto } from './types';
import type { Specialist } from '@/types';

export function normalizeSpecialist(raw: any): Specialist {
  if (!raw) return raw;
  const specialistId = raw.specialist?.id || raw.id;
  const fullName = raw.fullName || raw.user?.fullName || 'Noma’lum Mutaxassis';
  const phone = raw.phone || raw.user?.phone || '';
  const specialization = raw.specialization || raw.specialist?.specialization || 'Pediatriya massaji va reabilitatsiya';
  const experienceYears = raw.experienceYears ?? raw.specialist?.experienceYears ?? raw.experience ?? 3;
  const bio = raw.bio || raw.specialist?.bio || '';

  return {
    id: String(specialistId),
    fullName,
    phone,
    email: raw.email || (phone ? `${phone.replace(/[^0-9]/g, '')}@massaj.uz` : `${specialistId}@massaj.uz`),
    role: 'SPECIALIST',
    specialization,
    experience: Number(experienceYears),
    workingDays: raw.workingDays || [1, 2, 3, 4, 5, 6],
    workingHours: raw.workingHours || { start: '09:00', end: '18:00' },
    bio,
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
