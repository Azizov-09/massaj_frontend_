import type { ApiClient } from './client';
import type {
  CreateChildDto,
  UpdateChildDto,
  LinkParentDto,
  RecordConsentDto,
  CreateDocumentDto,
} from './types';
import type { Child } from '@/types';

export function normalizeChild(raw: any): Child {
  if (!raw) return raw;
  const firstName = raw.firstName || '';
  const lastName = raw.lastName || '';
  const fullName =
    raw.fullName ||
    (firstName || lastName ? `${firstName} ${lastName}`.trim() : 'Noma’lum bola');

  return {
    id: String(raw.id),
    fullName,
    dateOfBirth: raw.birthDate || raw.dateOfBirth || '',
    gender: raw.gender === 'FEMALE' ? 'FEMALE' : 'MALE',
    parentId: raw.parentId ? String(raw.parentId) : (raw.parents?.[0]?.id ? String(raw.parents[0].id) : ''),
    assignedSpecialistId: raw.assignedSpecialistId ? String(raw.assignedSpecialistId) : undefined,
    phone: raw.phone || raw.parent?.phone,
    address: raw.address,
    emergencyContact: raw.emergencyContact,
    status: raw.status === 'ARCHIVED' ? 'ARCHIVED' : raw.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    notes: raw.notes,
    createdAt: raw.createdAt || new Date().toISOString(),
    avatar: raw.avatar,
    diagnosis: raw.diagnosis,
    allergies: raw.allergies,
  };
}

export class ChildrenApi {
  constructor(private client: ApiClient) {}

  public async getAll(params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<Child[]> {
    const res = await this.client.get<any>('/children', params);
    const list = Array.isArray(res) ? res : res?.data || res?.items || [];
    return list.map(normalizeChild);
  }

  public async getById(id: string): Promise<Child> {
    const res = await this.client.get<any>(`/children/${id}`);
    const item = res?.data || res;
    return normalizeChild(item);
  }

  public async create(dto: CreateChildDto): Promise<Child> {
    const res = await this.client.post<any>('/children', dto);
    const item = res?.data || res;
    return normalizeChild(item);
  }

  public async update(id: string, dto: UpdateChildDto): Promise<Child> {
    const res = await this.client.patch<any>(`/children/${id}`, dto);
    const item = res?.data || res;
    return normalizeChild(item);
  }

  public async archive(id: string): Promise<void> {
    await this.client.post(`/children/${id}/archive`);
  }

  public async delete(id: string): Promise<void> {
    try {
      await this.client.delete(`/children/${id}`);
    } catch {
      await this.client.post(`/children/${id}/archive`);
    }
  }

  public async restore(id: string): Promise<void> {
    await this.client.post(`/children/${id}/restore`);
  }

  public async getParents(childId: string): Promise<any[]> {
    const res = await this.client.get<any>(`/children/${childId}/parents`);
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async linkParent(childId: string, parentId: string, dto: LinkParentDto): Promise<any> {
    return this.client.post(`/children/${childId}/parents/${parentId}`, dto);
  }

  public async updateParentLink(childId: string, parentId: string, dto: Partial<LinkParentDto>): Promise<any> {
    return this.client.patch(`/children/${childId}/parents/${parentId}`, dto);
  }

  public async unlinkParent(childId: string, parentId: string): Promise<void> {
    await this.client.delete(`/children/${childId}/parents/${parentId}`);
  }

  public async getBalance(childId: string): Promise<{ balance: number; debt: number }> {
    const res = await this.client.get<any>(`/children/${childId}/balance`);
    return res?.data || res || { balance: 0, debt: 0 };
  }

  public async getAssessments(childId: string): Promise<any[]> {
    const res = await this.client.get<any>(`/children/${childId}/assessments`);
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async getProgress(childId: string): Promise<any[]> {
    const res = await this.client.get<any>(`/children/${childId}/progress`);
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async getConsents(childId: string): Promise<any[]> {
    const res = await this.client.get<any>(`/children/${childId}/consents`);
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async recordConsent(childId: string, dto: RecordConsentDto): Promise<any> {
    return this.client.post(`/children/${childId}/consents`, dto);
  }

  public async getDocuments(childId: string): Promise<any[]> {
    const res = await this.client.get<any>(`/children/${childId}/documents`);
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async registerDocument(childId: string, dto: CreateDocumentDto): Promise<any> {
    return this.client.post(`/children/${childId}/documents`, dto);
  }
}
