import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppointmentsPage } from './AppointmentsPage';
import { useStore } from '@/store';

describe('AppointmentsPage Component', () => {
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
          status: 'SCHEDULED',
          notes: 'Birinchi seans',
          createdAt: '2026-01-01T00:00:00Z',
        },
        {
          id: 'apt-2',
          childId: 'c2',
          parentId: 'p2',
          specialistId: 's2',
          serviceId: 'srv2',
          date: '2027-01-01',
          startTime: '14:00',
          endTime: '14:45',
          status: 'COMPLETED',
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
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
      parents: [
        {
          id: 'p1',
          fullName: 'Dilnoza Abdullayeva',
          phone: '+998901112233',
          role: 'PARENT',
          childrenIds: ['c1'],
          status: 'ACTIVE',
          email: 'dilnoza@test.uz',
          createdAt: '2026-01-01T00:00:00Z',
        } as any,
        {
          id: 'p2',
          fullName: 'Rustam Karimov',
          phone: '+998904445566',
          role: 'PARENT',
          childrenIds: ['c2'],
          status: 'ACTIVE',
          email: 'rustam@test.uz',
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
        {
          id: 's2',
          fullName: 'Kamola Azimova',
          specialization: 'Reabilitolog',
          phone: '+998905556677',
          status: 'ACTIVE',
          role: 'SPECIALIST',
          experience: 4,
          workingDays: [1, 2, 3, 4, 5],
          workingHours: { start: '09:00', end: '18:00' },
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
        {
          id: 'srv2',
          name: 'Ortopedik reabilitatsiya',
          durationMinutes: 45,
          price: 200000,
          status: 'ACTIVE',
          createdAt: '2026-01-01T00:00:00Z',
        } as any,
      ],
    });
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <AppointmentsPage />
      </MemoryRouter>
    );

  it('renders page header, interactive KPI cards and status tabs', () => {
    renderComponent();

    expect(screen.getByText('Uchrashuvlar')).toBeInTheDocument();
    expect(screen.getAllByText('Bugun').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Kutilmoqda').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Yakunlangan').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Bekor qilingan').length).toBeGreaterThan(0);

    // Check status tab buttons
    expect(screen.getByRole('button', { name: /Barchasi/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Yakunlangan/i })).toBeInTheDocument();
  });

  it('displays rich child and specialist cell details in the table', () => {
    renderComponent();

    // Child name and diagnosis
    expect(screen.getByText('Asilbek Abdullayev')).toBeInTheDocument();
    expect(screen.getByText(/Dilnoza Abdullayeva/i)).toBeInTheDocument();
    expect(screen.getByText(/998901112233/)).toBeInTheDocument();

    // Specialist name in table
    const tableElement = screen.getByRole('table');
    expect(within(tableElement).getByText('Aziz Karimov')).toBeInTheDocument();
    expect(within(tableElement).getByText('Bolalar massajchisi')).toBeInTheDocument();

    // Service name
    expect(within(tableElement).getByText('Umumiy massaj')).toBeInTheDocument();
  });

  it('filters appointments when clicking quick status tabs', () => {
    renderComponent();

    // Initially both appointments are visible
    expect(screen.getByText('Asilbek Abdullayev')).toBeInTheDocument();
    expect(screen.getByText('Madina Karimova')).toBeInTheDocument();

    // Click "Bugun" status tab (the tab has badge count 1)
    const todayTab = screen.getAllByRole('button', { name: /Bugun/i })[0];
    fireEvent.click(todayTab);

    // Only today's appointment (Asilbek) is visible
    expect(screen.getByText('Asilbek Abdullayev')).toBeInTheDocument();
    expect(screen.queryByText('Madina Karimova')).not.toBeInTheDocument();

    // Click "Yakunlangan" tab
    const completedTab = screen.getByRole('button', { name: /Yakunlangan/i });
    fireEvent.click(completedTab);

    // Only completed appointment (Madina) is visible
    expect(screen.queryByText('Asilbek Abdullayev')).not.toBeInTheDocument();
    expect(screen.getByText('Madina Karimova')).toBeInTheDocument();
  });

  it('filters appointments via search input and resets with clear button', () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText(/Bola, ota-ona yoki mutaxassis/i);
    fireEvent.change(searchInput, { target: { value: 'Madina' } });

    expect(screen.getByText('Madina Karimova')).toBeInTheDocument();
    expect(screen.queryByText('Asilbek Abdullayev')).not.toBeInTheDocument();

    // Clear filters button should be visible
    const clearBtn = screen.getByTitle("Barcha filtrlarni bekor qilish");
    fireEvent.click(clearBtn);

    expect(screen.getByText('Asilbek Abdullayev')).toBeInTheDocument();
    expect(screen.getByText('Madina Karimova')).toBeInTheDocument();
  });

  it('opens appointment details modal when clicking details eye button', async () => {
    renderComponent();

    const viewButtons = screen.getAllByTitle("Batafsil ko'rish");
    // viewButtons[1] corresponds to apt-1 (Asilbek, sorted after 2027 apt-2)
    fireEvent.click(viewButtons[1]);

    // Modal title and detailed content
    expect(screen.getByText("Uchrashuv tafsilotlari")).toBeInTheDocument();
    expect(screen.getByText(/Bola ma'lumotlari/i)).toBeInTheDocument();
    expect(screen.getByText(/Skolioz/i)).toBeInTheDocument();
    expect(screen.getByText('Izoh:')).toBeInTheDocument();
    expect(screen.getByText('Birinchi seans')).toBeInTheDocument();

    // Close modal
    const closeBtns = screen.getAllByRole('button', { name: /Yopish/i });
    fireEvent.click(closeBtns[0]);
    await waitFor(() => {
      expect(screen.queryByText("Uchrashuv tafsilotlari")).not.toBeInTheDocument();
    });
  });
});
