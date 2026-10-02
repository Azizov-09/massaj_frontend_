import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SpecialistDashboard } from './SpecialistDashboard';
import { useStore } from '@/store';

describe('SpecialistDashboard Component', () => {
  const today = new Date().toISOString().split('T')[0];

  beforeEach(() => {
    useStore.setState({
      currentUser: {
        id: 's1',
        fullName: 'Aziz Karimov',
        email: 'aziz@massaj.uz',
        phone: '+998909998877',
        role: 'SPECIALIST',
        status: 'ACTIVE',
        specialization: 'Bolalar massajchisi',
        experience: 6,
        workingDays: [1, 2, 3, 4, 5],
        workingHours: { start: '09:00', end: '18:00' },
        createdAt: '2026-01-01T00:00:00Z',
      } as any,
      children: [
        {
          id: 'c1',
          fullName: 'Asilbek Abdullayev',
          dateOfBirth: '2020-01-01',
          gender: 'MALE',
          parentId: 'p1',
          status: 'ACTIVE',
          assignedSpecialistId: 's1',
          diagnosis: 'Skolioz',
          createdAt: '2026-01-01T00:00:00Z',
        } as any,
      ],
      services: [
        {
          id: 'srv1',
          name: 'Davolovchi massaj',
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
          notes: 'Bel sohasini kuchaytirish',
          createdAt: '2026-01-01T00:00:00Z',
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

  it('renders specialist greeting, clinical telemetry and KPIs', () => {
    render(
      <MemoryRouter>
        <SpecialistDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/Assalomu alaykum, Aziz Karimov!/i)).toBeInTheDocument();
    expect(screen.getByText('Bugungi muolajalar')).toBeInTheDocument();
    expect(screen.getByText('Biriktirilgan bolalar')).toBeInTheDocument();
    expect(screen.getByText('Bajarilgan seanslar')).toBeInTheDocument();
    expect(screen.getByText('Kasbiy reyting')).toBeInTheDocument();
  });

  it('displays today\'s schedule with action button to start session', () => {
    render(
      <MemoryRouter>
        <SpecialistDashboard />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Asilbek Abdullayev').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Seansni boshlash/i })).toBeInTheDocument();
  });

  it('opens quick progress note modal upon clicking Kuzatuv qaydi button', () => {
    render(
      <MemoryRouter>
        <SpecialistDashboard />
      </MemoryRouter>
    );

    const noteButtons = screen.getAllByRole('button', { name: /Kuzatuv qaydi/i });
    fireEvent.click(noteButtons[0]);

    expect(screen.getByText('Tezkor klinik kuzatuv qaydi')).toBeInTheDocument();
    expect(screen.getByText('Bemor bola')).toBeInTheDocument();
  });
});
