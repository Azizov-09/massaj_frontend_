import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ChildrenPage } from './ChildrenPage';
import { useStore } from '@/store';
import type { AdminUser, Parent, Child, Specialist } from '@/types';

describe('ChildrenPage Component', () => {
  const mockAdmin: AdminUser = {
    id: 'admin-1',
    fullName: 'Bosh Admin',
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

  const mockSpecialists: Specialist[] = [
    {
      id: 'spec-1',
      fullName: 'Dilnoza Karimova',
      email: 'dilnoza@massaj.uz',
      phone: '+998901234568',
      role: 'SPECIALIST',
      status: 'ACTIVE',
      specialization: 'Bolalar massaji',
      rating: 4.9,
      experience: 7,
      bio: 'Tajribali massajchi',
      workingDays: [1, 2, 3, 4, 5],
      workingHours: { start: '09:00', end: '18:00' },
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
      assignedSpecialistId: 'spec-1',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'child-2',
      fullName: 'Umid Hasanov',
      parentId: 'par-2',
      dateOfBirth: '2021-08-20',
      gender: 'MALE',
      diagnosis: 'Ploskostopie',
      status: 'INACTIVE',
      assignedSpecialistId: 'spec-1',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'child-3',
      fullName: 'Aziz Karimov',
      parentId: 'par-1',
      dateOfBirth: '2019-02-10',
      gender: 'MALE',
      status: 'ARCHIVED',
      createdAt: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    useStore.setState({
      currentUser: mockAdmin,
      isAuthenticated: true,
      children: mockChildren,
      parents: mockParents,
      specialists: mockSpecialists,
      transactions: [],
      appointments: [],
    });
  });

  it('renders page header, counter cards, and children table', () => {
    render(
      <MemoryRouter>
        <ChildrenPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Bolalar' })).toBeInTheDocument();
    expect(screen.getByText('Jami bolalar')).toBeInTheDocument();
    expect(screen.getByText('Zara Aliyeva')).toBeInTheDocument();
    expect(screen.getByText('Umid Hasanov')).toBeInTheDocument();
  });

  it('displays accurate range indicator matching visible items', () => {
    render(
      <MemoryRouter>
        <ChildrenPage />
      </MemoryRouter>
    );

    // Range display format: "Ko‘rsatilmoqda: 1–3 / 3"
    const rangeText = screen.getByText(/Ko‘rsatilmoqda:/i);
    expect(rangeText).toBeInTheDocument();
    expect(rangeText.textContent).toContain('1–3');
    expect(rangeText.textContent).toContain('3');
  });

  it('filters children by search query with debouncing', async () => {
    render(
      <MemoryRouter>
        <ChildrenPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Bola yoki ota-ona ismi bo'yicha.../i);
    fireEvent.change(searchInput, { target: { value: 'Zara' } });

    await waitFor(() => {
      expect(screen.getByText('Zara Aliyeva')).toBeInTheDocument();
      expect(screen.queryByText('Umid Hasanov')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('switches status filter when clicking status counter cards', async () => {
    render(
      <MemoryRouter>
        <ChildrenPage />
      </MemoryRouter>
    );

    // Click "Faol" counter card
    const activeCards = screen.getAllByRole('button', { name: /Faol/i });
    fireEvent.click(activeCards[0]);

    await waitFor(() => {
      expect(screen.getByText('Zara Aliyeva')).toBeInTheDocument();
      expect(screen.queryByText('Umid Hasanov')).not.toBeInTheDocument();
      expect(screen.queryByText('Aziz Karimov')).not.toBeInTheDocument();
    });
  });

  it('opens details modal when clicking on child row', async () => {
    render(
      <MemoryRouter>
        <ChildrenPage />
      </MemoryRouter>
    );

    const childRowText = screen.getByText('Zara Aliyeva');
    fireEvent.click(childRowText);

    await waitFor(() => {
      expect(screen.getByText("Bola ma'lumotlari")).toBeInTheDocument();
      expect(screen.getByText("Joriy depozit")).toBeInTheDocument();
    });
  });
});
