import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './index';

describe('Global Zustand Store Tests', () => {
  beforeEach(() => {
    useStore.setState({
      currentUser: null,
      isAuthenticated: false,
      toasts: [],
    });
  });

  it('authenticates Super Admin successfully', async () => {
    const result = await useStore.getState().login('superadmin@demo.com', 'demo123');
    expect(result.success).toBe(true);
    const user = useStore.getState().currentUser;
    expect(user).toBeDefined();
    expect(user?.role).toBe('SUPER_ADMIN');
    expect(useStore.getState().isAuthenticated).toBe(true);
  });

  it('authenticates Specialist successfully', async () => {
    const result = await useStore.getState().login('specialist@demo.com', 'demo123');
    expect(result.success).toBe(true);
    const user = useStore.getState().currentUser;
    expect(user).toBeDefined();
    expect(user?.role).toBe('SPECIALIST');
    expect(user?.email).toBe('specialist@demo.com');
  });

  it('authenticates Parent successfully', async () => {
    const result = await useStore.getState().login('parent@demo.com', 'demo123');
    expect(result.success).toBe(true);
    const user = useStore.getState().currentUser;
    expect(user?.role).toBe('PARENT');
  });

  it('rejects invalid credentials with an error', async () => {
    const result = await useStore.getState().login('wrong@email.com', 'badpass');
    expect(result.success).toBe(false);
    expect(result.error).toBe("Email yoki parol noto'g'ri");
    expect(useStore.getState().isAuthenticated).toBe(false);
  });

  it('creates and lists a new appointment', () => {
    const prevCount = useStore.getState().appointments.length;
    const newApt = useStore.getState().createAppointment({
      childId: 'child-1',
      parentId: 'par-1',
      specialistId: 'spec-1',
      serviceId: 'svc-1',
      date: '2026-10-01',
      startTime: '10:00',
      endTime: '10:45',
      status: 'SCHEDULED',
      notes: 'Test appointment',
    });

    expect(newApt.id).toBeDefined();
    expect(useStore.getState().appointments.length).toBe(prevCount + 1);
  });

  it('adds and removes toast messages correctly', () => {
    useStore.getState().addToast({
      type: 'success',
      title: 'Muvaffaqiyatli saqlandi',
    });

    const toasts = useStore.getState().toasts;
    expect(toasts.length).toBeGreaterThan(0);
    const toastId = toasts[0].id;

    useStore.getState().removeToast(toastId);
    expect(useStore.getState().toasts.find(t => t.id === toastId)).toBeUndefined();
  });
});
