import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input, Select, Textarea } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store';
import type { Service, Specialist } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  services: Service[];
  specialists: Specialist[];
  initialServiceId?: string;
}

export function BookingModal({ isOpen, onClose, services, specialists, initialServiceId }: Props) {
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState({
    parentName: '',
    phone: '',
    childName: '',
    childAge: '',
    serviceId: initialServiceId || '',
    notes: '',
  });

  const createParent = useStore(s => s.createParent);
  const createChild = useStore(s => s.createChild);
  const createAppointment = useStore(s => s.createAppointment);
  const addToast = useStore(s => s.addToast);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.parentName || !data.phone) return;

    try {
      const parent = createParent({
        fullName: data.parentName,
        phone: data.phone,
        email: `lead_${Date.now()}@landing.uz`,
        role: 'PARENT',
        status: 'ACTIVE',
        childrenIds: [],
      });

      const child = createChild({
        fullName: data.childName || 'Yangi bola',
        dateOfBirth: new Date(Date.now() - (Number(data.childAge) || 3) * 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
        gender: 'MALE',
        parentId: parent.id,
        status: 'ACTIVE',
        notes: data.notes || 'Landing sahifasidan so\'rov',
      });

      createAppointment({
        childId: child.id,
        parentId: parent.id,
        specialistId: specialists[0]?.id || 'spec-1',
        serviceId: data.serviceId || services[0]?.id || 'svc-1',
        date: new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '10:45',
        status: 'SCHEDULED',
        notes: `Landing orqali so'rov: ${data.notes || 'Birlamchi ko\'rik'}`,
      });

      addToast({
        type: 'success',
        title: 'Qabulga so\'rov yuborildi!',
        description: `${data.parentName}, ma'lumotlar tizimga kiritildi. Operator tez orada bog'lanadi.`,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        setData({ parentName: '', phone: '', childName: '', childAge: '', serviceId: '', notes: '' });
      }, 2000);
    } catch {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Uchrashuvga yozilish"
      size="md"
    >
      {success ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-14 h-14 bg-sage-50 text-sage-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h4 className="text-lg font-bold text-charcoal-900">Arizangiz qabul qilindi!</h4>
          <p className="text-sm text-charcoal-600 max-w-xs mx-auto">
            Mutaxassisimiz tez orada siz bilan bog‘lanib, qulay vaqtni tasdiqlaydi.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <Input
            label="Ota-ona ismi va familiyasi"
            required
            placeholder="Masalan: Dilnoza Karimova"
            value={data.parentName}
            onChange={e => setData(prev => ({ ...prev, parentName: e.target.value }))}
          />
          <Input
            label="Telefon raqamingiz"
            required
            type="tel"
            placeholder="+998 (90) 123-45-67"
            value={data.phone}
            onChange={e => setData(prev => ({ ...prev, phone: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Bolaning ismi"
              placeholder="Masalan: Umar"
              value={data.childName}
              onChange={e => setData(prev => ({ ...prev, childName: e.target.value }))}
            />
            <Input
              label="Yoshi (yoshda)"
              placeholder="Masalan: 2"
              type="number"
              value={data.childAge}
              onChange={e => setData(prev => ({ ...prev, childAge: e.target.value }))}
            />
          </div>
          <Select
            label="Qiziqtirgan xizmat"
            value={data.serviceId}
            onChange={e => setData(prev => ({ ...prev, serviceId: e.target.value }))}
            options={[
              { label: 'Xizmatni tanlang', value: '' },
              ...services.map(s => ({ label: `${s.name} (${s.durationMinutes} daq)`, value: s.id })),
            ]}
          />
          <Textarea
            label="Qo‘shimcha ma’lumot yoki shikoyat (ixtiyoriy)"
            placeholder="Bolaning holati yoki tashxisi haqida qisqacha..."
            rows={3}
            value={data.notes}
            onChange={e => setData(prev => ({ ...prev, notes: e.target.value }))}
          />
          <div className="pt-2 flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Bekor qilish
            </Button>
            <Button type="submit" className="flex-1">
              Ariza yuborish
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
