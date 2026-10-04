// ═══════════════════════════════════════════════════════
//  Assessments Page — Senior Medical/Wellness CRM Standard
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Plus, AlertCircle, TrendingUp, ArrowRight,
  Search, X, Calendar, User, Eye, LayoutGrid, Table as TableIcon,
  CheckCircle2, Award, Baby, Star, Sparkles, Filter, ChevronRight
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { formatDate, cn } from '@/utils';
import { differenceInYears, parseISO } from 'date-fns';
import { Card, Avatar, Badge, Select, EmptyState, ProgressBar, Textarea } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { DataTable, Column } from '@/components/tables/DataTable';
import { Modal } from '@/components/ui/Modal';
import type { Assessment, AssessmentScores } from '@/types';

type ScoreFilter = 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW';
type ViewMode = 'TABLE' | 'CARDS';

const criteriaLabels = [
  { key: 'movement' as const, label: 'Harakat faolligi', desc: 'Faol va passiv harakatlar diapazoni' },
  { key: 'coordination' as const, label: 'Koordinatsiya', desc: 'Muvozanat va fazodagi harakat aniqligi' },
  { key: 'flexibility' as const, label: 'Mushak tonusi (Egiluvchanlik)', desc: 'Spastika, gipotonus va elastiklik' },
  { key: 'activityTolerance' as const, label: 'Chidamlilik', desc: 'Jismoniy yuklamalarga chidash qobiliyati' },
  { key: 'sessionResponse' as const, label: 'Muolajaga javob', desc: 'Massaj va mashqlarga ijobiy emotsional reaksiya' },
];

export function AssessmentsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const assessments = useStore(s => s.assessments);
  const children = useStore(s => s.children);
  const specialists = useStore(s => s.specialists);
  const createAssessment = useStore(s => s.createAssessment);

  const isParent = currentUser?.role === 'PARENT';
  const isSpecialist = currentUser?.role === 'SPECIALIST';

  const myChildIds = useMemo(() => {
    if (isParent && currentUser) {
      return children.filter(c => c.parentId === currentUser.id).map(c => c.id);
    }
    return [];
  }, [children, isParent, currentUser]);

  const baseAssessments = useMemo(() => {
    if (isParent && currentUser) {
      return assessments.filter(a => myChildIds.includes(a.childId));
    }
    if (isSpecialist && currentUser) {
      return assessments.filter(a => a.specialistId === currentUser.id);
    }
    return assessments;
  }, [assessments, isParent, isSpecialist, currentUser, myChildIds]);

  const [search, setSearch] = useState('');
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [specialistFilter, setSpecialistFilter] = useState<string>('');
  const [scoreTab, setScoreTab] = useState<ScoreFilter>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('TABLE');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingAssessment, setViewingAssessment] = useState<Assessment | null>(null);

  // New assessment form state
  const [formData, setFormData] = useState<{
    childId: string;
    specialistId: string;
    scores: AssessmentScores;
    professionalObservation: string;
  }>({
    childId: children[0]?.id ?? '',
    specialistId: currentUser?.role === 'SPECIALIST' ? currentUser.id : (specialists[0]?.id ?? ''),
    scores: {
      movement: 3,
      coordination: 3,
      flexibility: 3,
      activityTolerance: 3,
      sessionResponse: 3,
    },
    professionalObservation: '',
  });

  // Calculate average scores helper
  const calcAvg = (scores: AssessmentScores) => {
    const sum = Object.values(scores).reduce((a, b) => a + b, 0);
    return Number((sum / 5).toFixed(1));
  };

  // Overall statistics
  const stats = useMemo(() => {
    if (baseAssessments.length === 0) {
      return { total: 0, avgScore: 0, highCount: 0, uniqueChildren: 0 };
    }
    const totalScore = baseAssessments.reduce((acc, a) => acc + calcAvg(a.scores), 0);
    const avgScore = Number((totalScore / baseAssessments.length).toFixed(1));
    const highCount = baseAssessments.filter(a => calcAvg(a.scores) >= 4.0).length;
    const uniqueChildren = new Set(baseAssessments.map(a => a.childId)).size;

    return {
      total: baseAssessments.length,
      avgScore,
      highCount,
      uniqueChildren,
    };
  }, [baseAssessments]);

  // Tab counts
  const tabCounts = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;

    baseAssessments.forEach(a => {
      const avg = calcAvg(a.scores);
      if (avg >= 4.0) high++;
      else if (avg >= 3.0) medium++;
      else low++;
    });

    return { all: baseAssessments.length, high, medium, low };
  }, [baseAssessments]);

  // Filtered assessments
  const filtered = useMemo(() => {
    return baseAssessments.filter(a => {
      // Child filter
      if (selectedChildId && a.childId !== selectedChildId) return false;

      // Specialist filter
      if (specialistFilter && a.specialistId !== specialistFilter) return false;

      // Score filter
      const avg = calcAvg(a.scores);
      if (scoreTab === 'HIGH' && avg < 4.0) return false;
      if (scoreTab === 'MEDIUM' && (avg < 3.0 || avg >= 4.0)) return false;
      if (scoreTab === 'LOW' && avg >= 3.0) return false;

      // Text search
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const child = children.find(c => c.id === a.childId);
        const spec = specialists.find(s => s.id === a.specialistId);
        const matchChild = child?.fullName?.toLowerCase().includes(q);
        const matchSpec = spec?.fullName?.toLowerCase().includes(q);
        const matchObs = (a.professionalObservation || '').toLowerCase().includes(q);
        if (!matchChild && !matchSpec && !matchObs) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [baseAssessments, selectedChildId, specialistFilter, scoreTab, search, children, specialists]);

  const hasActiveFilters = Boolean(
    search || selectedChildId || specialistFilter || scoreTab !== 'ALL'
  );

  const resetAllFilters = () => {
    setSearch('');
    setSelectedChildId('');
    setSpecialistFilter('');
    setScoreTab('ALL');
  };

  // Comparison block if specific child has >= 2 assessments
  const comparison = useMemo(() => {
    const targetChildId = selectedChildId || (children[0]?.id ?? '');
    if (!targetChildId) return null;

    const childAssessments = baseAssessments
      .filter(a => a.childId === targetChildId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (childAssessments.length < 2) return null;
    return {
      child: children.find(c => c.id === targetChildId),
      initial: childAssessments[0],
      latest: childAssessments[childAssessments.length - 1],
    };
  }, [baseAssessments, selectedChildId, children]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSpecialistId = currentUser?.role === 'SPECIALIST' ? currentUser.id : formData.specialistId;
    if (!formData.childId || !finalSpecialistId) return;

    createAssessment({
      childId: formData.childId,
      specialistId: finalSpecialistId,
      scores: formData.scores,
      professionalObservation: formData.professionalObservation,
      date: new Date().toISOString().split('T')[0],
    });

    setShowCreateModal(false);
    setFormData(prev => ({
      ...prev,
      scores: { movement: 3, coordination: 3, flexibility: 3, activityTolerance: 3, sessionResponse: 3 },
      professionalObservation: '',
    }));
  };

  const getScoreBadge = (score: number) => {
    if (score >= 4) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 font-bold';
    }
    if (score === 3) {
      return 'bg-amber-50 text-amber-800 border-amber-200/80 font-bold';
    }
    return 'bg-rose-50 text-rose-700 border-rose-200/80 font-bold';
  };

  const getAvgScoreBadge = (avg: number) => {
    if (avg >= 4.0) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (avg >= 3.0) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  const columns: Column<Assessment>[] = [
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
      header: 'Ko‘rik sanasi',
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
      key: 'scores',
      header: '5 ballik mezonlar',
      className: 'py-3.5',
      cell: (row) => (
        <div className="flex items-center gap-1 flex-wrap max-w-[220px]">
          {criteriaLabels.map(({ key, label }) => (
            <span
              key={key}
              title={`${label}: ${row.scores[key]} ball`}
              className={cn(
                'inline-flex items-center justify-center w-6 h-6 rounded-[6px] text-[11px] border tabular-nums shadow-2xs',
                getScoreBadge(row.scores[key])
              )}
            >
              {row.scores[key]}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'avgScore',
      header: 'O‘rtacha ball',
      sortable: true,
      className: 'py-3.5',
      cell: (row) => {
        const avg = calcAvg(row.scores);
        return (
          <span
            className={cn(
              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] text-xs font-bold border tabular-nums shadow-2xs',
              getAvgScoreBadge(avg)
            )}
          >
            <Star className="w-3 h-3 fill-current" />
            {avg} / 5.0
          </span>
        );
      },
    },
    {
      key: 'professionalObservation',
      header: 'Kuzatuv xulosasi',
      className: 'py-3.5',
      cell: (row) => (
        <span className="text-xs text-charcoal-600 max-w-xs block truncate" title={row.professionalObservation}>
          {row.professionalObservation || '—'}
        </span>
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
            onClick={() => setViewingAssessment(row)}
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
        title={isParent ? "Farzandim klinik baholashlari" : "Klinik baholashlar (Assessments)"}
        description="5 ballik tibbiy-pediatrik mezonlar asosida motorika, mushak tonusi va reabilitatsiya dinamikasini tizimli monitoring qilish"
        actions={
          !isParent ? (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
              Yangi baholash
            </Button>
          ) : undefined
        }
      />

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setScoreTab('ALL')}
          className={cn(
            'cursor-pointer transition-all duration-200 rounded-[14px]',
            scoreTab === 'ALL' ? 'ring-2 ring-brand-500 shadow-sm' : 'hover:scale-[1.01]'
          )}
          title="Barcha baholashlar"
        >
          <KpiCard
            label="Jami baholashlar"
            value={stats.total}
            description="Tizimdagi qaydlar soni"
            icon={<Activity className="w-5 h-5 text-brand-600" />}
            accentColor="brand"
            index={0}
          />
        </div>

        <div
          onClick={() => setScoreTab('HIGH')}
          className={cn(
            'cursor-pointer transition-all duration-200 rounded-[14px]',
            scoreTab === 'HIGH' ? 'ring-2 ring-emerald-500 shadow-sm' : 'hover:scale-[1.01]'
          )}
          title="Yuqori ko'rsatkichli baholashlar (>= 4.0)"
        >
          <KpiCard
            label="O‘rtacha ko‘rsatkich"
            value={`${stats.avgScore} / 5.0`}
            description="Umumiy reabilitatsiya balli"
            icon={<Award className="w-5 h-5 text-emerald-600" />}
            accentColor="sage"
            index={1}
          />
        </div>

        <div
          onClick={() => setScoreTab('HIGH')}
          className={cn(
            'cursor-pointer transition-all duration-200 rounded-[14px]',
            scoreTab === 'HIGH' ? 'ring-2 ring-amber-500 shadow-sm' : 'hover:scale-[1.01]'
          )}
          title="Yuqori natijali bolalar"
        >
          <KpiCard
            label="Optimal dinamika"
            value={`${stats.highCount} ta`}
            description="4.0 balldan yuqori natijalar"
            icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
            accentColor="gold"
            index={2}
          />
        </div>

        <div>
          <KpiCard
            label="Qamrab olingan bolalar"
            value={`${stats.uniqueChildren} nafar`}
            description="Tizimli nazoratdagi bemorlar"
            icon={<Baby className="w-5 h-5 text-blue-600" />}
            accentColor="blue"
            index={3}
          />
        </div>
      </div>

      {/* Clinical Protocol Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-brand-50/70 border border-brand-200/80 shadow-2xs flex items-start gap-3.5 text-xs text-charcoal-700">
        <AlertCircle className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-charcoal-900">Professional reabilitatsiya kuzatuv protokoli</p>
          <p className="text-charcoal-600 leading-relaxed">
            Baholashlar avtomatlashtirilgan yakuniy tashxis emas, balki shifokor-reabilitolog tomonidan bolaning
            <strong> harakat faolligi, koordinatsiyasi, mushak tonusi, jismoniy chidamliligi va muolajalarga javob reaksiyasini</strong> 5 ballik standart shkala bo‘yicha tizimli solishtirish vositasidir.
          </p>
        </div>
      </div>

      {/* Comparison Telemetry Card (when available) */}
      {comparison && (
        <Card className="p-5 bg-gradient-to-br from-white via-white to-warm-50/60 border border-warm-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-warm-100">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-600" />
                <h3 className="text-sm sm:text-base font-bold text-charcoal-900">
                  Dinamik Taqqoslash: {comparison.child?.fullName}
                </h3>
              </div>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Dastlabki ko'rik va oxirgi reabilitatsiya tekshiruvi natijalari solishtirmasi
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-[8px] bg-warm-100 border border-warm-200 text-charcoal-700 shadow-2xs">
                Dastlabki: {formatDate(comparison.initial.date)}
              </span>
              <ArrowRight className="w-4 h-4 text-charcoal-400" />
              <span className="px-2.5 py-1 rounded-[8px] bg-brand-600 text-white shadow-2xs">
                So‘nggi: {formatDate(comparison.latest.date)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {criteriaLabels.map(({ key, label }) => {
              const init = comparison.initial.scores[key];
              const late = comparison.latest.scores[key];
              const diff = late - init;

              return (
                <div key={key} className="bg-white p-3.5 rounded-[12px] border border-warm-200 shadow-2xs space-y-2">
                  <span className="text-[11px] font-semibold text-charcoal-600 block truncate" title={label}>
                    {label}
                  </span>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-charcoal-400 tabular-nums">{init}</span>
                      <span className="text-xs text-charcoal-300">→</span>
                      <span className="text-lg font-extrabold text-charcoal-900 tabular-nums">{late}</span>
                      <span className="text-[10px] text-charcoal-400 font-medium">/ 5</span>
                    </div>
                    {diff > 0 ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-[4px] border border-emerald-200 tabular-nums">
                        +{diff}
                      </span>
                    ) : diff === 0 ? (
                      <span className="text-xs font-semibold text-charcoal-400 bg-warm-100 px-1.5 py-0.5 rounded-[4px] tabular-nums">
                        0
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-[4px] border border-rose-200 tabular-nums">
                        {diff}
                      </span>
                    )}
                  </div>
                  <ProgressBar value={(late / 5) * 100} fillClassName={late >= 4 ? 'bg-emerald-600' : late === 3 ? 'bg-amber-500' : 'bg-rose-500'} />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Main Table & Controls Card */}
      <Card className="overflow-visible border border-warm-200/90 shadow-xs">
        {/* Top Status Tabs — Desktop/tablet filter pills */}
        <div className="hidden sm:flex px-4 py-3 bg-warm-50/70 border-b border-warm-200/80 items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto touch-scroll-x scrollbar-thin py-0.5 w-full sm:w-auto -mx-0.5 px-0.5">
            {[
              { key: 'ALL', label: 'Barchasi', count: tabCounts.all },
              { key: 'HIGH', label: 'Optimal (4-5 ball)', count: tabCounts.high },
              { key: 'MEDIUM', label: 'O‘rtacha (3 ball)', count: tabCounts.medium },
              { key: 'LOW', label: 'Past (<3 ball)', count: tabCounts.low },
            ].map(tab => {
              const isActive = scoreTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={(e) => {
                    setScoreTab(tab.key as ScoreFilter);
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
                      'text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums',
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
                onClick={() => setViewMode('TABLE')}
                className={cn(
                  'p-1.5 rounded-[6px] transition-colors cursor-pointer',
                  viewMode === 'TABLE' ? 'bg-brand-50 text-brand-700' : 'text-charcoal-400 hover:text-charcoal-700'
                )}
                title="Jadval ko'rinishi"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('CARDS')}
                className={cn(
                  'p-1.5 rounded-[6px] transition-colors cursor-pointer',
                  viewMode === 'CARDS' ? 'bg-brand-50 text-brand-700' : 'text-charcoal-400 hover:text-charcoal-700'
                )}
                title="Karta ko'rinishi"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <span className="text-xs font-medium text-charcoal-500 bg-white px-2.5 py-1 rounded-[8px] border border-warm-200/80 shadow-2xs">
              Ko‘rsatilmoqda: <strong className="text-charcoal-900 font-bold">{filtered.length}</strong> / {baseAssessments.length}
            </span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-3.5 bg-white border-b border-warm-100 flex flex-wrap items-center gap-2.5">
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

          {/* Score / Status Tab Select */}
          <div className="w-full sm:w-48">
            <Select
              size="sm"
              triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 font-medium w-full"
              value={scoreTab}
              onChange={e => setScoreTab(e.target.value as ScoreFilter)}
              options={[
                { value: 'ALL', label: `Barcha natijalar (${tabCounts.all})` },
                { value: 'HIGH', label: `Optimal 4-5 ball (${tabCounts.high})` },
                { value: 'MEDIUM', label: `O‘rtacha 3 ball (${tabCounts.medium})` },
                { value: 'LOW', label: `Past <3 ball (${tabCounts.low})` },
              ]}
              aria-label="Baholash darajasi bo'yicha filter"
            />
          </div>

          {!isSpecialist ? (
            <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:items-center sm:gap-2.5 sm:w-auto">
              {/* Child Select */}
              <div className="w-full sm:w-56">
                <Select
                  size="sm"
                  triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 font-medium w-full"
                  value={selectedChildId}
                  onChange={e => setSelectedChildId(e.target.value)}
                  options={[
                    { value: '', label: 'Barcha bolalar' },
                    ...children.map(c => ({ value: c.id, label: c.fullName })),
                  ]}
                  aria-label="Bola bo'yicha filter"
                />
              </div>

              {/* Specialist Select */}
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
            </div>
          ) : (
            <div className="w-full sm:w-56">
              <Select
                size="sm"
                triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 font-medium w-full"
                value={selectedChildId}
                onChange={e => setSelectedChildId(e.target.value)}
                options={[
                  { value: '', label: 'Barcha bolalar' },
                  ...children.map(c => ({ value: c.id, label: c.fullName })),
                ]}
                aria-label="Bola bo'yicha filter"
              />
            </div>
          )}

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-[10px] text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-colors shadow-2xs cursor-pointer w-full sm:w-auto ml-auto sm:ml-0"
              title="Barcha filtrlarni bekor qilish"
            >
              <X className="w-3.5 h-3.5" />
              <span>Filtrlarni tozalash</span>
            </button>
          )}
        </div>

        {/* Content: Table View vs Cards View */}
        {viewMode === 'TABLE' ? (
          <DataTable
            data={filtered}
            columns={columns}
            keyExtractor={r => r.id}
            tableClassName="min-w-[900px]"
            onRowClick={row => setViewingAssessment(row)}
            emptyTitle="Baholashlar topilmadi"
            emptyDescription={
              hasActiveFilters
                ? "Kiritilgan filtr parametrlariga mos keluvchi baholashlar topilmadi."
                : "Hozircha hech qanday professional baholash qayd etilmagan."
            }
            emptyIcon={<Activity className="w-6 h-6 text-charcoal-400" />}
            emptyAction={
              hasActiveFilters ? (
                <Button size="sm" variant="secondary" onClick={resetAllFilters} leftIcon={<X className="w-3.5 h-3.5" />}>
                  Filtrlarni tozalash
                </Button>
              ) : !isParent ? (
                <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowCreateModal(true)}>
                  Baholash qo'shish
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="p-4 sm:p-5 space-y-4">
            {filtered.length === 0 ? (
              <EmptyState
                title="Baholashlar topilmadi"
                description="Tanlangan mezonlar bo'yicha baholash qaydlari mavjud emas."
                icon={<Activity className="w-6 h-6 text-charcoal-400" />}
                className="py-12"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map(asmnt => {
                  const child = children.find(c => c.id === asmnt.childId);
                  const spec = specialists.find(s => s.id === asmnt.specialistId);
                  const avg = calcAvg(asmnt.scores);

                  return (
                    <div
                      key={asmnt.id}
                      onClick={() => setViewingAssessment(asmnt)}
                      className="p-4 rounded-xl border border-warm-200/90 bg-white hover:border-brand-300 hover:shadow-xs transition-all cursor-pointer space-y-3.5"
                    >
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-warm-100">
                        <div className="flex items-center gap-3">
                          <Avatar name={child?.fullName || 'Bola'} size="md" className="ring-2 ring-warm-100" />
                          <div>
                            <h4 className="text-sm font-bold text-charcoal-900">{child?.fullName}</h4>
                            <p className="text-xs text-charcoal-500 mt-0.5">
                              {spec?.fullName} • {formatDate(asmnt.date)}
                            </p>
                          </div>
                        </div>
                        <span className={cn('px-2.5 py-1 rounded-[6px] text-xs font-bold border tabular-nums', getAvgScoreBadge(avg))}>
                          ★ {avg} / 5.0
                        </span>
                      </div>

                      {/* 5 metric badges */}
                      <div className="grid grid-cols-5 gap-1.5">
                        {criteriaLabels.map(({ key, label }) => (
                          <div key={key} className="p-1.5 rounded-[8px] bg-warm-50 text-center border border-warm-100">
                            <span className="text-[10px] text-charcoal-500 block truncate" title={label}>{label.split(' ')[0]}</span>
                            <span className={cn('inline-block text-xs font-bold mt-0.5', asmnt.scores[key] >= 4 ? 'text-emerald-700' : asmnt.scores[key] === 3 ? 'text-amber-700' : 'text-rose-700')}>
                              {asmnt.scores[key]}
                            </span>
                          </div>
                        ))}
                      </div>

                      {asmnt.professionalObservation && (
                        <p className="text-xs text-charcoal-600 line-clamp-2 leading-relaxed bg-warm-50/60 p-2.5 rounded-[8px] border border-warm-100/80">
                          {asmnt.professionalObservation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Table Summary Footer */}
        <div className="px-4 py-3 bg-warm-50/50 border-t border-warm-100 flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal-500">
          <div className="flex items-center gap-4 flex-wrap">
            <span>Jami: <strong className="text-charcoal-800 font-bold">{baseAssessments.length} ta baholash</strong></span>
            <span className="hidden sm:inline-block text-warm-300">•</span>
            <span className="text-emerald-700 font-medium">O‘rtacha ko‘rsatkich: <strong className="font-bold">{stats.avgScore} / 5.0</strong></span>
            <span className="hidden sm:inline-block text-warm-300">•</span>
            <span className="text-brand-700 font-medium">Optimal natijalar: <strong className="font-bold">{stats.highCount} ta</strong></span>
          </div>
          <span className="text-[11px] text-charcoal-400 font-medium">
            Ko'rish uchun qator ustiga bosing
          </span>
        </div>
      </Card>

      {/* Assessment Details Modal */}
      {viewingAssessment && (
        <Modal
          isOpen={!!viewingAssessment}
          onClose={() => setViewingAssessment(null)}
          title="Klinik baholash bayonnomasi"
          size="md"
        >
          {(() => {
            const child = children.find(c => c.id === viewingAssessment.childId);
            const spec = specialists.find(s => s.id === viewingAssessment.specialistId);
            const avg = calcAvg(viewingAssessment.scores);

            return (
              <div className="space-y-4">
                {/* Header card with child and overall rating */}
                <div className="p-3.5 rounded-[12px] bg-warm-50 border border-warm-200/80 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Avatar name={child?.fullName || 'Bola'} size="md" className="ring-2 ring-warm-100" />
                    <div>
                      <h4 className="text-sm font-bold text-charcoal-900">{child?.fullName}</h4>
                      <p className="text-xs text-charcoal-500">
                        {spec?.fullName} • {formatDate(viewingAssessment.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-charcoal-400 font-bold uppercase tracking-wider block">O'rtacha ball</span>
                    <span className={cn('inline-flex items-center gap-1 px-3 py-1 rounded-[6px] text-sm font-extrabold border shadow-2xs mt-0.5', getAvgScoreBadge(avg))}>
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {avg} / 5.0
                    </span>
                  </div>
                </div>

                {/* 5 Criteria Score Bars */}
                <div className="space-y-2.5 p-3.5 rounded-[12px] border border-warm-200/80 bg-white">
                  <h5 className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider mb-2">
                    5 Ballik batafsil mezonlar
                  </h5>
                  {criteriaLabels.map(({ key, label, desc }) => {
                    const score = viewingAssessment.scores[key];
                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-charcoal-800">{label}</span>
                            <span className="text-[10px] text-charcoal-400 ml-1.5 hidden sm:inline">({desc})</span>
                          </div>
                          <span className={cn('px-2 py-0.5 rounded-[4px] text-xs font-bold border tabular-nums', getScoreBadge(score))}>
                            {score} / 5
                          </span>
                        </div>
                        <ProgressBar value={(score / 5) * 100} fillClassName={score >= 4 ? 'bg-emerald-600' : score === 3 ? 'bg-amber-500' : 'bg-rose-500'} />
                      </div>
                    );
                  })}
                </div>

                {/* Observation Notes */}
                {viewingAssessment.professionalObservation && (
                  <div className="p-3.5 rounded-[12px] bg-warm-50/80 border border-warm-200/80 text-xs space-y-1">
                    <span className="font-bold text-charcoal-900 block">Shifokor-reabilitolog xulosasi:</span>
                    <p className="text-charcoal-700 leading-relaxed">{viewingAssessment.professionalObservation}</p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-warm-100">
                  <Button variant="secondary" onClick={() => setViewingAssessment(null)}>
                    Yopish
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Create Assessment Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Yangi professional baholash kiritish"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Bola"
              required
              value={formData.childId}
              onChange={e => setFormData({ ...formData, childId: e.target.value })}
              options={children.map(c => ({ value: c.id, label: c.fullName }))}
            />

            {currentUser?.role === 'SPECIALIST' ? (
              <div>
                <label className="block text-xs font-semibold text-charcoal-700 mb-1.5">Mutaxassis</label>
                <div className="px-3 py-2 text-xs rounded-[10px] bg-warm-100 border border-warm-200 text-charcoal-700 font-medium">
                  {currentUser.fullName} (Siz)
                </div>
              </div>
            ) : (
              <Select
                label="Mutaxassis"
                required
                value={formData.specialistId}
                onChange={e => setFormData({ ...formData, specialistId: e.target.value })}
                options={specialists.map(s => ({ value: s.id, label: s.fullName }))}
              />
            )}
          </div>

          <div className="pt-2">
            <p className="text-xs font-bold text-charcoal-800 mb-2">
              5 ballik mezonlar (1: Eng past, 5: Optimal):
            </p>
            <div className="space-y-3 bg-warm-50/70 p-4 rounded-[14px] border border-warm-200/90 shadow-2xs">
              {criteriaLabels.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium text-charcoal-700">{label}</span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            scores: { ...formData.scores, [key]: val },
                          })
                        }
                        className={cn(
                          'w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer',
                          formData.scores[key] === val
                            ? 'bg-charcoal-900 text-white shadow-xs scale-105'
                            : 'bg-white border border-warm-200 text-charcoal-700 hover:bg-warm-100 shadow-2xs'
                        )}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Textarea
            label="Professional kuzatuv va xulosa"
            required
            rows={3}
            placeholder="Bolaning harakat faolligi, tonusdagi o‘zgarishlar va seansdagi xulq-atvori..."
            value={formData.professionalObservation}
            onChange={e => setFormData({ ...formData, professionalObservation: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-warm-100">
            <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
              Bekor qilish
            </Button>
            <Button type="submit">
              Baholashni saqlash
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
