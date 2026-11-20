// ═══════════════════════════════════════════════════════
//  Backend API DTO & Payload Types (Synchronized with Swagger)
// ═══════════════════════════════════════════════════════

export interface LoginDto {
  phone: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    phone: string;
    fullName?: string;
    role: 'SUPER_ADMIN' | 'ADMIN' | 'SPECIALIST' | 'PARENT';
    status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  };
}

export interface RefreshDto {
  refreshToken: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface CreateParentDto {
  fullName: string;
  phone: string;
  password: string;
  address?: string;
}

export interface UpdateParentDto {
  fullName?: string;
  phone?: string;
  address?: string;
}

export interface CreateSpecialistDto {
  fullName: string;
  phone: string;
  password: string;
  specialization: string;
  experienceYears: number;
  bio?: string;
}

export interface UpdateSpecialistDto {
  fullName?: string;
  phone?: string;
  specialization?: string;
  experienceYears?: number;
  bio?: string;
  workingDays?: number[];
  workingHours?: { start: string; end: string };
}

export interface CreateAdminDto {
  fullName: string;
  phone: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  password?: string;
}

export interface UpdateAdminDto {
  fullName?: string;
  phone?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN';
}

export interface CreateEmployeeDto {
  fullName: string;
  position: string;
  phone: string;
  salary?: number;
  notes?: string;
}

export interface UpdateEmployeeDto {
  fullName?: string;
  position?: string;
  phone?: string;
  status?: string;
  salary?: number;
  notes?: string;
}

export interface SetStatusDto {
  status: 'ACTIVE' | 'INACTIVE';
}

export interface CreateChildDto {
  firstName: string;
  lastName: string;
  birthDate: string; // YYYY-MM-DD
  gender: 'MALE' | 'FEMALE';
  address?: string;
  notes?: string;
}

export interface UpdateChildDto {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: 'MALE' | 'FEMALE';
  address?: string;
  notes?: string;
}

export interface LinkParentDto {
  relationship: string;
  isPrimary?: boolean;
}

export interface CreateServiceDto {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  durationMinutes?: number;
  price?: number;
}

export interface RecordPaymentDto {
  parentId: string;
  childId?: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'TRANSFER' | 'PAYME' | 'CLICK' | 'UZUM';
  note?: string;
  paidAt?: string;
  idempotencyKey?: string;
}

export interface RefundDto {
  amount: number;
  note?: string;
  idempotencyKey?: string;
}

export interface CreateAttendanceDto {
  childId: string;
  specialistId?: string;
  date?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'NO_SHOW';
  note?: string;
}

export interface UpdateAttendanceDto {
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'NO_SHOW';
  note?: string;
}

export interface CreateAssessmentDto {
  childId: string;
  specialistId?: string;
  movement?: number;
  coordination?: number;
  flexibility?: number;
  activityTolerance?: number;
  sessionResponse?: number;
  professionalObservation: string;
  assessedAt?: string;
}

export interface UpdateAssessmentDto {
  movement?: number;
  coordination?: number;
  flexibility?: number;
  activityTolerance?: number;
  sessionResponse?: number;
  professionalObservation?: string;
  assessedAt?: string;
}

export interface CreateProgressDto {
  childId: string;
  specialistId?: string;
  title: string;
  description: string;
  occurredAt?: string;
}

export interface UpdateProgressDto {
  title?: string;
  description?: string;
  occurredAt?: string;
}

export interface CreateAnnouncementDto {
  title: string;
  message: string;
  audience: 'ALL_PARENTS' | 'SPECIFIC_PARENTS';
  recipientUserIds?: string[];
  sendInApp?: boolean;
  sendSms?: boolean;
  scheduledAt?: string;
}

export interface PublishAnnouncementDto {
  recipientUserIds?: string[];
}

export interface RecordConsentDto {
  parentId?: string;
  type: 'TREATMENT' | 'PHOTO_VIDEO' | 'DATA_PROCESSING';
  granted: boolean;
}

export interface UpdateConsentDto {
  granted: boolean;
}

export interface CreateDocumentDto {
  parentId?: string;
  name: string;
  fileKey: string;
  mimeType: string;
  size: number;
  type: string;
}

export interface UpdateSettingsDto {
  centerName?: string;
  logoUrl?: string;
  phone?: string;
  address?: string;
  workingHours?: Record<string, any>;
  notificationSettings?: Record<string, any>;
}

export interface UpdateNotificationPreferencesDto {
  appointmentInApp?: boolean;
  appointmentSms?: boolean;
  paymentInApp?: boolean;
  paymentSms?: boolean;
  debtInApp?: boolean;
  debtSms?: boolean;
  sessionInApp?: boolean;
  sessionSms?: boolean;
  assessmentInApp?: boolean;
  progressInApp?: boolean;
  announcementInApp?: boolean;
  announcementSms?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateAppointmentDto {
  childId: string;
  parentId?: string;
  specialistId: string;
  serviceId: string;
  date: string;
  startTime: string;
  endTime: string;
  status?: string;
  notes?: string;
}

export interface UpdateAppointmentDto {
  childId?: string;
  parentId?: string;
  specialistId?: string;
  serviceId?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  notes?: string;
}
