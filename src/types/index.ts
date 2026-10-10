// ═══════════════════════════════════════════════════════
//  MASSAJ CRM — Core Domain Types
//  Children's Massage & Rehabilitation Center
// ═══════════════════════════════════════════════════════

// ─── Shared Enums ───────────────────────────────────────

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SPECIALIST' | 'PARENT';

export type EntityStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type Gender = 'MALE' | 'FEMALE';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type SessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'NO_SHOW';

export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED';

export type TransactionType =
  | 'PAYMENT'
  | 'SESSION_CHARGE'
  | 'REFUND'
  | 'ADJUSTMENT'
  | 'EXPENSE';

export type TransactionDirection = 'IN' | 'OUT';

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER';

// ─── User / Auth ─────────────────────────────────────────

export interface BaseUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  status: EntityStatus;
  avatar?: string;
  createdAt: string;
}

export interface AdminUser extends BaseUser {
  role: 'SUPER_ADMIN' | 'ADMIN';
  lastLogin?: string;
}

export interface Employee {
  id: string;
  fullName: string;
  position: string;
  phone: string;
  email?: string;
  status: EntityStatus;
  joinedAt: string;
  avatar?: string;
  salary?: number;
  notes?: string;
}

// ─── Specialist ───────────────────────────────────────────

export interface WorkingHours {
  start: string; // "HH:mm"
  end: string;
}

export interface Specialist extends BaseUser {
  role: 'SPECIALIST';
  specialization: string;
  experience: number; // years
  workingDays: number[]; // 0=Sunday, 1=Monday, ...
  workingHours: WorkingHours;
  bio: string;
  rating?: number;
}

// ─── Parent ───────────────────────────────────────────────

export interface Parent extends BaseUser {
  role: 'PARENT';
  childrenIds: string[];
  address?: string;
  email: string;
  notes?: string;
}

// ─── Child ────────────────────────────────────────────────

export interface Child {
  id: string;
  fullName: string;
  dateOfBirth: string; // ISO date
  gender: Gender;
  parentId: string;
  assignedSpecialistId?: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  status: EntityStatus;
  notes?: string;
  createdAt: string;
  avatar?: string;
  diagnosis?: string; // Non-diagnostic; just admin notes
  allergies?: string;
}

// ─── Service ─────────────────────────────────────────────

export interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number; // UZS
  status: EntityStatus;
  createdAt: string;
  color?: string; // For calendar display
  category?: string;
  ageMin?: number;
  ageMax?: number;
}

// ─── Appointment ─────────────────────────────────────────

export interface Appointment {
  id: string;
  childId: string;
  parentId: string;
  specialistId: string;
  serviceId: string;
  date: string; // ISO date
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ─── Session ──────────────────────────────────────────────

export interface Session {
  id: string;
  appointmentId: string;
  childId: string;
  specialistId: string;
  serviceId: string;
  startTime: string; // ISO datetime
  endTime?: string; // ISO datetime
  status: SessionStatus;
  note?: string;
  observation?: string;
  recommendation?: string;
  createdAt: string;
}

// ─── Attendance ───────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  childId: string;
  appointmentId?: string;
  specialistId: string;
  date: string; // ISO date
  status: AttendanceStatus;
  note?: string;
  createdAt: string;
}

// ─── Assessment ───────────────────────────────────────────

export interface AssessmentScores {
  movement: number; // 1-5 scale
  coordination: number;
  flexibility: number;
  activityTolerance: number;
  sessionResponse: number;
}

export interface Assessment {
  id: string;
  childId: string;
  specialistId: string;
  sessionId?: string;
  scores: AssessmentScores;
  professionalObservation: string;
  date: string;
  createdAt: string;
}

// ─── Progress ─────────────────────────────────────────────

export interface ProgressNote {
  id: string;
  childId: string;
  specialistId: string;
  sessionId?: string;
  note: string;
  date: string;
  createdAt: string;
}

// ─── Goals ────────────────────────────────────────────────

export interface Goal {
  id: string;
  childId: string;
  title: string;
  description: string;
  createdAt: string;
  targetDate: string;
  status: GoalStatus;
  progress: number; // 0-100
  specialistNote?: string;
}

// ─── Finance ──────────────────────────────────────────────

export interface Transaction {
  id: string;
  type: TransactionType;
  direction: TransactionDirection;
  amount: number; // UZS
  childId?: string;
  parentId?: string;
  sessionId?: string;
  appointmentId?: string;
  paymentId?: string;
  description: string;
  date: string; // ISO datetime
  createdAt: string;
  createdBy: string; // userId
}

export interface Payment {
  id: string;
  parentId: string;
  childId?: string;
  amount: number; // UZS
  method: PaymentMethod;
  date: string;
  notes?: string;
  transactionId: string;
  createdBy: string;
  createdAt: string;
}

// ─── Notifications ───────────────────────────────────────

export type NotificationType =
  | 'appointment'
  | 'payment'
  | 'debt'
  | 'schedule'
  | 'session'
  | 'assessment'
  | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntity?: {
    type: 'appointment' | 'child' | 'session' | 'payment' | 'specialist';
    id: string;
  };
  createdAt: string;
}

// ─── Activity Logs ────────────────────────────────────────

export type ActivityAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ARCHIVE'
  | 'RESTORE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'COMPLETE'
  | 'CANCEL'
  | 'PAYMENT';

export type ActivityEntity =
  | 'child'
  | 'parent'
  | 'specialist'
  | 'admin'
  | 'employee'
  | 'appointment'
  | 'session'
  | 'payment'
  | 'service'
  | 'assessment'
  | 'goal'
  | 'user';

export interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: ActivityAction;
  entity: ActivityEntity;
  entityId: string;
  description: string;
  timestamp: string;
}

// ─── Analytics / Derived Types ────────────────────────────

export interface FinancialSummary {
  totalRevenue: number;
  totalDebt: number;
  currentBalance: number;
  todayRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  monthlyDebt: number;
  lastMonthDebt: number;
  recoveredDebt: number;
}

export interface ChildBalance {
  childId: string;
  parentId: string;
  balance: number; // positive = balance available
  debt: number; // positive = owes money
}

export interface DateRange {
  from: Date;
  to: Date;
}

export type DateFilterPreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'thisWeek'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'custom';

// ─── Repository Interfaces ────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface QueryOptions {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, string | string[] | boolean | null | undefined>;
}

// ─── Form Types ────────────────────────────────────────────

export interface CreateChildInput {
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  parentId: string;
  assignedSpecialistId?: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  notes?: string;
  diagnosis?: string;
  allergies?: string;
}

export interface CreateParentInput {
  fullName: string;
  phone: string;
  email: string;
  address?: string;
  password: string;
}

export interface CreateAppointmentInput {
  childId: string;
  parentId: string;
  specialistId: string;
  serviceId: string;
  date: string;
  startTime: string;
  notes?: string;
}

export interface CreatePaymentInput {
  parentId: string;
  childId?: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  notes?: string;
}

export interface CompleteSessionInput {
  note: string;
  observation: string;
  recommendation: string;
}

export interface CreateServiceInput {
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
}

// ─── UI State Types ──────────────────────────────────────

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

export interface ModalState {
  isOpen: boolean;
  type?: string;
  data?: unknown;
}

// ─── Settings ─────────────────────────────────────────────

export interface CenterSettings {
  centerName: string;
  address: string;
  phone: string;
  email: string;
  workingDays: number[];
  workingHours: WorkingHours;
  currency: string;
  timezone: string;
  language: string;
}
