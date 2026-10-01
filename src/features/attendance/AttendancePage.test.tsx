import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AttendancePage } from './AttendancePage';
import { useStore } from '@/store';

describe('AttendancePage Component', () => {
  const today = new Date().toISOString().split('T')[0];

  beforeEach(() => {
    // Ensure Super Admin user and today's mock appointment are populated
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
      appointments: [
        {
          id: 'apt-test-1',
          childId: 'c1',
          parentId: 'p1',
          specialistId: 's1',
          serviceId: 'srv1',
          date: today,
          startTime: '10:00',
          endTime: '11:00',
          status: 'CONFIRMED',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
      children: [
        {
          id: 'c1',
          fullName: 'Alisher Qodirov',
          dateOfBirth: '2019-05-10',
          gender: 'MALE',
          parentId: 'p1',
          status: 'ACTIVE',
          createdAt: '2026-01-01T00:00:00Z',
        } as any,
      ],
      specialists: [
        {
          id: 's1',
          fullName: 'Dr. Aziz Nazarov',
          phone: '+998901234567',
          status: 'ACTIVE',
          role: 'SPECIALIST',
          specialization: 'Massaj terapevti',
          experience: 5,
          workingDays: [1, 2, 3, 4, 5],
          workingHours: { start: '09:00', end: '18:00' },
          createdAt: '2026-01-01T00:00:00Z',
        } as any,
      ],
      services: [
        {
          id: 'srv1',
          name: 'Davolash massaji',
          description: 'Reabilitatsiya massaji',
          durationMinutes: 60,
          price: 150000,
          status: 'ACTIVE',
          createdAt: '2026-01-01T00:00:00Z',
        } as any,
      ],
      attendance: [],
    });
  });

  it('renders page header and KPI statistics cards', () => {
    render(
      <MemoryRouter>
        <AttendancePage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Davomat jurnali' })).toBeInTheDocument();
    expect(screen.getByText('Davomat darajasi')).toBeInTheDocument();
    expect(screen.getByText('Kelganlar')).toBeInTheDocument();
    expect(screen.getByText('Kechikkanlar')).toBeInTheDocument();
    expect(screen.getByText('Sababli kelmagan')).toBeInTheDocument();
    expect(screen.getByText('Sababsiz kelmagan')).toBeInTheDocument();
  });

  it('renders unified date controls with single DatePicker trigger and no duplicate text', () => {
    render(
      <MemoryRouter>
        <AttendancePage />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: 'Bugun' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Oldingi kun' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keyingi kun' })).toBeInTheDocument();
    expect(screen.getByTestId('datepicker-trigger')).toBeInTheDocument();
  });

  it('renders table header strip with Bola va mashg‘ulot and Davomat holati columns', () => {
    render(
      <MemoryRouter>
        <AttendancePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Bola va mashg‘ulot ma’lumotlari')).toBeInTheDocument();
    expect(screen.getByText('Davomat holati')).toBeInTheDocument();
  });

  it('renders segmented quick action toggle buttons and marks attendance on click', () => {
    render(
      <MemoryRouter>
        <AttendancePage />
      </MemoryRouter>
    );

    const keldiButton = screen.getByTitle('Keldi (mashg‘ulotda qatnashdi)');
    expect(keldiButton).toBeInTheDocument();
    expect(screen.getByTitle('Kechikdi')).toBeInTheDocument();
    expect(screen.getByTitle('Sababli kelmadi')).toBeInTheDocument();
    expect(screen.getByTitle('Sababsiz kelmadi')).toBeInTheDocument();

    // Clicking Keldi marks attendance
    fireEvent.click(keldiButton);
    expect(keldiButton).toHaveClass('bg-emerald-600');
  });

  it('marks attendance independently when a child has multiple appointments on the same day', () => {
    // Add a second appointment for the same child on the same day
    useStore.setState({
      appointments: [
        {
          id: 'apt-test-1',
          childId: 'c1',
          parentId: 'p1',
          specialistId: 's1',
          serviceId: 'srv1',
          date: today,
          startTime: '10:00',
          endTime: '11:00',
          status: 'CONFIRMED',
          createdAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 'apt-test-2',
          childId: 'c1',
          parentId: 'p1',
          specialistId: 's1',
          serviceId: 'srv1',
          date: today,
          startTime: '14:00',
          endTime: '15:00',
          status: 'CONFIRMED',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
      attendance: [],
    });

    render(
      <MemoryRouter>
        <AttendancePage />
      </MemoryRouter>
    );

    const keldiButtons = screen.getAllByTitle('Keldi (mashg‘ulotda qatnashdi)');
    expect(keldiButtons).toHaveLength(2);

    // Both should be unmarked initially
    expect(keldiButtons[0]).not.toHaveClass('bg-emerald-600');
    expect(keldiButtons[1]).not.toHaveClass('bg-emerald-600');

    // Click "Keldi" on the FIRST appointment only
    fireEvent.click(keldiButtons[0]);

    // ONLY the first appointment should have "Keldi" selected!
    expect(keldiButtons[0]).toHaveClass('bg-emerald-600');
    expect(keldiButtons[1]).not.toHaveClass('bg-emerald-600');

    // Click "Keldi" again on the first appointment to unmark it
    fireEvent.click(keldiButtons[0]);
    expect(keldiButtons[0]).not.toHaveClass('bg-emerald-600');
  });
});
