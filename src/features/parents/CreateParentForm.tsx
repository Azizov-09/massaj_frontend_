// Create Parent Form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore } from '@/store';
import { Input, Select, Textarea } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';

const schema = z.object({
  fullName: z.string().min(2, 'Ism kamida 2 ta belgi'),
  phone: z.string().min(9, 'Telefon raqamni kiriting'),
  email: z.string().email('Noto\'g\'ri email').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;
interface Props { onSuccess: () => void; onCancel: () => void; }

export function CreateParentForm({ onSuccess, onCancel }: Props) {
  const createParent = useStore(s => s.createParent);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormValues) => {
    await new Promise(r => setTimeout(r, 300));
    createParent({ fullName: data.fullName, phone: data.phone, email: data.email || `${data.phone.replace(/\D/g, '')}@parent.uz`, address: data.address, status: 'ACTIVE', role: 'PARENT', childrenIds: [] });
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Input label="To'liq ism" required placeholder="Masalan: Karimova Nilufar" error={errors.fullName?.message} {...register('fullName')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Telefon" required type="tel" placeholder="+998901234567" error={errors.phone?.message} {...register('phone')} />
        <Input label="Email" type="email" placeholder="email@example.com" error={errors.email?.message} {...register('email')} />
      </div>
      <Input label="Manzil" placeholder="Toshkent, Yunusobod..." error={errors.address?.message} {...register('address')} />
      <Textarea label="Izoh" placeholder="Qo'shimcha ma'lumot..." rows={2} {...register('notes')} />
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-warm-100">
        <Button variant="secondary" type="button" onClick={onCancel}>Bekor qilish</Button>
        <Button type="submit" loading={isSubmitting}>Saqlash</Button>
      </div>
    </form>
  );
}
