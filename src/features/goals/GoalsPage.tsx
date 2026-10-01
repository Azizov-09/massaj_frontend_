// ═══════════════════════════════════════════════════════
//  Goals Page — Rehabilitation Targets & Progress Tracking
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  Target, Plus, CheckCircle2, Clock,
  Edit2, BarChart, Sparkles, Check,
  TrendingUp, Quote, Calendar
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { formatDate, cn } from '@/utils';
import { Card, Badge, Avatar, Select, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea, DatePicker, Slider } from '@/components/ui/primitives';
import type { Goal, GoalStatus } from '@/types';

export function GoalsPage() {
  const { currentUser } = useAuth();
  const children = useStore(s => s.children);
  const goals = useStore(s => s.goals);
  const createGoal = useStore(s => s.createGoal);
  const updateGoal = useStore(s => s.updateGoal);

  const isParent = currentUser?.role === 'PARENT';
  const availableChildren = useMemo(() => {
    if (isParent && currentUser) {
      return children.filter(c => c.parentId === currentUser.id);
    }
    return children;
  }, [children, isParent, currentUser]);
  const parentChildIds = useMemo(() => availableChildren.map(c => c.id), [availableChildren]);

  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // New goal form
  const [newGoal, setNewGoal] = useState(() => ({
    childId: availableChildren[0]?.id ?? '',
    title: '',
    description: '',
    targetDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    progress: 0,
    specialistNote: '',
  }));

  // Edit goal state
  const [editData, setEditData] = useState<{
    progress: number;
    status: GoalStatus;
    specialistNote: string;
  }>({
    progress: 0,
    status: 'ACTIVE',
    specialistNote: '',
  });

  const filteredGoals = useMemo(() => {
    return goals.filter(g => {
      if (isParent && !parentChildIds.includes(g.childId)) return false;
      if (selectedChildId && g.childId !== selectedChildId) return false;
      if (selectedStatus && g.status !== selectedStatus) return false;
      return true;
    });
  }, [goals, selectedChildId, selectedStatus, isParent, parentChildIds]);

  // Statistics
  const stats = useMemo(() => {
    const total = goals.length;
    const achieved = goals.filter(g => g.status === 'COMPLETED').length;
    const inProgress = goals.filter(g => g.status === 'ACTIVE').length;
    const avgProgress = total > 0
      ? Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / total)
      : 0;

    return { total, achieved, inProgress, avgProgress };
  }, [goals]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.childId || !newGoal.title) return;

    createGoal({
      childId: newGoal.childId,
      title: newGoal.title,
      description: newGoal.description,
      targetDate: newGoal.targetDate,
      progress: Number(newGoal.progress),
      status: Number(newGoal.progress) >= 100 ? 'COMPLETED' : 'ACTIVE',
      specialistNote: newGoal.specialistNote || undefined,
    });

    setShowCreateModal(false);
    setNewGoal({
      childId: children[0]?.id ?? '',
      title: '',
      description: '',
      targetDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      progress: 0,
      specialistNote: '',
    });
  };

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setEditData({
      progress: goal.progress,
      status: goal.status,
      specialistNote: goal.specialistNote || '',
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;

    const finalStatus: GoalStatus = editData.progress >= 100 ? 'COMPLETED' : editData.status;

    updateGoal(editingGoal.id, {
      progress: editData.progress,
      status: finalStatus,
      specialistNote: editData.specialistNote,
    });

    setEditingGoal(null);
  };

  const getStatusBadge = (status: GoalStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Bajarildi
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Faol
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-warm-100/80 text-charcoal-600 border border-warm-200/70">
            <span className="w-1.5 h-1.5 rounded-full bg-charcoal-400" />
            To‘xtatilgan
          </span>
        );
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="px-4 lg:px-6 py-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Reabilitatsiya maqsadlari"
        description="Har bir bolaning rivojlanish maqsadlari va ularga erishish foizlari"
        actions={
          !isParent ? (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
              Yangi maqsad
            </Button>
          ) : undefined
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="Jami maqsadlar"
          value={stats.total}
          description="Barcha qo'yilgan maqsadlar"
          icon={<Target className="w-5 h-5 text-brand-600" />}
          accentColor="brand"
          index={0}
        />
        <KpiCard
          label="Erishilgan maqsadlar"
          value={stats.achieved}
          description="To'liq bajarildi"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          accentColor="sage"
          index={1}
        />
        <KpiCard
          label="Jarayonda"
          value={stats.inProgress}
          description="Bajarilayotgan maqsadlar"
          icon={<Clock className="w-5 h-5 text-amber-500" />}
          accentColor="gold"
          index={2}
        />
        <KpiCard
          label="O‘rtacha natija"
          value={`${stats.avgProgress}%`}
          description="Umumiy o'rtacha ko'rsatkich"
          icon={<BarChart className="w-5 h-5 text-blue-500" />}
          accentColor="blue"
          index={3}
        />
      </div>

      {/* Filter strip */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-56">
              <Select
                size="sm"
                triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300"
                value={selectedChildId}
                onChange={e => setSelectedChildId(e.target.value)}
                options={[
                  { value: '', label: 'Barcha bolalar' },
                  ...availableChildren.map(c => ({ value: c.id, label: c.fullName })),
                ]}
                aria-label="Bola bo'yicha filter"
              />
            </div>

            <div className="w-48">
              <Select
                size="sm"
                triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300"
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                options={[
                  { value: '', label: 'Barcha holatlar' },
                  { value: 'ACTIVE', label: 'Faol (Jarayonda)' },
                  { value: 'COMPLETED', label: 'Bajarilgan' },
                  { value: 'PAUSED', label: 'To‘xtatilgan' },
                ]}
                aria-label="Holat bo'yicha filter"
              />
            </div>
          </div>

          <span className="text-xs text-charcoal-400 font-medium">
            {filteredGoals.length} ta maqsad
          </span>
        </div>
      </Card>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            title="Maqsadlar topilmadi"
            description="Tanlangan mezonlar bo‘yicha maqsadlar mavjud emas"
            icon={<Target className="w-6 h-6" />}
            action={
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                Maqsad qo‘shish
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGoals.map((goal) => {
            const child = children.find(c => c.id === goal.childId);

            return (
              <Card
                key={goal.id}
                onClick={() => !isParent && handleOpenEdit(goal)}
                className={cn(
                  'p-5 h-full flex flex-col justify-between rounded-2xl bg-white border border-warm-200/80 shadow-2xs transition-all duration-200 group',
                  !isParent && 'cursor-pointer hover:border-brand-200 hover:shadow-card-hover'
                )}
              >
                <div className="space-y-3">
                  {/* Card Header: Child Avatar + Name + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={child?.fullName ?? 'Bola'} size="xs" />
                      <span className="text-xs font-semibold text-charcoal-800 truncate max-w-[150px]">
                        {child?.fullName}
                      </span>
                    </div>
                    {getStatusBadge(goal.status)}
                  </div>

                  {/* Goal Title & Description */}
                  <div>
                    <h4 className="text-sm font-semibold text-charcoal-900 group-hover:text-brand-600 transition-colors line-clamp-1 break-words">
                      {goal.title}
                    </h4>
                    <p className="text-xs text-charcoal-500 mt-1 line-clamp-2 leading-relaxed min-h-[32px] break-words">
                      {goal.description}
                    </p>
                  </div>

                  {/* Progress Bar with clean modern styling */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-charcoal-500 flex items-center gap-1 font-medium">
                        <TrendingUp className="w-3.5 h-3.5 text-charcoal-400" />
                        Progress
                      </span>
                      <span
                        className={cn(
                          'text-xs font-bold tabular-nums',
                          goal.progress >= 100
                            ? 'text-emerald-600'
                            : goal.progress >= 50
                            ? 'text-brand-600'
                            : 'text-amber-600'
                        )}
                      >
                        {goal.progress}%
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-warm-100 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          goal.progress >= 100
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            : goal.progress >= 50
                            ? 'bg-gradient-to-r from-brand-400 to-brand-600'
                            : 'bg-gradient-to-r from-amber-400 to-amber-500'
                        )}
                        style={{ width: `${Math.min(100, goal.progress)}%` }}
                      />
                    </div>
                  </div>

                  {/* Specialist Sharh / Note Slot (Senior-level clinical observation design) */}
                  <div className="pt-0.5">
                    {goal.specialistNote ? (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          !isParent && handleOpenEdit(goal);
                        }}
                        title={`Mutaxassis sharhi: ${goal.specialistNote}`}
                        className={cn(
                          'w-full rounded-xl bg-warm-50/80 border border-warm-200/75 p-2.5 min-h-[44px] flex items-start gap-2.5 shadow-2xs transition-all',
                          !isParent && 'hover:border-brand-300 hover:bg-brand-50/20 cursor-pointer'
                        )}
                      >
                        <div className="w-6 h-6 rounded-lg bg-brand-50 border border-brand-100/80 flex items-center justify-center shrink-0 mt-0.5 text-brand-600">
                          <Quote className="w-3.5 h-3.5 text-brand-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-[11px] font-semibold text-charcoal-800 leading-tight mb-0.5">
                            Mutaxassis sharhi
                          </span>
                          <p className="text-xs text-charcoal-600 italic leading-relaxed break-words line-clamp-2">
                            “{goal.specialistNote}”
                          </p>
                        </div>
                      </div>
                    ) : (
                      !isParent ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(goal);
                          }}
                          className="w-full p-2.5 rounded-xl border border-dashed border-warm-200/90 hover:border-brand-300 hover:bg-brand-50/40 text-[11px] text-charcoal-400 hover:text-brand-600 flex items-center justify-center gap-1.5 transition-all min-h-[44px] group/note cursor-pointer"
                          title="Mutaxassis izohini qo‘shish"
                        >
                          <Plus className="w-3.5 h-3.5 text-charcoal-400 group-hover/note:text-brand-500 transition-colors" />
                          <span className="font-medium">Izoh kiritilmagan · Qo‘shish</span>
                        </button>
                      ) : (
                        <div className="w-full p-2.5 rounded-xl bg-warm-50/40 border border-warm-200/40 text-[11px] text-charcoal-400 flex items-center justify-center min-h-[44px] italic">
                          Hozircha izoh kiritilmagan
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-3 border-t border-warm-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-charcoal-400 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-charcoal-400 shrink-0" />
                    <span>Muddat: {formatDate(goal.targetDate)}</span>
                  </div>
                  {!isParent && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(goal);
                      }}
                      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-semibold text-charcoal-600 group-hover:text-brand-600 bg-warm-50 group-hover:bg-brand-50/80 border border-warm-200/80 group-hover:border-brand-200 shadow-2xs transition-all duration-150"
                    >
                      <Edit2 className="w-3 h-3 text-charcoal-400 group-hover:text-brand-500 transition-colors" />
                      <span>Yangilash</span>
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── Create Goal Modal ─── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Yangi reabilitatsiya maqsadi"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Select
            label="Bola"
            required
            value={newGoal.childId}
            onChange={e => setNewGoal({ ...newGoal, childId: e.target.value })}
            options={availableChildren.map(c => ({ value: c.id, label: c.fullName }))}
          />

          <Input
            label="Maqsad nomi"
            required
            placeholder="Masalan: Mustaqil 10 metr qadamsiz yurish"
            value={newGoal.title}
            onChange={e => setNewGoal({ ...newGoal, title: e.target.value })}
          />

          <Textarea
            label="Tavsif va mezonlar"
            rows={2}
            placeholder="Kutilayotgan harakat funksiyasi..."
            value={newGoal.description}
            onChange={e => setNewGoal({ ...newGoal, description: e.target.value })}
          />

          <DatePicker
            label="Kutilayotgan muddat"
            required
            value={newGoal.targetDate}
            onChange={e => setNewGoal({ ...newGoal, targetDate: e.target.value })}
          />

          <Slider
            label="Boshlang‘ich progress"
            value={newGoal.progress}
            onChange={val => setNewGoal({ ...newGoal, progress: val })}
            presets={[0, 25, 50, 75, 100]}
          />

          <Textarea
            label="Mutaxassis sharhi (ixtiyoriy)"
            rows={2}
            placeholder="Bolaning holati bo‘yicha dastlabki xulosa yoki ko‘rsatmalar..."
            value={newGoal.specialistNote}
            onChange={e => setNewGoal({ ...newGoal, specialistNote: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-warm-100">
            <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
              Bekor qilish
            </Button>
            <Button type="submit">
              Maqsadni yaratish
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── Edit Goal Modal ─── */}
      <Modal
        isOpen={!!editingGoal}
        onClose={() => setEditingGoal(null)}
        title="Maqsad taraqqiyotini yangilash"
        size="md"
      >
        {editingGoal && (() => {
          const editingChild = children.find(c => c.id === editingGoal.childId);
          const progressDelta = editData.progress - editingGoal.progress;

          return (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* ─── Patient & Objective Summary Card ─── */}
              <div className="p-4 rounded-[14px] bg-warm-50/90 border border-warm-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={editingChild?.fullName ?? 'Bola'} size="sm" />
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-charcoal-900 truncate block">
                        {editingChild?.fullName}
                      </span>
                      <span className="text-[11px] text-charcoal-500 block truncate">
                        {editingChild?.diagnosis || 'Reabilitatsiya dasturi'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] text-[11px] font-semibold bg-white border border-warm-200 text-charcoal-600 shadow-2xs">
                      <Clock className="w-3 h-3 text-brand-500" />
                      {formatDate(editingGoal.targetDate)}
                    </span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-warm-200/70 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-charcoal-900">
                      <Target className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                      <span className="truncate">{editingGoal.title}</span>
                    </div>
                    {editingGoal.description && (
                      <p className="text-xs text-charcoal-500 mt-1 leading-relaxed line-clamp-2">
                        {editingGoal.description}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <span className="text-[10px] text-charcoal-400 block uppercase tracking-wider font-semibold">
                      Boshlang‘ich
                    </span>
                    <span className="text-xs font-bold text-charcoal-700">
                      {editingGoal.progress}%
                    </span>
                    {progressDelta !== 0 && (
                      <span
                        className={cn(
                          'block text-[11px] font-extrabold',
                          progressDelta > 0 ? 'text-emerald-600' : 'text-amber-600'
                        )}
                      >
                        {progressDelta > 0 ? `+${progressDelta}%` : `${progressDelta}%`}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* ─── Interactive Progress Slider ─── */}
              <Slider
                label="Reabilitatsiya progressi"
                value={editData.progress}
                onChange={val => {
                  const nextStatus: GoalStatus = val >= 100
                    ? 'COMPLETED'
                    : (editData.status === 'COMPLETED' ? 'ACTIVE' : editData.status);
                  setEditData({ ...editData, progress: val, status: nextStatus });
                }}
                step={5}
                presets={[0, 25, 50, 75, 100]}
              />

              {/* ─── Segmented Status Control ─── */}
              <div>
                <label className="block text-xs font-bold text-charcoal-800 mb-1.5">
                  Maqsad holati
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-warm-100/80 rounded-[12px] border border-warm-200/90">
                  <button
                    type="button"
                    onClick={() => {
                      setEditData({
                        ...editData,
                        status: 'ACTIVE',
                      });
                    }}
                    className={cn(
                      'flex items-center justify-center gap-1.5 py-2 px-2 rounded-[9px] text-xs font-bold transition-all active:scale-95',
                      editData.status === 'ACTIVE'
                        ? 'bg-white text-brand-700 shadow-xs border border-brand-200/70 ring-1 ring-brand-500/10'
                        : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-white/50'
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="truncate">Faol</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditData({
                        ...editData,
                        status: 'COMPLETED',
                        progress: 100,
                      });
                    }}
                    className={cn(
                      'flex items-center justify-center gap-1.5 py-2 px-2 rounded-[9px] text-xs font-bold transition-all active:scale-95',
                      editData.status === 'COMPLETED'
                        ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200/70 ring-1 ring-emerald-500/10'
                        : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-white/50'
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="truncate">Bajarildi (100%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditData({
                        ...editData,
                        status: 'PAUSED',
                      });
                    }}
                    className={cn(
                      'flex items-center justify-center gap-1.5 py-2 px-2 rounded-[9px] text-xs font-bold transition-all active:scale-95',
                      editData.status === 'PAUSED'
                        ? 'bg-white text-charcoal-800 shadow-xs border border-warm-300 ring-1 ring-charcoal-500/10'
                        : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-white/50'
                    )}
                  >
                    <span className="w-2 h-2 rounded-full bg-charcoal-400 flex-shrink-0" />
                    <span className="truncate">To‘xtatilgan</span>
                  </button>
                </div>
              </div>

              {/* ─── Specialist Sharh & Result with Quick Templates ─── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-charcoal-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-500" />
                    <span>Mutaxassis sharhi va xulosasi</span>
                  </label>
                  <span className="text-[11px] text-charcoal-400 font-medium">Tezkor shablonlar:</span>
                </div>

                {/* Quick note templates */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    'Dinamika ijobiy',
                    'Mashqlarni mustaqil bajardi',
                    'Mushak tonusi yaxshilandi',
                    'Keyingi bosqichga tavsiya',
                    'Qo‘shimcha mashqlar tavsiya etildi',
                  ].map(template => (
                    <button
                      key={template}
                      type="button"
                      onClick={() => {
                        const cur = editData.specialistNote.trim();
                        const next = cur ? `${cur}. ${template}` : template;
                        setEditData({ ...editData, specialistNote: next });
                      }}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-warm-100/90 hover:bg-brand-50 hover:text-brand-700 text-charcoal-700 transition-all border border-warm-200/80 hover:border-brand-200 active:scale-95 cursor-pointer shadow-2xs"
                    >
                      + {template}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    value={editData.specialistNote}
                    onChange={e => setEditData({ ...editData, specialistNote: e.target.value })}
                    placeholder="Bolaning reabilitatsiya jarayoni, erishgan natijalari va keyingi tavsiyalarni yozing..."
                    className={cn(
                      'w-full bg-white border border-warm-300 rounded-[12px] p-3 text-xs sm:text-sm text-charcoal-900 placeholder:text-charcoal-400',
                      'outline-none transition-all duration-150 resize-y min-h-[84px]',
                      'hover:border-warm-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 shadow-2xs'
                    )}
                  />
                  {editData.specialistNote && (
                    <button
                      type="button"
                      onClick={() => setEditData({ ...editData, specialistNote: '' })}
                      className="absolute right-2.5 bottom-2.5 text-[10px] font-semibold text-charcoal-400 hover:text-danger-main px-2 py-0.5 rounded-md bg-warm-100 hover:bg-red-50 border border-warm-200/60 transition-colors"
                      title="Sharhni tozalash"
                    >
                      Tozalash
                    </button>
                  )}
                </div>
              </div>

              {/* ─── Actions ─── */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-warm-100">
                <Button variant="secondary" type="button" onClick={() => setEditingGoal(null)}>
                  Bekor qilish
                </Button>
                <Button type="submit" leftIcon={<Check className="w-4 h-4" />}>
                  O‘zgarishlarni saqlash
                </Button>
              </div>
            </form>
          );
        })()}
      </Modal>
    </div>
  );
}
