// ═══════════════════════════════════════════════════════
//  Parent Dashboard — Family Portal & Child Progress
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  Heart, Calendar, CheckCircle2,
  CreditCard, AlertCircle, Plus
} from 'lucide-react';
import { useAuth, useStore } from '@/store';
import { formatCurrency, formatDate } from '@/utils';
import { calculateParentBalance } from '@/services/finance.service';
import { Card, CardHeader, CardBody, Badge, Avatar, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { KpiCard } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';
import { CreateAppointmentForm } from '@/features/appointments/CreateAppointmentForm';
import { useNavigate } from 'react-router-dom';

export function ParentDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showBookModal, setShowBookModal] = useState(false);

  const parentId = currentUser?.id ?? '';
  const children = useStore(s => s.children);
  const appointments = useStore(s => s.appointments);
  const sessions = useStore(s => s.sessions);
  const specialists = useStore(s => s.specialists);
  const services = useStore(s => s.services);
  const transactions = useStore(s => s.transactions);
  const goals = useStore(s => s.goals);
  const progressNotes = useStore(s => s.progressNotes);

  // Parent's children
  const myChildren = useMemo(() => {
    return children.filter(c => c.parentId === parentId);
  }, [children, parentId]);

  const childIds = useMemo(() => myChildren.map(c => c.id), [myChildren]);

  // Financial status
  const finance = useMemo(() => {
    if (!parentId) return { balance: 0, debt: 0 };
    return calculateParentBalance(parentId, childIds, transactions);
  }, [parentId, childIds, transactions]);

  // Upcoming appointments for my children
  const upcomingAppointments = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments
      .filter(a => childIds.includes(a.childId) && a.date >= today && a.status !== 'CANCELLED')
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
      .slice(0, 5);
  }, [appointments, childIds]);

  // Active goals for my children
  const myGoals = useMemo(() => {
    return goals.filter(g => childIds.includes(g.childId));
  }, [goals, childIds]);

  // Recent specialist notes
  const recentNotes = useMemo(() => {
    return progressNotes
      .filter(p => childIds.includes(p.childId))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [progressNotes, childIds]);

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight flex items-center gap-2">
            Assalomu alaykum, {currentUser?.fullName}! <Heart className="w-5 h-5 text-brand-500 fill-brand-500" />
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
            Farzandingizning reabilitatsiya jarayoni, navbatdagi uchrashuvlar va to‘lovlar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<CreditCard className="w-4 h-4" />}
            onClick={() => navigate('/dashboard/parent/payments')}
          >
            To‘lovlar tarixi
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowBookModal(true)}
          >
            Qabulga yozilish
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Mening farzandlarim"
          value={myChildren.length}
          accentColor="brand"
          icon={<Heart className="w-4 h-4 text-brand-600" />}
        />
        <KpiCard
          label="Navbatdagi uchrashuvlar"
          value={upcomingAppointments.length}
          accentColor="blue"
          icon={<Calendar className="w-4 h-4 text-blue-600" />}
        />
        <KpiCard
          label="Joriy balans (Depozit)"
          value={formatCurrency(finance.balance)}
          accentColor="sage"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          changeType="positive"
        />
        <KpiCard
          label="Qarzdorlik"
          value={formatCurrency(finance.debt)}
          accentColor="danger"
          icon={<AlertCircle className="w-4 h-4 text-rose-600" />}
          changeType={finance.debt > 0 ? 'negative' : 'positive'}
        />
      </div>

      {/* Children Overview Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-charcoal-900">Farzandlarim kartochkalari</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {myChildren.map(c => {
            const spec = specialists.find(s => s.id === c.assignedSpecialistId);
            const childSessions = sessions.filter(s => s.childId === c.id && s.status === 'COMPLETED').length;

            return (
              <Card key={c.id} className="p-5 hover:border-warm-300 transition-colors">
                <div className="flex items-center gap-3">
                  <Avatar name={c.fullName} size="md" />
                  <div>
                    <h4 className="text-sm font-bold text-charcoal-900">{c.fullName}</h4>
                    <p className="text-xs text-charcoal-400">
                      Tug‘ilgan sana: {formatDate(c.dateOfBirth)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-warm-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-charcoal-500">Mutaxassis:</span>
                    <span className="font-semibold text-charcoal-800">{spec?.fullName ?? 'Biriktirilmagan'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-500">O‘tkazilgan seanslar:</span>
                    <span className="font-bold text-brand-600">{childSessions} ta seans</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-warm-100 flex items-center justify-between">
                  <Button
                    size="xs"
                    variant="secondary"
                    className="w-full justify-center"
                    onClick={() => navigate('/dashboard/parent/progress')}
                  >
                    Rivojlanishni ko‘rish
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upcoming Appointments */}
        <div className="lg:col-span-7">
          <Card className="h-full">
            <CardHeader className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-charcoal-900">Yaqinlashayotgan qabullar</h3>
                <p className="text-xs text-charcoal-400">Rejalashtirilgan muolajalar vaqt jadvali</p>
              </div>
              <Badge variant="neutral">{upcomingAppointments.length} ta</Badge>
            </CardHeader>
            <CardBody className="p-0">
              {upcomingAppointments.length === 0 ? (
                <EmptyState
                  title="Rejalashtirilgan qabullar yo‘q"
                  description="Markaz ma’muriyati orqali yangi seansga yozilishingiz mumkin"
                  icon={<Calendar className="w-6 h-6" />}
                  className="py-12"
                />
              ) : (
                <div className="divide-y divide-warm-100">
                  {upcomingAppointments.map(apt => {
                    const child = children.find(c => c.id === apt.childId);
                    const spec = specialists.find(s => s.id === apt.specialistId);
                    const svc = services.find(s => s.id === apt.serviceId);

                    return (
                      <div key={apt.id} className="p-4 flex items-center justify-between hover:bg-warm-50/50">
                        <div>
                          <p className="text-sm font-bold text-charcoal-900">{child?.fullName}</p>
                          <p className="text-xs text-charcoal-500">
                            {svc?.name} • Mutaxassis: <span className="font-semibold text-charcoal-700">{spec?.fullName}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-brand-600 block">
                            {formatDate(apt.date)}
                          </span>
                          <span className="text-xs text-charcoal-400">
                            {apt.startTime} - {apt.endTime}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Goals & Specialist Notes */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold text-charcoal-900">Reabilitatsiya maqsadlari</h3>
              <p className="text-xs text-charcoal-400">Farzandlaringiz erishayotgan natijalar</p>
            </CardHeader>
            <CardBody className="space-y-4">
              {myGoals.length === 0 ? (
                <p className="text-xs text-charcoal-400 text-center py-4">Maqsadlar belgilanmagan</p>
              ) : (
                myGoals.map(g => (
                  <div key={g.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-charcoal-800">{g.title}</span>
                      <span className="text-brand-600 font-bold">{g.progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-warm-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all duration-500"
                        style={{ width: `${g.progress}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          {/* Recent Notes */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold text-charcoal-900">Mutaxassis tavsiyalari</h3>
              <p className="text-xs text-charcoal-400">So‘nggi kuzatuvlar va uyda bajariladigan mashqlar</p>
            </CardHeader>
            <CardBody className="space-y-3">
              {recentNotes.length === 0 ? (
                <p className="text-xs text-charcoal-400 text-center py-4">Tavsiyalar mavjud emas</p>
              ) : (
                recentNotes.map(n => (
                  <div key={n.id} className="p-3 rounded-xl bg-warm-50 border border-warm-100 text-xs space-y-1">
                    <div className="flex justify-between text-[11px] text-charcoal-400">
                      <span>Mutaxassis qaydi</span>
                      <span>{formatDate(n.date)}</span>
                    </div>
                    <p className="text-charcoal-700 font-medium leading-relaxed">{n.note}</p>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Appointment booking modal */}
      <Modal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        title="Yangi qabulga yozilish"
        size="md"
      >
        <CreateAppointmentForm
          onSuccess={() => setShowBookModal(false)}
          onCancel={() => setShowBookModal(false)}
        />
      </Modal>
    </div>
  );
}
