import type { ApiClient } from './client';
import type {
  CreateAttendanceDto,
  UpdateAttendanceDto,
  CreateAssessmentDto,
  UpdateAssessmentDto,
  CreateProgressDto,
  UpdateProgressDto,
  CreateGoalDto,
  UpdateGoalDto,
} from './types';
import type { AttendanceRecord, Assessment, ProgressNote, Goal } from '@/types';

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
  return {
    id: String(raw.id),
    childId: String(raw.childId || ''),
    specialistId: String(raw.specialistId || ''),
    sessionId: raw.sessionId ? String(raw.sessionId) : undefined,
    scores: {
      movement: Number(raw.movement ?? raw.scores?.movement ?? 3),
      coordination: Number(raw.coordination ?? raw.scores?.coordination ?? 3),
      flexibility: Number(raw.flexibility ?? raw.scores?.flexibility ?? 3),
      activityTolerance: Number(raw.activityTolerance ?? raw.scores?.activityTolerance ?? 3),
      sessionResponse: Number(raw.sessionResponse ?? raw.scores?.sessionResponse ?? 3),
    },
    professionalObservation: raw.professionalObservation || raw.observation || '',
    date: raw.date || (raw.createdAt ? raw.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export function normalizeProgress(raw: any): ProgressNote {
  if (!raw) return raw;
  return {
    id: String(raw.id),
    childId: String(raw.childId || ''),
    specialistId: String(raw.specialistId || ''),
    sessionId: raw.sessionId ? String(raw.sessionId) : undefined,
    note: raw.description || raw.note || raw.title || '',
    date: raw.date || (raw.createdAt ? raw.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export function normalizeGoal(raw: any): Goal {
  if (!raw) return raw;
  return {
    id: String(raw.id),
    childId: String(raw.childId || ''),
    title: raw.title || 'Reabilitatsiya maqsadi',
    description: raw.description || '',
    progress: Number(raw.progress ?? 0),
    targetDate: raw.targetDate || '',
    status: raw.status || 'ACTIVE',
    createdAt: raw.createdAt || new Date().toISOString(),
    specialistNote: raw.specialistNote,
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

  // ── Progress ──
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

  // ── Goals ──
  public async createGoal(dto: CreateGoalDto): Promise<Goal> {
    const res = await this.client.post<any>('/goals', dto);
    const item = res?.data || res;
    return normalizeGoal(item);
  }

  public async updateGoal(id: string, dto: UpdateGoalDto): Promise<Goal> {
    const res = await this.client.patch<any>(`/goals/${id}`, dto);
    const item = res?.data || res;
    return normalizeGoal(item);
  }

  public async completeGoal(id: string): Promise<Goal> {
    const res = await this.client.post<any>(`/goals/${id}/complete`);
    const item = res?.data || res;
    return normalizeGoal(item);
  }

  public async pauseGoal(id: string): Promise<Goal> {
    const res = await this.client.post<any>(`/goals/${id}/pause`);
    const item = res?.data || res;
    return normalizeGoal(item);
  }
}
