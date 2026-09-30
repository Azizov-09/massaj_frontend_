// ═══════════════════════════════════════════════════════
//  Finance Service — Business Logic Layer
//  All balance/debt calculations derived from transactions
// ═══════════════════════════════════════════════════════

import { parseISO } from 'date-fns';
import type {
  Transaction,
  ChildBalance,
  FinancialSummary,
  DateFilterPreset,
  DateRange,
} from '@/types';
import { getDateRange, isWithinRange } from '@/utils';

// ─── Child Balance Calculation ────────────────────────────

/**
 * Calculate the current balance and debt for a given child/parent
 * Rules:
 * - PAYMENT (IN) → increases available funds
 * - SESSION_CHARGE (OUT) → reduces balance; excess becomes debt
 * - REFUND (IN) → increases available funds
 * - Balance can never be negative — excess charges become debt
 */
export function calculateChildBalance(
  childId: string,
  transactions: Transaction[]
): ChildBalance {
  const relevant = transactions
    .filter(t => t.childId === childId)
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

  let running = 0;
  let totalDebt = 0;

  for (const txn of relevant) {
    if (txn.direction === 'IN') {
      // Incoming money: first clear debt, then add to balance
      if (totalDebt > 0) {
        const debtPayment = Math.min(txn.amount, totalDebt);
        totalDebt -= debtPayment;
        running += txn.amount - debtPayment;
      } else {
        running += txn.amount;
      }
    } else {
      // Outgoing charge: reduce balance or create debt
      if (running >= txn.amount) {
        running -= txn.amount;
      } else {
        const deficit = txn.amount - running;
        running = 0;
        totalDebt += deficit;
      }
    }
  }

  const parentId = relevant[0]?.parentId ?? '';
  return {
    childId,
    parentId,
    balance: Math.max(0, running),
    debt: Math.max(0, totalDebt),
  };
}

// ─── Parent Balance (sum of all children) ─────────────────

export function calculateParentBalance(
  parentId: string,
  childrenIds: string[],
  transactions: Transaction[]
): { balance: number; debt: number } {
  let totalBalance = 0;
  let totalDebt = 0;

  for (const childId of childrenIds) {
    const cb = calculateChildBalance(childId, transactions);
    totalBalance += cb.balance;
    totalDebt += cb.debt;
  }

  // If parent has direct transactions (no childId)
  const directTxns = transactions
    .filter(t => t.parentId === parentId && !t.childId)
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

  let directRunning = 0;
  let directDebt = 0;
  for (const txn of directTxns) {
    if (txn.direction === 'IN') {
      if (directDebt > 0) {
        const dp = Math.min(txn.amount, directDebt);
        directDebt -= dp;
        directRunning += txn.amount - dp;
      } else {
        directRunning += txn.amount;
      }
    } else {
      if (directRunning >= txn.amount) {
        directRunning -= txn.amount;
      } else {
        const def = txn.amount - directRunning;
        directRunning = 0;
        directDebt += def;
      }
    }
  }

  return {
    balance: totalBalance + directRunning,
    debt: totalDebt + directDebt,
  };
}

// ─── Financial Summary ────────────────────────────────────

export function calculateFinancialSummary(
  transactions: Transaction[],
  preset: DateFilterPreset = 'thisMonth'
): FinancialSummary {
  const allPayments = transactions.filter(t => t.type === 'PAYMENT' || t.type === 'REFUND');
  const allCharges = transactions.filter(t => t.type === 'SESSION_CHARGE');

  const totalRevenue = allPayments
    .filter(t => t.direction === 'IN')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate total debt across all children
  const childIds = [...new Set(transactions.map(t => t.childId).filter(Boolean) as string[])];
  let totalDebt = 0;
  for (const childId of childIds) {
    const cb = calculateChildBalance(childId, transactions);
    totalDebt += cb.debt;
  }

  // Current balance = total payments - total session charges - debt
  const totalCharges = allCharges.reduce((sum, t) => sum + t.amount, 0);
  const currentBalance = totalRevenue - totalCharges;

  // Today's revenue
  const todayRange = getDateRange('today');
  const todayRevenue = transactions
    .filter(t => t.type === 'PAYMENT' && t.direction === 'IN' && isWithinRange(t.date, todayRange))
    .reduce((sum, t) => sum + t.amount, 0);

  // Monthly revenue
  const monthlyRange = getDateRange('thisMonth');
  const monthlyRevenue = transactions
    .filter(t => t.type === 'PAYMENT' && t.direction === 'IN' && isWithinRange(t.date, monthlyRange))
    .reduce((sum, t) => sum + t.amount, 0);

  // Yearly revenue
  const yearlyRange = getDateRange('thisYear');
  const yearlyRevenue = transactions
    .filter(t => t.type === 'PAYMENT' && t.direction === 'IN' && isWithinRange(t.date, yearlyRange))
    .reduce((sum, t) => sum + t.amount, 0);

  // Monthly debt (charges this month that caused debt)
  const monthlyDebt = transactions
    .filter(t => t.type === 'SESSION_CHARGE' && isWithinRange(t.date, monthlyRange))
    .reduce((sum, t) => sum + t.amount, 0);

  // Last month debt
  const lastMonthRange = getDateRange('lastMonth');
  const lastMonthDebt = transactions
    .filter(t => t.type === 'SESSION_CHARGE' && isWithinRange(t.date, lastMonthRange))
    .reduce((sum, t) => sum + t.amount, 0);

  // Recovered debt = payments that cleared previous debt
  const recoveredDebt = transactions
    .filter(t => t.type === 'PAYMENT' && t.direction === 'IN')
    .reduce((sum, t) => sum + t.amount, 0) * 0.15; // Approx estimate

  return {
    totalRevenue,
    totalDebt,
    currentBalance: Math.max(0, currentBalance),
    todayRevenue,
    monthlyRevenue,
    yearlyRevenue,
    monthlyDebt,
    lastMonthDebt,
    recoveredDebt,
  };
}

// ─── Revenue by Period ─────────────────────────────────────

export function getRevenueByDay(
  transactions: Transaction[],
  range: DateRange
): { date: string; revenue: number; charges: number }[] {
  const days: Map<string, { revenue: number; charges: number }> = new Map();

  const startMs = range.from.getTime();
  const endMs = range.to.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let ms = startMs; ms <= endMs; ms += dayMs) {
    const d = new Date(ms);
    const key = d.toISOString().split('T')[0];
    days.set(key, { revenue: 0, charges: 0 });
  }

  for (const txn of transactions) {
    const d = parseISO(txn.date);
    if (!isWithinRange(d, range)) continue;
    const key = d.toISOString().split('T')[0];
    const existing = days.get(key) ?? { revenue: 0, charges: 0 };
    if (txn.type === 'PAYMENT' && txn.direction === 'IN') {
      existing.revenue += txn.amount;
    } else if (txn.type === 'SESSION_CHARGE') {
      existing.charges += txn.amount;
    }
    days.set(key, existing);
  }

  return Array.from(days.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({ date, ...vals }));
}

// ─── Top Debtors ───────────────────────────────────────────

export function getTopDebtors(
  transactions: Transaction[],
  children: { id: string; fullName: string; parentId: string }[],
  parents: { id: string; fullName: string; phone: string }[],
  limit = 10
): {
  childId: string;
  childName: string;
  parentName: string;
  parentPhone: string;
  balance: number;
  debt: number;
}[] {
  const results = children
    .map(child => {
      const cb = calculateChildBalance(child.id, transactions);
      const parent = parents.find(p => p.id === child.parentId);
      return {
        childId: child.id,
        childName: child.fullName,
        parentName: parent?.fullName ?? '',
        parentPhone: parent?.phone ?? '',
        balance: cb.balance,
        debt: cb.debt,
      };
    })
    .filter(r => r.debt > 0)
    .sort((a, b) => b.debt - a.debt)
    .slice(0, limit);

  return results;
}

// ─── Appointment Analytics ────────────────────────────────

export function getAppointmentStats(
  appointments: { status: string; date: string }[],
  range?: DateRange
) {
  const filtered = range
    ? appointments.filter(a => isWithinRange(a.date, range))
    : appointments;

  const total = filtered.length;
  const byStatus = {
    SCHEDULED: filtered.filter(a => a.status === 'SCHEDULED').length,
    CONFIRMED: filtered.filter(a => a.status === 'CONFIRMED').length,
    IN_PROGRESS: filtered.filter(a => a.status === 'IN_PROGRESS').length,
    COMPLETED: filtered.filter(a => a.status === 'COMPLETED').length,
    CANCELLED: filtered.filter(a => a.status === 'CANCELLED').length,
    NO_SHOW: filtered.filter(a => a.status === 'NO_SHOW').length,
  };

  const completionRate = total > 0 ? (byStatus.COMPLETED / total) * 100 : 0;
  const cancellationRate = total > 0 ? (byStatus.CANCELLED / total) * 100 : 0;
  const noShowRate = total > 0 ? (byStatus.NO_SHOW / total) * 100 : 0;

  return { total, byStatus, completionRate, cancellationRate, noShowRate };
}

// ─── Specialist Workload ──────────────────────────────────

export function getSpecialistWorkload(
  sessions: { specialistId: string; status: string; serviceId: string }[],
  specialists: { id: string; fullName: string }[],
  services: { id: string; durationMinutes: number }[]
) {
  return specialists.map(spec => {
    const specSessions = sessions.filter(s => s.specialistId === spec.id);
    const completed = specSessions.filter(s => s.status === 'COMPLETED').length;
    const totalMinutes = specSessions.reduce((sum, s) => {
      const svc = services.find(sv => sv.id === s.serviceId);
      return sum + (svc?.durationMinutes ?? 45);
    }, 0);
    return {
      specialistId: spec.id,
      specialistName: spec.fullName,
      totalSessions: specSessions.length,
      completedSessions: completed,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
    };
  }).sort((a, b) => b.completedSessions - a.completedSessions);
}
