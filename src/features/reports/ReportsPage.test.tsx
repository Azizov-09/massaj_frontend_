import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ReportsPage } from './ReportsPage';
import { useStore } from '@/store';
import type { Parent, Child, Transaction } from '@/types';

describe('ReportsPage Component', () => {
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
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'txn-101',
      parentId: 'par-1',
      childId: 'child-1',
      type: 'PAYMENT',
      direction: 'IN',
      amount: 500000,
      date: '2026-03-01T10:00:00Z',
      description: 'Kurs uchun to‘lov',
    },
  ];

  beforeEach(() => {
    useStore.setState({
      parents: mockParents,
      children: mockChildren,
      transactions: mockTransactions,
      sessions: [],
      attendance: [],
      specialists: [],
      services: [],
    });
  });

  it('renders header, export buttons, and tab switchers', () => {
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Tizimli hisobotlar va tahlillar')).toBeInTheDocument();
    expect(screen.getByText('CSV Eksport')).toBeInTheDocument();
    expect(screen.getByText('JSON Eksport')).toBeInTheDocument();
    expect(screen.getAllByText('Moliyaviy hisobot').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Davomat hisoboti').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Seanslar hisoboti').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bolalar ro‘yxati').length).toBeGreaterThan(0);
  });

  it('renders finance table with pagination and formatted record', () => {
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('txn-101')).toBeInTheDocument();
    expect(screen.getByText('Feruza Aliyeva')).toBeInTheDocument();
    expect(screen.getByText('Kurs uchun to‘lov')).toBeInTheDocument();
  });

  it('allows searching within report data', () => {
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText("Hisobot bo'yicha qidirish...");
    fireEvent.change(searchInput, { target: { value: 'Feruza' } });
    expect(screen.getByText('txn-101')).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'MavjudEmas' } });
    expect(screen.queryByText('txn-101')).not.toBeInTheDocument();
    expect(screen.getByText("Moliyaviy ma'lumot topilmadi")).toBeInTheDocument();
  });

  it('switches to children report tab correctly', () => {
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    const childrenTabButton = screen.getByRole('button', { name: /Bolalar ro‘yxati/i });
    fireEvent.click(childrenTabButton);

    expect(screen.getByText('Zara Aliyeva')).toBeInTheDocument();
    expect(screen.getByText('+998901234600')).toBeInTheDocument();
  });

  it('exports CSV when export button is clicked', () => {
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    const createObjectURLMock = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    const exportBtn = screen.getByText('CSV Eksport');
    fireEvent.click(exportBtn);

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();
  });
});
