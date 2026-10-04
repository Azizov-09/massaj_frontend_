import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { DebtorsPage } from './DebtorsPage';
import { useStore } from '@/store';
import type { AdminUser, Parent, Child, Transaction } from '@/types';

describe('DebtorsPage Component', () => {
  const mockAdmin: AdminUser = {
    id: 'admin-1',
    fullName: 'Bosh Administrator',
    email: 'admin@massaj.uz',
    phone: '+998901234567',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
  };

  const mockParents: Parent[] = [
    {
      id: 'par-1',
      fullName: 'Feruza Aliyeva',
      email: 'feruza@example.com',
      phone: '+998901234600',
      role: 'PARENT',
      status: 'ACTIVE',
      childrenIds: ['child-1'],
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'par-2',
      fullName: 'Munira Hasanova',
      email: 'munira@example.com',
      phone: '+998901234601',
      role: 'PARENT',
      status: 'ACTIVE',
      childrenIds: ['child-2'],
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  const mockChildren: Child[] = [
    {
      id: 'child-1',
      fullName: 'Zara Aliyeva',
      parentId: 'par-1',
      dateOfBirth: '2020-05-15',
      gender: 'FEMALE',
      diagnosis: 'Skolioz',
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'child-2',
      fullName: 'Umid Hasanov',
      parentId: 'par-2',
      dateOfBirth: '2021-08-20',
      gender: 'MALE',
      diagnosis: 'Ploskostopie',
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  const mockTransactions: Transaction[] = [
    // Zara has 1,020,000 debt (charge 1,020,000, no payment)
    {
      id: 'txn-1',
      type: 'SESSION_CHARGE',
      direction: 'OUT',
      amount: 1020000,
      childId: 'child-1',
      parentId: 'par-1',
      description: 'Muolaja to\'lovi',
      date: '2026-09-20T10:00:00.000Z',
      createdAt: '2026-09-20T10:00:00.000Z',
      createdBy: 'spec-1',
    },
    // Umid has 940,000 debt
    {
      id: 'txn-2',
      type: 'SESSION_CHARGE',
      direction: 'OUT',
      amount: 940000,
      childId: 'child-2',
      parentId: 'par-2',
      description: 'Muolaja to\'lovi',
      date: '2026-09-25T11:00:00.000Z',
      createdAt: '2026-09-25T11:00:00.000Z',
      createdBy: 'spec-2',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    useStore.setState({
      currentUser: mockAdmin,
      parents: mockParents,
      children: mockChildren,
      transactions: mockTransactions,
      payments: [],
    });
  });

  it('renders header, KPIs, and both debtors with accurate currency formatting', () => {
    render(
      <MemoryRouter>
        <DebtorsPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Qarzdorlar reytingi")).toBeInTheDocument();
    expect(screen.getAllByText("Zara Aliyeva").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Umid Hasanov").length).toBeGreaterThan(0);

    // Verify accurate currency formatting (1,020,000 so'm without losing 20,000 so'm)
    const zaraDebts = screen.getAllByText(/-1\s?020\s?000\s?so'm/i);
    expect(zaraDebts.length).toBeGreaterThan(0);

    // Overdue badges
    const overdueBadges = screen.getAllByText(/kun kechikdi/i);
    expect(overdueBadges.length).toBeGreaterThan(0);
  });

  it('displays call link and telegram action buttons', () => {
    render(
      <MemoryRouter>
        <DebtorsPage />
      </MemoryRouter>
    );

    // Phone links
    const phoneLinks = screen.getAllByRole('link', { name: /\+998901234600/i });
    expect(phoneLinks.length).toBeGreaterThan(0);
    expect(phoneLinks[0]).toHaveAttribute('href', 'tel:+998901234600');

    // Telegram buttons
    const telegramButtons = screen.getAllByRole('button', { name: /Telegram/i });
    expect(telegramButtons.length).toBeGreaterThan(0);

    // Click Telegram button opens window.open
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    fireEvent.click(telegramButtons[0]);
    expect(windowOpenSpy).toHaveBeenCalledWith(
      expect.stringContaining('https://t.me/share/url'),
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('opens and completes Quick Payment modal, immediately reducing debtor balance', async () => {
    render(
      <MemoryRouter>
        <DebtorsPage />
      </MemoryRouter>
    );

    // Find and click "To'lov"
    const paymentButtons = screen.getAllByRole('button', { name: /To'lov/i });
    expect(paymentButtons.length).toBeGreaterThan(0);
    fireEvent.click(paymentButtons[0]);

    // Modal should be open
    expect(screen.getByText("Tezkor to'lov qabul qilish")).toBeInTheDocument();

    // Submit payment
    const confirmButton = screen.getByRole('button', { name: /To'lovni tasdiqlash/i });
    fireEvent.click(confirmButton);

    // Modal closes
    await waitFor(() => {
      expect(screen.queryByText("Tezkor to'lov qabul qilish")).not.toBeInTheDocument();
    });

    // Zustand store transactions should now have a payment recorded
    const state = useStore.getState();
    const payments = state.payments;
    expect(payments.length).toBe(1);
    expect(payments[0].amount).toBe(1020000);
    expect(payments[0].childId).toBe('child-1');
  });

  it('filters debtors by search input', () => {
    render(
      <MemoryRouter>
        <DebtorsPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Bola, ota-ona yoki telefon/i);
    fireEvent.change(searchInput, { target: { value: 'Zara' } });

    expect(screen.getAllByText("Zara Aliyeva").length).toBeGreaterThan(0);
    expect(screen.queryByText("Umid Hasanov")).not.toBeInTheDocument();
  });

  it('triggers Excel export download without errors', () => {
    render(
      <MemoryRouter>
        <DebtorsPage />
      </MemoryRouter>
    );

    const exportBtn = screen.getByRole('button', { name: /Excelga yuklash/i });
    expect(exportBtn).toBeInTheDocument();

    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    fireEvent.click(exportBtn);
    expect(appendChildSpy).toHaveBeenCalled();
  });
});
