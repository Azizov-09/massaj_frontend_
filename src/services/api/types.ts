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

export interface UpdateAdminDto {
  fullName?: string;
  phone?: string;
  role?: 'SUPER_ADMIN' | 'ADMIN';
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

export interface CreateProgressDto {
  childId: string;
  specialistId?: string;
  title: string;
  description: string;
  occurredAt?: string;
}

export interface UpdateSettingsDto {
  centerName?: string;
  logoUrl?: string;
  phone?: string;
  address?: string;
  workingHours?: Record<string, any>;
  notificationSettings?: Record<string, any>;
}
