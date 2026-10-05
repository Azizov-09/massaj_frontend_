// ═══════════════════════════════════════════════════════
//  Progress Page — Child Development Timeline & Notes
//  Senior Medical/Wellness CRM Standard
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  TrendingUp, Plus, Activity, FileText, ClipboardCheck,
  Search, X, Calendar, User, Eye, LayoutGrid, Table as TableIcon,
  Clock, Stethoscope, Copy, Check, AlertCircle, Award, Baby,
  ArrowRight, HeartPulse, ChevronRight
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { formatDate, cn } from '@/utils';
import { differenceInYears, parseISO } from 'date-fns';
import { Card, Badge, Avatar, Select, EmptyState, ProgressBar, Textarea } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { DataTable, Column } from '@/components/tables/DataTable';
import { Modal } from '@/components/ui/Modal';
import type { AssessmentScores } from '@/types';

type EventTypeFilter = 'ALL' | 'SESSION' | 'NOTE' | 'ASSESSMENT' | 'WITH_RECOMMENDATION';
type ViewMode = 'TIMELINE' | 'TABLE';

interface TimelineEvent {
  id: string;
  date: string;
  childId: string;
  specialistId: string;
  type: 'NOTE' | 'SESSION' | 'ASSESSMENT';
  title: string;
  content: string;
  details?: string;
  recommendation?: string;
  scores?: AssessmentScores;
  avgScore?: number;
}

export function ProgressPage() {
  const { currentUser } = useAuth();
  const children = useStore(s => s.children);
  const specialists = useStore(s => s.specialists);
  const parents = useStore(s => s.parents);
  const progressNotes = useStore(s => s.progressNotes);
  const sessions = useStore(s => s.sessions);
  const assessments = useStore(s => s.assessments);
  const createProgressNote = useStore(s => s.createProgressNote);

  const isParent = currentUser?.role === 'PARENT';
  const isSpecialist = currentUser?.role === 'SPECIALIST';

  const availableChildren = useMemo(() => {
    if (isParent && currentUser) {
      return children.filter(c => c.parentId === currentUser.id);
    }
    return children;
  }, [children, isParent, currentUser]);

  const [search, setSearch] = useState('');
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [specialistFilter, setSpecialistFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<EventTypeFilter>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('TIMELINE');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New progress note state
  const [formData, setFormData] = useState({
    childId: availableChildren[0]?.id ?? '',
    specialistId: currentUser?.role === 'SPECIALIST' ? currentUser.id : (specialists[0]?.id ?? ''),
    note: '',
    recommendation: '',
  });

  // Calculate average scores helper
  const calcAvg = (scores: AssessmentScores) => {
    const sum = Object.values(scores).reduce((a, b) => a + b, 0);
    return Number((sum / 5).toFixed(1));
  };

  // Timeline events: combined from progressNotes, completed sessions with notes, and assessments
  const rawTimelineEvents = useMemo(() => {
    const parentChildIds = availableChildren.map(c => c.id);
    const list: TimelineEvent[] = [];

    // 1. Progress notes
    progressNotes.forEach(p => {
      if (isParent && !parentChildIds.includes(p.childId)) return;
      if (isSpecialist && currentUser && p.specialistId !== currentUser.id) return;
      list.push({
        id: p.id,
        date: p.date,
        childId: p.childId,
        specialistId: p.specialistId,
        type: 'NOTE',
        title: 'Mutaxassis kuzatuv qaydi',
        content: p.note,
      });
    });

    // 2. Completed sessions with notes
    sessions.forEach(ses => {
      if (ses.status !== 'COMPLETED' || (!ses.note && !ses.observation && !ses.recommendation)) return;
      if (isParent && !parentChildIds.includes(ses.childId)) return;
      if (isSpecialist && currentUser && ses.specialistId !== currentUser.id) return;
      list.push({
        id: ses.id,
        date: ses.endTime ? (ses.endTime || '').split('T')[0] : (ses.startTime ? (ses.startTime || '').split('T')[0] : new Date().toISOString().split('T')[0]),
        childId: ses.childId,
        specialistId: ses.specialistId,
        type: 'SESSION',
        title: 'Seans natijasi va tavsiyalar',
        content: ses.observation || ses.note || 'Seans muvaffaqiyatli yakunlandi.',
        details: ses.recommendation ? `Tavsiya: ${ses.recommendation}` : undefined,
        recommendation: ses.recommendation,
      });
    });

    // 3. Assessments
    assessments.forEach(asmnt => {
      if (isParent && !parentChildIds.includes(asmnt.childId)) return;
      if (isSpecialist && currentUser && asmnt.specialistId !== currentUser.id) return;
      const avg = calcAvg(asmnt.scores);
      list.push({
        id: asmnt.id,
        date: asmnt.date,
        childId: asmnt.childId,
        specialistId: asmnt.specialistId,
        type: 'ASSESSMENT',
        title: `Klinik baholash (O‘rtacha: ${avg} / 5)`,
        content: asmnt.professionalObservation,
        details: `Harakat: ${asmnt.scores.movement}, Koordinatsiya: ${asmnt.scores.coordination}, Tonus: ${asmnt.scores.flexibility}, Chidamlilik: ${asmnt.scores.activityTolerance}, Reaksiya: ${asmnt.scores.sessionResponse}`,
        scores: asmnt.scores,
        avgScore: avg,
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [progressNotes, sessions, assessments, isParent, isSpecialist, currentUser, availableChildren]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = rawTimelineEvents.length;
    const sessionCount = rawTimelineEvents.filter(e => e.type === 'SESSION').length;
    const noteCount = rawTimelineEvents.filter(e => e.type === 'NOTE').length;
    const assessmentCount = rawTimelineEvents.filter(e => e.type === 'ASSESSMENT').length;
    const recommendationCount = rawTimelineEvents.filter(e => Boolean(e.recommendation || (e.details && e.type === 'SESSION'))).length;
    const coveredChildren = new Set(rawTimelineEvents.map(e => e.childId)).size;

    return {
      total,
      sessionCount,
      noteCount,
      assessmentCount,
      recommendationCount,
      coveredChildren,
    };
  }, [rawTimelineEvents]);

  // Tab counts
  const tabCounts = useMemo(() => {
    let session = 0;
    let note = 0;
    let assessment = 0;
    let recommendation = 0;

    rawTimelineEvents.forEach(e => {
      if (e.type === 'SESSION') session++;
      if (e.type === 'NOTE') note++;
      if (e.type === 'ASSESSMENT') assessment++;
      if (e.recommendation || (e.details && e.type === 'SESSION')) recommendation++;
    });

    return {
      all: rawTimelineEvents.length,
      session,
      note,
      assessment,
      recommendation,
    };
  }, [rawTimelineEvents]);

  // Filtered timeline events
  const filteredEvents = useMemo(() => {
    return rawTimelineEvents.filter(evt => {
      // Child filter
      if (selectedChildId && evt.childId !== selectedChildId) return false;

      // Specialist filter
      if (specialistFilter && evt.specialistId !== specialistFilter) return false;

      // Event Type tab filter
      if (activeTab === 'SESSION' && evt.type !== 'SESSION') return false;
      if (activeTab === 'NOTE' && evt.type !== 'NOTE') return false;
      if (activeTab === 'ASSESSMENT' && evt.type !== 'ASSESSMENT') return false;
      if (activeTab === 'WITH_RECOMMENDATION' && !evt.recommendation && !(evt.details && evt.type === 'SESSION')) return false;

      // Search query
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const child = children.find(c => c.id === evt.childId);
        const spec = specialists.find(s => s.id === evt.specialistId);
        const matchChild = child?.fullName?.toLowerCase().includes(q);
        const matchSpec = spec?.fullName?.toLowerCase().includes(q);
        const matchTitle = (evt.title || '').toLowerCase().includes(q);
        const matchContent = (evt.content || '').toLowerCase().includes(q);
        const matchRec = evt.recommendation?.toLowerCase().includes(q) || evt.details?.toLowerCase().includes(q);

        if (!matchChild && !matchSpec && !matchTitle && !matchContent && !matchRec) {
          return false;
        }
      }

      return true;
    });
  }, [rawTimelineEvents, selectedChildId, specialistFilter, activeTab, search, children, specialists]);

  const hasActiveFilters = Boolean(
    search || selectedChildId || specialistFilter || activeTab !== 'ALL'
  );

  const resetAllFilters = () => {
    setSearch('');
    setSelectedChildId('');
    setSpecialistFilter('');
    setActiveTab('ALL');
  };

  const handleCopyRecommendation = (id: string, text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.childId || !formData.note.trim()) return;

    const fullNote = formData.recommendation.trim()
      ? `${formData.note.trim()}\n\n[Uy sharoitidagi tavsiya]: ${formData.recommendation.trim()}`
      : formData.note.trim();

    createProgressNote({
      childId: formData.childId,
      specialistId: formData.specialistId || currentUser?.id || '',
      note: fullNote,
      date: new Date().toISOString().split('T')[0],
    });

    setShowCreateModal(false);
    setFormData({
      childId: availableChildren[0]?.id ?? '',
      specialistId: currentUser?.role === 'SPECIALIST' ? currentUser.id : (specialists[0]?.id ?? ''),
      note: '',
      recommendation: '',
    });
  };

  const getEventTypeMeta = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'SESSION':
        return {
          icon: <Activity className="w-3.5 h-3.5" />,
          nodeBg: 'bg-emerald-600 text-white ring-4 ring-emerald-50',
          badgeVariant: 'success' as const,
          label: 'Seans xulosasi',
          cardBorder: 'hover:border-emerald-200',
        };
      case 'NOTE':
        return {
          icon: <FileText className="w-3.5 h-3.5" />,
          nodeBg: 'bg-brand-600 text-white ring-4 ring-brand-50',
          badgeVariant: 'neutral' as const,
          label: 'Kuzatuv qaydi',
          cardBorder: 'hover:border-brand-200',
        };
      case 'ASSESSMENT':
        return {
          icon: <ClipboardCheck className="w-3.5 h-3.5" />,
          nodeBg: 'bg-amber-500 text-white ring-4 ring-amber-50',
          badgeVariant: 'warning' as const,
          label: 'Klinik baholash',
          cardBorder: 'hover:border-amber-200',
        };
    }
  };

  // DataTable columns
  const columns: Column<TimelineEvent>[] = [
    {
      key: 'childId',
      header: 'Bola',
      sortable: true,
      className: 'py-3.5',
      cell: (row) => {
        const child = children.find(c => c.id === row.childId);
        const childAge = child?.dateOfBirth ? differenceInYears(new Date(), parseISO(child.dateOfBirth)) : null;

        return child ? (
          <div className="flex items-center gap-3">
            <Avatar name={child.fullName} size="sm" className="ring-2 ring-warm-100 shadow-2xs shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-charcoal-900 truncate">
                  {child.fullName}
                </span>
                {childAge !== null && (
                  <span className="text-[10px] font-semibold text-charcoal-600 bg-warm-100/90 border border-warm-200/80 px-1.5 py-0.5 rounded-[4px] shrink-0">
                    {childAge} yosh
                  </span>
                )}
              </div>
              {child.diagnosis && (
                <p className="text-[11px] text-charcoal-400 truncate max-w-[170px] mt-0.5">
                  {child.diagnosis}
                </p>
              )}
            </div>
          </div>
        ) : (
          <span className="text-charcoal-400 text-xs">—</span>
        );
      },
    },
    {
      key: 'specialistId',
      header: 'Mutaxassis',
      sortable: true,
      className: 'py-3.5',
      cell: (row) => {
        const spec = specialists.find(s => s.id === row.specialistId);
        return spec ? (
          <div className="flex items-center gap-2.5">
            <Avatar name={spec.fullName} size="xs" className="ring-1 ring-warm-200 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-charcoal-900 truncate">{spec.fullName}</p>
              <p className="text-[11px] text-charcoal-500 truncate font-medium">{spec.specialization || 'Mutaxassis'}</p>
            </div>
          </div>
        ) : (
          <span className="text-charcoal-400 text-xs">—</span>
        );
      },
    },
    {
      key: 'date',
      header: 'Qayd sanasi',
      sortable: true,
      className: 'py-3.5',
      cell: (row) => (
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-800">
          <Calendar className="w-3.5 h-3.5 text-brand-600 shrink-0" />
          <span>{formatDate(row.date)}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Voqea turi',
      sortable: true,
      className: 'py-3.5',
      cell: (row) => {
        const meta = getEventTypeMeta(row.type);
        return (
          <Badge variant={meta.badgeVariant} className="text-xs font-semibold shadow-2xs">
            {meta.label}
          </Badge>
        );
      },
    },
    {
      key: 'content',
      header: 'Kuzatuv va natijalar',
      className: 'py-3.5',
      cell: (row) => (
        <div className="space-y-1 max-w-sm">
          <p className="text-xs font-medium text-charcoal-800 line-clamp-2">
            {row.content}
          </p>
          {row.recommendation && (
            <p className="text-[11px] font-semibold text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded-[4px] border border-emerald-200/80 truncate">
              Tavsiya: {row.recommendation}
            </p>
          )}
          {row.scores && (
            <p className="text-[11px] text-charcoal-500">
              {row.details}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Amallar',
      headerClassName: 'text-right pr-4',
      className: 'py-3.5 text-right',
      cell: (row) => (
        <div className="flex items-center justify-end" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setSelectedEvent(row)}
            className="p-1.5 rounded-[8px] text-charcoal-500 hover:text-charcoal-900 hover:bg-warm-100 border border-transparent hover:border-warm-200 transition-all cursor-pointer"
            title="Batafsil ko'rish"
            aria-label="Batafsil ko'rish"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title={isParent ? "Farzandim rivojlanish tarixi" : "Rivojlanish va monitoring (Progress)"}
        description="Bolalar reabilitatsiyasi, mashq dinamikasi, seans xulosalari va shifokor tavsiyalarining to'liq xronologiyasi"
        actions={
          !isParent ? (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
              Yangi qayd qo‘shish
            </Button>
          ) : undefined
        }
      />

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setActiveTab('ALL')}
          className={cn(
            'cursor-pointer transition-all duration-200 rounded-[14px]',
            activeTab === 'ALL' ? 'ring-2 ring-brand-500 shadow-sm' : 'hover:scale-[1.01]'
          )}
          title="Barcha xronologik qaydlar"
        >
          <KpiCard
            label="Jami qaydlar"
            value={stats.total}
            description="Tizimdagi barcha qaydlar"
            icon={<TrendingUp className="w-5 h-5 text-brand-600" />}
            accentColor="brand"
            index={0}
          />
        </div>

        <div
          onClick={() => setActiveTab('SESSION')}
          className={cn(
            'cursor-pointer transition-all duration-200 rounded-[14px]',
            activeTab === 'SESSION' ? 'ring-2 ring-emerald-500 shadow-sm' : 'hover:scale-[1.01]'
          )}
          title="Seans xulosalari"
        >
          <KpiCard
            label="Seans xulosalari"
            value={`${stats.sessionCount} ta`}
            description="Muolaja yakunlari"
            icon={<Activity className="w-5 h-5 text-emerald-600" />}
            accentColor="sage"
            index={1}
          />
        </div>

        <div
          onClick={() => setActiveTab('WITH_RECOMMENDATION')}
          className={cn(
            'cursor-pointer transition-all duration-200 rounded-[14px]',
            activeTab === 'WITH_RECOMMENDATION' ? 'ring-2 ring-amber-500 shadow-sm' : 'hover:scale-[1.01]'
          )}
          title="Tavsiyali qaydlar"
        >
          <KpiCard
            label="Tibbiy tavsiyalar"
            value={`${stats.recommendationCount} ta`}
            description="Uy mashqlari va ko‘rsatmalar"
            icon={<Stethoscope className="w-5 h-5 text-amber-600" />}
            accentColor="gold"
            index={2}
          />
        </div>

        <div
          onClick={() => setActiveTab('ASSESSMENT')}
          className={cn(
            'cursor-pointer transition-all duration-200 rounded-[14px]',
            activeTab === 'ASSESSMENT' ? 'ring-2 ring-blue-500 shadow-sm' : 'hover:scale-[1.01]'
          )}
          title="Klinik baholashlar"
        >
          <KpiCard
            label="Baholash natijalari"
            value={`${stats.assessmentCount} ta`}
            description="5 mezonli dinamik testlar"
            icon={<ClipboardCheck className="w-5 h-5 text-blue-600" />}
            accentColor="blue"
            index={3}
          />
        </div>
      </div>

      {/* Clinical Guidance Banner */}
      <div className="p-4 rounded-xl bg-brand-50/70 border border-brand-200/80 shadow-2xs flex items-start gap-3.5 text-xs text-charcoal-700">
        <AlertCircle className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-charcoal-900">Multidissiplinar monitoring va dinamika tizimi</p>
          <p className="text-charcoal-600 leading-relaxed">
            Har bir seansdan keyin mutaxassis tomonidan kiritilgan klinik xulosalar, ota-onaga uy sharoitida bajarish uchun berilgan mashqlar va davriy baholashlar yagona xronologiyada saqlanadi. Bu reabilitatsiya jarayonining uzluksizligini ta’minlaydi.
          </p>
        </div>
      </div>

      {/* Main Table & Controls Card */}
      <Card className="overflow-visible border border-warm-200/90 shadow-xs">
        {/* Top Status Tabs — Desktop/tablet filter pills */}
        <div className="hidden sm:flex px-4 py-3 bg-warm-50/70 border-b border-warm-200/80 items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto touch-scroll-x scrollbar-thin py-0.5 w-full sm:w-auto -mx-0.5 px-0.5">
            {[
              { key: 'ALL', label: 'Barchasi', count: tabCounts.all },
              { key: 'SESSION', label: 'Seans xulosalari', count: tabCounts.session },
              { key: 'NOTE', label: 'Mutaxassis qaydlari', count: tabCounts.note },
              { key: 'ASSESSMENT', label: 'Baholash natijalari', count: tabCounts.assessment },
              { key: 'WITH_RECOMMENDATION', label: 'Tavsiyali qaydlar', count: tabCounts.recommendation },
            ].map(tab => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={(e) => {
                    setActiveTab(tab.key as EventTypeFilter);
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
                  }}
                  className={cn(
                    'shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap select-none',
                    isActive
                      ? 'bg-charcoal-900 text-white shadow-xs'
                      : 'bg-white text-charcoal-600 hover:text-charcoal-900 hover:bg-warm-100 border border-warm-200/90 shadow-2xs'
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums',
                      isActive ? 'bg-white/20 text-white' : 'bg-warm-100 text-charcoal-700'
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white p-0.5 rounded-[8px] border border-warm-200/90 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('TIMELINE')}
                className={cn(
                  'p-1.5 rounded-[6px] transition-colors cursor-pointer',
                  viewMode === 'TIMELINE' ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-charcoal-400 hover:text-charcoal-700'
                )}
                title="Lenta (Xronologiya) ko'rinishi"
                aria-label="Lenta ko'rinishi"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={cn(
                  'p-1.5 rounded-[6px] transition-colors cursor-pointer',
                  viewMode === 'TABLE' ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-charcoal-400 hover:text-charcoal-700'
                )}
                title="Jadval ko'rinishi"
                aria-label="Jadval ko'rinishi"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>

            <span className="text-xs font-medium text-charcoal-500 bg-white px-2.5 py-1 rounded-[8px] border border-warm-200/80 shadow-2xs">
              Ko‘rsatilmoqda: <strong className="text-charcoal-900 font-bold">{filteredEvents.length}</strong> / {rawTimelineEvents.length}
            </span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-3.5 bg-white border-b border-warm-100 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Bola, mutaxassis yoki xulosa matni..."
              className="w-full h-9 pl-9 pr-8 text-xs border border-warm-300 rounded-[10px] bg-white shadow-2xs placeholder:text-charcoal-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100/80 outline-none transition-all font-medium text-charcoal-800"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700 p-0.5 rounded-full cursor-pointer"
                title="Qidiruvni tozalash"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Event Type / Tab Select (Mobile only: on desktop, pills tab bar handles event type) */}
          <div className="sm:hidden w-full">
            <Select
              size="sm"
              triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 font-medium w-full"
              value={activeTab}
              onChange={e => setActiveTab(e.target.value as EventTypeFilter)}
              options={[
                { value: 'ALL', label: `Barcha turlar (${tabCounts.all})` },
                { value: 'SESSION', label: `Seanslar (${tabCounts.session})` },
                { value: 'NOTE', label: `Qaydlar (${tabCounts.note})` },
                { value: 'ASSESSMENT', label: `Baholashlar (${tabCounts.assessment})` },
                { value: 'WITH_RECOMMENDATION', label: `Tavsiyalar (${tabCounts.recommendation})` },
              ]}
              aria-label="Hodisa turi bo'yicha filter"
            />
          </div>

          {/* Child & Specialist Filters — 2-column grid on mobile to save vertical space */}
          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
            {/* Child Select */}
            <div className={cn("w-full sm:w-56", (isSpecialist || isParent) && "col-span-2 sm:col-span-1")}>
              <Select
                size="sm"
                triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 font-medium w-full"
                value={selectedChildId}
                onChange={e => setSelectedChildId(e.target.value)}
                options={[
                  { value: '', label: isParent ? "Barcha farzandlarim" : "Barcha bolalar" },
                  ...availableChildren.map(c => ({ value: c.id, label: c.fullName })),
                ]}
                aria-label="Bola bo'yicha filter"
              />
            </div>

            {/* Specialist Select */}
            {!isSpecialist && !isParent && (
              <div className="w-full sm:w-52">
                <Select
                  size="sm"
                  triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 font-medium w-full"
                  value={specialistFilter}
                  onChange={e => setSpecialistFilter(e.target.value)}
                  options={[
                    { value: '', label: 'Barcha mutaxassislar' },
                    ...specialists.map(s => ({ value: s.id, label: s.fullName })),
                  ]}
                  aria-label="Mutaxassis bo'yicha filter"
                />
              </div>
            )}
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="h-9 px-3 rounded-[10px] text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer w-full sm:w-auto ml-auto sm:ml-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Filtrlarni tozalash</span>
            </button>
          )}
        </div>

        {/* Content Body: Timeline vs Table */}
        {filteredEvents.length === 0 ? (
          <div className="p-12">
            <EmptyState
              title="Qaydlar topilmadi"
              description={
                hasActiveFilters
                  ? "Tanlangan qidiruv va filtr mezonlariga mos keluvchi rivojlanish qaydlari mavjud emas."
                  : "Hozircha tizimda rivojlanish qaydlari mavjud emas."
              }
              icon={<TrendingUp className="w-6 h-6 text-charcoal-400" />}
              action={
                hasActiveFilters ? (
                  <Button size="sm" variant="secondary" onClick={resetAllFilters}>
                    Filtrlarni tozalash
                  </Button>
                ) : !isParent ? (
                  <Button size="sm" onClick={() => setShowCreateModal(true)}>
                    Yangi qayd qo‘shish
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : viewMode === 'TABLE' ? (
          <div className="overflow-x-auto touch-scroll-x scrollbar-thin">
            <DataTable<TimelineEvent>
              data={filteredEvents}
              columns={columns}
              keyExtractor={r => r.id}
              emptyTitle="Qaydlar topilmadi"
              emptyDescription="Tanlangan mezonlar bo‘yicha rivojlanish qaydlari mavjud emas."
              onRowClick={(row) => setSelectedEvent(row)}
              tableClassName="min-w-[900px]"
            />
          </div>
        ) : (
          /* Enhanced Visual Timeline View */
          <div className="p-5 sm:p-7 bg-[#FFFDF9]/60">
            <div className="relative pl-7 sm:pl-9 space-y-6 before:absolute before:left-3.5 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-warm-200">
              {filteredEvents.map((evt) => {
                const child = children.find(c => c.id === evt.childId);
                const spec = specialists.find(s => s.id === evt.specialistId);
                const childAge = child?.dateOfBirth ? differenceInYears(new Date(), parseISO(child.dateOfBirth)) : null;
                const meta = getEventTypeMeta(evt.type);

                return (
                  <div key={evt.id} className="relative group">
                    {/* Node Pin Marker */}
                    <div
                      className={cn(
                        'absolute -left-7 sm:-left-9 top-2 w-7 h-7 rounded-full flex items-center justify-center shadow-2xs transition-transform group-hover:scale-110',
                        meta.nodeBg
                      )}
                    >
                      {meta.icon}
                    </div>

                    {/* Timeline Event Card */}
                    <Card
                      className={cn(
                        'p-5 bg-white border border-warm-200/90 shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer',
                        meta.cardBorder
                      )}
                      onClick={() => setSelectedEvent(evt)}
                    >
                      {/* Top Header of Card */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-warm-100">
                        {/* Child & Specialist Info */}
                        <div className="flex items-center gap-3">
                          <Avatar name={child?.fullName ?? 'Bola'} size="sm" className="ring-2 ring-warm-100 shadow-2xs shrink-0" />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-charcoal-900">
                                {child?.fullName}
                              </span>
                              {childAge !== null && (
                                <span className="text-[10px] font-semibold text-charcoal-600 bg-warm-100 border border-warm-200 px-1.5 py-0.5 rounded-[4px]">
                                  {childAge} yosh
                                </span>
                              )}
                              {child?.diagnosis && (
                                <span className="text-[11px] text-charcoal-400 font-medium truncate max-w-[200px]">
                                  • {child.diagnosis}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-charcoal-500 font-medium mt-0.5">
                              Mutaxassis: <strong className="text-charcoal-800 font-semibold">{spec?.fullName ?? 'Mutaxassis'}</strong>
                              {spec?.specialization && <span className="text-charcoal-400"> ({spec.specialization})</span>}
                            </p>
                          </div>
                        </div>

                        {/* Event Category & Date */}
                        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                          <Badge variant={meta.badgeVariant} className="text-xs font-semibold shadow-2xs">
                            {meta.label}
                          </Badge>
                          <div className="inline-flex items-center gap-1.5 text-xs text-charcoal-500 font-semibold bg-warm-50 px-2.5 py-1 rounded-[8px] border border-warm-200/80 shadow-2xs">
                            <Calendar className="w-3 h-3 text-brand-600" />
                            <span>{formatDate(evt.date)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Main Observation Text */}
                      <div className="pt-3.5 space-y-3">
                        <p className="text-xs sm:text-sm text-charcoal-700 leading-relaxed font-normal">
                          {evt.content}
                        </p>

                        {/* Assessment Criteria pill preview (if Assessment) */}
                        {evt.scores && (
                          <div className="p-3 rounded-[10px] bg-warm-50/80 border border-warm-200/80 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-charcoal-800">
                              <span>Klinik baholash shkalasi (5 ballik)</span>
                              <span className="text-brand-700">O‘rtacha: {evt.avgScore} / 5.0</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-[11px] text-charcoal-600 font-medium">
                              <span className="bg-white p-1.5 rounded-[6px] border border-warm-200 truncate">Harakat: <strong>{evt.scores.movement}</strong></span>
                              <span className="bg-white p-1.5 rounded-[6px] border border-warm-200 truncate">Koordinatsiya: <strong>{evt.scores.coordination}</strong></span>
                              <span className="bg-white p-1.5 rounded-[6px] border border-warm-200 truncate">Mushak tonusi: <strong>{evt.scores.flexibility}</strong></span>
                              <span className="bg-white p-1.5 rounded-[6px] border border-warm-200 truncate">Chidamlilik: <strong>{evt.scores.activityTolerance}</strong></span>
                              <span className="bg-white p-1.5 rounded-[6px] border border-warm-200 truncate">Reaksiya: <strong>{evt.scores.sessionResponse}</strong></span>
                            </div>
                          </div>
                        )}

                        {/* Recommendation Highlight Callout (if available) */}
                        {evt.recommendation && (
                          <div
                            className="p-3.5 rounded-[12px] bg-emerald-50/70 border border-emerald-200/80 text-emerald-950 space-y-1.5"
                            onClick={e => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                                <Stethoscope className="w-4 h-4 text-emerald-600" />
                                <span>Ota-ona uchun tavsiya va uy mashqlari</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyRecommendation(evt.id, evt.recommendation!)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-white/80 hover:bg-white px-2 py-0.5 rounded-[6px] border border-emerald-200 shadow-2xs transition-colors cursor-pointer"
                                title="Tavsiyani nusxalash"
                              >
                                {copiedId === evt.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Nusxalandi!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Nusxalash</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <p className="text-xs font-medium text-emerald-900 leading-relaxed">
                              {evt.recommendation}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Card Footer / View Details */}
                      <div className="pt-3 mt-3 border-t border-warm-100 flex items-center justify-between text-xs text-charcoal-400">
                        <span className="font-medium text-[11px]">
                          ID: <span className="font-mono">{evt.id}</span>
                        </span>
                        <div className="flex items-center gap-1 text-brand-600 font-semibold group-hover:text-brand-700 group-hover:translate-x-0.5 transition-all text-xs">
                          <span>Batafsil ko‘rish</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary Footer */}
        <div className="px-4 py-3 bg-warm-50/70 border-t border-warm-100 flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal-500 font-medium">
          <div className="flex items-center gap-2 flex-wrap">
            <span>Jami: <strong className="text-charcoal-800 font-bold">{filteredEvents.length}</strong> ta qayd</span>
            <span>•</span>
            <span>Seanslar: <strong className="text-charcoal-800 font-semibold">{tabCounts.session}</strong></span>
            <span>•</span>
            <span>Kuzatuvlar: <strong className="text-charcoal-800 font-semibold">{tabCounts.note}</strong></span>
            <span>•</span>
            <span>Baholashlar: <strong className="text-charcoal-800 font-semibold">{tabCounts.assessment}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-charcoal-500">
            <HeartPulse className="w-3.5 h-3.5 text-brand-600" />
            <span>Har bir qayd bolaning individual reabilitatsiya xaritasida saqlanadi</span>
          </div>
        </div>
      </Card>

      {/* ─── Event Details Modal ─── */}
      <Modal
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title="Klinik qayd tafsilotlari"
        size="lg"
      >
        {selectedEvent && (() => {
          const child = children.find(c => c.id === selectedEvent.childId);
          const spec = specialists.find(s => s.id === selectedEvent.specialistId);
          const parent = parents.find(p => p.id === child?.parentId);
          const childAge = child?.dateOfBirth ? differenceInYears(new Date(), parseISO(child.dateOfBirth)) : null;
          const meta = getEventTypeMeta(selectedEvent.type);

          return (
            <div className="space-y-5">
              {/* Event Type & Header Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-warm-50/80 border border-warm-200">
                <div className="flex items-center gap-3">
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-2xs', meta.nodeBg)}>
                    {meta.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-charcoal-900">{selectedEvent.title}</h4>
                    <p className="text-xs text-charcoal-500">Qayd ID: <span className="font-mono">{selectedEvent.id}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={meta.badgeVariant} className="text-xs font-semibold">
                    {meta.label}
                  </Badge>
                  <span className="text-xs font-semibold text-charcoal-600 bg-white px-2.5 py-1 rounded-[8px] border border-warm-200">
                    {formatDate(selectedEvent.date)}
                  </span>
                </div>
              </div>

              {/* Patient and Specialist Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-warm-200 bg-white space-y-2">
                  <span className="text-[11px] font-bold text-charcoal-400 uppercase tracking-wider block">Bemor bola ma'lumotlari</span>
                  <div className="flex items-center gap-3">
                    <Avatar name={child?.fullName ?? 'Bola'} size="md" className="ring-2 ring-warm-100" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-charcoal-900 truncate">{child?.fullName}</p>
                      <p className="text-xs text-charcoal-500">
                        {childAge !== null ? `${childAge} yosh` : ''} {child?.gender === 'MALE' ? '• O‘g‘il' : '• Qiz'}
                      </p>
                      {child?.diagnosis && (
                        <p className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded-[4px] border border-brand-200 inline-block mt-1 truncate max-w-full">
                          {child.diagnosis}
                        </p>
                      )}
                    </div>
                  </div>
                  {parent && (
                    <div className="pt-2 border-t border-warm-100 text-xs text-charcoal-600">
                      <span>Ota-onasi: <strong>{parent.fullName}</strong> ({parent.phone})</span>
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl border border-warm-200 bg-white space-y-2">
                  <span className="text-[11px] font-bold text-charcoal-400 uppercase tracking-wider block">Mas'ul mutaxassis</span>
                  <div className="flex items-center gap-3">
                    <Avatar name={spec?.fullName ?? 'Mutaxassis'} size="md" className="ring-2 ring-warm-100" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-charcoal-900 truncate">{spec?.fullName}</p>
                      <p className="text-xs text-charcoal-500">{spec?.specialization || 'Bolalar massajchisi'}</p>
                      {spec?.phone && (
                        <p className="text-[11px] text-charcoal-400 mt-0.5">{spec.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessment Breakdown (if Assessment) */}
              {selectedEvent.scores && (
                <div className="p-4 rounded-xl border border-warm-200 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-charcoal-900">5 ballik klinik mezonlar ko‘rsatkichi</span>
                    <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-[6px] border border-brand-200">
                      O‘rtacha: {selectedEvent.avgScore} / 5.0
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { key: 'movement', label: 'Harakat faolligi', val: selectedEvent.scores.movement },
                      { key: 'coordination', label: 'Koordinatsiya', val: selectedEvent.scores.coordination },
                      { key: 'flexibility', label: 'Mushak tonusi (Egiluvchanlik)', val: selectedEvent.scores.flexibility },
                      { key: 'activityTolerance', label: 'Jismoniy chidamlilik', val: selectedEvent.scores.activityTolerance },
                      { key: 'sessionResponse', label: 'Muolajaga ijobiy javob', val: selectedEvent.scores.sessionResponse },
                    ].map(item => (
                      <div key={item.key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-charcoal-700 font-medium">{item.label}</span>
                          <span className="font-bold text-charcoal-900 tabular-nums">{item.val} / 5</span>
                        </div>
                        <ProgressBar
                          value={(item.val / 5) * 100}
                          fillClassName={item.val >= 4 ? 'bg-emerald-600' : item.val === 3 ? 'bg-amber-500' : 'bg-rose-500'}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Observation Content */}
              <div className="p-4 rounded-xl border border-warm-200 bg-white space-y-2">
                <span className="text-xs font-bold text-charcoal-900 block">Klinik xulosa va kuzatuv qaydi</span>
                <p className="text-xs sm:text-sm text-charcoal-700 whitespace-pre-wrap leading-relaxed font-normal">
                  {selectedEvent.content}
                </p>
              </div>

              {/* Home Advice Callout */}
              {selectedEvent.recommendation && (
                <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/90 text-emerald-950 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-bold text-emerald-900">Ota-onaga berilgan maxsus tavsiyalar</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyRecommendation(selectedEvent.id, selectedEvent.recommendation!)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-white px-2.5 py-1 rounded-[6px] border border-emerald-300 shadow-2xs hover:bg-emerald-50 transition-colors cursor-pointer"
                    >
                      {copiedId === selectedEvent.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Nusxalandi!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Nusxalash</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-emerald-900 whitespace-pre-wrap leading-relaxed">
                    {selectedEvent.recommendation}
                  </p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end pt-3 border-t border-warm-100">
                <Button variant="secondary" onClick={() => setSelectedEvent(null)}>
                  Yopish
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ─── Create Note Modal ─── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Yangi rivojlanish qaydi qo‘shish"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Bemor bola"
            required
            value={formData.childId}
            onChange={e => setFormData({ ...formData, childId: e.target.value })}
            options={availableChildren.map(c => ({ value: c.id, label: c.fullName }))}
          />

          {!isSpecialist && (
            <Select
              label="Kuzatuvchi mutaxassis"
              required
              value={formData.specialistId}
              onChange={e => setFormData({ ...formData, specialistId: e.target.value })}
              options={specialists.map(s => ({ value: s.id, label: s.fullName }))}
            />
          )}

          <Textarea
            label="Kuzatuv qaydi yoki muolaja dinamikasi"
            required
            rows={4}
            placeholder="Bolaning mushak tonusi, passiv va faol harakatlari, reabilitatsiyadagi o'zgarishlar..."
            value={formData.note}
            onChange={e => setFormData({ ...formData, note: e.target.value })}
          />

          <Textarea
            label="Ota-ona uchun uy sharoitidagi mashq va tavsiyalar (ixtiyoriy)"
            rows={2}
            placeholder="Uyda har kuni 10 daqiqa oyoq massaji yoki fitbolda mashqlar..."
            value={formData.recommendation}
            onChange={e => setFormData({ ...formData, recommendation: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-warm-100">
            <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
              Bekor qilish
            </Button>
            <Button type="submit">
              Saqlash
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
