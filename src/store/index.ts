// ═══════════════════════════════════════════════════════
//  Zustand Store — Global Application State & API Sync
// ═══════════════════════════════════════════════════════

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { generateId } from "@/utils";
import { api } from "@/services/api";
import { WORKFLOW_UNAVAILABLE } from "@/services/api/workflow";
import type { UpdateAdminDto } from "@/services/api/types";
import { normalizePayment } from "@/services/api/finance";
import type {
  AdminUser,
  Specialist,
  Parent,
  Child,
  Service,
  Appointment,
  Session,
  AttendanceRecord,
  Assessment,
  ProgressNote,
  Transaction,
  Payment,
  Notification,
  ActivityLog,
  Employee,
  ToastMessage,
  UserRole,
  BaseUser,
  ServiceAssignment,
  CreateServiceAssignmentInput,
  ParentAccount,
} from "@/types";

const IS_TEST_ENV =
  (typeof process !== "undefined" && process.env?.NODE_ENV === "test") ||
  (import.meta as any).env?.MODE === "test" ||
  Boolean((import.meta as any).env?.VITEST);

// ─── Auth State ───────────────────────────────────────────

interface AuthState {
  currentUser: (AdminUser | Specialist | Parent) | null;
  isAuthenticated: boolean;
  login: (
    identifier: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
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
  serviceAssignments: ServiceAssignment[];
  assignmentsLoading: boolean;
  assignmentsError: string | null;
  parentAccounts: Record<string, ParentAccount>;
  accountsError: string | null;
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
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

// ─── Actions ─────────────────────────────────────────────

interface Actions {
  // Sync
  fetchInitialData: () => Promise<void>;

  fetchServiceAssignments: (childId: string) => Promise<void>;
  createServiceAssignment: (
    data: CreateServiceAssignmentInput,
    key: string,
  ) => Promise<ServiceAssignment>;
  extendServiceAssignment: (
    id: string,
    count: number,
    key: string,
  ) => Promise<void>;
  saveReception: (data: Record<string, unknown>, key: string) => Promise<void>;
  commitReception: (
    id: string,
    status: "PRESENT" | "ABSENT",
    note: string,
    key: string,
  ) => Promise<void>;
  // Children
  createChild: (data: Omit<Child, "id" | "createdAt">) => Promise<Child>;
  updateChild: (id: string, data: Partial<Child>) => Promise<void>;
  archiveChild: (id: string) => Promise<void>;
  deleteChild: (id: string) => Promise<void>;

  // Parents
  createParent: (
    data: Omit<Parent, "id" | "createdAt">,
    password?: string,
  ) => Promise<Parent>;
  updateParent: (id: string, data: Partial<Parent>) => Promise<void>;
  deleteParent: (id: string) => Promise<void>;

  // Specialists
  createSpecialist: (
    data: Omit<Specialist, "id" | "createdAt">,
    password?: string,
  ) => Promise<Specialist>;
  updateSpecialist: (id: string, data: Partial<Specialist>) => Promise<void>;
  deleteSpecialist: (id: string) => Promise<void>;

  // Services
  createService: (data: Omit<Service, "id" | "createdAt">) => Promise<Service>;
  updateService: (id: string, data: Partial<Service>) => Promise<void>;
  archiveService: (id: string) => Promise<void>;
  restoreService: (id: string) => Promise<void>;

  // Appointments
  createAppointment: (
    data: Omit<Appointment, "id" | "createdAt">,
  ) => Appointment;
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
    recommendation: string,
  ) => void;

  // Attendance
  recordAttendance: (
    data: Omit<AttendanceRecord, "id" | "createdAt">,
  ) => Promise<AttendanceRecord>;
  removeAttendance: (appointmentId: string) => void;

  // Assessments
  createAssessment: (
    data: Omit<Assessment, "id" | "createdAt">,
  ) => Promise<Assessment>;

  // Progress Notes
  createProgressNote: (
    data: Omit<ProgressNote, "id" | "createdAt">,
  ) => Promise<ProgressNote>;

  // Payments
  recordPayment: (data: {
    parentId: string;
    childId?: string;
    amount: number;
    method: Payment["method"];
    date: string;
    notes?: string;
    createdBy: string;
    idempotencyKey?: string;
  }) => Promise<Payment>;

  // Notifications
  addNotification: (
    data: Omit<Notification, "id" | "createdAt" | "isRead"> & {
      isRead?: boolean;
    },
  ) => Notification;
  markNotificationRead: (id: string) => void;
  markNotificationUnread: (id: string) => void;
  markAllNotificationsRead: (userId?: string, role?: UserRole) => void;

  // Admins
  createAdmin: (
    data: Omit<AdminUser, "id" | "createdAt">,
    password?: string,
  ) => Promise<AdminUser>;
  updateAdmin: (id: string, data: Partial<AdminUser>) => Promise<void>;
  deleteAdmin: (id: string) => Promise<void>;

  // Employees
  createEmployee: (
    data: Omit<Employee, "id" | "joinedAt">,
  ) => Promise<Employee>;
  updateEmployee: (id: string, data: Partial<Employee>) => Promise<void>;

  // Activity log helper
  addActivityLog: (log: Omit<ActivityLog, "id" | "timestamp">) => void;

  // Clinic Settings & Reset
  updateClinicSettings: (
    settings: Partial<DataState["clinicSettings"]>,
  ) => Promise<void>;
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
        let phone = identifier.trim();
        const digitsOnly = phone.replace(/[^0-9]/g, "");
        if (digitsOnly.length === 9) {
          phone = `+998${digitsOnly}`;
        } else if (digitsOnly.length === 12 && digitsOnly.startsWith("998")) {
          phone = `+${digitsOnly}`;
        }

        try {
          // Attempt real NestJS backend login
          const res = await api.auth.login({ phone, password });
          if (res && res.accessToken) {
            const u = res.user;
            if (
              !u?.id ||
              !["SUPER_ADMIN", "ADMIN", "SPECIALIST", "PARENT"].includes(u.role)
            )
              throw new Error("Server foydalanuvchini tasdiqlamadi");
            const currentUser: any = {
              id: u.id,
              fullName: u.fullName || "Foydalanuvchi",
              phone: u.phone || phone,
              role: u.role,
              status: u.status || "ACTIVE",
              createdAt: new Date().toISOString(),
              specialistId:
                (u as any).specialistId || (u as any).specialist?.id,
            };
            set({ currentUser, isAuthenticated: true });
            get().addToast({
              type: "success",
              title: "Tizimga kirildi",
              description: `Xush kelibsiz, ${currentUser.fullName}`,
            });
            // Fetch live data from backend
            get().fetchInitialData();
            return { success: true };
          }
        } catch (err: any) {
          if (!IS_TEST_ENV) {
            console.warn("[Auth] Real backend login attempt response:", err);
          }

          const friendlyMsg =
            err?.message && err.message !== "fetch failed"
              ? err.message
              : "Telefon raqami yoki parol noto'g'ri";
          return { success: false, error: friendlyMsg };
        }

        return { success: false, error: "Telefon raqami yoki parol noto'g'ri" };
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
          serviceAssignments: [],
          parentAccounts: {},
          accountsError: null,
          assignmentsError: null,
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
        set((s) => {
          if (!s.currentUser) return s;
          const updated = { ...s.currentUser, ...data };
          if (
            s.currentUser.role === "SUPER_ADMIN" ||
            s.currentUser.role === "ADMIN"
          ) {
            return {
              currentUser: updated as AdminUser,
              admins: s.admins.map((a) =>
                a.id === updated.id ? (updated as AdminUser) : a,
              ),
            };
          } else if (s.currentUser.role === "SPECIALIST") {
            return {
              currentUser: updated as Specialist,
              specialists: s.specialists.map((sp) =>
                sp.id === updated.id ? (updated as Specialist) : sp,
              ),
            };
          } else if (s.currentUser.role === "PARENT") {
            return {
              currentUser: updated as Parent,
              parents: s.parents.map((p) =>
                p.id === updated.id ? (updated as Parent) : p,
              ),
            };
          }
          return { currentUser: updated as AdminUser };
        });
      },

      // ── Initial Clinical Dataset (Seeded defaults with live backend sync) ──
      admins: [],
      employees: [],
      specialists: [],
      parents: [],
      children: [],
      services: [],
      appointments: [],
      serviceAssignments: [],
      assignmentsLoading: false,
      assignmentsError: null,
      parentAccounts: {},
      accountsError: null,
      sessions: [],
      attendance: [],
      assessments: [],
      progressNotes: [],
      transactions: [],
      payments: [],
      notifications: [],
      activityLogs: [],
      clinicSettings: {
        clinicName: "Bolalar Massaj & Reabilitatsiya Markazi",
        phone: "",
        address: "",
        workStart: "08:00",
        workEnd: "18:00",
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
            dataError: "Sessiya tugagan. Qayta tizimga kiring.",
          });
          return;
        }

        set({ isLoadingData: true, dataError: null });
        try {
          let user = get().currentUser;
          if (user?.role === "PARENT") {
            const profile = await api.parents.getMe();
            if (!profile?.id || profile.id === "undefined")
              throw new Error("Ota-ona profili tasdiqlanmadi");
            user = { ...user, ...profile };
            set({ currentUser: user });
          }
          const isParent = user?.role === "PARENT";
          const isSpecialist = user?.role === "SPECIALIST";
          const isAdmin =
            user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
          const emptyList = () => Promise.resolve([] as any[]);
          const parentsRequest = isAdmin
            ? api.parents.getAll({ limit: 100 })
            : emptyList();

          const childrenRequest = isParent
            ? api.portal.getMyChildren()
            : isSpecialist
              ? api.portal.getMyAssignedChildren()
              : api.children.getAll({ limit: 100 });

          const loadClinicalPerChild = async <T>(
            loader: (childId: string) => Promise<T[]>,
          ): Promise<T[]> => {
            const children = await childrenRequest;
            const combined: T[] = [];
            const batchSize = 8;
            for (let index = 0; index < children.length; index += batchSize) {
              const batch = children.slice(index, index + batchSize);
              const batchResults = await Promise.allSettled(
                batch.map((child) => loader(child.id)),
              );
              if (batchResults.some((result) => result.status === "rejected"))
                throw new Error("Bola tarixi to‘liq yuklanmadi");
              batchResults.forEach((result) => {
                if (
                  result.status === "fulfilled" &&
                  Array.isArray(result.value)
                ) {
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
              : loadClinicalPerChild((childId) =>
                  api.children.getAssessments(childId),
                );
          const progressRequest = isParent
            ? api.portal.getMyProgress()
            : isSpecialist
              ? api.portal.getMyRecordedProgress()
              : loadClinicalPerChild((childId) =>
                  api.children.getProgress(childId),
                );

          const appointmentsRequest = api.workflow.enabled
            ? api.workflow.getAppointments()
            : emptyList();
          const attendanceRequest = isParent
            ? api.portal.getMyAttendances()
            : loadClinicalPerChild((childId) =>
                api.children.getAttendance(childId),
              );
          const accountsRequest = isParent
            ? api.portal.getMyBalance().then((value) => ({
                [user!.id]: { ...value, parentId: user!.id },
              }))
            : isAdmin
              ? parentsRequest.then(async (parents) => {
                  const accounts: Record<string, ParentAccount> = {};
                  for (let index = 0; index < parents.length; index += 8) {
                    await Promise.all(
                      parents.slice(index, index + 8).map(async (parent) => {
                        const value = await api.finance.getParentBalance(
                          parent.id,
                        );
                        if (
                          !Number.isFinite(value.balance) ||
                          !Number.isFinite(value.debt) ||
                          value.balance < 0 ||
                          value.debt < 0 ||
                          (value.balance > 0 && value.debt > 0)
                        )
                          throw new Error("Oila hisobi serverda tasdiqlanmadi");
                        accounts[parent.id] = { ...value, parentId: parent.id };
                      }),
                    );
                  }
                  return accounts;
                })
              : Promise.resolve({});

          const results = await Promise.allSettled([
            childrenRequest,
            parentsRequest,
            isAdmin ? api.specialists.getAll({ limit: 100 }) : emptyList(),
            api.services.getAll(),
            isParent
              ? api.portal.getMyPayments()
              : isAdmin
                ? api.finance.getPayments({ limit: 100 })
                : emptyList(),
            isAdmin ? api.finance.getTransactions() : emptyList(),
            isAdmin ? api.platform.getSettings() : Promise.resolve(null),
            api.platform.getNotifications(),
            isAdmin ? api.platform.getActivityLogs() : emptyList(),
            emptyList(),
            emptyList(),
            assessmentsRequest,
            progressRequest,
            appointmentsRequest,
            attendanceRequest,
            accountsRequest,
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
            appointmentsRes,
            attendanceRes,
            accountsRes,
          ] = results;

          const failures = results.filter(
            (result) => result.status === "rejected",
          );
          const unauthorized = failures.some(
            (result) =>
              result.status === "rejected" &&
              (result.reason as any)?.status === 401,
          );
          if (unauthorized) {
            get().expireSession();
            return;
          }

          const syncError =
            failures.length > 0
              ? `${failures.length} ta bo'lim serverdan yangilanmadi. Ko'rsatilgan ayrim ma'lumotlar eskirgan bo'lishi mumkin.`
              : null;

          if (
            !get().isAuthenticated ||
            get().currentUser?.id !== user?.id ||
            get().currentUser?.role !== user?.role
          )
            return;

          set((state) => {
            let nextChildren =
              childrenRes.status === "fulfilled" &&
              Array.isArray(childrenRes.value)
                ? childrenRes.value
                : state.children;
            let nextParents =
              parentsRes.status === "fulfilled" &&
              Array.isArray(parentsRes.value)
                ? parentsRes.value
                : state.parents;
            let nextSpecialists =
              specialistsRes.status === "fulfilled" &&
              Array.isArray(specialistsRes.value)
                ? specialistsRes.value
                : state.specialists;
            const nextServices =
              servicesRes.status === "fulfilled" &&
              Array.isArray(servicesRes.value)
                ? servicesRes.value
                : state.services;
            const nextPayments =
              paymentsRes.status === "fulfilled" &&
              Array.isArray(paymentsRes.value)
                ? paymentsRes.value
                : state.payments;
            const nextTransactions =
              transactionsRes.status === "fulfilled" &&
              Array.isArray(transactionsRes.value)
                ? transactionsRes.value
                : state.transactions;
            const nextNotifications =
              notificationsRes.status === "fulfilled" &&
              Array.isArray(notificationsRes.value)
                ? notificationsRes.value
                : state.notifications;
            const nextLogs =
              activityLogsRes.status === "fulfilled" &&
              Array.isArray(activityLogsRes.value)
                ? activityLogsRes.value
                : state.activityLogs;
            const nextAdmins =
              adminsRes.status === "fulfilled" && Array.isArray(adminsRes.value)
                ? adminsRes.value
                : state.admins;
            const nextEmployees =
              employeesRes.status === "fulfilled" &&
              Array.isArray(employeesRes.value)
                ? employeesRes.value
                : state.employees;
            const nextAssessments =
              assessmentsRes.status === "fulfilled" &&
              Array.isArray(assessmentsRes.value)
                ? assessmentsRes.value
                : state.assessments;
            const nextProgress =
              progressRes.status === "fulfilled" &&
              Array.isArray(progressRes.value)
                ? progressRes.value
                : state.progressNotes;

            const nextAppointments =
              appointmentsRes.status === "fulfilled" &&
              Array.isArray(appointmentsRes.value)
                ? appointmentsRes.value
                : state.appointments;

            // Ensure any child or specialist embedded in appointments is registered in local lookup maps
            const existingChildIds = new Set(nextChildren.map((c) => c.id));
            const extraChildren: Child[] = [];
            const existingSpecIds = new Set(nextSpecialists.map((s) => s.id));
            const extraSpecialists: Specialist[] = [];

            nextAppointments.forEach((apt) => {
              if (
                apt.childId &&
                !existingChildIds.has(apt.childId) &&
                apt.child
              ) {
                extraChildren.push({
                  id: apt.childId,
                  fullName: apt.child.fullName || apt.childName || "Bola",
                  firstName: apt.child.firstName,
                  lastName: apt.child.lastName,
                  dateOfBirth: apt.child.dateOfBirth || "2020-01-01",
                  gender: apt.child.gender || "MALE",
                  parentId: apt.parentId || apt.child.parentId || "",
                  status: "ACTIVE",
                  createdAt: apt.createdAt || new Date().toISOString(),
                } as Child);
                existingChildIds.add(apt.childId);
              }
              if (
                apt.specialistId &&
                !existingSpecIds.has(apt.specialistId) &&
                apt.specialist
              ) {
                extraSpecialists.push({
                  id: apt.specialistId,
                  fullName:
                    apt.specialist.fullName ||
                    apt.specialistName ||
                    "Mutaxassis",
                  specialization: apt.specialist.specialization || "Mutaxassis",
                  phone: apt.specialist.phone || "+998901234567",
                  role: "SPECIALIST",
                  status: "ACTIVE",
                  workingDays: [1, 2, 3, 4, 5, 6, 7],
                  workingHours: { start: "09:00", end: "18:00" },
                  createdAt: apt.createdAt || new Date().toISOString(),
                } as Specialist);
                existingSpecIds.add(apt.specialistId);
              }
            });

            if (extraChildren.length > 0)
              nextChildren = [...nextChildren, ...extraChildren];
            if (extraSpecialists.length > 0)
              nextSpecialists = [...nextSpecialists, ...extraSpecialists];

            const nextSettings =
              settingsRes.status === "fulfilled" && settingsRes.value
                ? {
                    clinicName:
                      settingsRes.value.centerName ||
                      state.clinicSettings.clinicName,
                    phone:
                      settingsRes.value.phone || state.clinicSettings.phone,
                    address:
                      settingsRes.value.address || state.clinicSettings.address,
                    workStart:
                      settingsRes.value.workingHours?.start ||
                      state.clinicSettings.workStart,
                    workEnd:
                      settingsRes.value.workingHours?.end ||
                      state.clinicSettings.workEnd,
                  }
                : state.clinicSettings;

            return {
              children: nextChildren,
              parents: nextParents,
              specialists: nextSpecialists,
              services: nextServices,
              appointments: nextAppointments,
              sessions: state.sessions,
              attendance:
                attendanceRes.status === "fulfilled"
                  ? attendanceRes.value
                  : state.attendance,
              parentAccounts:
                accountsRes.status === "fulfilled" ? accountsRes.value : {},
              accountsError:
                accountsRes.status === "rejected"
                  ? "Oila balansini serverdan tekshirib bo‘lmadi. Qayta yuklang."
                  : null,
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
          console.warn("[Store] fetchInitialData error:", err);
          set({
            isLoadingData: false,
            dataError: err?.message || "Ma’lumotlarni yuklashda xatolik",
          });
        }
      },

      // ── UI ──────────────────────────────────────────────
      sidebarCollapsed: false,
      toasts: [],

      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      addToast: (toast) => {
        const id = generateId();
        set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
        const duration = toast.duration ?? 4000;
        setTimeout(() => get().removeToast(id), duration);
      },

      removeToast: (id) => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      },

      // ── Children Actions ─────────────────────────────────
      // ── Children Actions ─────────────────────────────────
      createChild: async (data) => {
        if (!["SUPER_ADMIN", "ADMIN"].includes(get().currentUser?.role || ""))
          throw new Error("Ruxsat yo‘q");
        try {
          const names = (data.fullName || "").trim().split(" ");
          const created = await api.children.create({
            firstName: names[0] || "Bola",
            lastName: names.slice(1).join(" ") || "",
            birthDate: data.dateOfBirth || "2020-01-01",
            gender: data.gender,
            address: data.address,
            notes: data.notes,
          });

          if (!created?.id || created.id === "undefined")
            throw new Error("Bola serverda tasdiqlanmadi");
          const child: Child = { ...created };
          if (data.parentId && !created.parentId) {
            try {
              await api.children.linkParent(created.id, data.parentId, {
                relationship: "Ota/Ona",
                isPrimary: true,
              });
              child.parentId = data.parentId;
            } catch {
              get().addToast({
                type: "warning",
                title: "Bola yaratildi, ota-ona biriktirilmadi",
                description:
                  "Qayta bola yaratmang. Bola kartasini tahrirlab ota-onani biriktiring.",
                duration: 12000,
              });
            }
          }

          set((s) => ({
            children: [child, ...s.children.filter((c) => c.id !== child.id)],
            parents: s.parents.map((p) =>
              p.id === child.parentId && !p.childrenIds.includes(child.id)
                ? { ...p, childrenIds: [...p.childrenIds, child.id] }
                : p,
            ),
          }));

          get().addActivityLog({
            actorId: get().currentUser?.id ?? "system",
            actorName: get().currentUser?.fullName ?? "Sistema",
            actorRole: (get().currentUser as BaseUser)?.role ?? "ADMIN",
            action: "CREATE",
            entity: "child",
            entityId: child.id,
            description: `Yangi bola qo'shildi: ${child.fullName}`,
          });
          get().addToast({
            type: "success",
            title: "Bola qo'shildi",
            description: `${child.fullName} muvaffaqiyatli qo'shildi`,
          });
          return child;
        } catch (err: any) {
          console.error("[Store] createChild error:", err);
          throw err;
        }
      },

      updateChild: async (id, data) => {
        if (!["SUPER_ADMIN", "ADMIN"].includes(get().currentUser?.role || ""))
          throw new Error("Ruxsat yo‘q");
        try {
          const previous = get().children.find((c) => c.id === id);
          if (data.status !== undefined) {
            if (data.status === "ACTIVE") await api.children.restore(id);
            else if (data.status === "ARCHIVED") await api.children.archive(id);
            else throw new Error("Bu holatni server qo‘llamaydi");
            if (Object.keys(data).length === 1) {
              set((state) => ({
                children: state.children.map((c) =>
                  c.id === id ? { ...c, status: data.status! } : c,
                ),
              }));
              return;
            }
          }
          if (data.parentId && data.parentId !== previous?.parentId) {
            if (previous?.parentId)
              throw new Error(
                "Ota-onani almashtirish serverda moliyaviy tarix bilan tekshirilishi kerak",
              );
            await api.children.linkParent(id, data.parentId, {
              relationship: "Ota/Ona",
              isPrimary: true,
            });
          }
          const names = data.fullName
            ? data.fullName.trim().split(" ")
            : undefined;
          await api.children.update(id, {
            firstName: names ? names[0] : undefined,
            lastName: names ? names.slice(1).join(" ") : undefined,
            birthDate: data.dateOfBirth,
            gender: data.gender,
            address: data.address,
            notes: data.notes,
          });
          set((s) => ({
            children: s.children.map((c) =>
              c.id === id ? { ...c, ...data } : c,
            ),
          }));
          get().addToast({
            type: "success",
            title: "Yangilandi",
            description: "Bola ma'lumotlari yangilandi",
          });
        } catch (err: any) {
          console.error("[Store] updateChild error:", err);
          get().addToast({
            type: "error",
            title: "Xatolik",
            description:
              err?.message || "Bola ma'lumotlarini yangilab bo'lmadi",
          });
          throw err;
        }
      },

      archiveChild: async (id) => {
        try {
          await api.children.archive(id);
          set((s) => ({
            children: s.children.map((c) =>
              c.id === id ? { ...c, status: "ARCHIVED" } : c,
            ),
          }));
          get().addToast({
            type: "info",
            title: "Arxivlandi",
            description: "Bola arxivga o'tkazildi",
          });
        } catch (err: any) {
          console.error("[Store] archiveChild error:", err);
          get().addToast({
            type: "error",
            title: "Xatolik",
            description: err?.message || "Arxivlab bo'lmadi",
          });
          throw err;
        }
      },

      deleteChild: async (id) => {
        try {
          const child = get().children.find((c) => c.id === id);
          await api.children.delete(id);
          set((s) => ({ children: s.children.filter((c) => c.id !== id) }));
          get().addToast({
            type: "success",
            title: "Bola o'chirildi",
            description: child
              ? `${child.fullName} tizimdan olib tashlandi`
              : undefined,
          });
        } catch (err: any) {
          console.error("[Store] deleteChild error:", err);
          get().addToast({
            type: "error",
            title: "Xatolik",
            description: err?.message || "O'chirib bo'lmadi",
          });
          throw err;
        }
      },

      // ── Parents Actions ──────────────────────────────────
      createParent: async (data, password) => {
        try {
          const created = await api.parents.create({
            fullName: data.fullName,
            phone: data.phone,
            password: password || "Password123!",
            address: data.address,
          });

          if (!created?.id || created.id === "undefined")
            throw new Error("Server yozuvni tasdiqlamadi");
          const parent: Parent = created;

          set((s) => ({
            parents: [parent, ...s.parents.filter((p) => p.id !== parent.id)],
          }));
          get().addToast({
            type: "success",
            title: "Qo'shildi",
            description: `${parent.fullName} tizimga qo'shildi`,
          });
          return parent;
        } catch (err: any) {
          console.error("[Store] createParent error:", err);
          throw err;
        }
      },

      updateParent: async (id, data) => {
        const prev = get().parents.find((p) => p.id === id);
        try {
          // If status is being updated
          if (data.status !== undefined) {
            if (data.status === "ACTIVE") {
              if (prev?.status === "ARCHIVED") {
                try {
                  await api.parents.restore(id);
                } catch {
                  await api.parents.activate(id);
                }
              } else {
                await api.parents.activate(id);
              }
            } else if (data.status === "INACTIVE") {
              await api.parents.deactivate(id);
            } else if (data.status === "ARCHIVED") {
              await api.parents.archive(id);
            }
          }

          // Profile update — supports fullName, phone, address (NOT status in body)
          const patchPayload: {
            fullName?: string;
            phone?: string;
            address?: string;
          } = {};
          if (data.fullName !== undefined)
            patchPayload.fullName = data.fullName;
          if (data.phone !== undefined) patchPayload.phone = data.phone;
          if (data.address !== undefined) patchPayload.address = data.address;

          let updatedParent: Parent | undefined;
          if (Object.keys(patchPayload).length > 0) {
            updatedParent = await api.parents.update(id, patchPayload);
          }

          set((s) => ({
            parents: s.parents.map((p) =>
              p.id === id ? { ...p, ...(updatedParent || {}), ...data } : p,
            ),
          }));
          get().addToast({
            type: "success",
            title:
              data.status && Object.keys(data).length === 1
                ? data.status === "ACTIVE"
                  ? prev?.status === "ARCHIVED"
                    ? "Arxivdan qaytarildi"
                    : "Faollashtirildi"
                  : "Nofaol qilindi"
                : "Ota-ona ma'lumotlari yangilandi",
          });
          return;
        } catch (err: any) {
          console.error("[Store] updateParent error:", err);
          if (prev) {
            set((s) => ({
              parents: s.parents.map((p) => (p.id === id ? prev : p)),
            }));
          }
          const friendlyMsg =
            err?.message?.includes("property") ||
            err?.message?.includes("should not exist")
              ? "Ota-ona ma'lumotlarini yangilab bo'lmadi. Qayta urinib ko'ring."
              : err?.message || "Yangilab bo'lmadi";
          get().addToast({
            type: "error",
            title: "Xatolik",
            description: friendlyMsg,
          });
          throw err;
        }
      },

      deleteParent: async (id) => {
        try {
          const parent = get().parents.find((p) => p.id === id);
          // Archive is the safe semantic — preserves children, balances, history
          await api.parents.archive(id);
          set((s) => ({
            parents: s.parents.map((p) =>
              p.id === id ? { ...p, status: "ARCHIVED" } : p,
            ),
          }));
          get().addToast({
            type: "info",
            title: "Ota-ona arxivlandi",
            description: parent
              ? `${parent.fullName} arxivga o'tkazildi`
              : undefined,
          });
        } catch (err: any) {
          console.error("[Store] deleteParent error:", err);
          get().addToast({
            type: "error",
            title: "Xatolik",
            description: err?.message || "Arxivlab bo'lmadi",
          });
          throw err;
        }
      },

      // ── Specialist Actions ───────────────────────────────
      createSpecialist: async (data, password) => {
        try {
          const created = await api.specialists.create({
            fullName: data.fullName,
            phone: data.phone,
            password: password || "Password123!",
            specialization: data.specialization,
            experienceYears: data.experience || 3,
            bio: data.bio || undefined,
          });

          if (!created?.id || created.id === "undefined")
            throw new Error("Server yozuvni tasdiqlamadi");
          const spec: Specialist = created;

          set((s) => ({
            specialists: [
              spec,
              ...s.specialists.filter((sp) => sp.id !== spec.id),
            ],
          }));
          get().addToast({ type: "success", title: "Mutaxassis qo'shildi" });
          return spec;
        } catch (err: any) {
          console.error("[Store] createSpecialist error:", err);
          throw err;
        }
      },

      updateSpecialist: async (id, data) => {
        // Preserve previous state for rollback on failure
        const prev = get().specialists.find((s) => s.id === id);
        try {
          // Status changes use dedicated endpoints, NOT the update payload
          if (data.status !== undefined && Object.keys(data).length === 1) {
            if (data.status === "ACTIVE") {
              if (prev?.status === "ARCHIVED") {
                try {
                  await api.specialists.restore(id);
                } catch {
                  await api.specialists.activate(id);
                }
              } else {
                await api.specialists.activate(id);
              }
            } else if (data.status === "INACTIVE") {
              await api.specialists.deactivate(id);
            } else if (data.status === "ARCHIVED") {
              await api.specialists.archive(id);
            }
            set((s) => ({
              specialists: s.specialists.map((sp) =>
                sp.id === id ? { ...sp, status: data.status! } : sp,
              ),
            }));
            get().addToast({
              type: "success",
              title:
                data.status === "ACTIVE"
                  ? prev?.status === "ARCHIVED"
                    ? "Arxivdan qaytarildi"
                    : "Faollashtirildi"
                  : "Nofaol qilindi",
            });
            return;
          }

          // Profile field updates (no status in payload)
          const dto: any = {};
          if (data.fullName !== undefined) dto.fullName = data.fullName;
          if (data.phone !== undefined) dto.phone = data.phone;
          if (data.specialization !== undefined)
            dto.specialization = data.specialization;
          if (data.experience !== undefined)
            dto.experienceYears = data.experience;
          if (data.bio !== undefined) dto.bio = data.bio;
          if (data.workingDays !== undefined)
            dto.workingDays = data.workingDays;
          if (data.workingHours !== undefined)
            dto.workingHours = data.workingHours;

          await api.specialists.update(id, dto);
          set((s) => ({
            specialists: s.specialists.map((sp) =>
              sp.id === id ? { ...sp, ...data } : sp,
            ),
          }));
          get().addToast({
            type: "success",
            title: "Mutaxassis ma'lumotlari yangilandi",
          });
        } catch (err: any) {
          console.error("[Store] updateSpecialist error:", err);
          // Rollback optimistic UI
          if (prev) {
            set((s) => ({
              specialists: s.specialists.map((sp) =>
                sp.id === id ? prev : sp,
              ),
            }));
          }
          const friendlyMsg =
            err?.message?.includes("property") ||
            err?.message?.includes("should not exist")
              ? "Mutaxassis ma'lumotlarini yangilab bo'lmadi. Qayta urinib ko'ring."
              : err?.message || "Yangilab bo'lmadi";
          get().addToast({
            type: "error",
            title: "Xatolik",
            description: friendlyMsg,
          });
          throw err;
        }
      },

      deleteSpecialist: async (id) => {
        try {
          const spec = get().specialists.find((s) => s.id === id);
          await api.specialists.archive(id);
          set((s) => ({
            specialists: s.specialists.map((sp) =>
              sp.id === id ? { ...sp, status: "ARCHIVED" } : sp,
            ),
          }));
          get().addToast({
            type: "info",
            title: "Mutaxassis arxivlandi",
            description: spec
              ? `${spec.fullName} arxivga o'tkazildi`
              : undefined,
          });
        } catch (err: any) {
          console.error("[Store] deleteSpecialist error:", err);
          get().addToast({
            type: "error",
            title: "Xatolik",
            description: err?.message || "Arxivlab bo'lmadi",
          });
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

          if (!created?.id || created.id === "undefined")
            throw new Error("Server yozuvni tasdiqlamadi");
          const svc: Service = created;

          set((s) => ({
            services: [svc, ...s.services.filter((sv) => sv.id !== svc.id)],
          }));
          get().addToast({ type: "success", title: "Xizmat qo'shildi" });
          return svc;
        } catch (err: any) {
          console.error("[Store] createService error:", err);
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
          set((s) => ({
            services: s.services.map((sv) =>
              sv.id === id ? { ...sv, ...data } : sv,
            ),
          }));
          get().addToast({ type: "success", title: "Xizmat yangilandi" });
        } catch (err: any) {
          console.error("[Store] updateService error:", err);
          get().addToast({
            type: "error",
            title: "Xatolik",
            description: err?.message || "Yangilab bo'lmadi",
          });
          throw err;
        }
      },

      archiveService: async (id) => {
        try {
          await api.services.archive(id);
          set((s) => ({
            services: s.services.map((sv) =>
              sv.id === id ? { ...sv, status: "ARCHIVED" } : sv,
            ),
          }));
          get().addToast({ type: "info", title: "Xizmat arxivlandi" });
        } catch (err: any) {
          console.error("[Store] archiveService error:", err);
          get().addToast({
            type: "error",
            title: "Xatolik",
            description: err?.message || "Arxivlab bo'lmadi",
          });
          throw err;
        }
      },

      restoreService: async (id) => {
        try {
          await api.services.restore(id);
          set((s) => ({
            services: s.services.map((sv) =>
              sv.id === id ? { ...sv, status: "ACTIVE" } : sv,
            ),
          }));
          get().addToast({ type: "success", title: "Xizmat tiklandi" });
        } catch (err: any) {
          console.error("[Store] restoreService error:", err);
          get().addToast({
            type: "error",
            title: "Xatolik",
            description: err?.message || "Qayta tiklab bo'lmadi",
          });
          throw err;
        }
      },

      // ── Appointment Actions ──────────────────────────────
      // Legacy local actions cannot record clinical or financial success.
      createAppointment: () => {
        throw new Error(WORKFLOW_UNAVAILABLE);
      },
      updateAppointment: () => {
        throw new Error(WORKFLOW_UNAVAILABLE);
      },
      confirmAppointment: () => {
        throw new Error(WORKFLOW_UNAVAILABLE);
      },
      startAppointment: () => {
        throw new Error(WORKFLOW_UNAVAILABLE);
      },
      cancelAppointment: () => {
        throw new Error(WORKFLOW_UNAVAILABLE);
      },
      markNoShow: () => {
        throw new Error(WORKFLOW_UNAVAILABLE);
      },
      completeAppointment: () => {
        throw new Error(WORKFLOW_UNAVAILABLE);
      },
      startSession: () => {
        throw new Error(WORKFLOW_UNAVAILABLE);
      },
      completeSession: () => {
        throw new Error(WORKFLOW_UNAVAILABLE);
      },
      removeAttendance: () => {
        throw new Error(WORKFLOW_UNAVAILABLE);
      },
      recordAttendance: async (data) => {
        if (!data.appointmentId || !["PRESENT", "ABSENT"].includes(data.status))
          throw new Error(WORKFLOW_UNAVAILABLE);
        await get().commitReception(
          data.appointmentId,
          data.status as "PRESENT" | "ABSENT",
          data.note || "",
          generateId(),
        );
        return get().attendance.find(
          (a) => a.appointmentId === data.appointmentId,
        )!;
      },
      fetchServiceAssignments: async (childId) => {
        set({ assignmentsLoading: true, assignmentsError: null });
        try {
          const rows = await api.workflow.getAssignments(childId);
          set((s) => ({
            serviceAssignments: [
              ...s.serviceAssignments.filter((a) => a.childId !== childId),
              ...rows,
            ],
          }));
        } catch (error) {
          set({
            assignmentsError:
              error instanceof Error ? error.message : "Xizmatlar yuklanmadi",
          });
        } finally {
          set({ assignmentsLoading: false });
        }
      },
      createServiceAssignment: async (data, key) => {
        const user = get().currentUser;
        if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role))
          throw new Error("Ruxsat yo‘q");
        const item = await api.workflow.createAssignment(data, key);
        if (item.childId !== data.childId || item.serviceId !== data.serviceId)
          throw new Error("Server boshqa xizmatni qaytardi");
        set((s) => ({
          serviceAssignments: [
            ...s.serviceAssignments.filter((a) => a.id !== item.id),
            item,
          ],
        }));
        await get().fetchInitialData();
        return item;
      },
      extendServiceAssignment: async (id, count, key) => {
        if (!["SUPER_ADMIN", "ADMIN"].includes(get().currentUser?.role || ""))
          throw new Error("Ruxsat yo‘q");
        const item = await api.workflow.extendAssignment(id, count, key);
        if (item.id !== id) throw new Error("Server boshqa xizmatni qaytardi");
        set((s) => ({
          serviceAssignments: s.serviceAssignments.map((a) =>
            a.id === id ? item : a,
          ),
        }));
        await get().fetchInitialData();
      },
      saveReception: async (data, key) => {
        if (!["SUPER_ADMIN", "ADMIN"].includes(get().currentUser?.role || ""))
          throw new Error("Ruxsat yo‘q");
        const item = await api.workflow.createAppointment(data, key);
        set((s) => ({
          appointments: [
            ...s.appointments.filter((a) => a.id !== item.id),
            item,
          ],
        }));
      },
      commitReception: async (id, status, note, key) => {
        const actorId = get().currentUser?.id;
        if (!["SUPER_ADMIN", "ADMIN"].includes(get().currentUser?.role || ""))
          throw new Error("Ruxsat yo‘q");
        const appointment = get().appointments.find((a) => a.id === id);
        if (!appointment || !Number.isInteger(appointment.version))
          throw new Error(
            "Qabul versiyasi serverdan tasdiqlanmadi. Qayta yuklang.",
          );
        const result = await api.workflow.commitAttendance(id, {
          status,
          note,
          expectedVersion: appointment.version!,
          idempotencyKey: key,
        });
        if (get().currentUser?.id !== actorId)
          throw new Error(
            "Sessiya o‘zgardi. Natijani qayta yuklab tekshiring.",
          );
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? result.appointment : a,
          ),
          attendance: [
            ...s.attendance.filter((a) => a.appointmentId !== id),
            result.attendance,
          ],
          serviceAssignments: [
            ...s.serviceAssignments.filter(
              (a) => a.id !== result.assignment.id,
            ),
            result.assignment,
          ],
          parentAccounts: {
            ...s.parentAccounts,
            [result.parentAccount.parentId]: result.parentAccount,
          },
        }));
        // The journal is read back from the server, never manufactured locally.
        try {
          const transactions = await api.finance.getTransactions();
          if (get().currentUser?.id === actorId) set({ transactions });
        } catch {
          set({
            dataError:
              "Davomat saqlandi. Pul harakatlarini yangilash uchun qayta yuklang.",
          });
        }
      },

      createAssessment: async (data) => {
        try {
          const created = await api.clinical.createAssessment({
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
          set((s) => ({
            assessments: [
              assessment,
              ...s.assessments.filter((item) => item.id !== assessment.id),
            ],
          }));
          get().addToast({ type: "success", title: "Baholash saqlandi" });
          return assessment;
        } catch (err: any) {
          get().addToast({
            type: "error",
            title: "Baholash saqlanmadi",
            description: err?.message,
          });
          throw err;
        }
      },

      // ── Progress Notes ───────────────────────────────────
      createProgressNote: async (data) => {
        try {
          const created = await api.clinical.createProgress({
            childId: data.childId,
            specialistId: data.specialistId,
            title: "Rivojlanish qaydi",
            description: data.note,
          });
          const note: ProgressNote = { ...data, ...created };
          set((s) => ({
            progressNotes: [
              note,
              ...s.progressNotes.filter((item) => item.id !== note.id),
            ],
          }));
          get().addToast({
            type: "success",
            title: "Rivojlanish qaydi saqlandi",
          });
          return note;
        } catch (err: any) {
          get().addToast({
            type: "error",
            title: "Rivojlanish qaydi saqlanmadi",
            description: err?.message,
          });
          throw err;
        }
      },

      // ── Payments ─────────────────────────────────────────
      recordPayment: async (data) => {
        const actorId = get().currentUser?.id;
        if (!["SUPER_ADMIN", "ADMIN"].includes(get().currentUser?.role || ""))
          throw new Error("Ruxsat yo‘q");
        if (
          !data.parentId ||
          !Number.isSafeInteger(data.amount) ||
          data.amount <= 0 ||
          data.amount > 2_000_000_000
        )
          throw new Error("Ota-ona va to‘lov summasini tekshiring");
        if (!api.workflow.familyTopUpEnabled)
          throw new Error(
            "Oila balansini to‘ldirish serverga hali ulanmagan. To‘lov qabul qilingani tasdiqlanmadi.",
          );
        const res: any = await api.workflow.topUp({
          parentId: data.parentId,
          amount: data.amount,
          method: data.method,
          note: data.notes,
          idempotencyKey: data.idempotencyKey || generateId(),
        });
        const body = res?.data || res;
        if (get().currentUser?.id !== actorId)
          throw new Error(
            "Sessiya o‘zgardi. Natijani qayta yuklab tekshiring.",
          );
        if (
          !body?.payment?.id ||
          body.payment.parentId !== data.parentId ||
          Number(body.payment.amount) !== data.amount ||
          body.payment.method !== data.method ||
          !Number.isFinite(
            Date.parse(
              body.payment.paidAt ||
                body.payment.date ||
                body.payment.createdAt,
            ),
          ) ||
          !body.parentAccount ||
          body.parentAccount.parentId !== data.parentId
        )
          throw new Error(
            "To‘lov javobi to‘liq emas. Qayta yuklab tekshiring.",
          );
        const account = body.parentAccount;
        if (
          !Number.isFinite(account.balance) ||
          !Number.isFinite(account.debt) ||
          account.balance < 0 ||
          account.debt < 0 ||
          (account.balance > 0 && account.debt > 0)
        )
          throw new Error("Oila hisobi tasdiqlanmadi");
        const confirmed = normalizePayment(body.payment);
        set((s) => ({
          payments: [
            confirmed,
            ...s.payments.filter((p) => p.id !== confirmed.id),
          ],
          parentAccounts: { ...s.parentAccounts, [account.parentId]: account },
        }));
        try {
          const transactions = await api.finance.getTransactions();
          set({ transactions });
        } catch {
          set({
            dataError: "To‘lov saqlandi. Pul harakatlarini qayta yuklang.",
          });
        }
        return confirmed;
      },

      addNotification: (data) => {
        const notif: Notification = {
          ...data,
          id: generateId(),
          isRead: data.isRead ?? false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          notifications: [notif, ...s.notifications],
        }));
        return notif;
      },

      markNotificationRead: (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n,
          ),
        }));
        api.platform.markNotificationRead(id).catch((err) => {
          console.warn(
            "[Store] Background markNotificationRead sync warning:",
            err,
          );
        });
      },

      markNotificationUnread: (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, isRead: false } : n,
          ),
        }));
      },

      markAllNotificationsRead: (userId, role) => {
        const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
        set((s) => ({
          notifications: s.notifications.map((n) => {
            if (isAdmin || !userId) {
              return { ...n, isRead: true };
            }
            if (n.userId === userId || !n.userId) {
              return { ...n, isRead: true };
            }
            return n;
          }),
        }));
        api.platform.markAllNotificationsRead().catch((err) => {
          console.warn(
            "[Store] Background markAllNotificationsRead sync warning:",
            err,
          );
        });
      },

      // ── Admins ───────────────────────────────────────────
      createAdmin: async (data, password) => {
        try {
          const created = await api.admins.create({
            fullName: data.fullName,
            phone: data.phone,
            role: data.role,
            password: password || "Admin123!",
          });

          if (!created?.id || created.id === "undefined")
            throw new Error("Server yozuvni tasdiqlamadi");
          const admin: AdminUser = created;

          set((s) => ({
            admins: [admin, ...s.admins.filter((a) => a.id !== admin.id)],
          }));
          get().addToast({
            type: "success",
            title: "Administrator qo‘shildi",
            description: `${admin.fullName} tizimga muvaffaqiyatli biriktirildi`,
          });
          return admin;
        } catch (err: any) {
          console.error("[Store] createAdmin error:", err);
          throw err;
        }
      },

      updateAdmin: async (id, data) => {
        const prev = get().admins.find((a) => a.id === id);
        try {
          // Status changes use dedicated endpoints
          if (data.status !== undefined && Object.keys(data).length === 1) {
            if (data.status === "ACTIVE") {
              if (prev?.status === "ARCHIVED") {
                try {
                  await api.admins.restore(id);
                } catch {
                  await api.admins.activate(id);
                }
              } else {
                await api.admins.activate(id);
              }
            } else if (data.status === "INACTIVE") {
              await api.admins.deactivate(id);
            } else if (data.status === "ARCHIVED") {
              await api.admins.archive(id);
            }
            set((s) => ({
              admins: s.admins.map((a) =>
                a.id === id ? { ...a, status: data.status! } : a,
              ),
            }));
            get().addToast({
              type: "success",
              title:
                data.status === "ACTIVE"
                  ? prev?.status === "ARCHIVED"
                    ? "Arxivdan qaytarildi"
                    : "Faollashtirildi"
                  : "Nofaol qilindi",
            });
            return;
          }

          const patchPayload: UpdateAdminDto = {};
          if (data.fullName !== undefined)
            patchPayload.fullName = data.fullName;
          if (data.phone !== undefined) patchPayload.phone = data.phone;
          if (data.role !== undefined) patchPayload.role = data.role;

          let updated: AdminUser | undefined;
          if (Object.keys(patchPayload).length > 0) {
            updated = await api.admins.update(id, patchPayload);
          }

          set((s) => ({
            admins: s.admins.map((a) =>
              a.id === id
                ? { ...a, ...(updated && updated.id ? updated : data) }
                : a,
            ),
          }));
          get().addToast({ type: "success", title: "Admin yangilandi" });
        } catch (err: any) {
          console.error("[Store] updateAdmin error:", err);
          if (prev) {
            set((s) => ({
              admins: s.admins.map((a) => (a.id === id ? prev : a)),
            }));
          }
          get().addToast({
            type: "error",
            title: "Xatolik",
            description:
              err?.message || "Admin ma'lumotlarini yangilab bo'lmadi",
          });
          throw err;
        }
      },

      deleteAdmin: async (id) => {
        try {
          await api.admins.archive(id);
          set((s) => ({ admins: s.admins.filter((a) => a.id !== id) }));
          get().addToast({ type: "success", title: "Admin o'chirildi" });
        } catch (err: any) {
          console.error("[Store] deleteAdmin error:", err);
          get().addToast({
            type: "error",
            title: "Xatolik",
            description: err?.message || "Adminni o'chirib bo'lmadi",
          });
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
            salary: data.salary,
            notes: data.notes,
          });

          if (!created?.id || created.id === "undefined")
            throw new Error("Server yozuvni tasdiqlamadi");
          const emp: Employee = created;

          set((s) => ({
            employees: [emp, ...s.employees.filter((e) => e.id !== emp.id)],
          }));
          get().addToast({ type: "success", title: "Xodim qo'shildi" });
          return emp;
        } catch (err: any) {
          console.error("[Store] createEmployee error:", err);
          throw err;
        }
      },

      updateEmployee: async (id, data) => {
        try {
          await api.employees.update(id, {
            fullName: data.fullName,
            position: data.position,
            phone: data.phone,
            salary: data.salary,
            notes: data.notes,
            status: data.status,
          });
          set((s) => ({
            employees: s.employees.map((e) =>
              e.id === id ? { ...e, ...data } : e,
            ),
          }));
          get().addToast({
            type: "success",
            title: "Xodim ma'lumotlari yangilandi",
          });
        } catch (err: any) {
          console.error("[Store] updateEmployee error:", err);
          get().addToast({
            type: "error",
            title: "Xatolik",
            description:
              err?.message || "Xodim ma'lumotlarini yangilab bo'lmadi",
          });
          throw err;
        }
      },

      // ── Activity Log ──────────────────────────────────────
      addActivityLog: (log) => {
        const entry: ActivityLog = {
          ...log,
          id: generateId(),
          timestamp: new Date().toISOString(),
        };
        set((s) => ({ activityLogs: [entry, ...s.activityLogs] }));
      },

      // ── Clinic Settings & Reset ───────────────────────────
      updateClinicSettings: async (settings) => {
        try {
          await api.platform.updateSettings({
            centerName: settings.clinicName,
            phone: settings.phone,
            address: settings.address,
            workingHours:
              settings.workStart || settings.workEnd
                ? {
                    start: settings.workStart ?? get().clinicSettings.workStart,
                    end: settings.workEnd ?? get().clinicSettings.workEnd,
                  }
                : undefined,
          });
          set((s) => ({
            clinicSettings: { ...s.clinicSettings, ...settings },
          }));
          get().addToast({
            type: "success",
            title: "Sozlamalar saqlandi",
            description: "Markaz ma’lumotlari yangilandi",
          });
        } catch (err: any) {
          get().addToast({
            type: "error",
            title: "Sozlamalar saqlanmadi",
            description: err?.message,
          });
          throw err;
        }
      },

      resetStore: () => {
        try {
          localStorage.removeItem("massaj-crm-store");
          localStorage.removeItem("access_token");
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
          serviceAssignments: [],
          parentAccounts: {},
          accountsError: null,
          assignmentsError: null,
          sessions: [],
          attendance: [],
          progressNotes: [],
          payments: [],
          notifications: [],
          activityLogs: [],
          clinicSettings: {
            clinicName: "Bolalar Massaj & Reabilitatsiya Markazi",
            phone: "",
            address: "",
            workStart: "08:00",
            workEnd: "18:00",
          },
          isLoadingData: false,
          isInitialized: false,
          dataError: null,
        });
        get().addToast({
          type: "info",
          title: "Tizim tozalandi",
          description: "Barcha sessiyalar bekor qilindi",
        });
      },

      resetToSeedData: () => {
        throw new Error("Demo ma’lumotlar ilovaga yuklanmaydi");
      },
    }),
    {
      name: "massaj-crm-live-storage-v1",
      onRehydrateStorage: () => (state) => {
        // Clear any old mock demo data lingering in legacy keys
        if (typeof window !== "undefined") {
          try {
            const legacy = localStorage.getItem("massaj-crm-store");
            if (
              legacy &&
              (legacy.includes("201.7") ||
                legacy.includes("superadmin@demo.com"))
            ) {
              localStorage.removeItem("massaj-crm-store");
            }
          } catch {}
        }
        if (state) {
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
    },
  ),
);

// Convenience selectors (Shallow memoized to prevent render cascading)
export const useAuth = () => {
  return useStore(
    useShallow((s) => ({
      currentUser: s.currentUser,
      isAuthenticated: s.isAuthenticated,
      login: s.login,
      logout: s.logout,
      updateCurrentUser: s.updateCurrentUser,
    })),
  );
};

export const useToasts = () => {
  return useStore(
    useShallow((s) => ({
      toasts: s.toasts,
      addToast: s.addToast,
      removeToast: s.removeToast,
    })),
  );
};

export const useSidebar = () => {
  return useStore(
    useShallow((s) => ({
      collapsed: s.sidebarCollapsed,
      toggle: s.toggleSidebar,
      set: s.setSidebarCollapsed,
    })),
  );
};

// Helper (used inside store without import cycle)
