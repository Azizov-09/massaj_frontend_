import type { ApiClient } from './client';
import type { RecordPaymentDto, RefundDto } from './types';
import type { Payment, Transaction, PaymentMethod } from '@/types';

export function normalizePayment(raw: any): Payment {
  if (!raw) return raw;
  return {
    id: String(raw.id),
    parentId: String(raw.parentId || ''),
    childId: raw.childId ? String(raw.childId) : undefined,
    amount: Number(raw.amount || 0),
    method: (raw.method as PaymentMethod) || 'CASH',
    notes: raw.notes || raw.note || '',
    date: raw.paidAt || raw.date || raw.createdAt || new Date().toISOString(),
    transactionId: String(raw.transactionId || `txn-${raw.id || ''}`),
    createdBy: String(raw.createdBy || raw.userId || 'system'),
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export function normalizeTransaction(raw: any): Transaction {
  if (!raw) return raw;
  return {
    id: String(raw.id),
    type: raw.type || 'PAYMENT',
    direction: raw.direction === 'OUT' ? 'OUT' : 'IN',
    amount: Number(raw.amount || 0),
    parentId: raw.parentId ? String(raw.parentId) : undefined,
    childId: raw.childId ? String(raw.childId) : undefined,
    sessionId: raw.sessionId ? String(raw.sessionId) : undefined,
    appointmentId: raw.appointmentId ? String(raw.appointmentId) : undefined,
    paymentId: raw.paymentId ? String(raw.paymentId) : undefined,
    description: raw.description || '',
    date: raw.date || raw.createdAt || new Date().toISOString(),
    createdAt: raw.createdAt || new Date().toISOString(),
    createdBy: String(raw.createdBy || raw.userId || 'system'),
  };
}

export class FinanceApi {
  constructor(private client: ApiClient) {}

  // ── Payments ──
  public async getPayments(params?: {
    parentId?: string;
    childId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<Payment[]> {
    const res = await this.client.get<any>('/payments', params);
    const list = Array.isArray(res) ? res : res?.data || res?.items || [];
    return list.map(normalizePayment);
  }

  public async getPaymentById(id: string): Promise<Payment> {
    const res = await this.client.get<any>(`/payments/${id}`);
    const item = res?.data || res;
    return normalizePayment(item);
  }

  public async recordPayment(dto: RecordPaymentDto): Promise<Payment> {
    const res = await this.client.post<any>('/payments', dto);
    const item = res?.data || res;
    return normalizePayment(item);
  }

  public async refundPayment(id: string, dto: RefundDto): Promise<any> {
    const res = await this.client.post<any>(`/payments/${id}/refund`, dto);
    return res?.data || res;
  }

  // ── Transactions ──
  public async getTransactions(params?: {
    parentId?: string;
    childId?: string;
    page?: number;
    limit?: number;
  }): Promise<Transaction[]> {
    const res = await this.client.get<any>('/transactions', params);
    const list = Array.isArray(res) ? res : res?.data || res?.items || [];
    return list.map(normalizeTransaction);
  }

  public async getTransactionById(id: string): Promise<Transaction> {
    const res = await this.client.get<any>(`/transactions/${id}`);
    const item = res?.data || res;
    return normalizeTransaction(item);
  }

  // ── Debtors & Balances ──
  public async getDebtors(): Promise<any[]> {
    const res = await this.client.get<any>('/debtors');
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async getParentDebtor(parentId: string): Promise<any> {
    const res = await this.client.get<any>(`/debtors/${parentId}`);
    return res?.data || res;
  }

  public async getChildBalance(childId: string): Promise<{ balance: number; debt: number }> {
    const res = await this.client.get<any>(`/children/${childId}/balance`);
    return res?.data || res || { balance: 0, debt: 0 };
  }

  public async getParentBalance(parentId: string): Promise<{ balance: number; debt: number }> {
    const res = await this.client.get<any>(`/parents/${parentId}/balance`);
    return res?.data || res || { balance: 0, debt: 0 };
  }

  public async getParentFinancialSummary(parentId: string): Promise<any> {
    const res = await this.client.get<any>(`/parents/${parentId}/financial-summary`);
    return res?.data || res;
  }
}
