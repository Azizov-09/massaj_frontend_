// Services Page
import { useState, useMemo } from 'react';
import { Plus, Heart, Archive, RotateCcw } from 'lucide-react';
import { useStore } from '@/store';
import { formatCurrencyCompact } from '@/utils';
import { Card } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/primitives';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import type { Service } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Nom kamida 2 ta belgi'),
  description: z.string().optional(),
  price: z.string().min(1, 'Narxni kiriting').refine(v => !isNaN(Number(v)) && Number(v) > 0, 'To\'g\'ri narx kiriting'),
  durationMinutes: z.string().min(1, 'Davomiylikni kiriting'),
  category: z.string().optional(),
  ageMin: z.string().optional(),
  ageMax: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

interface CreateServiceFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  createService: (data: Omit<Service, 'id' | 'createdAt'>) => Service;
}

function CreateServiceForm({ onSuccess, onCancel, createService }: CreateServiceFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema), defaultValues: { durationMinutes: '45' }
  });
  const onSubmit = async (data: FormValues) => {
    await new Promise(r => setTimeout(r, 300));
    createService({
      name: data.name,
      description: data.description || '',
      price: Number(data.price),
      durationMinutes: Number(data.durationMinutes),
      status: 'ACTIVE',
      category: data.category,
      ageMin: Number(data.ageMin) || undefined,
      ageMax: Number(data.ageMax) || undefined,
    });
    onSuccess();
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Input label="Xizmat nomi" required placeholder="Terapevtik massaj" error={errors.name?.message} {...register('name')} />
      <Textarea label="Tavsif" placeholder="Xizmat haqida qisqacha..." rows={2} {...register('description')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Narx (so'm)" required type="number" placeholder="150000" min="1000" error={errors.price?.message} {...register('price')} />
        <Input label="Davomiyligi (daqiqa)" required type="number" placeholder="45" min="15" max="120" error={errors.durationMinutes?.message} {...register('durationMinutes')} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Input label="Kategoriya" placeholder="Massaj, LFK..." {...register('category')} />
        <Input label="Min yosh" type="number" placeholder="1" min="0" max="18" {...register('ageMin')} />
        <Input label="Max yosh" type="number" placeholder="18" min="0" max="18" {...register('ageMax')} />
      </div>
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-warm-100">
        <Button variant="secondary" type="button" onClick={onCancel}>Bekor qilish</Button>
        <Button type="submit" loading={isSubmitting}>Saqlash</Button>
      </div>
    </form>
  );
}

export function ServicesPage() {
  const services = useStore(s => s.services);
  const sessions = useStore(s => s.sessions);
  const createService = useStore(s => s.createService);
  const archiveService = useStore(s => s.archiveService);
  const restoreService = useStore(s => s.restoreService);
  const [showCreate, setShowCreate] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);

  const activeServices = services.filter(s => s.status === 'ACTIVE');
  const archivedServices = services.filter(s => s.status === 'ARCHIVED');

  const sessionCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      if (s.status === 'COMPLETED') {
        map.set(s.serviceId, (map.get(s.serviceId) || 0) + 1);
      }
    }
    return map;
  }, [sessions]);

  const totalRevenue = sessions
    .filter(s => s.status === 'COMPLETED')
    .reduce((sum, s) => {
      const svc = services.find(sv => sv.id === s.serviceId);
      return sum + (svc?.price ?? 0);
    }, 0);

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title="Xizmatlar"
        description={`${activeServices.length} ta faol xizmat`}
        actions={<Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Xizmat qo'shish</Button>}
      />
      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Faol xizmatlar" value={activeServices.length} icon={<Heart className="w-4 h-4" />} accentColor="brand" index={0} />
        <KpiCard label="Jami tushum" value={totalRevenue} format="currency" accentColor="sage" index={1} />
        <KpiCard label="Arxivlangan" value={archivedServices.length} accentColor="gold" index={2} />
      </div>

      {/* Services Grid */}
      <div>
        <h3 className="text-sm font-semibold text-charcoal-700 mb-3">Faol xizmatlar</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {activeServices.map((svc, i) => {
            const svcSessions = sessionCountMap.get(svc.id) || 0;
            return (
              <motion.div key={svc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-9 h-9 rounded-[10px] bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-4 h-4 text-brand-600" />
                    </div>
                    <button onClick={() => setArchiveTarget(svc.id)}
                      className="p-1.5 text-charcoal-300 hover:text-charcoal-600 hover:bg-warm-100 rounded-[6px] transition-colors"
                      title="Arxivlash">
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-charcoal-900 mb-0.5">{svc.name}</p>
                  {svc.description && <p className="text-xs text-charcoal-400 mb-3 line-clamp-2">{svc.description}</p>}
                  <div className="flex items-center justify-between">
                    <p className="text-base font-bold text-brand-600 tabular-nums">{formatCurrencyCompact(svc.price)}</p>
                    <div className="text-right">
                      <p className="text-xs text-charcoal-400">{svc.durationMinutes} daq</p>
                      <p className="text-xs text-charcoal-400">{svcSessions} seans</p>
                    </div>
                  </div>
                  {(svc.ageMin || svc.ageMax) && (
                    <p className="text-[10px] text-charcoal-400 mt-2">Yosh: {svc.ageMin ?? 0}–{svc.ageMax ?? 18}</p>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {archivedServices.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-charcoal-400 mb-3">Arxivlangan ({archivedServices.length})</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {archivedServices.map(svc => (
              <Card key={svc.id} className="p-4 opacity-60">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-charcoal-600">{svc.name}</p>
                  <button onClick={() => restoreService(svc.id)}
                    className="p-1.5 text-sage-600 hover:bg-sage-50 rounded-[6px] transition-colors" title="Tiklash">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-sm font-bold text-charcoal-700">{formatCurrencyCompact(svc.price)}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Yangi xizmat" size="md">
        <CreateServiceForm
          createService={createService}
          onSuccess={() => setShowCreate(false)}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>

      <ConfirmDialog isOpen={!!archiveTarget} onClose={() => setArchiveTarget(null)}
        onConfirm={() => { if (archiveTarget) archiveService(archiveTarget); setArchiveTarget(null); }}
        title="Xizmatni arxivlash" message="Bu xizmat yangi uchrashuvlarda ko'rinmaydi. Mavjud ma'lumotlar saqlanib qoladi."
        variant="warning" confirmLabel="Arxivlash" />
    </div>
  );
}
