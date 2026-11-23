import type { ApiClient } from './client';
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
  return {
    id: String(specialistId),
    fullName,
    phone,
    role: 'SPECIALIST',
    specialization,
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
}
