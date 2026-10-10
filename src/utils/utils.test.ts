import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatAmount,
  calculateAge,
  getInitials,
} from './index';
import { calculateParentBalance } from '@/services/finance.service';
import type { Transaction } from '@/types';

describe('Utils test suite', () => {
  it('formats currency correctly', () => {
    const formatted = formatCurrency(150000);
    expect(formatted).toBeDefined();
    expect(typeof formatted).toBe('string');
  });

  it('formats compact currency correctly', () => {
    expect(formatCurrencyCompact(1500000)).toContain('mln');
    expect(formatCurrencyCompact(250000)).toContain('ming');
  });

  it('formats numbers with formatAmount', () => {
    expect(formatAmount(1000)).toBeDefined();
  });

  it('calculates age properly', () => {
    const birthDate = '2020-01-01';
    const age = calculateAge(birthDate);
    expect(age).toBeGreaterThanOrEqual(4);
  });

  it('gets correct initials', () => {
    expect(getInitials('Azizbek Karimov')).toBe('AK');
    expect(getInitials('Malika')).toBe('M');
    expect(getInitials('')).toBe('');
  });

  it('formats Uzbek phone numbers correctly as user types', async () => {
    const { formatUzbekPhoneInput } = await import('./index');
    expect(formatUzbekPhoneInput('')).toBe('');
    expect(formatUzbekPhoneInput('9')).toBe('+998 (9');
    expect(formatUzbekPhoneInput('90')).toBe('+998 (90) ');
    expect(formatUzbekPhoneInput('90123')).toBe('+998 (90) 123');
    expect(formatUzbekPhoneInput('9012345')).toBe('+998 (90) 123-45');
    expect(formatUzbekPhoneInput('901234567')).toBe('+998 (90) 123-45-67');
    expect(formatUzbekPhoneInput('+998901234567')).toBe('+998 (90) 123-45-67');
  });

  it('formats date strictly in dd.MM.yyyy format', async () => {
    const { formatDate } = await import('./index');
    expect(formatDate('2024-03-24')).toBe('24.03.2024');
    expect(formatDate(null)).toBe('—');
  });

  it('calculates parent balance correctly', () => {
    const mockTransactions: Transaction[] = [
      {
        id: 't1',
        type: 'PAYMENT',
        direction: 'IN',
        amount: 500000,
        parentId: 'parent-1',
        childId: 'child-1',
        description: 'Deposit',
        date: '2026-01-01',
        createdAt: '2026-01-01',
        createdBy: 'u1',
      },
      {
        id: 't2',
        type: 'SESSION_CHARGE',
        direction: 'OUT',
        amount: 200000,
        parentId: 'parent-1',
        childId: 'child-1',
        description: 'Massaj seansi',
        date: '2026-01-02',
        createdAt: '2026-01-02',
        createdBy: 'u1',
      },
    ];

    const result = calculateParentBalance('parent-1', ['child-1'], mockTransactions);
    expect(result.balance).toBe(300000);
    expect(result.debt).toBe(0);
  });

  it('determines mobile viewport correctly with useIsMobile', async () => {
    const { renderHook, act } = await import('@testing-library/react');
    const { useIsMobile } = await import('./index');

    // Default window.innerWidth in jsdom is 1024
    const { result } = renderHook(() => useIsMobile(768));
    expect(result.current).toBe(false);

    // Simulate mobile viewport resize
    act(() => {
      window.innerWidth = 390;
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe(true);

    // Restore desktop
    act(() => {
      window.innerWidth = 1024;
      window.dispatchEvent(new Event('resize'));
    });
    expect(result.current).toBe(false);
  });
});
