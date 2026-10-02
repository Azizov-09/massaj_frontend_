import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AssessmentsPage } from './AssessmentsPage';
import { useStore } from '@/store';

describe('AssessmentsPage Component', () => {
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
          diagnosis: 'Gipotonus',
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
      assessments: [
        {
          id: 'asmnt-1',
          childId: 'c1',
          specialistId: 's1',
          date: '2026-02-15',
          scores: {
            movement: 4,
            coordination: 4,
            flexibility: 5,
            activityTolerance: 4,
            sessionResponse: 5,
          },
          professionalObservation: 'Mushak elastikligi sezilarli yaxshilangan, bolada faol qiziqish bor.',
          createdAt: '2026-02-15T10:00:00Z',
        },
        {
          id: 'asmnt-2',
          childId: 'c2',
          specialistId: 's1',
          date: '2026-02-10',
          scores: {
            movement: 2,
            coordination: 3,
            flexibility: 2,
            activityTolerance: 3,
            sessionResponse: 2,
          },
          professionalObservation: 'Harakat cheklangan, chidamlilik past.',
          createdAt: '2026-02-10T10:00:00Z',
        },
      ],
    });
  });

  it('renders page header, interactive KPI cards and status tabs', () => {
    render(
      <MemoryRouter>
        <AssessmentsPage />
      </MemoryRouter>
    );

    // Header
    expect(screen.getByText('Klinik baholashlar (Assessments)')).toBeInTheDocument();
    expect(screen.getByText('Yangi baholash')).toBeInTheDocument();

    // KPIs
    expect(screen.getByText('Jami baholashlar')).toBeInTheDocument();
    expect(screen.getByText('O‘rtacha ko‘rsatkich')).toBeInTheDocument();
    expect(screen.getByText('Optimal dinamika')).toBeInTheDocument();
    expect(screen.getByText('Qamrab olingan bolalar')).toBeInTheDocument();

    // Tabs
    expect(screen.getByRole('button', { name: /Barchasi/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Optimal \(4-5 ball\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Past \(<3 ball\)/i })).toBeInTheDocument();

    // Table rows
    const table = screen.getByRole('table');
    expect(within(table).getByText('Asilbek Abdullayev')).toBeInTheDocument();
    expect(within(table).getByText('Madina Karimova')).toBeInTheDocument();
  });

  it('filters assessments by score tabs', () => {
    render(
      <MemoryRouter>
        <AssessmentsPage />
      </MemoryRouter>
    );

    // Click 'Optimal (4-5 ball)' tab
    const optimalTab = screen.getByRole('button', { name: /Optimal \(4-5 ball\)/i });
    fireEvent.click(optimalTab);

    const table = screen.getByRole('table');
    // Asilbek has average 4.4 so should remain
    expect(within(table).getByText('Asilbek Abdullayev')).toBeInTheDocument();
    // Madina has average 2.4 so should be filtered out
    expect(within(table).queryByText('Madina Karimova')).not.toBeInTheDocument();
  });

  it('searches assessments by text query', () => {
    render(
      <MemoryRouter>
        <AssessmentsPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Bola, mutaxassis yoki xulosa matni/i);
    fireEvent.change(searchInput, { target: { value: 'Madina' } });

    const table = screen.getByRole('table');
    expect(within(table).queryByText('Asilbek Abdullayev')).not.toBeInTheDocument();
    expect(within(table).getByText('Madina Karimova')).toBeInTheDocument();
  });

  it('toggles between Table view and Cards view', () => {
    render(
      <MemoryRouter>
        <AssessmentsPage />
      </MemoryRouter>
    );

    // Table view is active initially
    expect(screen.getByText('5 ballik mezonlar')).toBeInTheDocument();

    // Switch to cards view
    const cardsBtn = screen.getByTitle("Karta ko'rinishi");
    fireEvent.click(cardsBtn);

    // Now cards view should render
    expect(screen.queryByText('5 ballik mezonlar')).not.toBeInTheDocument();
    expect(screen.getByText('Mushak elastikligi sezilarli yaxshilangan, bolada faol qiziqish bor.')).toBeInTheDocument();
  });

  it('opens assessment details modal upon clicking eye button', () => {
    render(
      <MemoryRouter>
        <AssessmentsPage />
      </MemoryRouter>
    );

    const eyeButtons = screen.getAllByLabelText("Batafsil ko'rish");
    fireEvent.click(eyeButtons[0]);

    // Modal title
    expect(screen.getByText('Klinik baholash bayonnomasi')).toBeInTheDocument();
    expect(screen.getByText('Harakat faolligi')).toBeInTheDocument();
  });
});
