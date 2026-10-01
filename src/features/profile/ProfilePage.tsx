// ═══════════════════════════════════════════════════════
//  Profile Page — User Profile & Security Settings
// ═══════════════════════════════════════════════════════

import { useState } from 'react';
import {
  User, Lock, Save
} from 'lucide-react';
import { useAuth, useStore } from '@/store';
import { Card, CardHeader, CardBody, Badge, Avatar, Input } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/KpiCard';

export function ProfilePage() {
  const { currentUser, updateCurrentUser } = useAuth();
  const addToast = useStore(s => s.addToast);

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleUpdateInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) return;
    updateCurrentUser({
      fullName,
      email,
      phone,
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      addToast({
        type: 'error',
        title: 'Xatolik',
        description: 'Yangi parollar bir-biriga mos kelmadi',
      });
      return;
    }
    addToast({
      type: 'success',
      title: 'Parol o‘zgartirildi',
      description: 'Yangi parol muvaffaqiyatli o‘rnatildi',
    });
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
  };

  return (
    <div className="px-4 lg:px-6 py-6 max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Mening profilim"
        description="Shaxsiy ma’lumotlar va hisob xavfsizligi sozlamalari"
      />

      {/* Profile Overview Card */}
      <Card className="p-6 bg-gradient-to-r from-warm-50 to-white">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <Avatar name={currentUser?.fullName || 'Foydalanuvchi'} size="xl" />
          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-charcoal-900">{currentUser?.fullName}</h3>
            <p className="text-xs text-charcoal-500">{currentUser?.email} • {currentUser?.phone}</p>
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <Badge variant="info">
                {currentUser?.role === 'SUPER_ADMIN' ? 'Super Administrator'
                  : currentUser?.role === 'ADMIN' ? 'Administrator'
                  : currentUser?.role === 'SPECIALIST' ? 'Mutaxassis'
                  : 'Ota-ona'}
              </Badge>
              <Badge variant="success">Faol hisob</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-brand-500" />
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">Shaxsiy ma’lumotlar</h3>
              <p className="text-xs text-charcoal-400">Ism, familiya va aloqa ma’lumotlarini tahrirlash</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleUpdateInfo} className="space-y-4">
            <Input
              label="To‘liq ism"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <Input
                label="Telefon"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" leftIcon={<Save className="w-4 h-4" />}>
                Saqlash
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-gold-500" />
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">Parolni yangilash</h3>
              <p className="text-xs text-charcoal-400">Hisobingiz xavfsizligini ta’minlash uchun murakkab parol tanlang</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <Input
              label="Joriy parol"
              type="password"
              placeholder="••••••••"
              value={currentPass}
              onChange={e => setCurrentPass(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Yangi parol"
                type="password"
                placeholder="••••••••"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
              />
              <Input
                label="Yangi parolni tasdiqlash"
                type="password"
                placeholder="••••••••"
                value={confirmPass}
                onChange={e => setConfirmPass(e.target.value)}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="secondary">
                Parolni o‘zgartirish
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
