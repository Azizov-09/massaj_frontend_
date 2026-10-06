// ═══════════════════════════════════════════════════════
//  Admins Page — Senior Medical/Wellness CRM Table standard
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  ShieldCheck, Plus, Search, Shield, User,
  CheckCircle2, Phone, Mail, Calendar, Eye, EyeOff, KeyRound, RefreshCw, X
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { formatDate, getEntityStatusColor, getEntityStatusLabel, cn, generateStrongPassword } from '@/utils';
import { Card, Badge, Avatar, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { DataTable, Column, getAvatarGradient } from '@/components/tables/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/primitives';
import type { AdminUser } from '@/types';

type RoleTab = 'ALL' | 'SUPER_ADMIN' | 'ADMIN' | 'ACTIVE';

export function AdminsPage() {
  const admins = useStore(s => s.admins);
  const createAdmin = useStore(s => s.createAdmin);
  const updateAdmin = useStore(s => s.updateAdmin);
  const deleteAdmin = useStore(s => s.deleteAdmin);
  const addToast = useStore(s => s.addToast);
  const { currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<RoleTab>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [formErrors, setFormErrors] = useState<{ fullName?: string; email?: string; phone?: string; password?: string }>({});

  // New admin form state
  const [newAdmin, setNewAdmin] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'ADMIN' as 'SUPER_ADMIN' | 'ADMIN',
    password: generateStrongPassword(14),
  });

  const tabCounts = useMemo(() => {
    let superAdmin = 0;
    let admin = 0;
    let active = 0;
    admins.forEach(a => {
      if (a.role === 'SUPER_ADMIN') superAdmin++;
      if (a.role === 'ADMIN') admin++;
      if (a.status === 'ACTIVE') active++;
    });

    return {
      all: admins.length,
      superAdmin,
      admin,
      active,
    };
  }, [admins]);

  const filtered = useMemo(() => {
    return admins.filter(a => {
      if (activeTab === 'SUPER_ADMIN' && a.role !== 'SUPER_ADMIN') return false;
      if (activeTab === 'ADMIN' && a.role !== 'ADMIN') return false;
      if (activeTab === 'ACTIVE' && a.status !== 'ACTIVE') return false;

      if (search) {
        const q = search.toLowerCase();
        return (
          a.fullName?.toLowerCase().includes(q) ||
          a.email?.toLowerCase().includes(q) ||
          (a.phone || '').includes(q)
        );
      }
      return true;
    });
  }, [admins, activeTab, search]);

  const hasActiveFilters = search !== '' || activeTab !== 'ALL';

  const resetFilters = () => {
    setSearch('');
    setActiveTab('ALL');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { fullName?: string; email?: string; phone?: string; password?: string } = {};
    if (!newAdmin.fullName.trim()) errors.fullName = "Ism va familiyani kiriting";
    if (!newAdmin.email.trim() || !newAdmin.email.includes('@')) errors.email = "To'g'ri email manzilini kiriting";
    if (!newAdmin.phone.trim()) errors.phone = "Telefon raqamini kiriting";
    if (!newAdmin.password || newAdmin.password.length < 12) {
      errors.password = "Parol kamida 12 ta belgidan iborat bo'lishi shart";
    } else if (!/[A-Z]/.test(newAdmin.password)) {
      errors.password = "Kamida 1 ta katta harf (A-Z) bo'lishi shart";
    } else if (!/[a-z]/.test(newAdmin.password)) {
      errors.password = "Kamida 1 ta kichik harf (a-z) bo'lishi shart";
    } else if (!/[0-9]/.test(newAdmin.password)) {
      errors.password = "Kamida 1 ta raqam (0-9) bo'lishi shart";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    createAdmin({
      fullName: newAdmin.fullName.trim(),
      email: newAdmin.email.trim(),
      phone: newAdmin.phone.trim(),
      role: newAdmin.role,
      status: 'ACTIVE',
    }, newAdmin.password);

    addToast({
      type: 'success',
      title: 'Administrator qo‘shildi',
      description: `${newAdmin.fullName} tizimga muvaffaqiyatli biriktirildi`
    });

    setShowCreateModal(false);
    setNewAdmin({ fullName: '', email: '', phone: '', role: 'ADMIN', password: generateStrongPassword(14) });
    setFormErrors({});
  };

  const handleToggleAdminStatus = (admin: AdminUser) => {
    const nextStatus = admin.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateAdmin(admin.id, { status: nextStatus });
    addToast({
      type: 'info',
      title: nextStatus === 'ACTIVE' ? "Admin faollashtirildi" : "Admin nofaol qilindi",
      description: `${admin.fullName} holati o'zgartirildi`,
    });
  };

  const handleDeleteAdmin = (admin: AdminUser) => {
    if (window.confirm(`${admin.fullName} administratorini o'chirishni tasdiqlaysizmi?`)) {
      deleteAdmin(admin.id);
    }
  };

  const columns: Column<AdminUser>[] = [
    {
      key: 'fullName',
      header: 'Admin foydalanuvchi',
      sortable: true,
      cell: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.fullName} size="sm" className="font-semibold" />
          <div className="min-w-0">
            <h5 className="font-semibold text-charcoal-900 text-sm tracking-tight truncate hover:text-brand-700 transition-colors">
              {a.fullName}
            </h5>
            <p className="text-xs text-charcoal-400 mt-0.5 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              <span>{a.email}</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Tizimdagi roli',
      sortable: true,
      cell: (a) => (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold border",
            a.role === 'SUPER_ADMIN'
              ? "bg-rose-50 text-rose-700 border-rose-200/60"
              : "bg-blue-50 text-blue-700 border-blue-200/60"
          )}
        >
          {a.role === 'SUPER_ADMIN' ? (
            <Shield className="w-3.5 h-3.5 text-rose-600" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          )}
          {a.role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Administrator'}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Telefon',
      cell: (a) => (
        <a
          href={`tel:${a.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs text-charcoal-600 hover:text-brand-600 transition-colors font-medium"
        >
          <Phone className="w-3.5 h-3.5 text-charcoal-400" />
          <span>{a.phone}</span>
        </a>
      ),
    },
    {
      key: 'createdAt',
      header: 'Qo‘shilgan sana',
      sortable: true,
      cell: (a) => (
        <span className="inline-flex items-center gap-1 text-xs text-charcoal-600 font-medium">
          <Calendar className="w-3.5 h-3.5 text-brand-600" />
          {formatDate(a.createdAt)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Holati',
      sortable: true,
      cell: (a) => (
        <Badge className={getEntityStatusColor(a.status)} dot>
          {getEntityStatusLabel(a.status)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Amallar',
      cell: (a) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedAdmin(a);
            }}
            className="h-8 px-2.5 text-xs text-charcoal-600 hover:text-brand-700 hover:bg-brand-50/60"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Ko'rish
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      <PageHeader
        icon={<Shield className="w-5 h-5 text-white" />}
        title="Adminlar"
        description={`Jami ${admins.length} ta admin`}
        actions={
          currentUser?.role === 'SUPER_ADMIN' ? (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
              Admin qo‘shish
            </Button>
          ) : undefined
        }
      />

      {/* KPI Cards — Visible on tablet/desktop, cleanly hidden on mobile to give immediate list access matching educorecrm */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="Jami ma’murlar"
          value={admins.length}
          description="Tizim boshqaruvchilari"
          icon={<ShieldCheck className="w-5 h-5 text-brand-600" />}
          accentColor="brand"
          index={0}
        />
        <KpiCard
          label="Super Adminlar"
          value={tabCounts.superAdmin}
          description="To'liq huquqli boshqaruv"
          icon={<Shield className="w-5 h-5 text-rose-600" />}
          accentColor="danger"
          index={1}
        />
        <KpiCard
          label="Administratorlar"
          value={tabCounts.admin}
          description="Filial boshqaruvchilari"
          icon={<User className="w-5 h-5 text-blue-600" />}
          accentColor="blue"
          index={2}
        />
        <KpiCard
          label="Faol akkauntlar"
          value={tabCounts.active}
          description="Faol holatdagi adminlar"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          accentColor="sage"
          index={3}
        />
      </div>

      <Card className="overflow-visible border border-warm-200/90 rounded-2xl shadow-xs">
        {/* Quick Tabs — Desktop/tablet filter pills */}
        <div className="hidden sm:flex items-center gap-1.5 px-4 py-3 border-b border-warm-200/70 overflow-x-auto touch-scroll-x scrollbar-thin w-full bg-warm-50/30">
          <button
            onClick={(e) => {
              setActiveTab('ALL');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              activeTab === 'ALL'
                ? "bg-brand-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-warm-100 hover:text-charcoal-900"
            )}
          >
            Barchasi
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === 'ALL' ? "bg-white/20 text-white" : "bg-warm-200 text-charcoal-600"
            )}>
              {tabCounts.all}
            </span>
          </button>

          <button
            onClick={(e) => {
              setActiveTab('SUPER_ADMIN');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              activeTab === 'SUPER_ADMIN'
                ? "bg-rose-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-rose-50 hover:text-rose-700"
            )}
          >
            <Shield className="w-3.5 h-3.5" />
            Super Admin
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === 'SUPER_ADMIN' ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700"
            )}>
              {tabCounts.superAdmin}
            </span>
          </button>

          <button
            onClick={(e) => {
              setActiveTab('ADMIN');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              activeTab === 'ADMIN'
                ? "bg-blue-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-blue-50 hover:text-blue-800"
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === 'ADMIN' ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
            )}>
              {tabCounts.admin}
            </span>
          </button>

          <button
            onClick={(e) => {
              setActiveTab('ACTIVE');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              activeTab === 'ACTIVE'
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-emerald-50 hover:text-emerald-800"
            )}
          >
            Faol
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === 'ACTIVE' ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
            )}>
              {tabCounts.active}
            </span>
          </button>
        </div>

        {/* Filter bar: Unified search and status dropdown */}
        <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-warm-100 bg-white">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Ism yoki username bo'yicha qidirish..."
              className="w-full h-10 pl-9.5 pr-8 text-xs sm:text-sm border border-warm-200 rounded-xl bg-white shadow-2xs placeholder:text-charcoal-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-charcoal-400 hover:text-charcoal-600 hover:bg-warm-100 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status filter (Mobile only: on desktop, pills tab bar handles status) */}
          <div className="sm:hidden w-full">
            <Select
              size="sm"
              value={activeTab}
              onChange={e => setActiveTab(e.target.value as RoleTab)}
              triggerClassName="h-10 rounded-xl text-xs sm:text-sm font-medium border-warm-200 shadow-2xs w-full"
              options={[
                { value: 'ALL', label: `Barcha statuslar (${tabCounts.all})` },
                { value: 'SUPER_ADMIN', label: `Super Adminlar (${tabCounts.superAdmin})` },
                { value: 'ADMIN', label: `Administratorlar (${tabCounts.admin})` },
                { value: 'ACTIVE', label: `Faol adminlar (${tabCounts.active})` },
              ]}
              aria-label="Status bo'yicha filter"
            />
          </div>
        </div>

        {/* Data Table with EducoreCRM Expandable Accordion Architecture */}
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={r => r.id}
          onRowClick={(admin) => setSelectedAdmin(admin)}
          tableClassName="min-w-[850px]"
          emptyTitle="Adminlar topilmadi"
          emptyDescription="Qidiruv shartlarini o‘zgartiring yoki filtrni tozalang."
          emptyIcon={<ShieldCheck className="w-5 h-5" />}
          mobileCardConfig={(admin, index) => {
            const initials = admin.fullName
              ? admin.fullName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
              : 'A';
            const username = admin.email.split('@')[0] || `admin_${index + 1}`;

            return {
              avatarText: initials,
              avatarGradient: getAvatarGradient(index, admin.fullName),
              title: admin.fullName,
              subtitle: username,
              status: (
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                  admin.status === 'ACTIVE'
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                    : "bg-warm-100 text-charcoal-600 border-warm-200"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", admin.status === 'ACTIVE' ? "bg-emerald-500" : "bg-charcoal-400")} />
                  {admin.status === 'ACTIVE' ? 'Faol' : 'Nofaol'}
                </span>
              ),
              details: [
                { label: 'Email', value: admin.email },
                {
                  label: 'Telefon',
                  value: (
                    <a href={`tel:${admin.phone}`} onClick={e => e.stopPropagation()} className="text-brand-600 font-medium hover:underline">
                      {admin.phone}
                    </a>
                  ),
                },
                { label: 'Qo‘shilgan', value: formatDate(admin.createdAt), fullWidth: true },
              ],
              actions: (
                <div className="flex flex-wrap items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => setSelectedAdmin(admin)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-warm-200 bg-white text-charcoal-700 text-xs font-medium hover:bg-warm-50 active:bg-warm-100 shadow-2xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-charcoal-500" />
                    Tahrirlash
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAdminStatus(admin)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-warm-200 bg-white text-charcoal-700 text-xs font-medium hover:bg-warm-50 active:bg-warm-100 shadow-2xs cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    {admin.status === 'ACTIVE' ? 'Nofaol qilish' : 'Faollashtirish'}
                  </button>
                  {currentUser?.role === 'SUPER_ADMIN' && admin.id !== currentUser.id && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAdmin(admin)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 text-xs font-medium hover:bg-rose-100 active:bg-rose-200 shadow-2xs cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      O'chirish
                    </button>
                  )}
                </div>
              ),
            };
          }}
        />

        {/* Footer Summary */}
        <div className="px-4 py-3 bg-warm-50/70 border-t border-warm-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-charcoal-500">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-500" />
              Jami ma'murlar: <strong className="text-charcoal-800 font-semibold">{admins.length} nafar</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Super Admin: <strong className="text-rose-700 font-semibold">{tabCounts.superAdmin}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Faol holatda: <strong className="text-emerald-700 font-semibold">{tabCounts.active}</strong>
            </span>
          </div>
          <span className="text-[11px] text-charcoal-400">
            Qator ustiga bosib admin profilini ko'rishingiz mumkin
          </span>
        </div>
      </Card>

      {/* Admin Details Modal */}
      {selectedAdmin && (
        <Modal
          isOpen={!!selectedAdmin}
          onClose={() => setSelectedAdmin(null)}
          title="Administrator profili"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-warm-50 border border-warm-200/70">
              <Avatar name={selectedAdmin.fullName} size="lg" className="font-bold" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-charcoal-900 truncate">
                    {selectedAdmin.fullName}
                  </h3>
                  <Badge className={getEntityStatusColor(selectedAdmin.status)} dot>
                    {getEntityStatusLabel(selectedAdmin.status)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={selectedAdmin.role === 'SUPER_ADMIN' ? 'danger' : 'info'}>
                    {selectedAdmin.role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Administrator'}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-charcoal-600">
                  <a
                    href={`tel:${selectedAdmin.phone}`}
                    className="inline-flex items-center gap-1 hover:text-brand-600 font-medium text-charcoal-800"
                  >
                    <Phone className="w-3.5 h-3.5 text-charcoal-400" />
                    {selectedAdmin.phone}
                  </a>
                  {selectedAdmin.email && (
                    <span className="inline-flex items-center gap-1 text-charcoal-500">
                      <Mail className="w-3.5 h-3.5 text-charcoal-400" />
                      {selectedAdmin.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-warm-200/80 bg-white space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-warm-100">
                <span className="text-charcoal-500">Qo'shilgan sana:</span>
                <span className="font-semibold text-charcoal-800">{formatDate(selectedAdmin.createdAt)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-warm-100">
                <span className="text-charcoal-500">Oxirgi kirish:</span>
                <span className="font-semibold text-charcoal-800">
                  {selectedAdmin.lastLogin ? formatDate(selectedAdmin.lastLogin) : 'Yaqinda kirgan'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-charcoal-500">Xavfsizlik darajasi:</span>
                <span className="font-semibold text-charcoal-800">
                  {selectedAdmin.role === 'SUPER_ADMIN' ? 'To\'liq tizim boshqaruvi (Root)' : 'Standart ma\'muriy ruxsat'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-warm-100">
              <Button variant="secondary" onClick={() => setSelectedAdmin(null)}>
                Yopish
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Create Admin Modal ─── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Yangi administrator qo‘shish"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="To‘liq ism"
            required
            placeholder="Masalan: Sardor Rustamov"
            value={newAdmin.fullName}
            error={formErrors.fullName}
            onChange={e => {
              setNewAdmin({ ...newAdmin, fullName: e.target.value });
              if (formErrors.fullName) setFormErrors({ ...formErrors, fullName: undefined });
            }}
          />

          <Input
            label="Email"
            required
            type="email"
            placeholder="admin@massaj.uz"
            value={newAdmin.email}
            error={formErrors.email}
            onChange={e => {
              setNewAdmin({ ...newAdmin, email: e.target.value });
              if (formErrors.email) setFormErrors({ ...formErrors, email: undefined });
            }}
          />

          <Input
            label="Telefon raqam"
            required
            type="tel"
            placeholder="+998901234567"
            value={newAdmin.phone}
            error={formErrors.phone}
            onChange={e => {
              setNewAdmin({ ...newAdmin, phone: e.target.value });
              if (formErrors.phone) setFormErrors({ ...formErrors, phone: undefined });
            }}
          />

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-charcoal-700 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-brand-600" />
                <span>Admin paroli</span>
                <span className="text-danger-main">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const newPwd = generateStrongPassword(14);
                  setNewAdmin({ ...newAdmin, password: newPwd });
                  if (formErrors.password) setFormErrors({ ...formErrors, password: undefined });
                }}
                className="inline-flex items-center gap-1 text-[11px] text-brand-600 hover:text-brand-800 font-medium transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Tasodifiy parol generatsiya qilish
              </button>
            </div>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Kamida 12 ta belgi (katta/kichik harf, raqam)"
              value={newAdmin.password}
              error={formErrors.password}
              onChange={e => {
                setNewAdmin({ ...newAdmin, password: e.target.value });
                if (formErrors.password) setFormErrors({ ...formErrors, password: undefined });
              }}
              className="font-mono text-sm"
              rightAddon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="text-charcoal-400 hover:text-charcoal-700 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <div className="flex items-center gap-1.5 text-[11px] text-charcoal-500 pt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Backend talabi: kamida 12 ta belgi, katta harf, kichik harf va raqam.</span>
            </div>
          </div>

          <Select
            label="Admin roli"
            value={newAdmin.role}
            onChange={e => setNewAdmin({ ...newAdmin, role: e.target.value as 'SUPER_ADMIN' | 'ADMIN' })}
          >
            <option value="ADMIN">Administrator (Cheklangan ruxsatlar)</option>
            <option value="SUPER_ADMIN">Super Administrator (To‘liq ruxsatlar)</option>
          </Select>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-warm-100">
            <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
              Bekor qilish
            </Button>
            <Button type="submit">
              Adminni saqlash
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
