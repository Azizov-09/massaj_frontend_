import type { ApiClient } from './client';
import { normalizeChild } from './children';
import { normalizeAssessment, normalizeProgress, normalizeGoal } from './clinical';
import { normalizePayment } from './finance';
import type { Child, Assessment, ProgressNote, Goal, Payment } from '@/types';

export class PortalApi {
  constructor(private client: ApiClient) {}

  // ─── Parent Portal ───
  public async getMyChildren(): Promise<Child[]> {
    const res = await this.client.get<any>('/parent/my-children');
    const list = Array.isArray(res) ? res : res?.data || [];
    return list.map(normalizeChild);
  }

  public async getMyAssessments(): Promise<Assessment[]> {
    const res = await this.client.get<any>('/parent/my-assessments');
    const list = Array.isArray(res) ? res : res?.data || [];
    return list.map(normalizeAssessment);
  }

  public async getMyProgress(): Promise<ProgressNote[]> {
    const res = await this.client.get<any>('/parent/my-progress');
    const list = Array.isArray(res) ? res : res?.data || [];
    return list.map(normalizeProgress);
  }

  public async getMyGoals(): Promise<Goal[]> {
    const res = await this.client.get<any>('/parent/my-goals');
    const list = Array.isArray(res) ? res : res?.data || [];
    return list.map(normalizeGoal);
  }

  public async getMyPayments(): Promise<Payment[]> {
    const res = await this.client.get<any>('/parent/my-payments');
    const list = Array.isArray(res) ? res : res?.data || [];
    return list.map(normalizePayment);
  }

  public async getMyAttendances(): Promise<any[]> {
    const res = await this.client.get<any>('/parent/my-attendances');
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async getMyBalance(): Promise<{ balance: number; debt: number }> {
    const res = await this.client.get<any>('/parent/my-balance');
    return res?.data || res || { balance: 0, debt: 0 };
  }

  public async getMyDebt(): Promise<{ debt: number }> {
    const res = await this.client.get<any>('/parent/my-debt');
    return res?.data || res || { debt: 0 };
  }

  // ─── Specialist Portal ───
  public async getMySchedule(): Promise<any> {
    try {
      const res = await this.client.get<any>('/specialist/my-attendances');
      return res?.data || res;
    } catch {
      return [];
    }
  }

  public async getMySpecialistAttendances(): Promise<any[]> {
    const res = await this.client.get<any>('/specialist/my-attendances');
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async getMyAssignedChildren(): Promise<Child[]> {
    const res = await this.client.get<any>('/specialist/my-children');
    const list = Array.isArray(res) ? res : res?.data || [];
    return list.map(normalizeChild);
  }

  public async getMyAuthoredAssessments(): Promise<Assessment[]> {
    const res = await this.client.get<any>('/specialist/my-assessments');
    const list = Array.isArray(res) ? res : res?.data || [];
    return list.map(normalizeAssessment);
  }

  public async getMyRecordedProgress(): Promise<ProgressNote[]> {
    const res = await this.client.get<any>('/specialist/my-progress');
    const list = Array.isArray(res) ? res : res?.data || [];
    return list.map(normalizeProgress);
  }

  public async getMyManagedGoals(): Promise<Goal[]> {
    const res = await this.client.get<any>('/specialist/my-goals');
    const list = Array.isArray(res) ? res : res?.data || [];
    return list.map(normalizeGoal);
  }
}
