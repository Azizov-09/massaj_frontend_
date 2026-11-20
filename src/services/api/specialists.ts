import type { ApiClient } from './client';
import type { CreateSpecialistDto, UpdateSpecialistDto } from './types';
import type { Specialist } from '@/types';

export function normalizeSpecialist(raw: any): Specialist {
  if (!raw) return raw;
  const specialistId = raw.specialist?.id || raw.id;
  const fullName = raw.fullName || raw.user?.fullName || 'Noma\u02bclum Mutaxassis';
  const phone = raw.phone || raw.user?.phone || '';
  const specialization =
    raw.specialization ||
    raw.specialist?.specialization ||
    'Pediatriya massaji va reabilitatsiya';
  const experienceYears =
    raw.experienceYears ?? raw.specialist?.experienceYears ?? raw.experience ?? 3;
  const bio = raw.bio || raw.specialist?.bio || '';

  // Normalize workingDays — backend may return 0-based (Sun=0) or 1-based arrays
  let workingDays: number[] = raw.workingDays || raw.specialist?.workingDays || [1, 2, 3, 4, 5, 6];
  if (!Array.isArray(workingDays)) workingDays = [1, 2, 3, 4, 5, 6];

  return {
    id: String(specialistId),
    fullName,
    phone,
    role: 'SPECIALIST',
    specialization,
    experience: Number(experienceYears),
    workingDays,
    workingHours: raw.workingHours || raw.specialist?.workingHours || { start: '09:00', end: '18:00' },
    bio,
    rating: Number(raw.rating ?? 4.9),
    status:
      raw.status === 'ARCHIVED'
        ? 'ARCHIVED'
        : raw.status === 'INACTIVE'
        ? 'INACTIVE'
        : 'ACTIVE',
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

  /** Update specialist status via contract: PATCH /specialists/:id/status { status } */
  public async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<void> {
    try {
      await this.client.patch(`/specialists/${id}/status`, { status });
    } catch {
      // Fallback to dedicated activate/deactivate endpoints
      if (status === 'ACTIVE') {
        await this.client.patch(`/specialists/${id}/activate`);
      } else {
        await this.client.patch(`/specialists/${id}/deactivate`);
      }
    }
  }

  /** Activate a specialist — uses status endpoint */
  public async activate(id: string): Promise<void> {
    await this.updateStatus(id, 'ACTIVE');
  }

  /** Deactivate a specialist — uses status endpoint */
  public async deactivate(id: string): Promise<void> {
    await this.updateStatus(id, 'INACTIVE');
  }

  /** Archive (soft-delete) a specialist */
  public async archive(id: string): Promise<void> {
    await this.client.post(`/specialists/${id}/archive`);
  }

  /** Restore a previously archived specialist */
  public async restore(id: string): Promise<void> {
    await this.client.post(`/specialists/${id}/restore`);
  }

  /** Alias: archive is the safe "delete" semantic */
  public async delete(id: string): Promise<void> {
    await this.archive(id);
  }

  public async getMe(): Promise<Specialist> {
    const res = await this.client.get<any>('/specialist/me');
    const item = res?.data || res;
    return normalizeSpecialist(item);
  }
}
