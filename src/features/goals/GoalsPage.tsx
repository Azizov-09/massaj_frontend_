// ═══════════════════════════════════════════════════════
//  Goals Page — Rehabilitation Targets & Progress Tracking
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  Target, Plus, CheckCircle2, Clock,
  Edit2, BarChart
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { formatDate } from '@/utils';
import { Card, Badge, Avatar, Select, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea, DatePicker } from '@/components/ui/primitives';
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
        return <Badge variant="success">Bajarildi</Badge>;
      case 'ACTIVE':
        return <Badge variant="warning">Faol</Badge>;
      case 'PAUSED':
        return <Badge variant="danger">To‘xtatilgan</Badge>;
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
                className="p-5 h-full flex flex-col justify-between hover:border-warm-300 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar name={child?.fullName ?? 'Bola'} size="xs" />
                      <span className="text-xs font-bold text-charcoal-700 truncate max-w-[130px]">
                        {child?.fullName}
                      </span>
                    </div>
                    {getStatusBadge(goal.status)}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-charcoal-900 group-hover:text-brand-600 transition-colors">
                      {goal.title}
                    </h4>
                    <p className="text-xs text-charcoal-500 mt-1 line-clamp-2 leading-relaxed">
                      {goal.description}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-charcoal-500">Progress</span>
                      <span className="text-brand-600 font-extrabold">{goal.progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-warm-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          goal.progress >= 100
                            ? 'bg-sage-600'
                            : goal.progress >= 50
                            ? 'bg-brand-500'
                            : 'bg-gold-500'
                        }`}
                        style={{ width: `${Math.min(100, goal.progress)}%` }}
                      />
                    </div>
                  </div>

                  {goal.specialistNote && (
                    <div className="p-2.5 rounded-[10px] bg-warm-50/80 text-[11px] text-charcoal-600 border border-warm-200/80 shadow-2xs italic">
                      "{goal.specialistNote}"
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3.5 border-t border-warm-100 flex items-center justify-between">
                  <span className="text-[11px] text-charcoal-400">
                    Muddat: {formatDate(goal.targetDate)}
                  </span>
                  {!isParent && (
                    <Button
                      size="xs"
                      variant="secondary"
                      leftIcon={<Edit2 className="w-3 h-3" />}
                      onClick={() => handleOpenEdit(goal)}
                    >
                      Yangilash
                    </Button>
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

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              label="Kutilayotgan muddat"
              required
              value={newGoal.targetDate}
              onChange={e => setNewGoal({ ...newGoal, targetDate: e.target.value })}
            />
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Boshlang‘ich progress: {newGoal.progress}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={newGoal.progress}
                onChange={e => setNewGoal({ ...newGoal, progress: Number(e.target.value) })}
                className="w-full accent-brand-500 mt-2"
              />
            </div>
          </div>

          <Textarea
            label="Mutaxassis izohi (ixtiyoriy)"
            rows={2}
            placeholder="Qo‘shimcha ko‘rsatmalar..."
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
        {editingGoal && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="p-3.5 rounded-[14px] bg-warm-50/80 border border-warm-200/90 shadow-2xs">
              <h4 className="text-sm font-bold text-charcoal-900">{editingGoal.title}</h4>
              <p className="text-xs text-charcoal-500 mt-0.5">{editingGoal.description}</p>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-charcoal-800 mb-1">
                <span>Progress:</span>
                <span className="text-brand-600 text-sm">{editData.progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={editData.progress}
                onChange={e => setEditData({ ...editData, progress: Number(e.target.value) })}
                className="w-full accent-brand-500"
              />
            </div>

            <Select
              label="Holat"
              value={editData.status}
              onChange={e => setEditData({ ...editData, status: e.target.value as GoalStatus })}
              options={[
                { value: 'ACTIVE', label: 'Faol (Jarayonda)' },
                { value: 'COMPLETED', label: 'Bajarildi (100%)' },
                { value: 'PAUSED', label: 'To‘xtatilgan' },
              ]}
            />

            <Textarea
              label="Mutaxassis izohi va natija"
              rows={3}
              placeholder="O‘zgarishlar va keyingi qadamlar haqida..."
              value={editData.specialistNote}
              onChange={e => setEditData({ ...editData, specialistNote: e.target.value })}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-warm-100">
              <Button variant="secondary" type="button" onClick={() => setEditingGoal(null)}>
                Bekor qilish
              </Button>
              <Button type="submit">
                O‘zgarishlarni saqlash
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
