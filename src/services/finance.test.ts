import { describe, it, expect } from 'vitest';
import {
  calculateChildBalance,
  calculateParentBalance,
  calculateFinancialSummary,
  getTopDebtors,
  getAppointmentStats,
  getSpecialistWorkload,
} from './finance.service';
import type { Transaction } from '@/types';

function mockTxn(partial: Partial<Transaction> & Pick<Transaction, 'id' | 'type' | 'amount' | 'direction' | 'date'>): Transaction {
  return {
    description: 'Test transaction',
    createdAt: partial.date,
    createdBy: 'admin-1',
    ...partial,
  };
}

describe('Finance Service — Unit Tests', () => {
  describe('calculateChildBalance', () => {
    it('returns zero balance and zero debt when no transactions exist', () => {
      const result = calculateChildBalance('child-1', []);
      expect(result).toEqual({
        childId: 'child-1',
        parentId: '',
        balance: 0,
        debt: 0,
      });
    });

    it('credits balance when incoming payment is made', () => {
      const txns: Transaction[] = [
        mockTxn({
          id: 't-1',
          childId: 'child-1',
          parentId: 'par-1',
          type: 'PAYMENT',
          amount: 500000,
          direction: 'IN',
          date: '2026-09-01T10:00:00Z',
          description: 'Payment',
        }),
      ];
      const result = calculateChildBalance('child-1', txns);
      expect(result.balance).toBe(500000);
      expect(result.debt).toBe(0);
      expect(result.parentId).toBe('par-1');
    });

    it('deducts session charge from existing balance', () => {
      const txns: Transaction[] = [
        mockTxn({
          id: 't-1',
          childId: 'child-1',
          parentId: 'par-1',
          type: 'PAYMENT',
          amount: 500000,
          direction: 'IN',
          date: '2026-09-01T10:00:00Z',
          description: 'Payment',
        }),
        mockTxn({
          id: 't-2',
          childId: 'child-1',
          parentId: 'par-1',
          type: 'SESSION_CHARGE',
          amount: 150000,
          direction: 'OUT',
          date: '2026-09-02T10:00:00Z',
          description: 'Session charge',
        }),
      ];
      const result = calculateChildBalance('child-1', txns);
      expect(result.balance).toBe(350000);
      expect(result.debt).toBe(0);
    });

    it('creates debt when charge exceeds current balance', () => {
      const txns: Transaction[] = [
        mockTxn({
          id: 't-1',
          childId: 'child-1',
          parentId: 'par-1',
          type: 'PAYMENT',
          amount: 100000,
          direction: 'IN',
          date: '2026-09-01T10:00:00Z',
          description: 'Payment',
        }),
        mockTxn({
          id: 't-2',
          childId: 'child-1',
          parentId: 'par-1',
          type: 'SESSION_CHARGE',
          amount: 250000,
          direction: 'OUT',
          date: '2026-09-02T10:00:00Z',
          description: 'Session charge',
        }),
      ];
      const result = calculateChildBalance('child-1', txns);
      expect(result.balance).toBe(0);
      expect(result.debt).toBe(150000);
    });

    it('first clears existing debt when new payment arrives, putting remainder into balance', () => {
      const txns: Transaction[] = [
        mockTxn({
          id: 't-1',
          childId: 'child-1',
          parentId: 'par-1',
          type: 'SESSION_CHARGE',
          amount: 200000,
          direction: 'OUT',
          date: '2026-09-01T10:00:00Z',
          description: 'Charge without funds',
        }),
        mockTxn({
          id: 't-2',
          childId: 'child-1',
          parentId: 'par-1',
          type: 'PAYMENT',
          amount: 300000,
          direction: 'IN',
          date: '2026-09-02T10:00:00Z',
          description: 'Payment clearing debt + surplus',
        }),
      ];
      const result = calculateChildBalance('child-1', txns);
      expect(result.debt).toBe(0);
      expect(result.balance).toBe(100000);
    });

    it('partially clears debt when payment is less than total debt', () => {
      const txns: Transaction[] = [
        mockTxn({
          id: 't-1',
          childId: 'child-1',
          parentId: 'par-1',
          type: 'SESSION_CHARGE',
          amount: 200000,
          direction: 'OUT',
          date: '2026-09-01T10:00:00Z',
          description: 'Charge without funds',
        }),
        mockTxn({
          id: 't-2',
          childId: 'child-1',
          parentId: 'par-1',
          type: 'PAYMENT',
          amount: 80000,
          direction: 'IN',
          date: '2026-09-02T10:00:00Z',
          description: 'Partial debt repayment',
        }),
      ];
      const result = calculateChildBalance('child-1', txns);
      expect(result.debt).toBe(120000);
      expect(result.balance).toBe(0);
    });
  });

  describe('calculateParentBalance', () => {
    it('aggregates balances and debts across all children of parent', () => {
      const txns: Transaction[] = [
        mockTxn({
          id: 't-1',
          childId: 'c-1',
          parentId: 'p-1',
          type: 'PAYMENT',
          amount: 400000,
          direction: 'IN',
          date: '2026-09-01T10:00:00Z',
          description: 'Child 1 deposit',
        }),
        mockTxn({
          id: 't-2',
          childId: 'c-2',
          parentId: 'p-1',
          type: 'SESSION_CHARGE',
          amount: 150000,
          direction: 'OUT',
          date: '2026-09-02T10:00:00Z',
          description: 'Child 2 deficit charge',
        }),
      ];

      const parentBal = calculateParentBalance('p-1', ['c-1', 'c-2'], txns);
      expect(parentBal.balance).toBe(400000);
      expect(parentBal.debt).toBe(150000);
    });

    it('accounts for direct parent-level payments with no childId', () => {
      const txns: Transaction[] = [
        mockTxn({
          id: 't-direct',
          parentId: 'p-1',
          type: 'PAYMENT',
          amount: 250000,
          direction: 'IN',
          date: '2026-09-01T10:00:00Z',
          description: 'Direct family deposit',
        }),
      ];

      const parentBal = calculateParentBalance('p-1', [], txns);
      expect(parentBal.balance).toBe(250000);
      expect(parentBal.debt).toBe(0);
    });
  });

  describe('getTopDebtors', () => {
    it('identifies and orders debtors descending by debt amount', () => {
      const children = [
        { id: 'c-1', fullName: 'Ali Valiyev', parentId: 'p-1' },
        { id: 'c-2', fullName: 'Vali Aliyev', parentId: 'p-2' },
        { id: 'c-3', fullName: 'Gulbahor Karimova', parentId: 'p-3' },
      ];
      const parents = [
        { id: 'p-1', fullName: 'Vali Valiyev', phone: '+998901111111' },
        { id: 'p-2', fullName: 'Ali Aliyev', phone: '+998902222222' },
        { id: 'p-3', fullName: 'Karim Karimov', phone: '+998903333333' },
      ];
      const txns: Transaction[] = [
        mockTxn({ id: 't-1', childId: 'c-1', parentId: 'p-1', type: 'SESSION_CHARGE', amount: 300000, direction: 'OUT', date: '2026-09-01T10:00:00Z', description: 'c1 charge' }),
        mockTxn({ id: 't-2', childId: 'c-2', parentId: 'p-2', type: 'SESSION_CHARGE', amount: 500000, direction: 'OUT', date: '2026-09-01T10:00:00Z', description: 'c2 charge' }),
        mockTxn({ id: 't-3', childId: 'c-3', parentId: 'p-3', type: 'PAYMENT', amount: 200000, direction: 'IN', date: '2026-09-01T10:00:00Z', description: 'c3 payment' }),
      ];

      const top = getTopDebtors(txns, children, parents, 10);
      expect(top).toHaveLength(2);
      expect(top[0].childName).toBe('Vali Aliyev');
      expect(top[0].debt).toBe(500000);
      expect(top[1].childName).toBe('Ali Valiyev');
      expect(top[1].debt).toBe(300000);
    });
  });

  describe('getAppointmentStats', () => {
    it('computes completion, cancellation, and no-show percentages', () => {
      const appointments = [
        { status: 'COMPLETED', date: '2026-09-20' },
        { status: 'COMPLETED', date: '2026-09-21' },
        { status: 'CANCELLED', date: '2026-09-22' },
        { status: 'NO_SHOW', date: '2026-09-23' },
      ];

      const stats = getAppointmentStats(appointments);
      expect(stats.total).toBe(4);
      expect(stats.byStatus.COMPLETED).toBe(2);
      expect(stats.byStatus.CANCELLED).toBe(1);
      expect(stats.byStatus.NO_SHOW).toBe(1);
      expect(stats.completionRate).toBe(50);
      expect(stats.cancellationRate).toBe(25);
      expect(stats.noShowRate).toBe(25);
    });
  });

  describe('getSpecialistWorkload', () => {
    it('calculates completed session hours for specialists', () => {
      const specialists = [
        { id: 's-1', fullName: 'Dr. Aziz' },
        { id: 's-2', fullName: 'Dr. Kamola' },
      ];
      const services = [
        { id: 'svc-1', durationMinutes: 60 },
        { id: 'svc-2', durationMinutes: 30 },
      ];
      const sessions = [
        { specialistId: 's-1', status: 'COMPLETED', serviceId: 'svc-1' },
        { specialistId: 's-1', status: 'COMPLETED', serviceId: 'svc-1' },
        { specialistId: 's-2', status: 'COMPLETED', serviceId: 'svc-2' },
      ];

      const workload = getSpecialistWorkload(sessions, specialists, services);
      expect(workload[0].specialistName).toBe('Dr. Aziz');
      expect(workload[0].completedSessions).toBe(2);
      expect(workload[0].totalHours).toBe(2);
      expect(workload[1].specialistName).toBe('Dr. Kamola');
      expect(workload[1].completedSessions).toBe(1);
      expect(workload[1].totalHours).toBe(0.5);
    });
  });

  describe('calculateFinancialSummary', () => {
    it('accurately computes revenue, debt, and balance totals', () => {
      const txns: Transaction[] = [
        mockTxn({ id: 't-1', childId: 'c-1', parentId: 'p-1', type: 'PAYMENT', amount: 1000000, direction: 'IN', date: '2026-09-01T10:00:00Z', description: 'Deposit' }),
        mockTxn({ id: 't-2', childId: 'c-1', parentId: 'p-1', type: 'SESSION_CHARGE', amount: 300000, direction: 'OUT', date: '2026-09-02T10:00:00Z', description: 'Session 1' }),
      ];

      const summary = calculateFinancialSummary(txns);
      expect(summary.totalRevenue).toBe(1000000);
      expect(summary.totalDebt).toBe(0);
      expect(summary.currentBalance).toBe(700000);
    });
  });
});
