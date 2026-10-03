import type { ApiClient } from './client';
import type { CreateAppointmentDto, UpdateAppointmentDto } from './types';
import type { Appointment, AppointmentStatus } from '@/types';

export function normalizeAppointment(raw: any): Appointment {
  if (!raw) return raw;
  const startAt = raw.startAt || raw.startTime || '';
  const endAt = raw.endAt || raw.endTime || '';

  const date =
    raw.date ||
    (typeof startAt === 'string' && startAt.includes('T')
      ? startAt.split('T')[0]
      : typeof startAt === 'string'
      ? startAt.substring(0, 10)
      : new Date().toISOString().split('T')[0]);

  const startTime =
    typeof raw.startTime === 'string' && raw.startTime.length === 5
      ? raw.startTime
      : typeof startAt === 'string' && startAt.includes('T')
      ? startAt.split('T')[1].substring(0, 5)
      : '09:00';

  const endTime =
    typeof raw.endTime === 'string' && raw.endTime.length === 5
      ? raw.endTime
      : typeof endAt === 'string' && endAt.includes('T')
      ? endAt.split('T')[1].substring(0, 5)
      : '09:45';

  return {
    id: String(raw.id),
    childId: String(raw.childId || raw.child?.id || ''),
    parentId: String(raw.parentId || raw.parent?.id || ''),
    specialistId: String(raw.specialistId || raw.specialist?.id || ''),
    serviceId: String(raw.serviceId || raw.service?.id || ''),
    date,
    startTime,
    endTime,
    status: (raw.status as AppointmentStatus) || 'SCHEDULED',
    notes: raw.notes || '',
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt,
  };
}

export class AppointmentsApi {
  constructor(private client: ApiClient) {}

  public async getAll(params?: {
    childId?: string;
    specialistId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<Appointment[]> {
    const res = await this.client.get<any>('/appointments', params);
    const list = Array.isArray(res) ? res : res?.data || res?.items || [];
    return list.map(normalizeAppointment);
  }

  public async getById(id: string): Promise<Appointment> {
    const res = await this.client.get<any>(`/appointments/${id}`);
    const item = res?.data || res;
    return normalizeAppointment(item);
  }

  public async create(dto: CreateAppointmentDto): Promise<Appointment> {
    const res = await this.client.post<any>('/appointments', dto);
    const item = res?.data || res;
    return normalizeAppointment(item);
  }

  public async update(id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
    const res = await this.client.patch<any>(`/appointments/${id}`, dto);
    const item = res?.data || res;
    return normalizeAppointment(item);
  }

  public async confirm(id: string): Promise<Appointment> {
    const res = await this.client.post<any>(`/appointments/${id}/confirm`);
    const item = res?.data || res;
    return normalizeAppointment(item);
  }

  public async start(id: string): Promise<any> {
    const res = await this.client.post<any>(`/appointments/${id}/start`);
    return res?.data || res;
  }

  public async cancel(id: string): Promise<Appointment> {
    const res = await this.client.post<any>(`/appointments/${id}/cancel`);
    const item = res?.data || res;
    return normalizeAppointment(item);
  }

  public async markNoShow(id: string): Promise<Appointment> {
    const res = await this.client.post<any>(`/appointments/${id}/no-show`);
    const item = res?.data || res;
    return normalizeAppointment(item);
  }
}
