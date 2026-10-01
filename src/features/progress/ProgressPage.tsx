// ═══════════════════════════════════════════════════════
//  Progress Page — Child Development Timeline & Notes
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  TrendingUp, Plus
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { formatDate } from '@/utils';
import { Card, Badge, Avatar, Select, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/primitives';

export function ProgressPage() {
  const { currentUser } = useAuth();
  const children = useStore(s => s.children);
  const specialists = useStore(s => s.specialists);
  const progressNotes = useStore(s => s.progressNotes);
  const sessions = useStore(s => s.sessions);
  const assessments = useStore(s => s.assessments);
  const createProgressNote = useStore(s => s.createProgressNote);

  const isParent = currentUser?.role === 'PARENT';
  const availableChildren = useMemo(() => {
    if (isParent && currentUser) {
      return children.filter(c => c.parentId === currentUser.id);
    }
    return children;
  }, [children, isParent, currentUser]);

  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New progress note state
  const [formData, setFormData] = useState({
    childId: availableChildren[0]?.id ?? '',
    specialistId: currentUser?.role === 'SPECIALIST' ? currentUser.id : (specialists[0]?.id ?? ''),
    note: '',
  });

  // Timeline events: combined from progressNotes, completed sessions with notes, and assessments
  const timelineEvents = useMemo(() => {
    const parentChildIds = availableChildren.map(c => c.id);
    const list: {
      id: string;
      date: string;
      childId: string;
      specialistId: string;
      type: 'NOTE' | 'SESSION' | 'ASSESSMENT';
      title: string;
      content: string;
      details?: string;
    }[] = [];

    // Progress notes
    progressNotes.forEach(p => {
      if (isParent && !parentChildIds.includes(p.childId)) return;
      if (selectedChildId && p.childId !== selectedChildId) return;
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

    // Completed sessions with notes
    sessions.forEach(ses => {
      if (ses.status !== 'COMPLETED' || (!ses.note && !ses.observation && !ses.recommendation)) return;
      if (isParent && !parentChildIds.includes(ses.childId)) return;
      if (selectedChildId && ses.childId !== selectedChildId) return;
      list.push({
        id: ses.id,
        date: ses.endTime ? ses.endTime.split('T')[0] : ses.startTime.split('T')[0],
        childId: ses.childId,
        specialistId: ses.specialistId,
        type: 'SESSION',
        title: 'Seans natijasi va tavsiyalar',
        content: ses.observation || ses.note || 'Seans muvaffaqiyatli yakunlandi.',
        details: ses.recommendation ? `Tavsiya: ${ses.recommendation}` : undefined,
      });
    });

    // Assessments
    assessments.forEach(asmnt => {
      if (isParent && !parentChildIds.includes(asmnt.childId)) return;
      if (selectedChildId && asmnt.childId !== selectedChildId) return;
      const avg = (Object.values(asmnt.scores).reduce((a, b) => a + b, 0) / 5).toFixed(1);
      list.push({
        id: asmnt.id,
        date: asmnt.date,
        childId: asmnt.childId,
        specialistId: asmnt.specialistId,
        type: 'ASSESSMENT',
        title: `Reabilitatsiya baholashi (O‘rtacha: ${avg} / 5)`,
        content: asmnt.professionalObservation,
        details: `Harakat: ${asmnt.scores.movement}, Koordinatsiya: ${asmnt.scores.coordination}, Tonus: ${asmnt.scores.flexibility}`,
      });
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [progressNotes, sessions, assessments, selectedChildId, isParent, availableChildren]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.childId || !formData.note) return;

    createProgressNote({
      childId: formData.childId,
      specialistId: formData.specialistId,
      note: formData.note,
      date: new Date().toISOString().split('T')[0],
    });

    setShowCreateModal(false);
    setFormData(prev => ({ ...prev, note: '' }));
  };

  return (
    <div className="px-4 lg:px-6 py-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title={isParent ? "Farzandim rivojlanish tarixi" : "Rivojlanish xronologiyasi"}
        description={isParent ? "Mutaxassis ko'riklari, seans xulosalari va mashq tavsiyalari" : "Bolalarning muolajalar davomidagi o‘zgarishlari, seans xulosalari va tavsiyalar"}
        actions={
          !isParent ? (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
              Yangi qayd qo‘shish
            </Button>
          ) : undefined
        }
      />

      {/* Filter strip */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-semibold text-charcoal-500">Bola bo‘yicha filtr:</span>
            <div className="w-64">
              <Select
                value={selectedChildId}
                onChange={e => setSelectedChildId(e.target.value)}
                className="py-1.5 text-xs"
              >
                <option value="">{isParent ? "Barcha farzandlarim" : "Barcha bolalar"}</option>
                {availableChildren.map(c => (
                  <option key={c.id} value={c.id}>{c.fullName}</option>
                ))}
              </Select>
            </div>
          </div>
          <span className="text-xs text-charcoal-400">
            Jami: {timelineEvents.length} ta xronologik qayd
          </span>
        </div>
      </Card>

      {/* Timeline */}
      {timelineEvents.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            title="Qaydlar topilmadi"
            description="Tanlangan bola bo‘yicha hozircha rivojlanish qaydlari mavjud emas"
            icon={<TrendingUp className="w-6 h-6" />}
            action={
              <Button size="sm" onClick={() => setShowCreateModal(true)}>
                Yangi qayd kiritish
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-warm-200">
          {timelineEvents.map((evt) => {
            const child = children.find(c => c.id === evt.childId);
            const spec = specialists.find(s => s.id === evt.specialistId);

            return (
              <div key={evt.id} className="relative group">
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-1.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-[#FFFDF9] ${
                    evt.type === 'NOTE'
                      ? 'bg-brand-500 text-white'
                      : evt.type === 'SESSION'
                      ? 'bg-sage-600 text-white'
                      : 'bg-gold-500 text-white'
                  }`}
                >
                  {evt.type === 'NOTE' ? '✍️' : evt.type === 'SESSION' ? '✨' : '📊'}
                </div>

                {/* Card */}
                <Card className="p-5 hover:border-warm-300 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-warm-100">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={child?.fullName ?? 'Bola'} size="xs" />
                      <div>
                        <span className="text-sm font-bold text-charcoal-900">{child?.fullName}</span>
                        <span className="text-xs text-charcoal-500 ml-2">
                          ({spec?.fullName ?? 'Mutaxassis'})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={evt.type === 'NOTE' ? 'neutral' : evt.type === 'SESSION' ? 'success' : 'warning'}
                      >
                        {evt.title}
                      </Badge>
                      <span className="text-xs text-charcoal-400 font-medium">
                        {formatDate(evt.date)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-charcoal-700 leading-relaxed pt-3">
                    {evt.content}
                  </p>

                  {evt.details && (
                    <div className="mt-3 p-2.5 rounded-xl bg-warm-50 text-xs text-charcoal-600 font-medium border border-warm-100">
                      {evt.details}
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Create Note Modal ─── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Yangi rivojlanish qaydi qo‘shish"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Bola"
            required
            value={formData.childId}
            onChange={e => setFormData({ ...formData, childId: e.target.value })}
          >
            {children.map(c => (
              <option key={c.id} value={c.id}>{c.fullName}</option>
            ))}
          </Select>

          <Select
            label="Mutaxassis"
            required
            value={formData.specialistId}
            onChange={e => setFormData({ ...formData, specialistId: e.target.value })}
          >
            {specialists.map(s => (
              <option key={s.id} value={s.id}>{s.fullName}</option>
            ))}
          </Select>

          <Textarea
            label="Kuzatuv qaydi yoki tavsiya"
            required
            rows={4}
            placeholder="Bolaning mushak tonusi, emaklash/yurish harakatlari yoki ota-onaga berilgan mashqlar..."
            value={formData.note}
            onChange={e => setFormData({ ...formData, note: e.target.value })}
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
