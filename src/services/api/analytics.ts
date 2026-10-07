import type { ApiClient, ApiResponse } from './client';

export interface DashboardAnalytics {
  totalRevenue: number;
  activeChildren: number;
  totalAppointments: number;
  totalSpecialists: number;
  totalDebt: number;
  attendanceRate: number;
}

export interface RevenueAnalytics {
  period: string;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  dailyBreakdown: Array<{ date: string; amount: number }>;
}

export interface DebtAnalytics {
  totalDebt: number;
  debtorsCount: number;
  debtors: Array<{
    parentId: string;
    parentName: string;
    phone: string;
    childName: string;
    amount: number;
  }>;
}

export interface ReportFilterParams {
  startDate?: string;
  endDate?: string;
  specialistId?: string;
  childId?: string;
  limit?: number;
  page?: number;
}

export class AnalyticsApi {
  constructor(private client: ApiClient) {}

  private extractData<T>(res: ApiResponse<T> | T): T {
    if (res && typeof res === 'object' && 'data' in res) {
      return (res as ApiResponse<T>).data;
    }
    return res as T;
  }

  // ── Executive & Operational Analytics ──
  public async getDashboard(): Promise<DashboardAnalytics> {
    const res = await this.client.get<ApiResponse<DashboardAnalytics> | DashboardAnalytics>('/analytics/dashboard');
    return this.extractData(res);
  }

  public async getRevenue(): Promise<RevenueAnalytics> {
    const res = await this.client.get<ApiResponse<RevenueAnalytics> | RevenueAnalytics>('/analytics/revenue');
    return this.extractData(res);
  }

  public async getDebt(): Promise<DebtAnalytics> {
    const res = await this.client.get<ApiResponse<DebtAnalytics> | DebtAnalytics>('/analytics/debt');
    return this.extractData(res);
  }

  public async getChildren(): Promise<Record<string, unknown>> {
    const res = await this.client.get<ApiResponse<Record<string, unknown>> | Record<string, unknown>>('/analytics/children');
    return this.extractData(res);
  }

  public async getSpecialists(): Promise<Record<string, unknown>> {
    const res = await this.client.get<ApiResponse<Record<string, unknown>> | Record<string, unknown>>('/analytics/specialists');
    return this.extractData(res);
  }

  // ── Reports ──
  public async getFinancialReport(params?: ReportFilterParams): Promise<Record<string, unknown>> {
    const res = await this.client.get<ApiResponse<Record<string, unknown>> | Record<string, unknown>>('/reports/financial', params);
    return this.extractData(res);
  }

  public async getAttendanceReport(params?: ReportFilterParams): Promise<Record<string, unknown>> {
    const res = await this.client.get<ApiResponse<Record<string, unknown>> | Record<string, unknown>>('/reports/attendance', params);
    return this.extractData(res);
  }

  public async getChildrenReport(params?: ReportFilterParams): Promise<Record<string, unknown>> {
    const res = await this.client.get<ApiResponse<Record<string, unknown>> | Record<string, unknown>>('/reports/children', params);
    return this.extractData(res);
  }

  public async getSpecialistsReport(params?: ReportFilterParams): Promise<Record<string, unknown>> {
    const res = await this.client.get<ApiResponse<Record<string, unknown>> | Record<string, unknown>>('/reports/specialists', params);
    return this.extractData(res);
  }

  public async getProgressReport(params?: ReportFilterParams): Promise<Record<string, unknown>> {
    const res = await this.client.get<ApiResponse<Record<string, unknown>> | Record<string, unknown>>('/reports/progress', params);
    return this.extractData(res);
  }
}
