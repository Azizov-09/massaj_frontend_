// ═══════════════════════════════════════════════════════
//  Assessments Page — Professional 5-point Evaluation Scale
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  Activity, Plus, AlertCircle, TrendingUp, ArrowRight
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { formatDate } from '@/utils';
import { Card, Avatar, Select, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/primitives';
import type { AssessmentScores } from '@/types';

export function AssessmentsPage() {
  const { currentUser } = useAuth();
  const assessments = useStore(s => s.assessments);
  const children = useStore(s => s.children);
  const specialists = useStore(s => s.specialists);
  const createAssessment = useStore(s => s.createAssessment);

  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  // Filtered assessments
  const filteredAssessments = useMemo(() => {
    return assessments
      .filter(a => !selectedChildId || a.childId === selectedChildId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [assessments, selectedChildId]);

  // Selected child's first and latest assessment for comparison
  const comparison = useMemo(() => {
    if (!selectedChildId) return null;
    const childAssessments = assessments
      .filter(a => a.childId === selectedChildId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (childAssessments.length < 2) return null;
    return {
      initial: childAssessments[0],
      latest: childAssessments[childAssessments.length - 1],
    };
  }, [assessments, selectedChildId]);

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

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'bg-sage-500 text-white';
    if (score === 3) return 'bg-gold-500 text-white';
    return 'bg-brand-500 text-white';
  };

  const criteriaLabels = [
    { key: 'movement' as const, label: 'Harakat faolligi' },
    { key: 'coordination' as const, label: 'Koordinatsiya' },
    { key: 'flexibility' as const, label: 'Egiluvchanlik (tonus)' },
    { key: 'activityTolerance' as const, label: 'Chidamlilik' },
    { key: 'sessionResponse' as const, label: 'Muolajaga javob' },
  ];

  return (
    <div className="px-4 lg:px-6 py-6 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Baholashlar (Assessments)"
        description="5 ballik standart shkala bo‘yicha professional kuzatuv va monitoring"
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
            Yangi baholash
          </Button>
        }
      />

      {/* Professional observation note / medical disclaimer */}
      <div className="p-4 rounded-2xl bg-brand-50/70 border border-brand-200/60 flex items-start gap-3.5 text-xs text-charcoal-700">
        <AlertCircle className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-charcoal-900 mb-0.5">Professional kuzatuv eslatmasi</p>
          <p className="text-charcoal-600 leading-relaxed">
            Ushbu baholashlar avtomatlashtirilgan tibbiy tashxis emas, balki mutaxassis tomonidan bolaning harakat faolligi,
            mushak tonusi va muolajalarga javob reaksiyasini 5 ballik standart shkala bo‘yicha tizimli qayd etish vositasidir.
          </p>
        </div>
      </div>

      {/* Filter strip */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-semibold text-charcoal-500">Bola bo‘yicha filtr:</span>
            <div className="w-64">
              <Select
                size="sm"
                triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300"
                value={selectedChildId}
                onChange={e => setSelectedChildId(e.target.value)}
                options={[
                  { value: '', label: 'Barcha bolalar' },
                  ...children.map(c => ({ value: c.id, label: c.fullName })),
                ]}
                aria-label="Bola bo'yicha filter"
              />
            </div>
          </div>
          <span className="text-xs text-charcoal-400 font-medium">
            Jami: {filteredAssessments.length} ta baholash
          </span>
        </div>
      </Card>

      {/* Comparison block if child selected and has >= 2 assessments */}
      {comparison && (
        <Card className="p-6 bg-gradient-to-br from-white to-warm-50/60 border border-warm-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-500" />
                Dastlabki va So‘nggi baholash taqqoslash
              </h3>
              <p className="text-xs text-charcoal-500">
                {children.find(c => c.id === selectedChildId)?.fullName} bo‘yicha dinamika
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-lg bg-warm-200 text-charcoal-700">Dastlabki ({formatDate(comparison.initial.date)})</span>
              <ArrowRight className="w-4 h-4 text-charcoal-400" />
              <span className="px-2.5 py-1 rounded-lg bg-brand-500 text-white">So‘nggi ({formatDate(comparison.latest.date)})</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-4">
            {criteriaLabels.map(({ key, label }) => {
              const init = comparison.initial.scores[key];
              const late = comparison.latest.scores[key];
              const diff = late - init;

              return (
                <div key={key} className="bg-white p-3.5 rounded-2xl border border-warm-200 shadow-2xs space-y-1">
                  <span className="text-[11px] font-medium text-charcoal-500 block truncate">{label}</span>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-charcoal-400">{init}</span>
                      <span className="text-xs text-charcoal-300">→</span>
                      <span className="text-lg font-extrabold text-charcoal-900">{late}</span>
                      <span className="text-[10px] text-charcoal-400">/ 5</span>
                    </div>
                    {diff > 0 && <span className="text-xs font-bold text-sage-600">+{diff}</span>}
                    {diff === 0 && <span className="text-xs font-bold text-charcoal-400">0</span>}
                    {diff < 0 && <span className="text-xs font-bold text-brand-600">{diff}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Assessments List */}
      <div className="space-y-4">
        {filteredAssessments.length === 0 ? (
          <Card className="p-12">
            <EmptyState
              title="Baholashlar topilmadi"
              description="Hozircha baholash yozuvlari mavjud emas yoki tanlangan filtr bo‘yicha natija yo‘q"
              icon={<Activity className="w-6 h-6" />}
              action={
                <Button size="sm" onClick={() => setShowCreateModal(true)}>
                  Baholash qo‘shish
                </Button>
              }
            />
          </Card>
        ) : (
          filteredAssessments.map(asmnt => {
            const child = children.find(c => c.id === asmnt.childId);
            const spec = specialists.find(s => s.id === asmnt.specialistId);
            const avgScore = (
              Object.values(asmnt.scores).reduce((a, b) => a + b, 0) / 5
            ).toFixed(1);

            return (
              <Card key={asmnt.id} className="p-5 hover:border-warm-300 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-warm-100">
                  <div className="flex items-center gap-3">
                    <Avatar name={child?.fullName ?? 'Bola'} size="md" />
                    <div>
                      <h4 className="text-sm font-bold text-charcoal-900">{child?.fullName ?? 'Noma’lum bola'}</h4>
                      <p className="text-xs text-charcoal-500">
                        Mutaxassis: <span className="font-semibold text-charcoal-700">{spec?.fullName ?? '—'}</span> • {formatDate(asmnt.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-charcoal-400">O‘rtacha ko‘rsatkich:</span>
                    <span className="px-3 py-1 rounded-xl bg-brand-500 text-white font-extrabold text-sm shadow-2xs">
                      {avgScore} / 5.0
                    </span>
                  </div>
                </div>

                {/* Score Pills Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-4">
                  {criteriaLabels.map(({ key, label }) => {
                    const score = asmnt.scores[key];
                    return (
                      <div key={key} className="p-2.5 rounded-xl bg-warm-50/70 border border-warm-100 flex items-center justify-between">
                        <span className="text-xs text-charcoal-600 font-medium truncate mr-1">{label}</span>
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${getScoreColor(score)}`}>
                          {score}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Professional Observation note */}
                {asmnt.professionalObservation && (
                  <div className="mt-4 p-3.5 rounded-xl bg-warm-50 border border-warm-100 text-xs">
                    <span className="font-bold text-charcoal-700 block mb-1">Kuzatuv xulosasi:</span>
                    <p className="text-charcoal-600 leading-relaxed">{asmnt.professionalObservation}</p>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* ─── Create Assessment Modal ─── */}
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
            <div className="space-y-3 bg-warm-50/70 p-4 rounded-2xl border border-warm-100">
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
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          formData.scores[key] === val
                            ? 'bg-brand-500 text-white shadow-xs scale-105'
                            : 'bg-white border border-warm-200 text-charcoal-700 hover:bg-warm-100'
                        }`}
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
