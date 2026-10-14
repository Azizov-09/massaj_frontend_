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
    email?: string;
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
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
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
  email?: string;
  specialization?: string;
  experienceYears?: number;
  bio?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export interface CreateAdminDto {
  fullName: string;
  phone: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  password?: string;
  email?: string;
}

export interface UpdateAdminDto {
  fullName?: string;
  phone?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN';
  email?: string;
  status?: string;
}

export interface CreateEmployeeDto {
  fullName: string;
  position: string;
  phone: string;
  email?: string;
  salary?: number;
  notes?: string;
}

export interface UpdateEmployeeDto {
  fullName?: string;
  position?: string;
  phone?: string;
  email?: string;
  status?: string;
  salary?: number;
  notes?: string;
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
  method: 'CASH' | 'CARD' | 'TRANSFER';
  note?: string;
  paidAt?: string;
  idempotencyKey?: string;
}

export interface RefundDto {
  amount: number;
  note?: string;
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
}

export interface UpdateAssessmentDto {
  movement?: number;
  coordination?: number;
  flexibility?: number;
  activityTolerance?: number;
  sessionResponse?: number;
  professionalObservation?: string;
}

export interface CreateProgressDto {
  childId: string;
  specialistId?: string;
  title: string;
  description: string;
}

export interface UpdateProgressDto {
  title?: string;
  description?: string;
}

export interface CreateGoalDto {
  childId: string;
  specialistId?: string;
  title: string;
  description?: string;
  targetDate?: string;
  progress?: number;
}

export interface UpdateGoalDto {
  title?: string;
  description?: string;
  targetDate?: string;
  progress?: number;
  status?: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
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
