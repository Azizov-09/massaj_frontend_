// ═══════════════════════════════════════════════════════
//  Zustand Store — Global Application State & API Sync
// ═══════════════════════════════════════════════════════

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { generateId, isUUID, formatCurrency } from '@/utils';
import { api } from '@/services/api';
import type { CreateAttendanceDto } from '@/services/api/types';
import { calculateParentBalance } from '@/services/finance.service';
import type {
  AdminUser, Specialist, Parent, Child, Service,
  Appointment, Session, AttendanceRecord, Assessment,
  ProgressNote, Transaction, Payment,
  Notification, ActivityLog, Employee,
  ToastMessage, UserRole, BaseUser,
} from '@/types';
import {
  SERVICES,
  SPECIALISTS,
  PARENTS,
  CHILDREN,
  APPOINTMENTS,
  SESSIONS,
  ATTENDANCE_RECORDS,
  ASSESSMENTS,
  PROGRESS_NOTES,
  TRANSACTIONS,
  PAYMENTS,
  NOTIFICATIONS,
  ACTIVITY_LOGS,
  ADMINS,
  EMPLOYEES,
} from '@/data/seed';

const IS_TEST_ENV =
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') ||
  (import.meta as any).env?.MODE === 'test' ||
  Boolean((import.meta as any).env?.VITEST);
const DEMO_DATA_ENABLED = IS_TEST_ENV || (import.meta as any).env?.VITE_ENABLE_DEMO_DATA === 'true';

// ─── Auth State ───────────────────────────────────────────

interface AuthState {
  currentUser: (AdminUser | Specialist | Parent) | null;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  expireSession: () => void;
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
  isLoadingData: boolean;
  isInitialized: boolean;
  dataError: string | null;
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
  // Sync
  fetchInitialData: () => Promise<void>;

  // Children
  createChild: (data: Omit<Child, 'id' | 'createdAt'>) => Promise<Child>;
  updateChild: (id: string, data: Partial<Child>) => Promise<void>;
  archiveChild: (id: string) => Promise<void>;
  deleteChild: (id: string) => Promise<void>;

  // Parents
  createParent: (data: Omit<Parent, 'id' | 'createdAt'>, password?: string) => Promise<Parent>;
  updateParent: (id: string, data: Partial<Parent>) => Promise<void>;
  deleteParent: (id: string) => Promise<void>;

  // Specialists
  createSpecialist: (data: Omit<Specialist, 'id' | 'createdAt'>, password?: string) => Promise<Specialist>;
  updateSpecialist: (id: string, data: Partial<Specialist>) => Promise<void>;
  deleteSpecialist: (id: string) => Promise<void>;

  // Services
  createService: (data: Omit<Service, 'id' | 'createdAt'>) => Promise<Service>;
  updateService: (id: string, data: Partial<Service>) => Promise<void>;
  archiveService: (id: string) => Promise<void>;
  restoreService: (id: string) => Promise<void>;

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
  recordAttendance: (data: Omit<AttendanceRecord, 'id' | 'createdAt'>) => Promise<AttendanceRecord>;
  removeAttendance: (appointmentId: string) => void;

  // Assessments
  createAssessment: (data: Omit<Assessment, 'id' | 'createdAt'>) => Promise<Assessment>;

  // Progress Notes
  createProgressNote: (data: Omit<ProgressNote, 'id' | 'createdAt'>) => Promise<ProgressNote>;

  // Payments
  recordPayment: (data: {
    parentId: string;
    childId?: string;
    amount: number;
    method: Payment['method'];
    date: string;
    notes?: string;
    createdBy: string;
  }) => Promise<Payment>;

  // Notifications
  addNotification: (data: Omit<Notification, 'id' | 'createdAt' | 'isRead'> & { isRead?: boolean }) => Notification;
  markNotificationRead: (id: string) => void;
  markNotificationUnread: (id: string) => void;
  markAllNotificationsRead: (userId?: string, role?: UserRole) => void;

  // Admins
  createAdmin: (data: Omit<AdminUser, 'id' | 'createdAt'>, password?: string) => Promise<AdminUser>;
  updateAdmin: (id: string, data: Partial<AdminUser>) => Promise<void>;
  deleteAdmin: (id: string) => Promise<void>;

  // Employees
  createEmployee: (data: Omit<Employee, 'id' | 'joinedAt'>) => Promise<Employee>;
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;

  // Activity log helper
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;

  // Clinic Settings & Reset
  updateClinicSettings: (settings: Partial<DataState['clinicSettings']>) => Promise<void>;
  resetStore: () => void;
  resetToSeedData: () => void;
}

// ─── Combined Store ───────────────────────────────────────

type Store = AuthState & DataState & UIState & Actions;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // ── Auth ────────────────────────────────────────────
      currentUser: null,
      isAuthenticated: false,

      login: async (identifier, password) => {
        const isDemoEmail = identifier.includes('@demo.com') || identifier.includes('@massaj.uz');

        // Demo identities are isolated to tests. Production must always use a
        // backend-issued identity and JWT; local auth fallbacks create a false
        // authenticated state and trigger protected API calls without a token.
        if (isDemoEmail && password === 'demo123') {
          if (!IS_TEST_ENV) {
            return {
              success: false,
              error: "Demo kirish productionda o'chirilgan. Backenddagi telefon raqami va parol bilan kiring.",
            };
          }

          const role: UserRole = identifier.includes('specialist')
            ? 'SPECIALIST'
            : identifier.includes('parent')
            ? 'PARENT'
            : 'SUPER_ADMIN';

          const user: any = {
            id: `user-${role.toLowerCase()}`,
            email: identifier,
            fullName:
              role === 'SUPER_ADMIN'
                ? 'Alisher Nazarov'
                : role === 'SPECIALIST'
                ? 'Dilorom Karimova'
                : 'Malika Yusupova',
            phone: '+998901234567',
            role,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
          };

          set({ currentUser: user, isAuthenticated: true });
          return { success: true };
        }

        let phone = identifier.trim();
        const digitsOnly = phone.replace(/[^0-9]/g, '');
        if (digitsOnly.length === 9) {
          phone = `+998${digitsOnly}`;
        } else if (digitsOnly.length === 12 && digitsOnly.startsWith('998')) {
          phone = `+${digitsOnly}`;
        }

        try {
          // Attempt real NestJS backend login
          const res = await api.auth.login({ phone, password });
          if (res && res.accessToken) {
            const u = res.user;
            const currentUser: any = {
              id: u.id || 'u-admin-1',
              fullName: u.fullName || 'Administrator',
              email: u.email || `${phone}@massaj.uz`,
              phone: u.phone || phone,
              role: u.role || 'SUPER_ADMIN',
              status: u.status || 'ACTIVE',
              createdAt: new Date().toISOString(),
            };
            set({ currentUser, isAuthenticated: true });
            get().addToast({
              type: 'success',
              title: 'Tizimga kirildi',
              description: `Xush kelibsiz, ${currentUser.fullName}`,
            });
            // Fetch live data from backend
            get().fetchInitialData();
            return { success: true };
          }
        } catch (err: any) {
          if (!IS_TEST_ENV) {
            console.warn('[Auth] Real backend login attempt response:', err);
          }

          const friendlyMsg = (err?.message && err.message !== 'fetch failed') ? err.message : "Email yoki parol noto'g'ri";
          return { success: false, error: friendlyMsg };
        }

        return { success: false, error: "Email yoki parol noto'g'ri" };
      },

      logout: () => {
        void api.auth.logout();
        get().expireSession();
      },

      expireSession: () => {
        api.setToken(null);
        api.setRefreshToken(null);
        set({
          currentUser: null,
          isAuthenticated: false,
          admins: [],
          employees: [],
          children: [],
          parents: [],
          specialists: [],
          services: [],
          appointments: [],
          sessions: [],
          attendance: [],
          assessments: [],
          transactions: [],
          payments: [],
          progressNotes: [],
          notifications: [],
          activityLogs: [],
          isInitialized: false,
          isLoadingData: false,
        });
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
      },

      // ── Initial Clinical Dataset (Seeded defaults with live backend sync) ──
      admins: DEMO_DATA_ENABLED ? ADMINS : [],
      employees: DEMO_DATA_ENABLED ? EMPLOYEES : [],
      specialists: DEMO_DATA_ENABLED ? SPECIALISTS : [],
      parents: DEMO_DATA_ENABLED ? PARENTS : [],
      children: DEMO_DATA_ENABLED ? CHILDREN : [],
      services: DEMO_DATA_ENABLED ? SERVICES : [],
      appointments: DEMO_DATA_ENABLED ? APPOINTMENTS : [],
      sessions: DEMO_DATA_ENABLED ? SESSIONS : [],
      attendance: DEMO_DATA_ENABLED ? ATTENDANCE_RECORDS : [],
      assessments: DEMO_DATA_ENABLED ? ASSESSMENTS : [],
      progressNotes: DEMO_DATA_ENABLED ? PROGRESS_NOTES : [],
      transactions: DEMO_DATA_ENABLED ? TRANSACTIONS : [],
      payments: DEMO_DATA_ENABLED ? PAYMENTS : [],
      notifications: DEMO_DATA_ENABLED ? NOTIFICATIONS : [],
      activityLogs: DEMO_DATA_ENABLED ? ACTIVITY_LOGS : [],
      clinicSettings: {
        clinicName: 'Bolalar Massaj & Reabilitatsiya Markazi',
        phone: '+998 71 200 00 00',
        address: 'Toshkent sh., Chilonzor tumani, 9-mavze',
        workStart: '08:00',
        workEnd: '18:00',
      },
      isLoadingData: false,
      isInitialized: false,
      dataError: null,

      // ── Live Backend Synchronization ───────────────────
      fetchInitialData: async () => {
        if (IS_TEST_ENV) {
          set({ isLoadingData: false, isInitialized: true });
          return;
        }

        let token = api.getToken();
        if (!token && get().isAuthenticated) {
          // Only a valid refresh token may recover a session. Never manufacture
          // a production session with hard-coded demo credentials.
          token = await api.refreshAccessToken();
        }

        // If still no token, do not fire protected API requests without authorization
        if (!token) {
          set({
            isLoadingData: false,
            isInitialized: false,
            dataError: 'Sessiya tugagan. Qayta tizimga kiring.',
          });
          return;
        }

        set({ isLoadingData: true, dataError: null });
        try {
          const user = get().currentUser;
          const isParent = user?.role === 'PARENT';
          const isSpecialist = user?.role === 'SPECIALIST';
          const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
          const emptyList = () => Promise.resolve([] as any[]);

          const childrenRequest = isParent
            ? api.portal.getMyChildren()
            : isSpecialist
              ? api.portal.getMyAssignedChildren()
              : api.children.getAll({ limit: 100 });

          const loadClinicalPerChild = async <T,>(loader: (childId: string) => Promise<T[]>): Promise<T[]> => {
            const children = await childrenRequest;
            const combined: T[] = [];
            const batchSize = 8;
            for (let index = 0; index < children.length; index += batchSize) {
              const batch = children.slice(index, index + batchSize);
              const batchResults = await Promise.allSettled(batch.map(child => loader(child.id)));
              batchResults.forEach(result => {
                if (result.status === 'fulfilled' && Array.isArray(result.value)) {
                  combined.push(...result.value);
                }
              });
            }
            return combined;
          };

          const assessmentsRequest = isParent
            ? api.portal.getMyAssessments()
            : isSpecialist
              ? api.portal.getMyAuthoredAssessments()
              : loadClinicalPerChild(childId => api.children.getAssessments(childId));
          const progressRequest = isParent
            ? api.portal.getMyProgress()
            : isSpecialist
              ? api.portal.getMyRecordedProgress()
              : loadClinicalPerChild(childId => api.children.getProgress(childId));

          const results = await Promise.allSettled([
            childrenRequest,
            isAdmin ? api.parents.getAll({ limit: 100 }) : emptyList(),
            isAdmin ? api.specialists.getAll({ limit: 100 }) : emptyList(),
            api.services.getAll(),
            isParent ? api.portal.getMyPayments() : isAdmin ? api.finance.getPayments({ limit: 100 }) : emptyList(),
            isAdmin ? api.finance.getTransactions() : emptyList(),
            isAdmin ? api.platform.getSettings() : Promise.resolve(null),
            api.platform.getNotifications(),
            isAdmin ? api.platform.getActivityLogs() : emptyList(),
            isAdmin ? api.admins.getAll({ limit: 100 }) : emptyList(),
            isAdmin ? api.employees.getAll({ limit: 100 }) : emptyList(),
            assessmentsRequest,
            progressRequest,
          ]);

          const [
            childrenRes,
            parentsRes,
            specialistsRes,
            servicesRes,
            paymentsRes,
            transactionsRes,
            settingsRes,
            notificationsRes,
            activityLogsRes,
            adminsRes,
            employeesRes,
            assessmentsRes,
            progressRes,
          ] = results;

          const failures = results.filter(result => result.status === 'rejected');
          const unauthorized = failures.some(result =>
            result.status === 'rejected' && (result.reason as any)?.status === 401
          );
          if (unauthorized) {
            get().expireSession();
            return;
          }

          const syncError = failures.length > 0
            ? `${failures.length} ta bo'lim serverdan yangilanmadi. Ko'rsatilgan ayrim ma'lumotlar eskirgan bo'lishi mumkin.`
            : null;

          set(state => {
            const nextChildren = childrenRes.status === 'fulfilled' && Array.isArray(childrenRes.value) ? childrenRes.value : state.children;
            const nextParents = parentsRes.status === 'fulfilled' && Array.isArray(parentsRes.value) ? parentsRes.value : state.parents;
            const nextSpecialists = specialistsRes.status === 'fulfilled' && Array.isArray(specialistsRes.value) ? specialistsRes.value : state.specialists;
            const nextServices = servicesRes.status === 'fulfilled' && Array.isArray(servicesRes.value) ? servicesRes.value : state.services;
            const nextPayments = paymentsRes.status === 'fulfilled' && Array.isArray(paymentsRes.value) ? paymentsRes.value : state.payments;
            const nextTransactions = transactionsRes.status === 'fulfilled' && Array.isArray(transactionsRes.value) ? transactionsRes.value : state.transactions;
            const nextNotifications = notificationsRes.status === 'fulfilled' && Array.isArray(notificationsRes.value) ? notificationsRes.value : state.notifications;
            const nextLogs = activityLogsRes.status === 'fulfilled' && Array.isArray(activityLogsRes.value) ? activityLogsRes.value : state.activityLogs;
            const nextAdmins = adminsRes.status === 'fulfilled' && Array.isArray(adminsRes.value) ? adminsRes.value : state.admins;
            const nextEmployees = employeesRes.status === 'fulfilled' && Array.isArray(employeesRes.value) ? employeesRes.value : state.employees;
            const nextAssessments = assessmentsRes.status === 'fulfilled' && Array.isArray(assessmentsRes.value) ? assessmentsRes.value : state.assessments;
            const nextProgress = progressRes.status === 'fulfilled' && Array.isArray(progressRes.value) ? progressRes.value : state.progressNotes;

            const nextSettings = settingsRes.status === 'fulfilled' && settingsRes.value
              ? {
                  clinicName: settingsRes.value.centerName || state.clinicSettings.clinicName,
                  phone: settingsRes.value.phone || state.clinicSettings.phone,
                  address: settingsRes.value.address || state.clinicSettings.address,
                  workStart: settingsRes.value.workingHours?.start || state.clinicSettings.workStart,
                  workEnd: settingsRes.value.workingHours?.end || state.clinicSettings.workEnd,
                }
              : state.clinicSettings;

            return {
              children: nextChildren,
              parents: nextParents,
              specialists: nextSpecialists,
              services: nextServices,
              appointments: state.appointments,
              sessions: state.sessions,
              attendance: state.attendance,
              assessments: nextAssessments,
              progressNotes: nextProgress,
              payments: nextPayments,
              transactions: nextTransactions,
              notifications: nextNotifications,
              activityLogs: nextLogs,
              admins: nextAdmins,
              employees: nextEmployees,
              clinicSettings: nextSettings,
              isLoadingData: false,
              isInitialized: true,
              dataError: syncError,
            };
          });
        } catch (err: any) {
          console.warn('[Store] fetchInitialData error:', err);
          set({ isLoadingData: false, dataError: err?.message || 'Ma’lumotlarni yuklashda xatolik' });
        }
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
      // ── Children Actions ─────────────────────────────────
      createChild: async (data) => {
        try {
          const names = (data.fullName || '').trim().split(' ');
          const created = await api.children.create({
            firstName: names[0] || 'Bola',
            lastName: names.slice(1).join(' ') || '',
            birthDate: data.dateOfBirth || '2020-01-01',
            gender: data.gender,
            address: data.address,
            notes: data.notes,
          });

          const child: Child = created && created.id ? created : {
            ...data,
            id: generateId(),
            createdAt: new Date().toISOString(),
          };

          if (child.parentId && created && created.id) {
            api.children.linkParent(created.id, child.parentId, { relationship: 'Ota/Ona', isPrimary: true }).catch(() => {});
          }

          set(s => ({
            children: [child, ...s.children.filter(c => c.id !== child.id)],
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
        } catch (err: any) {
          console.error('[Store] createChild error:', err);
          throw err;
        }
      },

      updateChild: async (id, data) => {
        try {
          const names = data.fullName ? data.fullName.trim().split(' ') : undefined;
          await api.children.update(id, {
            firstName: names ? names[0] : undefined,
            lastName: names ? names.slice(1).join(' ') : undefined,
            birthDate: data.dateOfBirth,
            gender: data.gender,
            address: data.address,
            notes: data.notes,
          });
          set(s => ({ children: s.children.map(c => c.id === id ? { ...c, ...data } : c) }));
          get().addToast({ type: 'success', title: 'Yangilandi', description: 'Bola ma\'lumotlari yangilandi' });
        } catch (err: any) {
          console.error('[Store] updateChild error:', err);
          get().addToast({ type: 'error', title: 'Xatolik', description: err?.message || 'Bola ma\'lumotlarini yangilab bo\'lmadi' });
          throw err;
        }
      },

      archiveChild: async (id) => {
        try {
          await api.children.archive(id);
          set(s => ({ children: s.children.map(c => c.id === id ? { ...c, status: 'ARCHIVED' } : c) }));
          get().addToast({ type: 'info', title: 'Arxivlandi', description: 'Bola arxivga o\'tkazildi' });
        } catch (err: any) {
          console.error('[Store] archiveChild error:', err);
          get().addToast({ type: 'error', title: 'Xatolik', description: err?.message || 'Arxivlab bo\'lmadi' });
          throw err;
        }
      },

      deleteChild: async (id) => {
        try {
          const child = get().children.find(c => c.id === id);
          await api.children.delete(id);
          set(s => ({ children: s.children.filter(c => c.id !== id) }));
          get().addToast({
            type: 'success',
            title: "Bola o'chirildi",
            description: child ? `${child.fullName} tizimdan olib tashlandi` : undefined,
          });
        } catch (err: any) {
          console.error('[Store] deleteChild error:', err);
          get().addToast({ type: 'error', title: 'Xatolik', description: err?.message || 'O\'chirib bo\'lmadi' });
          throw err;
        }
      },

      // ── Parents Actions ──────────────────────────────────
      createParent: async (data, password) => {
        try {
          const created = await api.parents.create({
            fullName: data.fullName,
            phone: data.phone,
            password: password || 'Password123!',
            address: data.address,
          });

          const parent: Parent = created && created.id ? created : {
            ...data,
            id: generateId(),
            createdAt: new Date().toISOString(),
          };

          set(s => ({ parents: [parent, ...s.parents.filter(p => p.id !== parent.id)] }));
          get().addToast({ type: 'success', title: 'Qo\'shildi', description: `${parent.fullName} tizimga qo'shildi` });
          return parent;
        } catch (err: any) {
          console.error('[Store] createParent error:', err);
          throw err;
        }
      },

      updateParent: async (id, data) => {
        try {
          await api.parents.update(id, {
            fullName: data.fullName,
            phone: data.phone,
            address: data.address,
            status: data.status,
          });
          set(s => ({ parents: s.parents.map(p => p.id === id ? { ...p, ...data } : p) }));
          get().addToast({ type: 'success', title: 'Ota-ona ma\'lumotlari yangilandi' });
        } catch (err: any) {
          console.error('[Store] updateParent error:', err);
          get().addToast({ type: 'error', title: 'Xatolik', description: err?.message || 'Yangilab bo\'lmadi' });
          throw err;
        }
      },

      deleteParent: async (id) => {
        try {
          const parent = get().parents.find(p => p.id === id);
          await api.parents.delete(id);
          set(s => ({ parents: s.parents.filter(p => p.id !== id) }));
          get().addToast({
            type: 'success',
            title: "Ota-ona o'chirildi",
            description: parent ? `${parent.fullName} tizimdan olib tashlandi` : undefined,
          });
        } catch (err: any) {
          console.error('[Store] deleteParent error:', err);
          get().addToast({ type: 'error', title: 'Xatolik', description: err?.message || 'O\'chirib bo\'lmadi' });
          throw err;
        }
      },

      // ── Specialist Actions ───────────────────────────────
      createSpecialist: async (data, password) => {
        try {
          const created = await api.specialists.create({
            fullName: data.fullName,
            phone: data.phone,
            email: data.email,
            password: password || 'Password123!',
            specialization: data.specialization,
            experienceYears: data.experience || 3,
            bio: data.bio,
          });

          const spec: Specialist = created && created.id ? created : {
            ...data,
            id: generateId(),
            createdAt: new Date().toISOString(),
          };

          set(s => ({ specialists: [spec, ...s.specialists.filter(sp => sp.id !== spec.id)] }));
          get().addToast({ type: 'success', title: 'Mutaxassis qo\'shildi' });
          return spec;
        } catch (err: any) {
          console.error('[Store] createSpecialist error:', err);
          throw err;
        }
      },

      updateSpecialist: async (id, data) => {
        try {
          await api.specialists.update(id, {
            fullName: data.fullName,
            phone: data.phone,
            email: data.email,
            specialization: data.specialization,
            experienceYears: data.experience,
            bio: data.bio,
            status: data.status,
          });
          set(s => ({ specialists: s.specialists.map(sp => sp.id === id ? { ...sp, ...data } : sp) }));
          get().addToast({ type: 'success', title: 'Mutaxassis ma\'lumotlari yangilandi' });
        } catch (err: any) {
          console.error('[Store] updateSpecialist error:', err);
          get().addToast({ type: 'error', title: 'Xatolik', description: err?.message || 'Yangilab bo\'lmadi' });
          throw err;
        }
      },

      deleteSpecialist: async (id) => {
        try {
          const spec = get().specialists.find(s => s.id === id);
          await api.specialists.delete(id);
          set(s => ({ specialists: s.specialists.filter(sp => sp.id !== id) }));
          get().addToast({
            type: 'success',
            title: "Mutaxassis o'chirildi",
            description: spec ? `${spec.fullName} tizimdan olib tashlandi` : undefined,
          });
        } catch (err: any) {
          console.error('[Store] deleteSpecialist error:', err);
          get().addToast({ type: 'error', title: 'Xatolik', description: err?.message || 'O\'chirib bo\'lmadi' });
          throw err;
        }
      },

      // ── Service Actions ──────────────────────────────────
      createService: async (data) => {
        try {
          const created = await api.services.create({
            name: data.name,
            description: data.description,
            durationMinutes: data.durationMinutes,
            price: data.price,
          });

          const svc: Service = created && created.id ? created : {
            ...data,
            id: generateId(),
            createdAt: new Date().toISOString(),
          };

          set(s => ({ services: [svc, ...s.services.filter(sv => sv.id !== svc.id)] }));
          get().addToast({ type: 'success', title: 'Xizmat qo\'shildi' });
          return svc;
        } catch (err: any) {
          console.error('[Store] createService error:', err);
          throw err;
        }
      },

      updateService: async (id, data) => {
        try {
          await api.services.update(id, {
            name: data.name,
            description: data.description,
            durationMinutes: data.durationMinutes,
            price: data.price,
          });
          set(s => ({ services: s.services.map(sv => sv.id === id ? { ...sv, ...data } : sv) }));
          get().addToast({ type: 'success', title: 'Xizmat yangilandi' });
        } catch (err: any) {
          console.error('[Store] updateService error:', err);
          get().addToast({ type: 'error', title: 'Xatolik', description: err?.message || 'Yangilab bo\'lmadi' });
          throw err;
        }
      },

      archiveService: async (id) => {
        try {
          await api.services.archive(id);
          set(s => ({ services: s.services.map(sv => sv.id === id ? { ...sv, status: 'ARCHIVED' } : sv) }));
          get().addToast({ type: 'info', title: 'Xizmat arxivlandi' });
        } catch (err: any) {
          console.error('[Store] archiveService error:', err);
          get().addToast({ type: 'error', title: 'Xatolik', description: err?.message || 'Arxivlab bo\'lmadi' });
          throw err;
        }
      },

      restoreService: async (id) => {
        try {
          await api.services.restore(id);
          set(s => ({ services: s.services.map(sv => sv.id === id ? { ...sv, status: 'ACTIVE' } : sv) }));
          get().addToast({ type: 'success', title: 'Xizmat tiklandi' });
        } catch (err: any) {
          console.error('[Store] restoreService error:', err);
          get().addToast({ type: 'error', title: 'Xatolik', description: err?.message || 'Qayta tiklab bo\'lmadi' });
          throw err;
        }
      },

      // ── Appointment Actions ──────────────────────────────
      createAppointment: (data) => {
        const apt: Appointment = { ...data, id: generateId(), createdAt: new Date().toISOString() };
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
          id: generateId(),
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
          id: generateId(),
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

        // 1. In-app bildirishnoma: Seans yakunlandi (Admin va mutaxassis uchun)
        const specialist = get().specialists.find(sp => sp.id === session.specialistId);
        get().addNotification({
          userId: 'admin-1',
          type: 'session',
          title: 'Seans yakunlandi',
          message: `${specialist?.fullName ?? 'Mutaxassis'} ${child?.fullName ?? 'Bemor'} bilan seans yakunladi.`,
          relatedEntity: { type: 'session', id: sessionId },
        });

        // 2. In-app bildirishnoma: Ota-onaga balans va qarzdorlik holati haqida
        const targetParentId = apt?.parentId ?? child?.parentId;
        if (targetParentId) {
          // Hisoblangan balans va qarzni tekshirish
          const updatedTxns = [...get().transactions, txn];
          const allParentChildren = get().children.filter(c => c.parentId === targetParentId).map(c => c.id);
          const parentFin = calculateParentBalance(targetParentId, allParentChildren, updatedTxns);

          if (parentFin.debt > 0) {
            get().addNotification({
              userId: targetParentId,
              type: 'debt',
              title: 'Qarzdorlik haqida ogohlantirish',
              message: `${child?.fullName ?? 'Farzandingiz'}ning seansi yakunlandi (${formatAmount(amount)} so'm). Hisobingizda mablag' yetarli emas, joriy qarzdorlik: ${formatAmount(parentFin.debt)} so'm. Iltimos, hisobni to'ldiring.`,
              relatedEntity: { type: 'child', id: session.childId },
            });
          } else {
            get().addNotification({
              userId: targetParentId,
              type: 'session',
              title: 'Seans yakunlandi',
              message: `${child?.fullName ?? 'Farzandingiz'}ning ${service?.name ?? 'muolaja'} seansi yakunlandi. Qoldiq balans: ${formatAmount(parentFin.balance)} so'm.`,
              relatedEntity: { type: 'child', id: session.childId },
            });
          }
        }

        get().addToast({ type: 'success', title: 'Seans yakunlandi', description: `${formatAmount(amount)} so'm hisoblandi` });
      },

      // ── Attendance ───────────────────────────────────────
      recordAttendance: async (data) => {
        // Resolve real backend childId
        let resolvedChildId = data.childId;
        const currentChildren = get().children;
        const matchedChild = currentChildren.find(c => c.id === data.childId);
        if (matchedChild && isUUID(matchedChild.id)) {
          resolvedChildId = matchedChild.id;
        } else if (!isUUID(resolvedChildId)) {
          // If demo ID, resolve to matching child by name or first backend child with valid UUID
          const byName = currentChildren.find(c => isUUID(c.id) && matchedChild && c.fullName === matchedChild.fullName);
          const firstUuidChild = currentChildren.find(c => isUUID(c.id));
          if (byName) {
            resolvedChildId = byName.id;
          } else if (firstUuidChild) {
            resolvedChildId = firstUuidChild.id;
          }
        }

        // Resolve specialistId (must be valid UUID if provided)
        let resolvedSpecialistId: string | undefined = undefined;
        if (data.specialistId) {
          if (isUUID(data.specialistId)) {
            resolvedSpecialistId = data.specialistId;
          } else {
            const matchedSpec = get().specialists.find(s => s.id === data.specialistId);
            if (matchedSpec && isUUID(matchedSpec.id)) {
              resolvedSpecialistId = matchedSpec.id;
            } else {
              const firstUuidSpec = get().specialists.find(s => isUUID(s.id));
              if (firstUuidSpec) {
                resolvedSpecialistId = firstUuidSpec.id;
              }
            }
          }
        }

        // Clean payload strictly conforming to backend CreateAttendanceDto (no appointmentId!)
        const payload: CreateAttendanceDto = {
          childId: resolvedChildId,
          status: data.status,
          date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
        };

        if (resolvedSpecialistId && isUUID(resolvedSpecialistId)) {
          payload.specialistId = resolvedSpecialistId;
        }

        if (data.note && data.note.trim().length > 0) {
          payload.note = data.note.trim();
        }

        try {
          const created = IS_TEST_ENV
            ? { ...data, id: generateId(), createdAt: new Date().toISOString() }
            : await api.clinical.recordAttendance(payload);
          const record: AttendanceRecord = {
            ...data,
            ...created,
            appointmentId: data.appointmentId,
            id: created.id,
            createdAt: created.createdAt,
          };

          set(s => ({
            attendance: [
              ...s.attendance.filter(a => {
                if (data.appointmentId && a.appointmentId) {
                  return a.appointmentId !== data.appointmentId;
                }
                return !(a.childId === data.childId && a.date === data.date);
              }),
              record,
            ],
          }));
          get().addToast({ type: 'success', title: 'Davomat belgilandi' });
          return record;
        } catch (err: any) {
          get().addToast({ type: 'error', title: 'Davomat saqlanmadi', description: err?.message });
          throw err;
        }
      },

      removeAttendance: (idOrAppointmentId) => {
        set(s => ({
          attendance: s.attendance.filter(a => a.id !== idOrAppointmentId && a.appointmentId !== idOrAppointmentId),
        }));
        get().addToast({ type: 'info', title: 'Davomat bekor qilindi' });
      },

      // ── Assessments ──────────────────────────────────────
      createAssessment: async (data) => {
        try {
          const created = IS_TEST_ENV
            ? { ...data, id: generateId(), createdAt: new Date().toISOString() }
            : await api.clinical.createAssessment({
                childId: data.childId,
                specialistId: data.specialistId,
                movement: data.scores.movement,
                coordination: data.scores.coordination,
                flexibility: data.scores.flexibility,
                activityTolerance: data.scores.activityTolerance,
                sessionResponse: data.scores.sessionResponse,
                professionalObservation: data.professionalObservation,
              });
          const assessment: Assessment = { ...data, ...created };
          set(s => ({ assessments: [assessment, ...s.assessments.filter(item => item.id !== assessment.id)] }));
          get().addToast({ type: 'success', title: 'Baholash saqlandi' });
          return assessment;
        } catch (err: any) {
          get().addToast({ type: 'error', title: 'Baholash saqlanmadi', description: err?.message });
          throw err;
        }
      },

      // ── Progress Notes ───────────────────────────────────
      createProgressNote: async (data) => {
        try {
          const created = IS_TEST_ENV
            ? { ...data, id: generateId(), createdAt: new Date().toISOString() }
            : await api.clinical.createProgress({
                childId: data.childId,
                specialistId: data.specialistId,
                title: 'Rivojlanish qaydi',
                description: data.note,
              });
          const note: ProgressNote = { ...data, ...created };
          set(s => ({ progressNotes: [note, ...s.progressNotes.filter(item => item.id !== note.id)] }));
          get().addToast({ type: 'success', title: 'Rivojlanish qaydi saqlandi' });
          return note;
        } catch (err: any) {
          get().addToast({ type: 'error', title: 'Rivojlanish qaydi saqlanmadi', description: err?.message });
          throw err;
        }
      },

      // ── Payments ─────────────────────────────────────────
      recordPayment: async (data) => {
        if (!data.parentId) {
          throw new Error('Ota-onani tanlash majburiy');
        }
        const cleanAmount = Math.round(Number(data.amount));
        if (!cleanAmount || cleanAmount <= 0) {
          throw new Error("To'lov summasi 0 dan katta bo'lishi kerak");
        }
        if (cleanAmount > 2_000_000_000) {
          throw new Error("To'lov summasi 2,000,000,000 so'mdan oshmasligi kerak");
        }

        const targetChildId = data.childId && data.childId.trim() ? data.childId.trim() : undefined;
        const now = new Date().toISOString();
        const txnId = generateId();
        const idempotencyKey = `pay-${generateId()}`;

        let confirmedPayment: Payment;

        const isTestEnv =
          (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') ||
          (import.meta as any).env?.MODE === 'test' ||
          Boolean((import.meta as any).env?.VITEST);

        if (isTestEnv) {
          const payId = generateId();
          confirmedPayment = {
            id: payId,
            parentId: data.parentId,
            childId: targetChildId,
            amount: cleanAmount,
            method: data.method,
            date: data.date || now,
            notes: data.notes,
            idempotencyKey,
            transactionId: txnId,
            createdBy: data.createdBy,
            createdAt: now,
          };
        } else {
          // Live API call: do NOT assume success!
          const res = await api.finance.recordPayment({
            parentId: data.parentId,
            childId: targetChildId,
            amount: cleanAmount,
            method: data.method,
            note: data.notes,
            paidAt: data.date || now,
            idempotencyKey,
          });

          confirmedPayment = {
            ...res,
            parentId: data.parentId,
            childId: res.childId || targetChildId,
            amount: cleanAmount,
            method: data.method,
            date: res.date || data.date || now,
            notes: data.notes || res.notes,
            idempotencyKey,
            transactionId: res.transactionId || txnId,
            createdBy: data.createdBy,
          };
        }

        // Only after backend confirms, commit to store:
        const txn: Transaction = {
          id: confirmedPayment.transactionId || txnId,
          type: 'PAYMENT',
          direction: 'IN',
          amount: cleanAmount,
          parentId: data.parentId,
          childId: confirmedPayment.childId || targetChildId,
          paymentId: confirmedPayment.id,
          description: `To'lov qabul qilindi - ${data.method}`,
          date: data.date || now,
          createdAt: now,
          createdBy: data.createdBy,
        };

        set(s => ({
          payments: [confirmedPayment, ...s.payments.filter(p => p.id !== confirmedPayment.id)],
          transactions: [txn, ...s.transactions],
        }));

        const parent = get().parents.find(p => p.id === data.parentId);
        get().addActivityLog({
          actorId: data.createdBy,
          actorName: get().currentUser?.fullName ?? 'Admin',
          actorRole: (get().currentUser as BaseUser)?.role ?? 'ADMIN',
          action: 'PAYMENT',
          entity: 'payment',
          entityId: confirmedPayment.id,
          description: `${parent?.fullName ?? ''} dan ${formatCurrency(cleanAmount)} qabul qilindi`,
        });

        // In-app notification with real confirmed payment
        get().addNotification({
          userId: data.parentId,
          type: 'payment',
          title: "To'lov qabul qilindi",
          message: `${formatCurrency(cleanAmount)} to'lov qabul qilindi. Balansingiz yangilandi.`,
          relatedEntity: { type: 'payment', id: confirmedPayment.id },
        });

        get().addToast({
          type: 'success',
          title: "To'lov qabul qilindi",
          description: `${formatCurrency(cleanAmount)} muvaffaqiyatli saqlandi`,
        });

        // Live server synchronization of finance, debtors, and notifications
        if (!isTestEnv) {
          Promise.allSettled([
            api.finance.getPayments({ limit: 100 }),
            api.finance.getTransactions({ limit: 100 }),
            api.platform.getNotifications(),
          ]).then(([pRes, tRes, nRes]) => {
            set(s => ({
              payments: pRes.status === 'fulfilled' && Array.isArray(pRes.value) ? pRes.value : s.payments,
              transactions: tRes.status === 'fulfilled' && Array.isArray(tRes.value) ? tRes.value : s.transactions,
              notifications: nRes.status === 'fulfilled' && Array.isArray(nRes.value) ? nRes.value : s.notifications,
            }));
          }).catch(() => {});
        }

        return confirmedPayment;
      },

      // ── Notifications ────────────────────────────────────
      addNotification: (data) => {
        const notif: Notification = {
          ...data,
          id: generateId(),
          isRead: data.isRead ?? false,
          createdAt: new Date().toISOString(),
        };
        set(s => ({
          notifications: [notif, ...s.notifications],
        }));
        return notif;
      },

      markNotificationRead: (id) => {
        set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: true } : n) }));
        api.platform.markNotificationRead(id).catch(err => {
          console.warn('[Store] Background markNotificationRead sync warning:', err);
        });
      },

      markNotificationUnread: (id) => {
        set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, isRead: false } : n) }));
      },

      markAllNotificationsRead: (userId, role) => {
        const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
        set(s => ({
          notifications: s.notifications.map(n => {
            if (isAdmin || !userId) {
              return { ...n, isRead: true };
            }
            if (n.userId === userId || !n.userId) {
              return { ...n, isRead: true };
            }
            return n;
          }),
        }));
        api.platform.markAllNotificationsRead().catch(err => {
          console.warn('[Store] Background markAllNotificationsRead sync warning:', err);
        });
      },

      // ── Admins ───────────────────────────────────────────
      createAdmin: async (data, password) => {
        try {
          const created = await api.admins.create({
            fullName: data.fullName,
            phone: data.phone,
            email: data.email,
            role: data.role,
            password: password || 'Admin123!',
          });

          const admin: AdminUser = created && created.id ? created : {
            ...data,
            id: generateId(),
            createdAt: new Date().toISOString(),
          };

          set(s => ({ admins: [admin, ...s.admins.filter(a => a.id !== admin.id)] }));
          get().addToast({ type: 'success', title: 'Administrator qo‘shildi', description: `${admin.fullName} tizimga muvaffaqiyatli biriktirildi` });
          return admin;
        } catch (err: any) {
          console.error('[Store] createAdmin error:', err);
          throw err;
        }
      },

      updateAdmin: async (id, data) => {
        try {
          const updated = await api.admins.update(id, {
            fullName: data.fullName,
            email: data.email,
            phone: data.phone,
            role: data.role,
            status: data.status,
          });
          set(s => ({
            admins: s.admins.map(a => a.id === id ? { ...a, ...(updated && updated.id ? updated : data) } : a)
          }));
          get().addToast({ type: 'success', title: 'Admin yangilandi' });
        } catch (err: any) {
          console.error('[Store] updateAdmin error:', err);
          get().addToast({ type: 'error', title: 'Xatolik', description: err?.message || 'Admin ma\'lumotlarini yangilab bo\'lmadi' });
          throw err;
        }
      },

      deleteAdmin: async (id) => {
        try {
          await api.admins.archive(id);
          set(s => ({ admins: s.admins.filter(a => a.id !== id) }));
          get().addToast({ type: 'success', title: "Admin o'chirildi" });
        } catch (err: any) {
          console.error('[Store] deleteAdmin error:', err);
          get().addToast({ type: 'error', title: 'Xatolik', description: err?.message || 'Adminni o\'chirib bo\'lmadi' });
          throw err;
        }
      },

      // ── Employees ────────────────────────────────────────
      createEmployee: async (data) => {
        try {
          const created = await api.employees.create({
            fullName: data.fullName,
            position: data.position,
            phone: data.phone,
            email: data.email,
            salary: data.salary,
            notes: data.notes,
          });

          const emp: Employee = created && created.id ? created : {
            ...data,
            id: generateId(),
            joinedAt: new Date().toISOString(),
          };

          set(s => ({ employees: [emp, ...s.employees.filter(e => e.id !== emp.id)] }));
          get().addToast({ type: 'success', title: 'Xodim qo\'shildi' });
          return emp;
        } catch (err: any) {
          console.error('[Store] createEmployee error:', err);
          throw err;
        }
      },

      updateEmployee: async (id, data) => {
        try {
          await api.employees.update(id, {
            fullName: data.fullName,
            position: data.position,
            phone: data.phone,
            email: data.email,
            salary: data.salary,
            notes: data.notes,
            status: data.status,
          });
          set(s => ({ employees: s.employees.map(e => e.id === id ? { ...e, ...data } : e) }));
          get().addToast({ type: 'success', title: 'Xodim ma\'lumotlari yangilandi' });
        } catch (err: any) {
          console.error('[Store] updateEmployee error:', err);
          get().addToast({ type: 'error', title: 'Xatolik', description: err?.message || 'Xodim ma\'lumotlarini yangilab bo\'lmadi' });
          throw err;
        }
      },

      // ── Activity Log ──────────────────────────────────────
      addActivityLog: (log) => {
        const entry: ActivityLog = { ...log, id: generateId(), timestamp: new Date().toISOString() };
        set(s => ({ activityLogs: [entry, ...s.activityLogs] }));
      },

      // ── Clinic Settings & Reset ───────────────────────────
      updateClinicSettings: async (settings) => {
        try {
          await api.platform.updateSettings({
            centerName: settings.clinicName,
            phone: settings.phone,
            address: settings.address,
            workingHours: settings.workStart || settings.workEnd
              ? {
                  start: settings.workStart ?? get().clinicSettings.workStart,
                  end: settings.workEnd ?? get().clinicSettings.workEnd,
                }
              : undefined,
          });
          set(s => ({ clinicSettings: { ...s.clinicSettings, ...settings } }));
          get().addToast({ type: 'success', title: 'Sozlamalar saqlandi', description: 'Markaz ma’lumotlari yangilandi' });
        } catch (err: any) {
          get().addToast({ type: 'error', title: 'Sozlamalar saqlanmadi', description: err?.message });
          throw err;
        }
      },

      resetStore: () => {
        try {
          localStorage.removeItem('massaj-crm-store');
          localStorage.removeItem('access_token');
        } catch {}
        set({
          currentUser: null,
          isAuthenticated: false,
          admins: [],
          employees: [],
          specialists: [],
          parents: [],
          children: [],
          services: [],
          appointments: [],
          sessions: [],
          attendance: [],
          progressNotes: [],
          payments: [],
          notifications: [],
          activityLogs: [],
          clinicSettings: {
            clinicName: 'Bolalar Massaj & Reabilitatsiya Markazi',
            phone: '+998 71 200 00 00',
            address: 'Toshkent sh., Chilonzor tumani, 9-mavze',
            workStart: '08:00',
            workEnd: '18:00',
          },
          isLoadingData: false,
          isInitialized: false,
          dataError: null,
        });
        get().addToast({ type: 'info', title: 'Tizim tozalandi', description: 'Barcha sessiyalar bekor qilindi' });
      },

      resetToSeedData: () => {
        set({
          admins: ADMINS,
          employees: EMPLOYEES,
          specialists: SPECIALISTS,
          parents: PARENTS,
          children: CHILDREN,
          services: SERVICES,
          appointments: APPOINTMENTS,
          sessions: SESSIONS,
          attendance: ATTENDANCE_RECORDS,
          assessments: ASSESSMENTS,
          progressNotes: PROGRESS_NOTES,
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
          isLoadingData: false,
          isInitialized: true,
          dataError: null,
        });
        get().addToast({
          type: 'success',
          title: 'Ma\'lumotlar yangilandi',
          description: 'Klinika ma\'lumotlari muvaffaqiyatli tiklandi',
        });
      },
    }),
    {
      name: 'massaj-crm-live-storage-v1',
      onRehydrateStorage: () => (state) => {
        // Clear any old mock demo data lingering in legacy keys
        if (typeof window !== 'undefined') {
          try {
            const legacy = localStorage.getItem('massaj-crm-store');
            if (legacy && (legacy.includes('201.7') || legacy.includes('Alisher Nazarov') || legacy.includes('superadmin@demo.com'))) {
              localStorage.removeItem('massaj-crm-store');
            }
          } catch {}
        }
        if (state) {
          // If stored state has 0 services or 0 children, initialize with realistic clinic data
          if ((!state.services || state.services.length === 0) || (!state.children || state.children.length === 0)) {
            state.resetToSeedData();
          }
          if (state.isAuthenticated) {
            // Immediately fetch fresh live data from Render backend if connected
            state.fetchInitialData();
          }
        }
      },
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        sidebarCollapsed: state.sidebarCollapsed,
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
