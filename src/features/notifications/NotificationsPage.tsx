// Notifications Page
import { Bell, BellOff, CheckCheck, CreditCard, Calendar, Activity, ClipboardCheck, Clock } from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { formatRelativeTime, cn } from '@/utils';
import { Card, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/KpiCard';

export function NotificationsPage() {
  const { currentUser } = useAuth();
  const notifications = useStore(s => s.notifications);
  const markRead = useStore(s => s.markNotificationRead);
  const markUnread = useStore(s => s.markNotificationUnread);
  const markAll = useStore(s => s.markAllNotificationsRead);

  const userNotifs = notifications
    .filter(n => n.userId === currentUser?.id || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unread = userNotifs.filter(n => !n.isRead).length;

  const typeColors: Record<string, string> = {
    appointment: 'bg-amber-100 text-amber-700',
    payment: 'bg-green-100 text-green-700',
    schedule: 'bg-blue-100 text-blue-700',
    session: 'bg-purple-100 text-purple-700',
    assessment: 'bg-teal-100 text-teal-700',
    system: 'bg-warm-100 text-charcoal-700',
  };

  return (
    <div className="px-4 lg:px-6 py-6 max-w-3xl mx-auto space-y-5">
      <PageHeader
        title="Bildirishnomalar"
        description={unread > 0 ? `${unread} ta o'qilmagan` : 'Barchasi o\'qilgan'}
        actions={
          unread > 0 && (
            <Button variant="secondary" size="sm" leftIcon={<CheckCheck className="w-4 h-4" />}
              onClick={() => markAll(currentUser?.id, currentUser?.role)}>
              Barchasini o'qildi
            </Button>
          )
        }
      />

      <Card>
        {userNotifs.length === 0 ? (
          <EmptyState title="Bildirishnomalar yo'q" icon={<Bell className="w-5 h-5" />} className="py-16" />
        ) : (
          <div className="divide-y divide-warm-50">
            {userNotifs.map(notif => (
              <div key={notif.id}
                className={cn('flex items-start gap-3 sm:gap-4 px-3.5 sm:px-5 py-3.5 sm:py-4 hover:bg-warm-50/50 transition-colors group', !notif.isRead && 'bg-brand-50/30')}>
                <div className={cn('w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0', typeColors[notif.type] ?? 'bg-warm-100 text-charcoal-700')}>
                  {notif.type === 'payment' ? (
                    <CreditCard className="w-4 h-4" />
                  ) : notif.type === 'appointment' ? (
                    <Calendar className="w-4 h-4" />
                  ) : notif.type === 'session' ? (
                    <Activity className="w-4 h-4" />
                  ) : notif.type === 'assessment' ? (
                    <ClipboardCheck className="w-4 h-4" />
                  ) : notif.type === 'schedule' ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm font-semibold text-charcoal-900', !notif.isRead && 'text-charcoal-900')}>{notif.title}</p>
                    {!notif.isRead && <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1" />}
                  </div>
                  <p className="text-sm text-charcoal-600 mt-0.5">{notif.message}</p>
                  <p className="text-xs text-charcoal-400 mt-1">{formatRelativeTime(notif.createdAt)}</p>
                </div>
                <button
                  onClick={() => notif.isRead ? markUnread(notif.id) : markRead(notif.id)}
                  className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 rounded-[6px] text-charcoal-400 hover:text-charcoal-700 hover:bg-warm-100 transition-all shrink-0 cursor-pointer"
                  title={notif.isRead ? "O'qilmagan qilish" : "O'qilgan qilish"}
                >
                  {notif.isRead ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
