import type { ApiClient } from './client';
import type { CreateEmployeeDto, UpdateEmployeeDto } from './types';
import type { Employee } from '@/types';

export function normalizeEmployee(raw: any): Employee {
  if (!raw) return raw;
  return {
    id: String(raw.id),
    fullName: raw.fullName || 'Xodim',
    position: raw.position || 'Mutaxassis',
    phone: raw.phone || '',
    email: raw.email || `${raw.phone?.replace(/[^0-9]/g, '') || raw.id}@massaj.uz`,
    status: raw.status === 'ARCHIVED' ? 'ARCHIVED' : raw.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    salary: raw.salary ? Number(raw.salary) : undefined,
    joinedAt: raw.joinedAt || new Date().toISOString(),
    notes: raw.notes,
  };
}

export class EmployeesApi {
  constructor(private client: ApiClient) {}

  public async getAll(params?: { page?: number; limit?: number }): Promise<Employee[]> {
    const res = await this.client.get<any>('/employees', params);
    const list = Array.isArray(res) ? res : res?.data || res?.items || [];
    return list.map(normalizeEmployee);
  }

  public async getById(id: string): Promise<Employee> {
    const res = await this.client.get<any>(`/employees/${id}`);
    const item = res?.data || res;
    return normalizeEmployee(item);
  }

  public async create(dto: CreateEmployeeDto): Promise<Employee> {
    const res = await this.client.post<any>('/employees', dto);
    const item = res?.data || res;
    return normalizeEmployee(item);
  }

  public async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    const res = await this.client.patch<any>(`/employees/${id}`, dto);
    const item = res?.data || res;
    return normalizeEmployee(item);
  }

  public async archive(id: string): Promise<void> {
    await this.client.post(`/employees/${id}/archive`);
  }
}
