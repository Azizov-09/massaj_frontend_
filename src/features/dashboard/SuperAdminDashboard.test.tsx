import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { useStore } from '@/store';

describe('SuperAdminDashboard Component', () => {
  const today = new Date().toISOString().split('T')[0];

  beforeEach(() => {
    useStore.setState({
      currentUser: {
        id: 'u-admin-1',
        fullName: 'Bosh Administrator',
        email: 'admin@massaj.uz',
        phone: '+998901234567',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00Z',
      },
      children: [
        {
          id: 'c1',
          fullName: 'Asilbek Abdullayev',
          dateOfBirth: '2020-01-01',
          gender: 'MALE',
          parentId: 'p1',
          status: 'ACTIVE',
          diagnosis: 'Skolioz',
          createdAt: '2026-01-01T00:00:00Z',
        } as any,
        {
          id: 'c2',
          fullName: 'Madina Karimova',
          dateOfBirth: '2019-06-15',
          gender: 'FEMALE',
          parentId: 'p2',
          status: 'ACTIVE',
          createdAt: '2026-01-01T00:00:00Z',
        } as any,
      ],
      specialists: [
        {
          id: 's1',
          fullName: 'Aziz Karimov',
          specialization: 'Bolalar massajchisi',
          phone: '+998909998877',
          status: 'ACTIVE',
          role: 'SPECIALIST',
          experience: 6,
          workingDays: [1, 2, 3, 4, 5],
          workingHours: { start: '09:00', end: '18:00' },
          createdAt: '2026-01-01T00:00:00Z',
        } as any,
      ],
      parents: [
        {
          id: 'p1',
          fullName: 'Dilnoza Abdullayeva',
          phone: '+998901112233',
          role: 'PARENT',
          childrenIds: ['c1'],
          status: 'ACTIVE',
          createdAt: '2026-01-01T00:00:00Z',
        } as any,
      ],
      services: [
        {
          id: 'srv1',
          name: 'Umumiy massaj',
          durationMinutes: 45,
          price: 150000,
          status: 'ACTIVE',
          createdAt: '2026-01-01T00:00:00Z',
        } as any,
      ],
      appointments: [
        {
          id: 'apt-1',
          childId: 'c1',
          parentId: 'p1',
          specialistId: 's1',
          serviceId: 'srv1',
          date: today,
          startTime: '10:00',
          endTime: '10:45',
          status: 'CONFIRMED',
          notes: 'Dastlabki ko‘rik',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
      transactions: [
        {
          id: 'txn-1',
          type: 'PAYMENT',
          direction: 'IN',
          amount: 300000,
          childId: 'c1',
          parentId: 'p1',
          description: 'Hisob to‘ldirish',
          date: today,
          createdAt: `${today}T10:00:00Z`,
          createdBy: 'u-admin-1',
        },
      ],
      sessions: [
        {
          id: 'ses-1',
          appointmentId: 'apt-1',
          childId: 'c1',
          specialistId: 's1',
          serviceId: 'srv1',
          startTime: `${today}T10:00:00Z`,
          status: 'COMPLETED',
          createdAt: `${today}T10:00:00Z`,
        },
      ],
    });
  });

  it('renders executive header, operational strip, and 8 KPI cards', () => {
    render(
      <MemoryRouter>
        <SuperAdminDashboard />
      </MemoryRouter>
    );

    // Header
    expect(screen.getByText('Markaz Boshqaruvi')).toBeInTheDocument();
    expect(screen.getByText('Jonli telemetriya')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Yangi qabul/i })).toBeInTheDocument();

    // Operational strip
    expect(screen.getByText(/Bugungi reja bajarilishi/i)).toBeInTheDocument();
    expect(screen.getByText(/Tizim me'yorida ishlamoqda/i)).toBeInTheDocument();

    // KPIs
    expect(screen.getByText('Jami tushum')).toBeInTheDocument();
    expect(screen.getByText('Jami qarzdorlik')).toBeInTheDocument();
    expect(screen.getByText('Joriy balans')).toBeInTheDocument();
    expect(screen.getByText('Bugungi tushum')).toBeInTheDocument();
    expect(screen.getByText('Faol bemor bolalar')).toBeInTheDocument();
    expect(screen.getByText('Faol mutaxassislar')).toBeInTheDocument();
    expect(screen.getByText('Bugungi qabullar')).toBeInTheDocument();
    expect(screen.getByText('Bugungi seanslar')).toBeInTheDocument();
  });

  it('filters date range using preset tabs', () => {
    render(
      <MemoryRouter>
        <SuperAdminDashboard />
      </MemoryRouter>
    );

    const todayTab = screen.getByRole('button', { name: 'Bugun' });
    fireEvent.click(todayTab);
    expect(todayTab).toHaveClass('bg-charcoal-900');
  });

  it('shows today\'s clinical schedule with appointment item', () => {
    render(
      <MemoryRouter>
        <SuperAdminDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Bugungi klinik jadval')).toBeInTheDocument();
    expect(screen.getAllByText('Asilbek Abdullayev').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  it('opens appointment details modal upon clicking appointment item', () => {
    render(
      <MemoryRouter>
        <SuperAdminDashboard />
      </MemoryRouter>
    );

    const aptItems = screen.getAllByText('Asilbek Abdullayev');
    fireEvent.click(aptItems[0]);

    expect(screen.getByText('Uchrashuv tafsilotlari')).toBeInTheDocument();
    expect(screen.getByText(/"Dastlabki ko‘rik"/i)).toBeInTheDocument();
  });

  it('opens create appointment modal on clicking Yangi qabul', () => {
    render(
      <MemoryRouter>
        <SuperAdminDashboard />
      </MemoryRouter>
    );

    const newBtn = screen.getByRole('button', { name: /Yangi qabul/i });
    fireEvent.click(newBtn);

    expect(screen.getByText('Yangi uchrashuv belgilash')).toBeInTheDocument();
  });
});
