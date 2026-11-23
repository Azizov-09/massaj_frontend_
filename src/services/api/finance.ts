import { normalizeAccount } from "./account";
import { getAllPages } from "./pagination";
import type { ApiClient } from "./client";
import type { Payment, Transaction, PaymentMethod } from "@/types";



export function normalizePayment(raw: any): Payment {
  if (!raw) return raw;
  const parentName =
    raw.parent?.fullName ||
    raw.parent?.user?.fullName ||
    raw.payer?.fullName ||
    (raw.parent?.firstName
      ? `${raw.parent.firstName} ${raw.parent.lastName || ""}`.trim()
      : raw.parentName);
  const parentPhone =
    raw.parent?.phone ||
    raw.parent?.user?.phone ||
    raw.payer?.phone ||
    raw.parentPhone;
  const childName =
    raw.child?.fullName ||
    (raw.child?.firstName
      ? `${raw.child.firstName} ${raw.child.lastName || ""}`.trim()
      : raw.childName);

  return {
    id: String(raw.id),
    parentId: String(raw.parentId || raw.parent?.id || raw.payer?.id || ""),
    parentName: parentName || undefined,
    parentPhone: parentPhone || undefined,
    parent: raw.parent || raw.payer || undefined,
    childId: raw.childId
      ? String(raw.childId)
      : raw.child?.id
        ? String(raw.child.id)
        : undefined,
    childName: childName || undefined,
    child: raw.child || undefined,
    amount: Number(raw.amount || 0),
    method: (raw.method as PaymentMethod) || "CASH",
    status: raw.status || "COMPLETED",
    note: raw.note || raw.notes || "",
    notes: raw.notes || raw.note || "",
    paidAt: raw.paidAt || undefined,
    idempotencyKey: raw.idempotencyKey || undefined,
    date: raw.paidAt || raw.date || raw.createdAt || new Date().toISOString(),
    transactionId: String(raw.transactionId || `txn-${raw.id || ""}`),
    createdBy: String(raw.createdBy || raw.userId || "system"),
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export function normalizeTransaction(raw: any): Transaction {
  if (!raw) return raw;
  return {
    id: String(raw.id),
    type: raw.type || "PAYMENT",
    direction: raw.direction === "OUT" ? "OUT" : "IN",
    amount: Number(raw.amount || 0),
    parentId: raw.parentId ? String(raw.parentId) : undefined,
    childId: raw.childId ? String(raw.childId) : undefined,
    sessionId: raw.sessionId ? String(raw.sessionId) : undefined,
    appointmentId: raw.appointmentId ? String(raw.appointmentId) : undefined,
    paymentId: raw.paymentId ? String(raw.paymentId) : undefined,
    description: raw.description || "",
    date: raw.date || raw.createdAt || new Date().toISOString(),
    createdAt: raw.createdAt || new Date().toISOString(),
    createdBy: String(raw.createdBy || raw.userId || "system"),
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
    if (!params?.page)
      return getAllPages(this.client, "/payments", params, normalizePayment);
    const res = await this.client.get<any>("/payments", params);
    const list = Array.isArray(res) ? res : res?.data || res?.items || [];
    return list.map(normalizePayment);
  }

  // ── Transactions ──
  public async getTransactions(params?: {
    parentId?: string;
    childId?: string;
    page?: number;
    limit?: number;
  }): Promise<Transaction[]> {
    if (!params?.page)
      return getAllPages(
        this.client,
        "/transactions",
        params,
        normalizeTransaction,
      );
    const res = await this.client.get<any>("/transactions", params);
    const list = Array.isArray(res) ? res : res?.data || res?.items || [];
    return list.map(normalizeTransaction);
  }

  public async getParentBalance(
    parentId: string,
  ): Promise<{ balance: number; debt: number }> {
    const res = await this.client.get<any>(`/parents/${parentId}/balance`);
    return normalizeAccount(res);
  }
}
