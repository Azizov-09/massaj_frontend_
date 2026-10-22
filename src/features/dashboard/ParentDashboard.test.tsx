import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ParentDashboard } from './ParentDashboard';
import { useStore } from '@/store';

describe('ParentDashboard Component', () => {
  const today = new Date().toISOString().split('T')[0];

  beforeEach(() => {
    useStore.setState({
      currentUser: {
        id: 'p1',
        fullName: 'Dilnoza Abdullayeva',
        email: 'dilnoza@test.uz',
        phone: '+998901112233',
        role: 'PARENT',
        status: 'ACTIVE',
        childrenIds: ['c1'],
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
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
      progressNotes: [
        {
          id: 'prg-1',
          childId: 'c1',
          specialistId: 's1',
          note: 'Uyda har kuni 10 daqiqa yengil gimnastika qilish kerak.',
          date: today,
          createdAt: `${today}T10:00:00Z`,
        },
      ],
    });
  });

  it('renders parent greeting, KPI cards and children cards', () => {
    render(
      <MemoryRouter>
        <ParentDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText(/Assalomu alaykum, Dilnoza Abdullayeva!/i)).toBeInTheDocument();
    expect(screen.getByText('Mening farzandlarim')).toBeInTheDocument();
    expect(screen.getByText('Navbatdagi qabullar')).toBeInTheDocument();
    expect(screen.getByText('Joriy depozit balansi')).toBeInTheDocument();
    expect(screen.getByText('Qarzdorlik holati')).toBeInTheDocument();

    // Child card
    expect(screen.getAllByText('Asilbek Abdullayev').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Skolioz')).toBeInTheDocument();
  });

  it('displays specialist recommendations with copy button', () => {
    render(
      <MemoryRouter>
        <ParentDashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Uyda har kuni 10 daqiqa yengil gimnastika qilish kerak.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nusxalash/i })).toBeInTheDocument();
  });

  it('opens appointment booking modal on clicking Qabulga yozilish', () => {
    render(
      <MemoryRouter>
        <ParentDashboard />
      </MemoryRouter>
    );

    const bookButtons = screen.getAllByRole('button', { name: /Qabulga yozilish/i });
    fireEvent.click(bookButtons[0]);

    expect(screen.getByText('Yangi qabulga yozilish')).toBeInTheDocument();
  });
});
