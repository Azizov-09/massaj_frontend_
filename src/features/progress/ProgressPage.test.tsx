import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { ProgressPage } from './ProgressPage';
import { useStore } from '@/store';

describe('ProgressPage Component', () => {
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
      progressNotes: [
        {
          id: 'prg-1',
          childId: 'c1',
          specialistId: 's1',
          note: 'Bola harakatlari ancha dadillashdi, emaklash fazasida faol.',
          date: '2026-02-14',
          createdAt: '2026-02-14T10:00:00Z',
        },
      ],
      sessions: [
        {
          id: 'ses-1',
          appointmentId: 'apt-1',
          childId: 'c2',
          specialistId: 's1',
          serviceId: 'srv-1',
          startTime: '2026-02-12T10:00:00Z',
          endTime: '2026-02-12T10:45:00Z',
          status: 'COMPLETED',
          observation: 'Yelka sohasi bo\'shashtirildi, spastika kamaydi.',
          recommendation: 'Uyda kuniga 10 daqiqa yengil gimnastika qilish kerak.',
          createdAt: '2026-02-12T10:00:00Z',
        },
      ],
      assessments: [
        {
          id: 'asmnt-1',
          childId: 'c1',
          specialistId: 's1',
          date: '2026-02-10',
          scores: {
            movement: 4,
            coordination: 4,
            flexibility: 4,
            activityTolerance: 4,
            sessionResponse: 4,
          },
          professionalObservation: 'Umumiy holat barqaror ijobiy.',
          createdAt: '2026-02-10T10:00:00Z',
        },
      ],
    });
  });

  it('renders page header, interactive KPI cards and event type tabs', () => {
    render(
      <MemoryRouter>
        <ProgressPage />
      </MemoryRouter>
    );

    // Header
    expect(screen.getByText('Rivojlanish va monitoring (Progress)')).toBeInTheDocument();
    expect(screen.getByText('Yangi qayd qo‘shish')).toBeInTheDocument();

    // KPIs & Tabs
    expect(screen.getByText('Jami qaydlar')).toBeInTheDocument();
    expect(screen.getAllByText('Seans xulosalari').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Tibbiy tavsiyalar')).toBeInTheDocument();
    expect(screen.getAllByText('Baholash natijalari').length).toBeGreaterThanOrEqual(1);

    // Timeline entries
    expect(screen.getByText('Bola harakatlari ancha dadillashdi, emaklash fazasida faol.')).toBeInTheDocument();
    expect(screen.getByText('Yelka sohasi bo\'shashtirildi, spastika kamaydi.')).toBeInTheDocument();
  });

  it('filters events by type tabs', () => {
    render(
      <MemoryRouter>
        <ProgressPage />
      </MemoryRouter>
    );

    // Filter by Seans xulosalari tab
    const sessionTab = screen.getByRole('button', { name: /Seans xulosalari/i });
    fireEvent.click(sessionTab);

    expect(screen.getByText('Yelka sohasi bo\'shashtirildi, spastika kamaydi.')).toBeInTheDocument();
    expect(screen.queryByText('Bola harakatlari ancha dadillashdi, emaklash fazasida faol.')).not.toBeInTheDocument();
  });

  it('searches events by text', () => {
    render(
      <MemoryRouter>
        <ProgressPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Bola, mutaxassis yoki xulosa matni/i);
    fireEvent.change(searchInput, { target: { value: 'Madina' } });

    expect(screen.queryByText('Bola harakatlari ancha dadillashdi, emaklash fazasida faol.')).not.toBeInTheDocument();
    expect(screen.getByText('Yelka sohasi bo\'shashtirildi, spastika kamaydi.')).toBeInTheDocument();
  });

  it('switches between Timeline view and DataTable view', () => {
    render(
      <MemoryRouter>
        <ProgressPage />
      </MemoryRouter>
    );

    // In timeline view
    expect(screen.getByTitle("Jadval ko'rinishi")).toBeInTheDocument();

    // Click table view
    fireEvent.click(screen.getByTitle("Jadval ko'rinishi"));

    // Table headers should now be visible
    expect(screen.getByText('Voqea turi')).toBeInTheDocument();
    expect(screen.getByText('Kuzatuv va natijalar')).toBeInTheDocument();
  });

  it('opens event details modal when clicking an event card', () => {
    render(
      <MemoryRouter>
        <ProgressPage />
      </MemoryRouter>
    );

    const noteCard = screen.getByText('Bola harakatlari ancha dadillashdi, emaklash fazasida faol.');
    fireEvent.click(noteCard);

    expect(screen.getByText('Klinik qayd tafsilotlari')).toBeInTheDocument();
    expect(screen.getByText('Klinik xulosa va kuzatuv qaydi')).toBeInTheDocument();
  });
});
