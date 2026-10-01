// ═══════════════════════════════════════════════════════
//  Settings Page — Clinic Configurations & Preferences
// ═══════════════════════════════════════════════════════

import { useState } from 'react';
import {
  Building2, Bell, Save, RefreshCw, AlertTriangle
} from 'lucide-react';
import { useStore } from '@/store';
import { Card, CardHeader, CardBody, Input, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/KpiCard';
import { ConfirmDialog } from '@/components/ui/Modal';

export function SettingsPage() {
  const clinicSettings = useStore(s => s.clinicSettings);
  const updateClinicSettings = useStore(s => s.updateClinicSettings);
  const resetStore = useStore(s => s.resetStore);

  const [clinicName, setClinicName] = useState(clinicSettings?.clinicName || 'Bolalar Massaj & Reabilitatsiya Markazi');
  const [phone, setPhone] = useState(clinicSettings?.phone || '+998 71 200 00 00');
  const [address, setAddress] = useState(clinicSettings?.address || 'Toshkent sh., Chilonzor tumani, 9-mavze');
  const [workStart, setWorkStart] = useState(clinicSettings?.workStart || '08:00');
  const [workEnd, setWorkEnd] = useState(clinicSettings?.workEnd || '18:00');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Notifications
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [reminderHours, setReminderHours] = useState('24');

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateClinicSettings({
      clinicName,
      phone,
      address,
      workStart,
      workEnd,
    });
  };

  const handleResetConfirm = () => {
    resetStore();
    setShowResetConfirm(false);
  };

  return (
    <div className="px-4 lg:px-6 py-6 max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Tizim sozlamalari"
        description="Markaz profili, bildirishnoma shablonlari va xavfsizlik sozlamalari"
      />

      {/* General Clinic Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-brand-500" />
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">Markaz profili</h3>
              <p className="text-xs text-charcoal-400">Muassasa nomi va umumiy kontakt ma’lumotlari</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSaveGeneral} className="space-y-4">
            <Input
              label="Markaz nomi"
              value={clinicName}
              onChange={e => setClinicName(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Kontakt telefon"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
              <Input
                label="Manzil"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Ish boshlanishi"
                type="time"
                value={workStart}
                onChange={e => setWorkStart(e.target.value)}
              />
              <Input
                label="Ish tugashi"
                type="time"
                value={workEnd}
                onChange={e => setWorkEnd(e.target.value)}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" leftIcon={<Save className="w-4 h-4" />}>
                O‘zgarishlarni saqlash
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gold-500" />
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">Bildirishnoma va Eslatmalar</h3>
              <p className="text-xs text-charcoal-400">Ota-onalar va mutaxassislarga avtomatik xabarlar</p>
            </div>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <label className="flex items-center justify-between p-3.5 rounded-[12px] border border-warm-200 shadow-2xs hover:bg-warm-50/50 cursor-pointer transition-colors">
            <div>
              <span className="text-xs sm:text-sm font-bold text-charcoal-900 block">SMS Eslatmalar</span>
              <span className="text-xs text-charcoal-500">Seansdan oldin ota-onaga SMS xabarnoma yuborish</span>
            </div>
            <input
              type="checkbox"
              checked={smsEnabled}
              onChange={e => setSmsEnabled(e.target.checked)}
              className="w-4 h-4 accent-brand-500"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-[12px] border border-warm-200 shadow-2xs hover:bg-warm-50/50 cursor-pointer transition-colors">
            <div>
              <span className="text-xs sm:text-sm font-bold text-charcoal-900 block">Ovozli signallar</span>
              <span className="text-xs text-charcoal-500">Yangi uchrashuv yoki to‘lov kiritilganda ovoz chiqarish</span>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={e => setSoundEnabled(e.target.checked)}
              className="w-4 h-4 accent-brand-500"
            />
          </label>

          <div className="flex items-center justify-between p-3.5 rounded-[12px] border border-warm-200 shadow-2xs">
            <div>
              <span className="text-xs sm:text-sm font-bold text-charcoal-900 block">Eslatma yuborish vaqti</span>
              <span className="text-xs text-charcoal-500">Seans boshlanishidan necha soat oldin yuboriladi</span>
            </div>
            <div className="w-40">
              <Select
                value={reminderHours}
                onChange={e => setReminderHours(e.target.value)}
                size="sm"
                options={[
                  { value: '2', label: '2 soat oldin' },
                  { value: '12', label: '12 soat oldin' },
                  { value: '24', label: '24 soat oldin' },
                  { value: '48', label: '48 soat oldin' },
                ]}
                aria-label="Eslatma yuborish vaqti"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Danger Zone / Reset */}
      <Card className="border-danger-main/30">
        <CardHeader>
          <div className="flex items-center gap-2 text-danger-main">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <h3 className="text-sm font-bold">Xavfli hudud (Ma’lumotlar bazasi)</h3>
              <p className="text-xs text-charcoal-400">Tizim xotirasini tozalash yoki demo ma’lumotlarni tiklash</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs sm:text-sm font-bold text-charcoal-900 block">Demo ma’lumotlarni qayta yuklash</span>
              <span className="text-xs text-charcoal-500">Barcha qo‘shilgan ma’lumotlarni o‘chirib, dastlabki holatga qaytaradi</span>
            </div>
            <Button
              variant="danger"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={() => setShowResetConfirm(true)}
            >
              Ma’lumotlarni qayta tiklash
            </Button>
          </div>
        </CardBody>
      </Card>

      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetConfirm}
        title="Ma’lumotlarni qayta tiklash"
        message="Barcha qo‘shilgan mijozlar, qabullar va to‘lovlar o‘chirilib, tizim dastlabki demo holatiga qaytariladi. Davom etishni xohlaysizmi?"
        confirmLabel="Qayta tiklash"
        variant="danger"
      />
    </div>
  );
}
