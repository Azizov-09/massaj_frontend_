// ═══════════════════════════════════════════════════════
//  Zustand Store — Global Application State
// ═══════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { generateId } from '@/utils';
import type {
  AdminUser, Specialist, Parent, Child, Service,
  Appointment, Session, AttendanceRecord, Assessment,
  ProgressNote, Goal, Transaction, Payment,
  Notification, ActivityLog, Employee,
  ToastMessage, UserRole, BaseUser,
} from '@/types';
import {
  ADMINS, SPECIALISTS, PARENTS, CHILDREN, SERVICES,
  APPOINTMENTS, SESSIONS, ATTENDANCE, ASSESSMENTS,
  PROGRESS_NOTES, GOALS, TRANSACTIONS, PAYMENTS,
  NOTIFICATIONS, ACTIVITY_LOGS, EMPLOYEES, DEMO_CREDENTIALS,
} from '@/data/seed';

// ─── Auth State ───────────────────────────────────────────

interface AuthState {
  currentUser: (AdminUser | Specialist | Parent) | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateCurrentUser: (data: Partial<AdminUser | Specialist | Parent>) => void;
}

// ─── Data State ───────────────────────────────────────────

interface DataState {
  admins: AdminUser[];
  employees: Employee[];
  specialists: Specialist[];
  parents: Parent[];
  children: Child[];
  services: Service[];
  appointments: Appointment[];
  sessions: Session[];
  attendance: AttendanceRecord[];
  assessments: Assessment[];
  progressNotes: ProgressNote[];
  goals: Goal[];
  transactions: Transaction[];
  payments: Payment[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
  clinicSettings: {
    clinicName: string;
    phone: string;
    address: string;
    workStart: string;
    workEnd: string;
  };
}

// ─── UI State ─────────────────────────────────────────────

interface UIState {
  sidebarCollapsed: boolean;
  toasts: ToastMessage[];
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

// ─── Actions ─────────────────────────────────────────────

interface Actions {
  // Children
  createChild: (data: Omit<Child, 'id' | 'createdAt'>) => Child;
  updateChild: (id: string, data: Partial<Child>) => void;
  archiveChild: (id: string) => void;

  // Parents
  createParent: (data: Omit<Parent, 'id' | 'createdAt'>) => Parent;
  updateParent: (id: string, data: Partial<Parent>) => void;

  // Specialists
  createSpecialist: (data: Omit<Specialist, 'id' | 'createdAt'>) => Specialist;
  updateSpecialist: (id: string, data: Partial<Specialist>) => void;

  // Services
  createService: (data: Omit<Service, 'id' | 'createdAt'>) => Service;
  updateService: (id: string, data: Partial<Service>) => void;
  archiveService: (id: string) => void;
  restoreService: (id: string) => void;

  // Appointments
  createAppointment: (data: Omit<Appointment, 'id' | 'createdAt'>) => Appointment;
  updateAppointment: (id: string, data: Partial<Appointment>) => void;
  confirmAppointment: (id: string) => void;
  startAppointment: (id: string) => void;
  cancelAppointment: (id: string) => void;
  markNoShow: (id: string) => void;
  completeAppointment: (id: string) => void;

  // Sessions
  startSession: (appointmentId: string) => Session;
  completeSession: (
    sessionId: string,
    note: string,
    observation: string,
    recommendation: string
  ) => void;

  // Attendance
  recordAttendance: (data: Omit<AttendanceRecord, 'id' | 'createdAt'>) => void;
  removeAttendance: (appointmentId: string) => void;

  // Assessments
  createAssessment: (data: Omit<Assessment, 'id' | 'createdAt'>) => void;

  // Progress Notes
  createProgressNote: (data: Omit<ProgressNote, 'id' | 'createdAt'>) => void;

  // Goals
  createGoal: (data: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, data: Partial<Goal>) => void;

  // Payments
  recordPayment: (data: {
    parentId: string;
    childId?: string;
    amount: number;
    method: Payment['method'];
    date: string;
    notes?: string;
    createdBy: string;
  }) => Payment;

  // Notifications
  markNotificationRead: (id: string) => void;
  markNotificationUnread: (id: string) => void;
  markAllNotificationsRead: (userId?: string, role?: UserRole) => void;

  // Admins
  createAdmin: (data: Omit<AdminUser, 'id' | 'createdAt'>) => AdminUser;
  updateAdmin: (id: string, data: Partial<AdminUser>) => void;

  // Employees
  createEmployee: (data: Omit<Employee, 'id' | 'joinedAt'>) => Employee;
  updateEmployee: (id: string, data: Partial<Employee>) => void;

  // Activity log helper
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;

  // Clinic Settings & Reset
  updateClinicSettings: (settings: Partial<DataState['clinicSettings']>) => void;
  resetStore: () => void;
}

// ─── Combined Store ───────────────────────────────────────

type Store = AuthState & DataState & UIState & Actions;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // ── Auth ────────────────────────────────────────────
      currentUser: null,
      isAuthenticated: false,

      login: async (email, password) => {
        // Simulate network delay
        await new Promise(r => setTimeout(r, 600));

        const cred = DEMO_CREDENTIALS.find(
          c => c.email === email && c.password === password
        );

        if (!cred) {
          return { success: false, error: 'Email yoki parol noto\'g\'ri' };
        }

        let user: AdminUser | Specialist | Parent | undefined;

        if (cred.role === 'SUPER_ADMIN') {
          user = get().admins.find(a => a.email === email);
        } else if (cred.role === 'SPECIALIST') {
          user = get().specialists.find(s => s.email === email);
        } else if (cred.role === 'PARENT') {
          user = get().parents.find(p => p.email === email);
        }

        if (!user) {
          return { success: false, error: 'Foydalanuvchi topilmadi' };
        }

        set({ currentUser: user, isAuthenticated: true });
        return { success: true };
      },

      logout: () => {
        set({ currentUser: null, isAuthenticated: false });
      },

      updateCurrentUser: (data) => {
        set(s => {
          if (!s.currentUser) return s;
          const updated = { ...s.currentUser, ...data };
          if (s.currentUser.role === 'SUPER_ADMIN' || s.currentUser.role === 'ADMIN') {
            return {
              currentUser: updated as AdminUser,
              admins: s.admins.map(a => a.id === updated.id ? (updated as AdminUser) : a),
            };
          } else if (s.currentUser.role === 'SPECIALIST') {
            return {
              currentUser: updated as Specialist,
              specialists: s.specialists.map(sp => sp.id === updated.id ? (updated as Specialist) : sp),
            };
          } else if (s.currentUser.role === 'PARENT') {
            return {
              currentUser: updated as Parent,
              parents: s.parents.map(p => p.id === updated.id ? (updated as Parent) : p),
            };
          }
          return { currentUser: updated as AdminUser };
        });
        get().addToast({ type: 'success', title: 'Profil yangilandi', description: 'Ma\'lumotlaringiz muvaffaqiyatli saqlandi' });
      },

      // ── Data ────────────────────────────────────────────
      admins: ADMINS,
      employees: EMPLOYEES,
      specialists: SPECIALISTS,
      parents: PARENTS,
      children: CHILDREN,
      services: SERVICES,
      appointments: APPOINTMENTS,
      sessions: SESSIONS,
      attendance: ATTENDANCE,
      assessments: ASSESSMENTS,
      progressNotes: PROGRESS_NOTES,
      goals: GOALS,
      transactions: TRANSACTIONS,
      payments: PAYMENTS,
      notifications: NOTIFICATIONS,
      activityLogs: ACTIVITY_LOGS,
      clinicSettings: {
        clinicName: 'Bolalar Massaj & Reabilitatsiya Markazi',
        phone: '+998 71 200 00 00',
        address: 'Toshkent sh., Chilonzor tumani, 9-mavze',
        workStart: '08:00',
        workEnd: '18:00',
      },

      // ── UI ──────────────────────────────────────────────
      sidebarCollapsed: false,
      toasts: [],

      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      addToast: (toast) => {
        const id = generateId();
        set(s => ({ toasts: [...s.toasts, { ...toast, id }] }));
        const duration = toast.duration ?? 4000;
        setTimeout(() => get().removeToast(id), duration);
      },

      removeToast: (id) => {
        set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
      },

      // ── Children Actions ─────────────────────────────────
      createChild: (data) => {
        const child: Child = { ...data, id: `child-${generateId()}`, createdAt: new Date().toISOString() };
        set(s => ({
          children: [...s.children, child],
          parents: s.parents.map(p =>
            p.id === child.parentId && !p.childrenIds.includes(child.id)
              ? { ...p, childrenIds: [...p.childrenIds, child.id] }
              : p
          ),
        }));
        get().addActivityLog({
          actorId: get().currentUser?.id ?? 'system',
          actorName: get().currentUser?.fullName ?? 'Sistema',
          actorRole: (get().currentUser as BaseUser)?.role ?? 'ADMIN',
          action: 'CREATE',
          entity: 'child',
          entityId: child.id,
          description: `Yangi bola qo'shildi: ${child.fullName}`,
        });
        get().addToast({ type: 'success', title: 'Bola qo\'shildi', description: `${child.fullName} muvaffaqiyatli qo'shildi` });
        return child;
      },

      updateChild: (id, data) => {
        set(s => ({ children: s.children.map(c => c.id === id ? { ...c, ...data } : c) }));
        get().addToast({ type: 'success', title: 'Yangilandi', description: 'Bola ma\'lumotlari yangilandi' });
      },

      archiveChild: (id) => {
        set(s => ({ children: s.children.map(c => c.id === id ? { ...c, status: 'ARCHIVED' } : c) }));
        get().addToast({ type: 'info', title: 'Arxivlandi', description: 'Bola arxivga o\'tkazildi' });
      },

      // ── Parents Actions ──────────────────────────────────
      createParent: (data) => {
        const parent: Parent = { ...data, id: `par-${generateId()}`, createdAt: new Date().toISOString() };
        set(s => ({ parents: [...s.parents, parent] }));
        get().addToast({ type: 'success', title: 'Qo\'shildi', description: `${parent.fullName} tizimga qo'shildi` });
        return parent;
      },

      updateParent: (id, data) => {
        set(s => ({ parents: s.parents.map(p => p.id === id ? { ...p, ...data } : p) }));
        get().addToast({ type: 'success', title: 'Yangilandi' });
      },

      // ── Specialist Actions ───────────────────────────────
      createSpecialist: (data) => {
        const spec: Specialist = { ...data, id: `spec-${generateId()}`, createdAt: new Date().toISOString() };
        set(s => ({ specialists: [...s.specialists, spec] }));
        get().addToast({ type: 'success', title: 'Mutaxassis qo\'shildi' });
        return spec;
      },

      updateSpecialist: (id, data) => {
        set(s => ({ specialists: s.specialists.map(sp => sp.id === id ? { ...sp, ...data } : sp) }));
        get().addToast({ type: 'success', title: 'Yangilandi' });
      },

      // ── Service Actions ──────────────────────────────────
      createService: (data) => {
        const svc: Service = { ...data, id: `svc-${generateId()}`, createdAt: new Date().toISOString() };
        set(s => ({ services: [...s.services, svc] }));
        get().addToast({ type: 'success', title: 'Xizmat qo\'shildi' });
        return svc;
      },

      updateService: (id, data) => {
        set(s => ({ services: s.services.map(sv => sv.id === id ? { ...sv, ...data } : sv) }));
        get().addToast({ type: 'success', title: 'Xizmat yangilandi' });
      },

      archiveService: (id) => {
        set(s => ({ services: s.services.map(sv => sv.id === id ? { ...sv, status: 'ARCHIVED' } : sv) }));
        get().addToast({ type: 'info', title: 'Xizmat arxivlandi' });
      },

      restoreService: (id) => {
        set(s => ({ services: s.services.map(sv => sv.id === id ? { ...sv, status: 'ACTIVE' } : sv) }));
        get().addToast({ type: 'success', title: 'Xizmat tiklandi' });
      },

      // ── Appointment Actions ──────────────────────────────
      createAppointment: (data) => {
        const apt: Appointment = { ...data, id: `apt-${generateId()}`, createdAt: new Date().toISOString() };
        set(s => ({ appointments: [...s.appointments, apt] }));
        get().addActivityLog({
          actorId: get().currentUser?.id ?? 'system',
          actorName: get().currentUser?.fullName ?? 'Sistema',
          actorRole: (get().currentUser as BaseUser)?.role ?? 'ADMIN',
          action: 'CREATE', entity: 'appointment', entityId: apt.id,
          description: 'Yangi uchrashuv yaratildi',
        });
        get().addToast({ type: 'success', title: 'Uchrashuv yaratildi' });
        return apt;
      },

      updateAppointment: (id, data) => {
        set(s => ({ appointments: s.appointments.map(a => a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a) }));
      },

      confirmAppointment: (id) => {
        set(s => ({ appointments: s.appointments.map(a => a.id === id ? { ...a, status: 'CONFIRMED', updatedAt: new Date().toISOString() } : a) }));
        get().addToast({ type: 'success', title: 'Uchrashuv tasdiqlandi' });
      },

      startAppointment: (id) => {
        set(s => ({ appointments: s.appointments.map(a => a.id === id ? { ...a, status: 'IN_PROGRESS', updatedAt: new Date().toISOString() } : a) }));
      },

      cancelAppointment: (id) => {
        set(s => ({ appointments: s.appointments.map(a => a.id === id ? { ...a, status: 'CANCELLED', updatedAt: new Date().toISOString() } : a) }));
        get().addToast({ type: 'info', title: 'Bekor qilindi', description: 'Uchrashuv bekor qilindi' });
      },

      markNoShow: (id) => {
        set(s => ({ appointments: s.appointments.map(a => a.id === id ? { ...a, status: 'NO_SHOW', updatedAt: new Date().toISOString() } : a) }));
        get().addToast({ type: 'warning', title: 'Kelmagan deb belgilandi' });
      },

      completeAppointment: (id) => {
        set(s => ({ appointments: s.appointments.map(a => a.id === id ? { ...a, status: 'COMPLETED', updatedAt: new Date().toISOString() } : a) }));
      },

      // ── Session Actions ──────────────────────────────────
      startSession: (appointmentId) => {
        const apt = get().appointments.find(a => a.id === appointmentId);
        if (!apt) throw new Error('Uchrashuv topilmadi');
        get().startAppointment(appointmentId);
        const session: Session = {
          id: `ses-${generateId()}`,
          appointmentId,
          childId: apt.childId,
          specialistId: apt.specialistId,
          serviceId: apt.serviceId,
          startTime: new Date().toISOString(),
          status: 'IN_PROGRESS',
          createdAt: new Date().toISOString(),
        };
        set(s => ({ sessions: [...s.sessions, session] }));
        get().addToast({ type: 'info', title: 'Seans boshlandi' });
        return session;
      },

      completeSession: (sessionId, note, observation, recommendation) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session) return;

        const endTime = new Date().toISOString();
        set(s => ({
          sessions: s.sessions.map(ses =>
            ses.id === sessionId
              ? { ...ses, status: 'COMPLETED', endTime, note, observation, recommendation }
              : ses
          ),
        }));

        // Complete the linked appointment
        get().completeAppointment(session.appointmentId);

        // Create SESSION_CHARGE transaction
        const service = get().services.find(sv => sv.id === session.serviceId);
        const amount = service?.price ?? 100_000;
        const apt = get().appointments.find(a => a.id === session.appointmentId);
        const child = get().children.find(c => c.id === session.childId);

        const txn: Transaction = {
          id: `txn-ses-${generateId()}`,
          type: 'SESSION_CHARGE',
          direction: 'OUT',
          amount,
          childId: session.childId,
          parentId: apt?.parentId,
          sessionId: session.id,
          appointmentId: session.appointmentId,
          description: `Seans narxi - ${service?.name ?? 'Xizmat'}`,
          date: endTime,
          createdAt: endTime,
          createdBy: session.specialistId,
        };
        set(s => ({ transactions: [...s.transactions, txn] }));

        // Activity log
        get().addActivityLog({
          actorId: session.specialistId,
          actorName: get().specialists.find(sp => sp.id === session.specialistId)?.fullName ?? '',
          actorRole: 'SPECIALIST',
          action: 'COMPLETE', entity: 'session', entityId: sessionId,
          description: `${child?.fullName ?? ''} bilan seans yakunlandi`,
        });

        get().addToast({ type: 'success', title: 'Seans yakunlandi', description: `${formatAmount(amount)} so'm hisoblandi` });
      },

      // ── Attendance ───────────────────────────────────────
      recordAttendance: (data) => {
        const record: AttendanceRecord = { ...data, id: `att-${generateId()}`, createdAt: new Date().toISOString() };
        set(s => ({
          attendance: [
            ...s.attendance.filter(a => a.appointmentId !== data.appointmentId),
            record,
          ],
        }));
        get().addToast({ type: 'success', title: 'Davomat belgilandi' });
      },
      removeAttendance: (appointmentId) => {
        set(s => ({
          attendance: s.attendance.filter(a => a.appointmentId !== appointmentId),
        }));
        get().addToast({ type: 'info', title: 'Davomat bekor qilindi' });
      },

      // ── Assessments ──────────────────────────────────────
      createAssessment: (data) => {
        const assessment: Assessment = { ...data, id: `asmnt-${generateId()}`, createdAt: new Date().toISOString() };
        set(s => ({ assessments: [...s.assessments, assessment] }));
        get().addToast({ type: 'success', title: 'Baholash saqlandi' });
      },

      // ── Progress Notes ───────────────────────────────────
      createProgressNote: (data) => {
        const note: ProgressNote = { ...data, id: `prg-${generateId()}`, createdAt: new Date().toISOString() };
        set(s => ({ progressNotes: [...s.progressNotes, note] }));
        get().addToast({ type: 'success', title: 'Rivojlanish qaydi saqlandi' });
      },

      // ── Goals ────────────────────────────────────────────
      createGoal: (data) => {
        const goal: Goal = { ...data, id: `goal-${generateId()}`, createdAt: new Date().toISOString() };
        set(s => ({ goals: [...s.goals, goal] }));
        get().addToast({ type: 'success', title: 'Maqsad qo\'shildi' });
      },

      updateGoal: (id, data) => {
        set(s => ({ goals: s.goals.map(g => g.id === id ? { ...g, ...data } : g) }));
        get().addToast({ type: 'success', title: 'Maqsad yangilandi' });
      },

      // ── Payments ─────────────────────────────────────────
      recordPayment: (data) => {
        const payId = `pay-${generateId()}`;
        const txnId = `txn-pay-${generateId()}`;
        const now = new Date().toISOString();

        const payment: Payment = {
          id: payId,
          parentId: data.parentId,
          childId: data.childId,
          amount: data.amount,
          method: data.method,
          date: data.date,
          notes: data.notes,
          transactionId: txnId,
          createdBy: data.createdBy,
          createdAt: now,
        };

        const txn: Transaction = {
          id: txnId,
          type: 'PAYMENT',
          direction: 'IN',
          amount: data.amount,
          parentId: data.parentId,
          childId: data.childId,
          paymentId: payId,
          description: `To'lov qabul qilindi - ${data.method}`,
          date: data.date,
          createdAt: now,
          createdBy: data.createdBy,
        };

        set(s => ({
          payments: [...s.payments, payment],
          transactions: [...s.transactions, txn],
        }));

        const parent = get().parents.find(p => p.id === data.parentId);
        get().addActivityLog({
          actorId: data.createdBy,
          actorName: get().currentUser?.fullName ?? 'Admin',
          actorRole: (get().currentUser as BaseUser)?.role ?? 'ADMIN',
          action: 'PAYMENT', entity: 'payment', entityId: payId,
          description: `${parent?.fullName ?? ''} dan ${formatAmount(data.amount)} so'm qabul qilindi`,
        });

        get().addToast({ type: 'success', title: "To'lov qabul qilindi", description: `${formatAmount(data.amount)} so'm` });
        return payment;
      },

      // ── Notifications ────────────────────────────────────
      markNotificationRead: (id) => {
        set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n) }));
      },
      markNotificationUnread: (id) => {
        set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: false } : n) }));
      },
      markAllNotificationsRead: (userId, role) => {
        const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
        set(s => ({
          notifications: s.notifications.map(n => {
            if (isAdmin && (n.userId === 'admin-1' || n.userId === 'admin-2' || n.userId === userId || !n.userId)) {
              return { ...n, isRead: true };
            }
            if (n.userId === userId) {
              return { ...n, isRead: true };
            }
            return n;
          }),
        }));
      },

      // ── Admins ───────────────────────────────────────────
      createAdmin: (data) => {
        const admin: AdminUser = { ...data, id: `admin-${generateId()}`, createdAt: new Date().toISOString() };
        set(s => ({ admins: [...s.admins, admin] }));
        get().addToast({ type: 'success', title: 'Admin qo\'shildi' });
        return admin;
      },
      updateAdmin: (id, data) => {
        set(s => ({ admins: s.admins.map(a => a.id === id ? { ...a, ...data } : a) }));
        get().addToast({ type: 'success', title: 'Admin yangilandi' });
      },

      // ── Employees ────────────────────────────────────────
      createEmployee: (data) => {
        const emp: Employee = { ...data, id: `emp-${generateId()}`, joinedAt: new Date().toISOString() };
        set(s => ({ employees: [...s.employees, emp] }));
        get().addToast({ type: 'success', title: 'Xodim qo\'shildi' });
        return emp;
      },
      updateEmployee: (id, data) => {
        set(s => ({ employees: s.employees.map(e => e.id === id ? { ...e, ...data } : e) }));
        get().addToast({ type: 'success', title: 'Xodim yangilandi' });
      },

      // ── Activity Log ──────────────────────────────────────
      addActivityLog: (log) => {
        const entry: ActivityLog = { ...log, id: `log-${generateId()}`, timestamp: new Date().toISOString() };
        set(s => ({ activityLogs: [entry, ...s.activityLogs] }));
      },

      // ── Clinic Settings & Reset ───────────────────────────
      updateClinicSettings: (settings) => {
        set(s => ({ clinicSettings: { ...s.clinicSettings, ...settings } }));
        get().addToast({ type: 'success', title: 'Sozlamalar saqlandi', description: 'Markaz ma\'lumotlari yangilandi' });
      },

      resetStore: () => {
        try {
          localStorage.removeItem('massaj-crm-store');
        } catch {}
        set({
          currentUser: null,
          isAuthenticated: false,
          admins: ADMINS,
          employees: EMPLOYEES,
          specialists: SPECIALISTS,
          parents: PARENTS,
          children: CHILDREN,
          services: SERVICES,
          appointments: APPOINTMENTS,
          sessions: SESSIONS,
          attendance: ATTENDANCE,
          assessments: ASSESSMENTS,
          progressNotes: PROGRESS_NOTES,
          goals: GOALS,
          transactions: TRANSACTIONS,
          payments: PAYMENTS,
          notifications: NOTIFICATIONS,
          activityLogs: ACTIVITY_LOGS,
          clinicSettings: {
            clinicName: 'Bolalar Massaj & Reabilitatsiya Markazi',
            phone: '+998 71 200 00 00',
            address: 'Toshkent sh., Chilonzor tumani, 9-mavze',
            workStart: '08:00',
            workEnd: '18:00',
          },
        });
        get().addToast({ type: 'info', title: 'Tizim qayta tiklandi', description: 'Boshlang\'ich ma\'lumotlar yuklandi' });
      },
    }),
    {
      name: 'massaj-crm-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        sidebarCollapsed: state.sidebarCollapsed,
        // Persist mutations
        children: state.children,
        parents: state.parents,
        specialists: state.specialists,
        services: state.services,
        appointments: state.appointments,
        sessions: state.sessions,
        payments: state.payments,
        transactions: state.transactions,
        goals: state.goals,
        assessments: state.assessments,
        notifications: state.notifications,
        activityLogs: state.activityLogs,
        clinicSettings: state.clinicSettings,
      }),
    }
  )
);

// Convenience selectors (Shallow memoized to prevent render cascading)
export const useAuth = () => {
  return useStore(
    useShallow(s => ({
      currentUser: s.currentUser,
      isAuthenticated: s.isAuthenticated,
      login: s.login,
      logout: s.logout,
      updateCurrentUser: s.updateCurrentUser,
    }))
  );
};

export const useToasts = () => {
  return useStore(
    useShallow(s => ({
      toasts: s.toasts,
      addToast: s.addToast,
      removeToast: s.removeToast,
    }))
  );
};

export const useSidebar = () => {
  return useStore(
    useShallow(s => ({
      collapsed: s.sidebarCollapsed,
      toggle: s.toggleSidebar,
      set: s.setSidebarCollapsed,
    }))
  );
};

// Helper (used inside store without import cycle)
function formatAmount(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount);
}
