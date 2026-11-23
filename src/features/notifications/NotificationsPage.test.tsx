import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { NotificationsPage } from './NotificationsPage';
import { useStore } from '@/store';
import type { Notification } from '@/types';
import { owner, parent } from '@/test/clinicFixtures';
import { api } from '@/services/api';

function CurrentLocation() {
  const location = useLocation();
  return <output data-testid="current-location">{location.pathname + location.search}</output>;
}

describe('NotificationsPage Component', () => {
  const mockNotifications: Notification[] = [
    {
      id: 'notif-t1',
      userId: 'admin-1',
      type: 'appointment',
      title: 'Yangi uchrashuv',
      message: 'Amir Aliyev bilan 10:00 da qabul rejalashtirildi',
      isRead: false,
      relatedEntity: { type: 'appointment', id: 'apt-1' },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'notif-t2',
      userId: 'admin-1',
      type: 'payment',
      title: "To'lov qabul qilindi",
      message: "Malika Rahimovadan 250,000 so'm to'lov",
      isRead: true,
      relatedEntity: { type: 'payment', id: 'pay-1' },
      createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(), // Yesterday
    },
    {
      id: 'notif-t3',
      userId: 'admin-1',
      type: 'session',
      title: 'Seans yakunlandi',
      message: 'Farxod Alimov massaj seansini yakunladi',
      isRead: false,
      relatedEntity: { type: 'session', id: 'ses-1' },
      createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(), // 2 days ago
    },
  ];

  beforeEach(() => {
    vi.spyOn(api.platform, 'markNotificationRead').mockResolvedValue();
    vi.spyOn(api.platform, 'markAllNotificationsRead').mockResolvedValue();
    useStore.setState({
      currentUser: {
        id: 'admin-1',
        fullName: 'Bosh Administrator',
        phone: '+998901234567',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00Z',
      },
      notifications: mockNotifications,
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('renders header, KPI cards and notification groups properly', () => {
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Bildirishnomalar' })).toBeInTheDocument();
    expect(screen.getByText('Jami xabarlar')).toBeInTheDocument();
    expect(screen.getAllByText('O‘qilmagan').length).toBeGreaterThan(0);
    expect(screen.getByText('Qabullar & Jadval')).toBeInTheDocument();
    expect(screen.getByText('To‘lovlar & Moliya')).toBeInTheDocument();

    // Verify notification titles render
    expect(screen.getByText('Yangi uchrashuv')).toBeInTheDocument();
    expect(screen.getByText("To'lov qabul qilindi")).toBeInTheDocument();
    expect(screen.getByText('Seans yakunlandi')).toBeInTheDocument();
  });

  it('filters notifications by tab pills', () => {
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    // Click "To‘lovlar" tab
    const paymentTab = screen.getByRole('button', { name: /To‘lovlar/i });
    fireEvent.click(paymentTab);

    // Only payment notification should remain
    expect(screen.getByText("To'lov qabul qilindi")).toBeInTheDocument();
    expect(screen.queryByText('Yangi uchrashuv')).not.toBeInTheDocument();
    expect(screen.queryByText('Seans yakunlandi')).not.toBeInTheDocument();
  });

  it('renders and filters by mobile category dropdown', () => {
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    const categorySelect = screen.getByRole('combobox', { name: 'Bildirishnoma toifasi' });
    expect(categorySelect).toBeInTheDocument();

    fireEvent.click(categorySelect);
    const paymentOption = screen.getByRole('option', { name: /To‘lovlar/i });
    fireEvent.click(paymentOption);

    expect(screen.getByText("To'lov qabul qilindi")).toBeInTheDocument();
    expect(screen.queryByText('Yangi uchrashuv')).not.toBeInTheDocument();
  });

  it('filters notifications by search keyword', () => {
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Bildirishnomalardan qidirish...');
    fireEvent.change(searchInput, { target: { value: 'Malika' } });

    expect(screen.getByText("To'lov qabul qilindi")).toBeInTheDocument();
    expect(screen.queryByText('Yangi uchrashuv')).not.toBeInTheDocument();
  });

  it('toggles read and unread status for a notification', () => {
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    // Find the mark read button for unread notification
    const unreadButton = screen.getAllByRole('button', { name: "O'qilgan deb belgilash" })[0];
    fireEvent.click(unreadButton);

    const updated = useStore.getState().notifications.find(n => n.id === 'notif-t1');
    expect(updated?.isRead).toBe(true);
  });

  it('marks all notifications as read when clicking mark all button', () => {
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    const markAllBtn = screen.getByRole('button', { name: /Barchasini o‘qilgan deb belgilash/i });
    fireEvent.click(markAllBtn);

    const allRead = useStore.getState().notifications.every(n => n.isRead);
    expect(allRead).toBe(true);
  });

  it('marks notifications with diverse userIds (spec, parent) as read when admin clicks mark all', () => {
    useStore.setState({
      notifications: [
        {
          id: 'n-spec',
          userId: 'spec-1',
          type: 'appointment',
          title: 'Specialist Notif',
          message: 'Spec message',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'n-parent',
          userId: 'par-1',
          type: 'payment',
          title: 'Parent Notif',
          message: 'Parent message',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],
    });

    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    const markAllBtn = screen.getByRole('button', { name: /Barchasini o‘qilgan deb belgilash/i });
    fireEvent.click(markAllBtn);

    const state = useStore.getState();
    expect(state.notifications.every(n => n.isRead)).toBe(true);
  });

  it.each([
    { type: 'payment' as const, relatedEntity: { type: 'payment' as const, id: 'payment' }, label: "To'lovlarga o'tish", destination: '/dashboard/super-admin/cash?tab=transactions' },
    { type: 'payment' as const, relatedEntity: undefined, label: "Moliya bo'limiga", destination: '/dashboard/super-admin/cash?tab=transactions' },
    { type: 'assessment' as const, relatedEntity: undefined, label: "Baholashga o'tish", destination: '/dashboard/super-admin/children?section=assessments' },
  ])('opens the current owner workspace for $type notifications', ({ type, relatedEntity, label, destination }) => {
    useStore.setState({
      currentUser: owner,
      notifications: [{
        id: 'current-route', userId: owner.id, type, relatedEntity,
        title: 'Yangi xabar', message: 'Xabar mazmuni', isRead: false,
        createdAt: new Date().toISOString(),
      }],
    });
    render(<MemoryRouter initialEntries={['/dashboard/super-admin/notifications']}><NotificationsPage /><CurrentLocation /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: label }));

    expect(screen.getByTestId('current-location')).toHaveTextContent(destination);
    expect(useStore.getState().notifications[0].isRead).toBe(true);
  });

  it('opens children for a parent schedule notification', () => {
    useStore.setState({
      currentUser: parent,
      notifications: [{
        id: 'parent-schedule', userId: parent.id, type: 'schedule',
        title: 'Qabul vaqti yangilandi', message: 'Yangi qabul vaqti',
        isRead: false, createdAt: new Date().toISOString(),
      }],
    });
    render(<MemoryRouter initialEntries={['/dashboard/parent/notifications']}><NotificationsPage /><CurrentLocation /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: 'Bolalar sahifasiga' }));

    expect(screen.getByTestId('current-location')).toHaveTextContent('/dashboard/parent/children');
  });

  it.each([owner, parent])('keeps historical specialist notifications readable without a retired management link for $role', (user) => {
    useStore.setState({
      currentUser: user,
      notifications: [{
        id: 'historical-specialist', userId: user.id, type: 'system',
        title: 'Mutaxassis ma’lumoti yangilangan', message: 'Tarixiy xabar',
        relatedEntity: { type: 'specialist', id: 'former-specialist' },
        isRead: false, createdAt: new Date().toISOString(),
      }],
    });
    render(<MemoryRouter><NotificationsPage /></MemoryRouter>);

    expect(screen.getByText('Tarixiy xabar')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: "Mutaxassisga o'tish" })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: "O'qilgan deb belgilash" })).toBeInTheDocument();
  });
});
