import type { ApiClient } from './client';
import type { CompleteSessionDto, CancelSessionDto } from './types';
import type { Session, SessionStatus } from '@/types';

export function normalizeSession(raw: any): Session {
  if (!raw) return raw;
  return {
    id: String(raw.id),
    appointmentId: String(raw.appointmentId || raw.appointment?.id || ''),
    childId: String(raw.childId || raw.child?.id || ''),
    specialistId: String(raw.specialistId || raw.specialist?.id || ''),
    serviceId: String(raw.serviceId || raw.service?.id || ''),
    startTime: raw.startTime || raw.startAt || new Date().toISOString(),
    endTime: raw.endTime || raw.endAt,
    status: (raw.status as SessionStatus) || 'IN_PROGRESS',
    note: raw.note || raw.clinicalNote || '',
    observation: raw.observation || raw.professionalObservation || '',
    recommendation: raw.recommendation || '',
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export class SessionsApi {
  constructor(private client: ApiClient) {}

  public async getAll(params?: {
    childId?: string;
    page?: number;
    limit?: number;
  }): Promise<Session[]> {
    const res = await this.client.get<any>('/sessions', params);
    const list = Array.isArray(res) ? res : res?.data || res?.items || [];
    return list.map(normalizeSession);
  }

  public async getById(id: string): Promise<Session> {
    const res = await this.client.get<any>(`/sessions/${id}`);
    const item = res?.data || res;
    return normalizeSession(item);
  }

  public async complete(id: string, dto: CompleteSessionDto): Promise<Session> {
    const res = await this.client.post<any>(`/sessions/${id}/complete`, dto);
    const item = res?.data || res;
    return normalizeSession(item);
  }

  public async cancel(id: string, dto?: CancelSessionDto): Promise<Session> {
    const res = await this.client.post<any>(`/sessions/${id}/cancel`, dto || {});
    const item = res?.data || res;
    return normalizeSession(item);
  }
}
