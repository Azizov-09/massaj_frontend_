import { useState } from 'react';
import {
  User, Lock, Save, AlertCircle
} from 'lucide-react';
import { useAuth, useStore } from '@/store';
import { api, ApiError } from '@/services/api';
import { cn } from '@/utils';
import { Card, CardHeader, CardBody, Badge, Avatar, Input } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/KpiCard';

export function ProfilePage() {
  const { currentUser, updateCurrentUser } = useAuth();
  const addToast = useStore(s => s.addToast);

  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');

  const [infoError, setInfoError] = useState<string | null>(null);
  const [isInfoShaking, setIsInfoShaking] = useState(false);
  const [isInfoSubmitting, setIsInfoSubmitting] = useState(false);

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const [passError, setPassError] = useState<string | null>(null);
  const [isPassShaking, setIsPassShaking] = useState(false);
  const [isPassSubmitting, setIsPassSubmitting] = useState(false);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoError(null);
    if (!fullName.trim()) {
      setIsInfoShaking(true);
      setTimeout(() => setIsInfoShaking(false), 600);
      setInfoError("To'liq ismni kiritish majburiy.");
      return;
    }

    setIsInfoSubmitting(true);
    try {
      if (!currentUser) throw new ApiError('Foydalanuvchi sessiyasi topilmadi.', 401);

      if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') {
        const updated = await api.admins.update(currentUser.id, {
          fullName: fullName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim(),
        });
        updateCurrentUser(updated);
      } else if (currentUser.role === 'PARENT') {
        const phoneChanged = phone.trim() !== (currentUser.phone || '');
        const emailChanged = email.trim() !== (currentUser.email || '');
        if (phoneChanged || emailChanged) {
          throw new ApiError("Ota-ona telefon yoki emailini yangilash endpointi backendda mavjud emas.", 501);
        }
        const updated = await api.parents.update(currentUser.id, { fullName: fullName.trim() });
        updateCurrentUser(updated);
      } else {
        throw new ApiError("Mutaxassisning shaxsiy aloqa ma'lumotlarini yangilash endpointi backendda mavjud emas.", 501);
      }
      addToast({
        type: 'success',
        title: 'Profil yangilandi',
        description: 'Shaxsiy ma’lumotlaringiz muvaffaqiyatli saqlandi',
      });
    } catch (err: any) {
      setIsInfoShaking(true);
      setTimeout(() => setIsInfoShaking(false), 600);
      setInfoError(err?.message || "Profilni yangilashda xatolik yuz berdi.");
    } finally {
      setIsInfoSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);

    if (!currentPass) {
      setIsPassShaking(true);
      setTimeout(() => setIsPassShaking(false), 600);
      setPassError("Joriy parolni kiriting.");
      return;
    }

    if (!newPass || newPass.length < 12) {
      setIsPassShaking(true);
      setTimeout(() => setIsPassShaking(false), 600);
      setPassError("Yangi parol kamida 12 ta belgidan iborat bo'lishi kerak.");
      return;
    }

    if (!/[A-Z]/.test(newPass) || !/[a-z]/.test(newPass) || !/[0-9]/.test(newPass)) {
      setIsPassShaking(true);
      setTimeout(() => setIsPassShaking(false), 600);
      setPassError("Yangi parolda katta harf, kichik harf va raqam bo'lishi kerak.");
      return;
    }

    if (newPass !== confirmPass) {
      setIsPassShaking(true);
      setTimeout(() => setIsPassShaking(false), 600);
      setPassError("Yangi parollar bir-biriga mos kelmadi.");
      return;
    }

    setIsPassSubmitting(true);
    try {
      await api.auth.changePassword({
        currentPassword: currentPass,
        newPassword: newPass,
      });

      addToast({
        type: 'success',
        title: 'Parol o‘zgartirildi',
        description: 'Yangi parol muvaffaqiyatli o‘rnatildi',
      });
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err: any) {
      setIsPassShaking(true);
      setTimeout(() => setIsPassShaking(false), 600);
      setPassError(err?.message || "Parolni o'zgartirishda xatolik yuz berdi.");
    } finally {
      setIsPassSubmitting(false);
    }
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
          <form
            onSubmit={handleUpdateInfo}
            noValidate
            className={cn("space-y-4 transition-transform", isInfoShaking && "animate-shake")}
          >
            {infoError && (
              <div role="alert" className="flex items-start gap-2.5 p-3.5 rounded-xl bg-danger-surface border-2 border-danger-main/40 text-danger-main text-xs font-medium shadow-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger-main" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{infoError}</p>
                </div>
              </div>
            )}
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
              <Button type="submit" loading={isInfoSubmitting} leftIcon={<Save className="w-4 h-4" />} className="w-full sm:w-auto justify-center">
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
          <form
            onSubmit={handleUpdatePassword}
            noValidate
            className={cn("space-y-4 transition-transform", isPassShaking && "animate-shake")}
          >
            {passError && (
              <div role="alert" className="flex items-start gap-2.5 p-3.5 rounded-xl bg-danger-surface border-2 border-danger-main/40 text-danger-main text-xs font-medium shadow-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger-main" />
                <div className="flex-1">
                  <p className="font-semibold text-sm">{passError}</p>
                </div>
              </div>
            )}
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
              <Button type="submit" loading={isPassSubmitting} variant="secondary" className="w-full sm:w-auto justify-center">
                Parolni o‘zgartirish
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
