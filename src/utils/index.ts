import { useState, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, differenceInYears, parseISO, isValid, isToday, isYesterday, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subMonths } from 'date-fns';
import { uz } from 'date-fns/locale';
import type { DateFilterPreset, DateRange } from '@/types';

// ─── Class Name Utility ───────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency Formatting ──────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} mlrd so'm`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} mln so'm`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)} ming so'm`;
  }
  return `${amount.toLocaleString('uz-UZ')} so'm`;
}

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount);
}

// ─── Safe Date Helper ─────────────────────────────────────

function toValidDate(date: string | Date | undefined | null): Date | null {
  if (!date) return null;
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? d : null;
}

// ─── Date Formatting ─────────────────────────────────────

export function formatDate(date: string | Date | undefined | null): string {
  const d = toValidDate(date);
  if (!d) return '—';
  return format(d, 'dd.MM.yyyy');
}

export function formatDateTime(date: string | Date | undefined | null): string {
  const d = toValidDate(date);
  if (!d) return '—';
  return format(d, 'dd.MM.yyyy HH:mm');
}

export function formatTime(date: string | Date | undefined | null): string {
  const d = toValidDate(date);
  if (!d) return '—';
  return format(d, 'HH:mm');
}

export function formatRelativeTime(date: string | Date | undefined | null): string {
  const d = toValidDate(date);
  if (!d) return '—';
  if (isToday(d)) return formatDistanceToNow(d, { addSuffix: true, locale: uz });
  if (isYesterday(d)) return `Kecha, ${format(d, 'HH:mm')}`;
  return format(d, 'dd.MM.yyyy HH:mm');
}

export function formatDateShort(date: string | Date | undefined | null): string {
  const d = toValidDate(date);
  if (!d) return '—';
  return format(d, 'dd MMM', { locale: uz });
}

export function formatDateLong(date: string | Date | undefined | null): string {
  const d = toValidDate(date);
  if (!d) return '—';
  return format(d, 'd MMMM yyyy', { locale: uz });
}

export function calculateAge(dateOfBirth: string | undefined | null): number {
  const d = toValidDate(dateOfBirth);
  if (!d) return 0;
  return differenceInYears(new Date(), d);
}

export function formatAge(dateOfBirth: string | undefined | null): string {
  if (!dateOfBirth) return '—';
  const age = calculateAge(dateOfBirth);
  if (age === 0) return 'Chaqaloq';
  if (age === 1) return '1 yosh';
  return `${age} yosh`;
}

// ─── Date Range Utilities ─────────────────────────────────

export function getDateRange(preset: DateFilterPreset): DateRange {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) };
    case 'yesterday': {
      const y = subDays(now, 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case 'last7days':
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case 'thisWeek':
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'thisMonth':
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case 'lastMonth': {
      const lm = subMonths(now, 1);
      return { from: startOfMonth(lm), to: endOfMonth(lm) };
    }
    case 'thisYear':
      return { from: startOfYear(now), to: endOfYear(now) };
    default:
      return { from: startOfDay(now), to: endOfDay(now) };
  }
}

export function isWithinRange(date: string | Date, range: DateRange): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return d >= range.from && d <= range.to;
}

// ─── String Utilities ─────────────────────────────────────

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');
}

/**
 * Formats a phone input string into standard +998 (XX) XXX-XX-XX mask.
 */
export function formatUzbekPhoneInput(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }
  digits = digits.slice(0, 9);
  if (digits.length === 0) return '';

  let formatted = '+998';
  if (digits.length > 0) {
    formatted += ` (${digits.slice(0, 2)}`;
  }
  if (digits.length >= 2) {
    formatted += `) `;
  }
  if (digits.length > 2) {
    formatted += digits.slice(2, 5);
  }
  if (digits.length > 5) {
    formatted += `-${digits.slice(5, 7)}`;
  }
  if (digits.length > 7) {
    formatted += `-${digits.slice(7, 9)}`;
  }

  return formatted;
}

// ─── Color Utilities ──────────────────────────────────────

export function getAvatarColor(name: string): string {
  const colors = [
    'bg-brand-100 text-brand-700',
    'bg-sage-100 text-sage-700',
    'bg-gold-100 text-gold-700',
    'bg-warm-200 text-warm-800',
    'bg-blue-100 text-blue-700',
    'bg-rose-100 text-rose-700',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

// ─── Status Label Utilities ──────────────────────────────

export function getAppointmentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    SCHEDULED: 'Rejalashtirilgan',
    CONFIRMED: 'Tasdiqlangan',
    IN_PROGRESS: 'Jarayonda',
    COMPLETED: 'Yakunlangan',
    CANCELLED: 'Bekor qilingan',
    NO_SHOW: 'Kelmagan',
  };
  return labels[status] ?? status;
}

export function getSessionStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    IN_PROGRESS: 'Jarayonda',
    COMPLETED: 'Yakunlangan',
    CANCELLED: 'Bekor qilingan',
  };
  return labels[status] ?? status;
}

export function getAttendanceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PRESENT: 'Keldi',
    ABSENT: 'Kelmadi',
    LATE: 'Kech keldi',
    NO_SHOW: 'Kelmagan',
  };
  return labels[status] ?? status;
}

export function getEntityStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: 'Faol',
    INACTIVE: 'Nofaol',
    ARCHIVED: 'Arxivlangan',
  };
  return labels[status] ?? status;
}


export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    CASH: 'Naqd',
    CARD: 'Karta',
    TRANSFER: "Bank o'tkazma",
  };
  return labels[method] ?? method;
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    SUPER_ADMIN: 'Bosh Admin',
    ADMIN: 'Admin',
    SPECIALIST: 'Mutaxassis',
    PARENT: 'Ota-ona',
  };
  return labels[role] ?? role;
}

export function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    PAYMENT: "To'lov",
    SESSION_CHARGE: 'Seans narxi',
    REFUND: 'Qaytarish',
    ADJUSTMENT: 'Tuzatish',
    EXPENSE: 'Xarajat',
  };
  return labels[type] ?? type;
}

// ─── Status Color Utilities ──────────────────────────────

export function getAppointmentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700 border-blue-200',
    CONFIRMED: 'bg-sage-100 text-sage-700 border-sage-200',
    IN_PROGRESS: 'bg-brand-100 text-brand-700 border-brand-200',
    COMPLETED: 'bg-green-100 text-green-700 border-green-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200',
    NO_SHOW: 'bg-warm-200 text-warm-700 border-warm-300',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-700 border-gray-200';
}

export function getSessionStatusColor(status: string): string {
  const colors: Record<string, string> = {
    IN_PROGRESS: 'bg-brand-100 text-brand-700 border-brand-200',
    COMPLETED: 'bg-green-100 text-green-700 border-green-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-700';
}

export function getEntityStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700 border-green-200',
    INACTIVE: 'bg-warm-200 text-warm-700 border-warm-300',
    ARCHIVED: 'bg-gray-100 text-gray-500 border-gray-200',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-700';
}


export function getAttendanceStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PRESENT: 'bg-green-100 text-green-700 border-green-200',
    ABSENT: 'bg-red-100 text-red-700 border-red-200',
    LATE: 'bg-gold-100 text-gold-700 border-gold-200',
    NO_SHOW: 'bg-warm-200 text-warm-700 border-warm-300',
  };
  return colors[status] ?? 'bg-gray-100 text-gray-700';
}

// ─── Number Utilities ─────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isUUID(value: any): boolean {
  if (typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

// ─── Sort Utilities ───────────────────────────────────────

export function sortBy<T>(
  arr: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...arr].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    const result = aVal < bVal ? -1 : 1;
    return order === 'asc' ? result : -result;
  });
}

// ─── Pagination Utility ──────────────────────────────────

export function paginate<T>(arr: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return arr.slice(start, start + pageSize);
}

// ─── Day of week labels ──────────────────────────────────

export const DAY_LABELS = [
  'Yakshanba',
  'Dushanba',
  'Seshanba',
  'Chorshanba',
  'Payshanba',
  'Juma',
  'Shanba',
];

export const DAY_LABELS_SHORT = ['Yak', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sha'];

export const MONTH_LABELS = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'Iyun',
  'Iyul',
  'Avgust',
  'Sentyabr',
  'Oktyabr',
  'Noyabr',
  'Dekabr',
];

// ─── Secure Password Generator ───────────────────────────

/**
 * Generates a cryptographically strong password meeting backend criteria:
 * - At least 12 characters (default: 14)
 * - Uppercase, lowercase, numbers, and special characters
 */
export function generateStrongPassword(length = 14): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '!@#$%^&*';
  const all = upper + lower + digits + special;

  const getRandomChar = (charset: string) => {
    const randomBuffer = new Uint32Array(1);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomBuffer);
      return charset[randomBuffer[0] % charset.length];
    }
    return charset[Math.floor(Math.random() * charset.length)];
  };

  // Ensure at least one of each required class
  const chars = [
    getRandomChar(upper),
    getRandomChar(lower),
    getRandomChar(digits),
    getRandomChar(special),
  ];

  while (chars.length < length) {
    chars.push(getRandomChar(all));
  }

  // Shuffle array using Fisher-Yates
  for (let i = chars.length - 1; i > 0; i--) {
    const randomBuffer = new Uint32Array(1);
    let j = 0;
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomBuffer);
      j = randomBuffer[0] % (i + 1);
    } else {
      j = Math.floor(Math.random() * (i + 1));
    }
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

// ─── Responsive Breakpoint Hook ───────────────────────────

export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const check = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isMobile;
}

/**
 * Normalizes Uzbek text for resilient searching across apostrophe variants
 * (' vs ‘ vs ’ vs ʻ vs `) and case.
 */
export function normalizeUzbekSearch(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/['‘’ʻ`´]/g, "'")
    .trim();
}

/**
 * Safely handles phone clicks without triggering browser's native desktop application prompt.
 * Copies phone to clipboard and triggers in-app toast, opening dialer on real mobile devices.
 */
export function handlePhoneAction(
  e: React.MouseEvent,
  phone: string,
  addToast?: (toast: { type: 'success' | 'info'; title: string; description?: string }) => void
) {
  e.preventDefault();
  e.stopPropagation();

  if (!phone) return;

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(phone).catch(() => {});
  }

  const isRealMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isRealMobile) {
    window.location.href = `tel:${phone}`;
  }

  if (addToast) {
    addToast({
      type: 'info',
      title: "Telefon raqam nusxalandi",
      description: `${phone} buferga nusxalandi`,
    });
  }
}

