// ═══════════════════════════════════════════════════════
//  Goals Page — Rehabilitation Targets & Progress Tracking
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  Target, Plus, Calendar, CheckCircle2, Clock,
  AlertCircle, Edit2, ChevronRight, BarChart
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { formatDate } from '@/utils';
import { Card, Badge, Avatar, Select, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/primitives';
import type { Goal, GoalStatus } from '@/types';

export function GoalsPage() {
  const children = useStore(s => s.children);
  const goals = useStore(s => s.goals);
  const createGoal = useStore(s => s.createGoal);
  const updateGoal = useStore(s => s.updateGoal);

  const [selectedChildId, setSelectedChildId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // New goal form
  const [newGoal, setNewGoal] = useState({
    childId: children[0]?.id ?? '',
    title: '',
    description: '',
    targetDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    progress: 0,
    specialistNote: '',
  });

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
      if (selectedChildId && g.childId !== selectedChildId) return false;
      if (selectedStatus && g.status !== selectedStatus) return false;
      return true;
    });
  }, [goals, selectedChildId, selectedStatus]);

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
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
            Yangi maqsad
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Jami maqsadlar"
          value={stats.total}
          icon={<Target className="w-5 h-5 text-brand-500" />}
        />
        <KpiCard
          label="Erishilgan maqsadlar"
          value={stats.achieved}
          icon={<CheckCircle2 className="w-5 h-5 text-sage-600" />}
        />
        <KpiCard
          label="Jarayonda"
          value={stats.inProgress}
          icon={<Clock className="w-5 h-5 text-gold-500" />}
        />
        <KpiCard
          label="O‘rtacha natija"
          value={`${stats.avgProgress}%`}
          icon={<BarChart className="w-5 h-5 text-blue-500" />}
        />
      </div>

      {/* Filter strip */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-56">
              <Select
                value={selectedChildId}
                onChange={e => setSelectedChildId(e.target.value)}
                className="py-1.5 text-xs"
              >
                <option value="">Barcha bolalar</option>
                {children.map(c => (
                  <option key={c.id} value={c.id}>{c.fullName}</option>
                ))}
              </Select>
            </div>

            <div className="w-48">
              <Select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="py-1.5 text-xs"
              >
                <option value="">Barcha holatlar</option>
                <option value="ACTIVE">Faol (Jarayonda)</option>
                <option value="COMPLETED">Bajarilgan</option>
                <option value="PAUSED">To‘xtatilgan</option>
              </Select>
            </div>
          </div>

          <span className="text-xs text-charcoal-400">
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
                className="p-5 flex flex-col justify-between hover:border-warm-300 transition-all group"
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
                    <div className="p-2.5 rounded-xl bg-warm-50 text-[11px] text-charcoal-600 border border-warm-100 italic">
                      "{goal.specialistNote}"
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3.5 border-t border-warm-100 flex items-center justify-between">
                  <span className="text-[11px] text-charcoal-400">
                    Muddat: {formatDate(goal.targetDate)}
                  </span>
                  <Button
                    size="xs"
                    variant="secondary"
                    leftIcon={<Edit2 className="w-3 h-3" />}
                    onClick={() => handleOpenEdit(goal)}
                  >
                    Yangilash
                  </Button>
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
          >
            {children.map(c => (
              <option key={c.id} value={c.id}>{c.fullName}</option>
            ))}
          </Select>

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
            <Input
              label="Kutilayotgan muddat"
              type="date"
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
            <div className="p-3 rounded-2xl bg-warm-50 border border-warm-100">
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
            >
              <option value="ACTIVE">Faol (Jarayonda)</option>
              <option value="COMPLETED">Bajarildi (100%)</option>
              <option value="PAUSED">To‘xtatilgan</option>
            </Select>

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
