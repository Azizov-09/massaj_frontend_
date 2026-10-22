import type { ApiClient } from './client';
import type {
  CreateAttendanceDto,
  UpdateAttendanceDto,
  CreateAssessmentDto,
  UpdateAssessmentDto,
  CreateProgressDto,
  UpdateProgressDto,
} from './types';
import type { AttendanceRecord, Assessment, ProgressNote } from '@/types';

export function normalizeAttendance(raw: any): AttendanceRecord {
  if (!raw) return raw;
  return {
    id: String(raw.id),
    appointmentId: raw.appointmentId ? String(raw.appointmentId) : undefined,
    childId: String(raw.childId || raw.appointment?.childId || ''),
    specialistId: String(raw.specialistId || raw.appointment?.specialistId || ''),
    date: raw.date ? (typeof raw.date === 'string' ? raw.date.split('T')[0] : new Date(raw.date).toISOString().split('T')[0]) : (raw.createdAt ? raw.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
    status: raw.status || 'PRESENT',
    note: raw.note,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export function normalizeAssessment(raw: any): Assessment {
  if (!raw) return raw;
  const childFullName = raw.child?.fullName ||
    (raw.child?.firstName ? `${raw.child.firstName} ${raw.child.lastName || ''}`.trim() : raw.childName);
  const specFullName = raw.specialist?.fullName ||
    raw.specialist?.user?.fullName ||
    (raw.specialist?.firstName ? `${raw.specialist.firstName} ${raw.specialist.lastName || ''}`.trim() : raw.specialistName);

  const rawDate = raw.assessedAt || raw.assessmentDate || raw.date || raw.createdAt;
  const dateFormatted = rawDate
    ? (typeof rawDate === 'string' ? rawDate.split('T')[0] : new Date(rawDate).toISOString().split('T')[0])
    : new Date().toISOString().split('T')[0];

  return {
    id: String(raw.id),
    childId: String(raw.childId || raw.child?.id || raw.child_id || ''),
    childName: childFullName || undefined,
    child: raw.child || undefined,
    specialistId: String(raw.specialistId || raw.specialist?.id || raw.specialist_id || ''),
    specialistName: specFullName || undefined,
    specialist: raw.specialist || undefined,
    sessionId: raw.sessionId ? String(raw.sessionId) : undefined,
    scores: {
      movement: Number(raw.movement ?? raw.scores?.movement ?? 3),
      coordination: Number(raw.coordination ?? raw.scores?.coordination ?? 3),
      flexibility: Number(raw.flexibility ?? raw.scores?.flexibility ?? 3),
      activityTolerance: Number(raw.activityTolerance ?? raw.scores?.activityTolerance ?? 3),
      sessionResponse: Number(raw.sessionResponse ?? raw.scores?.sessionResponse ?? 3),
    },
    professionalObservation: raw.professionalObservation || raw.observation || '',
    assessedAt: raw.assessedAt || undefined,
    assessmentDate: raw.assessmentDate || raw.assessedAt || undefined,
    date: dateFormatted,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export function normalizeProgress(raw: any): ProgressNote {
  if (!raw) return raw;
  const childFullName = raw.child?.fullName ||
    (raw.child?.firstName ? `${raw.child.firstName} ${raw.child.lastName || ''}`.trim() : raw.childName);
  const specFullName = raw.specialist?.fullName ||
    raw.specialist?.user?.fullName ||
    (raw.specialist?.firstName ? `${raw.specialist.firstName} ${raw.specialist.lastName || ''}`.trim() : raw.specialistName);

  const rawDate = raw.occurredAt || raw.progressDate || raw.date || raw.createdAt;
  const dateFormatted = rawDate
    ? (typeof rawDate === 'string' ? rawDate.split('T')[0] : new Date(rawDate).toISOString().split('T')[0])
    : new Date().toISOString().split('T')[0];

  const recordedBy = raw.recordedBy || raw.createdBy || null;

  return {
    id: String(raw.id),
    childId: String(raw.childId || raw.child?.id || raw.child_id || ''),
    childName: childFullName || undefined,
    child: raw.child || undefined,
    specialistId: String(raw.specialistId || raw.specialist?.id || raw.specialist_id || ''),
    specialistName: specFullName || undefined,
    specialist: raw.specialist || undefined,
    recordedBy,
    sessionId: raw.sessionId ? String(raw.sessionId) : undefined,
    note: raw.description || raw.note || raw.title || '',
    occurredAt: raw.occurredAt || undefined,
    progressDate: raw.progressDate || raw.occurredAt || undefined,
    date: dateFormatted,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export class ClinicalApi {
  constructor(private client: ApiClient) {}

  // ── Attendance ──
  public async recordAttendance(dto: CreateAttendanceDto): Promise<AttendanceRecord> {
    const payload: Record<string, any> = {
      childId: dto.childId,
      status: dto.status,
    };
    if (dto.specialistId) {
      payload.specialistId = dto.specialistId;
    }
    if (dto.date) {
      payload.date = dto.date;
    }
    if (dto.note && dto.note.trim().length > 0) {
      payload.note = dto.note.trim();
    }
    const res = await this.client.post<any>('/attendance', payload);
    const item = res?.data || res;
    return normalizeAttendance(item);
  }

  public async updateAttendance(id: string, dto: UpdateAttendanceDto): Promise<AttendanceRecord> {
    const res = await this.client.patch<any>(`/attendance/${id}`, dto);
    const item = res?.data || res;
    return normalizeAttendance(item);
  }

  public async getAttendance(params?: {
    childId?: string;
    specialistId?: string;
    date?: string;
    page?: number;
    limit?: number;
  }): Promise<AttendanceRecord[]> {
    const res = await this.client.get<any>('/attendance', params);
    const list = Array.isArray(res) ? res : res?.data || res?.items || [];
    return list.map(normalizeAttendance);
  }

  // ── Assessments ──
  public async createAssessment(dto: CreateAssessmentDto): Promise<Assessment> {
    const res = await this.client.post<any>('/assessments', dto);
    const item = res?.data || res;
    return normalizeAssessment(item);
  }

  public async updateAssessment(id: string, dto: UpdateAssessmentDto): Promise<Assessment> {
    const res = await this.client.patch<any>(`/assessments/${id}`, dto);
    const item = res?.data || res;
    return normalizeAssessment(item);
  }

  public async getAssessments(params?: { childId?: string; specialistId?: string; page?: number; limit?: number }): Promise<Assessment[]> {
    try {
      const res = await this.client.get<any>('/assessments', params);
      const list = Array.isArray(res) ? res : res?.items || res?.data || [];
      return list.map(normalizeAssessment);
    } catch (err: any) {
      if (err?.status === 404 && params?.childId) {
        const res = await this.client.get<any>(`/children/${params.childId}/assessments`);
        const list = Array.isArray(res) ? res : res?.items || res?.data || [];
        return list.map(normalizeAssessment);
      }
      throw err;
    }
  }

  // ── Progress Notes ──
  public async createProgress(dto: CreateProgressDto): Promise<ProgressNote> {
    const res = await this.client.post<any>('/progress', dto);
    const item = res?.data || res;
    return normalizeProgress(item);
  }

  public async updateProgress(id: string, dto: UpdateProgressDto): Promise<ProgressNote> {
    const res = await this.client.patch<any>(`/progress/${id}`, dto);
    const item = res?.data || res;
    return normalizeProgress(item);
  }

  public async getProgress(params?: { childId?: string; specialistId?: string; page?: number; limit?: number }): Promise<ProgressNote[]> {
    try {
      const res = await this.client.get<any>('/progress', params);
      const list = Array.isArray(res) ? res : res?.items || res?.data || [];
      return list.map(normalizeProgress);
    } catch (err: any) {
      if (err?.status === 404 && params?.childId) {
        const res = await this.client.get<any>(`/children/${params.childId}/progress`);
        const list = Array.isArray(res) ? res : res?.items || res?.data || [];
        return list.map(normalizeProgress);
      }
      throw err;
    }
  }
}
