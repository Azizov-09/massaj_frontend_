// ═══════════════════════════════════════════════════════
//  Specialist Dashboard — Daily Clinical Workspace
// ═══════════════════════════════════════════════════════

import { useMemo } from 'react';
import {
  Calendar, CheckCircle2, Clock, Play, Award,
  Users, Activity, ChevronRight, FileText
} from 'lucide-react';
import { useAuth, useStore } from '@/store';
import { formatDate } from '@/utils';
import { Card, CardHeader, CardBody, Badge, Avatar, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { KpiCard } from '@/components/ui/KpiCard';
import { useNavigate } from 'react-router-dom';

export function SpecialistDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const appointments = useStore(s => s.appointments);
  const sessions = useStore(s => s.sessions);
  const children = useStore(s => s.children);
  const services = useStore(s => s.services);
  const startSession = useStore(s => s.startSession);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Today's appointments for this specialist
  const todayAppointments = useMemo(() => {
    return appointments
      .filter(a => a.specialistId === currentUser?.id && a.date === todayStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, currentUser?.id, todayStr]);

  // Assigned children
  const assignedChildren = useMemo(() => {
    return children.filter(c => c.assignedSpecialistId === currentUser?.id);
  }, [children, currentUser?.id]);

  // Specialist's completed sessions
  const completedSessions = useMemo(() => {
    return sessions.filter(s => s.specialistId === currentUser?.id && s.status === 'COMPLETED');
  }, [sessions, currentUser?.id]);

  const handleStartAppointmentSession = (aptId: string) => {
    startSession(aptId);
    navigate('/dashboard/specialist/sessions');
  };

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight">
            Xush kelibsiz, {currentUser?.fullName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 mt-1">
            Bugungi rejalashtirilgan muolajalar va bolalar parvarishi paneli
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Calendar className="w-4 h-4" />}
            onClick={() => navigate('/dashboard/specialist/schedule')}
          >
            To‘liq jadval
          </Button>
          <Button
            size="sm"
            leftIcon={<Activity className="w-4 h-4" />}
            onClick={() => navigate('/dashboard/specialist/sessions')}
          >
            Seanslar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="Bugungi muolajalar"
          value={todayAppointments.length}
          accentColor="brand"
          icon={<Clock className="w-5 h-5 text-brand-600" />}
          change={`${todayAppointments.filter(a => a.status === 'COMPLETED').length} tasi yakunlandi`}
          index={0}
        />
        <KpiCard
          label="Biriktirilgan bolalar"
          value={assignedChildren.length}
          description="Davolash dasturidagi"
          accentColor="sage"
          icon={<Users className="w-5 h-5 text-emerald-600" />}
          index={1}
        />
        <KpiCard
          label="Bajarilgan seanslar"
          value={completedSessions.length}
          description="Jami o'tkazilgan muolajalar"
          accentColor="gold"
          icon={<CheckCircle2 className="w-5 h-5 text-amber-500" />}
          index={2}
        />
        <KpiCard
          label="Kasbiy reyting"
          value="4.95"
          description="Mijozlar bahosi"
          accentColor="blue"
          icon={<Award className="w-5 h-5 text-blue-600" />}
          change="A’lo darajada"
          changeType="positive"
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Schedule & Sessions list */}
        <div className="lg:col-span-8">
          <Card className="h-full">
            <CardHeader className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-charcoal-900">Bugungi reja ({formatDate(todayStr)})</h3>
                <p className="text-xs text-charcoal-400">Belgilangan vaqt bo‘yicha keluvchi bolalar</p>
              </div>
              <Badge variant="neutral">{todayAppointments.length} ta uchrashuv</Badge>
            </CardHeader>
            <CardBody className="p-0">
              {todayAppointments.length === 0 ? (
                <EmptyState
                  title="Bugunga uchrashuvlar yo‘q"
                  description="Dam olish kuni yoki jadval hali to‘ldirilmagan"
                  icon={<Calendar className="w-6 h-6" />}
                  className="py-14"
                />
              ) : (
                <div className="divide-y divide-warm-100">
                  {todayAppointments.map(apt => {
                    const child = children.find(c => c.id === apt.childId);
                    const service = services.find(s => s.id === apt.serviceId);
                    const isCompleted = apt.status === 'COMPLETED';

                    return (
                      <div
                        key={apt.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-warm-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <Avatar name={child?.fullName ?? 'Bola'} size="md" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-charcoal-900">{child?.fullName}</h4>
                              <Badge
                                variant={
                                  isCompleted ? 'success' : apt.status === 'IN_PROGRESS' ? 'warning' : 'neutral'
                                }
                              >
                                {isCompleted ? 'Yakunlangan' : apt.status === 'IN_PROGRESS' ? 'Jarayonda' : 'Kutilmoqda'}
                              </Badge>
                            </div>
                            <p className="text-xs text-charcoal-500 mt-0.5">
                              {service?.name} • <span className="font-semibold text-brand-600">{apt.startTime} - {apt.endTime}</span>
                            </p>
                            {apt.notes && (
                              <p className="text-[11px] text-charcoal-400 mt-1 italic">
                                "{apt.notes}"
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          {!isCompleted && apt.status !== 'IN_PROGRESS' && (
                            <Button
                              size="sm"
                              leftIcon={<Play className="w-3.5 h-3.5" />}
                              onClick={() => handleStartAppointmentSession(apt.id)}
                            >
                              Seansni boshlash
                            </Button>
                          )}
                          {apt.status === 'IN_PROGRESS' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => navigate('/dashboard/specialist/sessions')}
                            >
                              Seansni davom ettirish
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Assigned Children & Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-bold text-charcoal-900">Menga biriktirilgan bolalar</h3>
              <p className="text-xs text-charcoal-400">Doimiy nazoratimdagi kichik mijozlar</p>
            </CardHeader>
            <CardBody className="p-0">
              {assignedChildren.length === 0 ? (
                <div className="p-6 text-center text-xs text-charcoal-400">
                  Hozircha biriktirilgan bolalar yo‘q
                </div>
              ) : (
                <div className="divide-y divide-warm-100">
                  {assignedChildren.slice(0, 5).map(c => (
                    <div
                      key={c.id}
                      onClick={() => navigate('/dashboard/specialist/children')}
                      className="p-3.5 flex items-center justify-between hover:bg-warm-50/60 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar name={c.fullName} size="sm" />
                        <div>
                          <p className="text-xs font-bold text-charcoal-900">{c.fullName}</p>
                          <p className="text-[11px] text-charcoal-400">Tug‘ilgan: {formatDate(c.dateOfBirth)}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-charcoal-300" />
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Quick Tools */}
          <Card className="p-4 bg-gradient-to-br from-warm-50 to-white">
            <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-3">
              Tezkor harakatlar
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="xs"
                className="justify-start"
                leftIcon={<FileText className="w-3.5 h-3.5" />}
                onClick={() => navigate('/dashboard/specialist/progress')}
              >
                Kuzatuv qaydi
              </Button>
              <Button
                variant="secondary"
                size="xs"
                className="justify-start"
                leftIcon={<Activity className="w-3.5 h-3.5" />}
                onClick={() => navigate('/dashboard/specialist/assessments')}
              >
                Baholash (5 ball)
              </Button>
              <Button
                variant="secondary"
                size="xs"
                className="justify-start"
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                onClick={() => navigate('/dashboard/specialist/attendance')}
              >
                Davomat
              </Button>
              <Button
                variant="secondary"
                size="xs"
                className="justify-start"
                leftIcon={<Calendar className="w-3.5 h-3.5" />}
                onClick={() => navigate('/dashboard/specialist/schedule')}
              >
                Jadval
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
