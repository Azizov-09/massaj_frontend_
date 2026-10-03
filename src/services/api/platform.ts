import type { ApiClient } from './client';
import type {
  UpdateSettingsDto,
  CreateAnnouncementDto,
  PublishAnnouncementDto,
  UpdateNotificationPreferencesDto,
} from './types';
import type { Notification, ActivityLog } from '@/types';

export function normalizeNotification(raw: any): Notification {
  if (!raw) return raw;
  return {
    id: String(raw.id),
    userId: String(raw.userId || ''),
    title: raw.title || 'Bildirishnoma',
    message: raw.message || raw.body || '',
    type: raw.type || 'system',
    isRead: Boolean(raw.isRead || raw.read),
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

export function normalizeActivityLog(raw: any): ActivityLog {
  if (!raw) return raw;
  return {
    id: String(raw.id),
    actorId: String(raw.actorId || raw.userId || 'system'),
    actorName: raw.actorName || raw.userName || 'Sistema',
    actorRole: raw.actorRole || raw.userRole || 'ADMIN',
    action: raw.action || 'UPDATE',
    entity: raw.entity || 'system',
    entityId: String(raw.entityId || ''),
    description: raw.description || raw.message || '',
    timestamp: raw.timestamp || raw.createdAt || new Date().toISOString(),
  };
}

export class PlatformApi {
  constructor(private client: ApiClient) {}

  // ── Settings ──
  public async getSettings(): Promise<any> {
    const res = await this.client.get<any>('/settings');
    return res?.data || res;
  }

  public async updateSettings(dto: UpdateSettingsDto): Promise<any> {
    const res = await this.client.patch<any>('/settings', dto);
    return res?.data || res;
  }

  // ── Activity Logs ──
  public async getActivityLogs(params?: { page?: number; limit?: number }): Promise<ActivityLog[]> {
    const res = await this.client.get<any>('/activity-logs', params);
    const list = Array.isArray(res) ? res : res?.data || res?.items || [];
    return list.map(normalizeActivityLog);
  }

  // ── Notifications ──
  public async getNotifications(params?: { page?: number; limit?: number }): Promise<Notification[]> {
    const res = await this.client.get<any>('/notifications', params);
    const list = Array.isArray(res) ? res : res?.data || res?.items || [];
    return list.map(normalizeNotification);
  }

  public async getUnreadCount(): Promise<number> {
    const res = await this.client.get<any>('/notifications/unread-count');
    return Number(res?.count ?? res?.unreadCount ?? res?.data?.count ?? 0);
  }

  public async markNotificationRead(id: string): Promise<void> {
    await this.client.patch(`/notifications/${id}/read`);
  }

  public async markAllNotificationsRead(): Promise<void> {
    await this.client.patch('/notifications/read-all');
  }

  public async getNotificationPreferences(): Promise<any> {
    const res = await this.client.get<any>('/notification-preferences');
    return res?.data || res;
  }

  public async updateNotificationPreferences(dto: UpdateNotificationPreferencesDto): Promise<any> {
    const res = await this.client.patch<any>('/notification-preferences', dto);
    return res?.data || res;
  }

  // ── Announcements ──
  public async createAnnouncement(dto: CreateAnnouncementDto): Promise<any> {
    const res = await this.client.post<any>('/announcements', dto);
    return res?.data || res;
  }

  public async publishAnnouncement(id: string, dto?: PublishAnnouncementDto): Promise<any> {
    const res = await this.client.post<any>(`/announcements/${id}/publish`, dto || {});
    return res?.data || res;
  }

  public async getMyAnnouncements(): Promise<any[]> {
    const res = await this.client.get<any>('/announcements/my');
    return Array.isArray(res) ? res : res?.data || [];
  }

  public async markAnnouncementRead(id: string): Promise<void> {
    await this.client.patch(`/announcements/${id}/read`);
  }

  // ── Documents ──
  public async getDocument(id: string): Promise<any> {
    const res = await this.client.get<any>(`/documents/${id}`);
    return res?.data || res;
  }
}
