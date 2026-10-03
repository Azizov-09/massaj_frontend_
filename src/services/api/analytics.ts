import type { ApiClient } from './client';

export class AnalyticsApi {
  constructor(private client: ApiClient) {}

  // ── Executive & Operational Analytics ──
  public async getDashboard(): Promise<any> {
    const res = await this.client.get<any>('/analytics/dashboard');
    return res?.data || res;
  }

  public async getRevenue(): Promise<any> {
    const res = await this.client.get<any>('/analytics/revenue');
    return res?.data || res;
  }

  public async getDebt(): Promise<any> {
    const res = await this.client.get<any>('/analytics/debt');
    return res?.data || res;
  }

  public async getAppointments(): Promise<any> {
    const res = await this.client.get<any>('/analytics/appointments');
    return res?.data || res;
  }

  public async getSessions(): Promise<any> {
    const res = await this.client.get<any>('/analytics/sessions');
    return res?.data || res;
  }

  public async getChildren(): Promise<any> {
    const res = await this.client.get<any>('/analytics/children');
    return res?.data || res;
  }

  public async getSpecialists(): Promise<any> {
    const res = await this.client.get<any>('/analytics/specialists');
    return res?.data || res;
  }

  // ── Reports ──
  public async getFinancialReport(params?: any): Promise<any> {
    const res = await this.client.get<any>('/reports/financial', params);
    return res?.data || res;
  }

  public async getAttendanceReport(params?: any): Promise<any> {
    const res = await this.client.get<any>('/reports/attendance', params);
    return res?.data || res;
  }

  public async getSessionsReport(params?: any): Promise<any> {
    const res = await this.client.get<any>('/reports/sessions', params);
    return res?.data || res;
  }

  public async getChildrenReport(params?: any): Promise<any> {
    const res = await this.client.get<any>('/reports/children', params);
    return res?.data || res;
  }

  public async getSpecialistsReport(params?: any): Promise<any> {
    const res = await this.client.get<any>('/reports/specialists', params);
    return res?.data || res;
  }

  public async getProgressReport(params?: any): Promise<any> {
    const res = await this.client.get<any>('/reports/progress', params);
    return res?.data || res;
  }
}
