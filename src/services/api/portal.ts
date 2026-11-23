import { normalizeAccount } from "./account";
import type { ApiClient } from "./client";
import { normalizeChild } from "./children";
import {
  normalizeAssessment,
  normalizeProgress,
  normalizeAttendance,
} from "./clinical";
import { normalizePayment } from "./finance";
import type { Child, Assessment, ProgressNote, Payment } from "@/types";

export class PortalApi {
  constructor(private client: ApiClient) {}

  // ─── Parent Portal ───
  public async getMyChildren(): Promise<Child[]> {
    const res = await this.client.get<any>("/parent/my-children");
    const list = Array.isArray(res) ? res : res?.data || [];
    return list.map(normalizeChild);
  }

  public async getMyAssessments(): Promise<Assessment[]> {
    const res = await this.client.get<any>("/parent/my-assessments");
    const list = Array.isArray(res) ? res : res?.data || [];
    return list.map(normalizeAssessment);
  }

  public async getMyProgress(): Promise<ProgressNote[]> {
    const res = await this.client.get<any>("/parent/my-progress");
    const list = Array.isArray(res) ? res : res?.data || [];
    return list.map(normalizeProgress);
  }

  public async getMyPayments(): Promise<Payment[]> {
    const res = await this.client.get<any>("/parent/my-payments");
    const list = Array.isArray(res) ? res : res?.data || [];
    return list.map(normalizePayment);
  }

  public async getMyAttendances(): Promise<any[]> {
    const res = await this.client.get<any>("/parent/my-attendances");
    return (Array.isArray(res) ? res : res?.data || []).map(
      normalizeAttendance,
    );
  }

  public async getMyBalance(): Promise<{ balance: number; debt: number }> {
    const res = await this.client.get<any>("/parent/my-balance");
    return normalizeAccount(res);
  }
}
