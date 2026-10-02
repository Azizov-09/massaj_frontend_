// ═══════════════════════════════════════════════════════
//  Admins Page — Senior Medical/Wellness CRM Table standard
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  ShieldCheck, Plus, Search, Shield, User,
  CheckCircle2, Phone, Mail, Calendar, Eye, X
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { formatDate, getEntityStatusColor, getEntityStatusLabel, cn } from '@/utils';
import { Card, Badge, Avatar, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { DataTable, Column } from '@/components/tables/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/primitives';
import type { AdminUser } from '@/types';

type RoleTab = 'ALL' | 'SUPER_ADMIN' | 'ADMIN' | 'ACTIVE';

export function AdminsPage() {
  const admins = useStore(s => s.admins);
  const createAdmin = useStore(s => s.createAdmin);
  const { currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<RoleTab>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);

  // New admin form state
  const [newAdmin, setNewAdmin] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'ADMIN' as 'SUPER_ADMIN' | 'ADMIN',
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
          a.fullName.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.phone.includes(q)
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
    if (!newAdmin.fullName || !newAdmin.email) return;

    createAdmin({
      fullName: newAdmin.fullName,
      email: newAdmin.email,
      phone: newAdmin.phone,
      role: newAdmin.role,
      status: 'ACTIVE',
    });

    setShowCreateModal(false);
    setNewAdmin({ fullName: '', email: '', phone: '', role: 'ADMIN' });
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
      key: 'actions' as any,
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
        title="Tizim ma’murlari"
        description="Boshqaruv tizimiga kirish huquqiga ega administratorlar va super adminlar ro'yxati"
        actions={
          currentUser?.role === 'SUPER_ADMIN' ? (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
              Admin qo‘shish
            </Button>
          ) : undefined
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
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

      <Card className="overflow-hidden border border-warm-200/90 shadow-xs">
        {/* Quick Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-warm-200/70 overflow-x-auto scrollbar-none w-full">
          <button
            onClick={() => setActiveTab('ALL')}
            className={cn(
              "px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5",
              activeTab === 'ALL'
                ? "bg-brand-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-warm-100 hover:text-charcoal-900"
            )}
          >
            Barchasi
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
              activeTab === 'ALL' ? "bg-white/20 text-white" : "bg-warm-200 text-charcoal-600"
            )}>
              {tabCounts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('SUPER_ADMIN')}
            className={cn(
              "px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5",
              activeTab === 'SUPER_ADMIN'
                ? "bg-rose-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-rose-50 hover:text-rose-700"
            )}
          >
            <Shield className="w-3.5 h-3.5" />
            Super Admin
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
              activeTab === 'SUPER_ADMIN' ? "bg-white/20 text-white" : "bg-rose-100 text-rose-700"
            )}>
              {tabCounts.superAdmin}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ADMIN')}
            className={cn(
              "px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5",
              activeTab === 'ADMIN'
                ? "bg-blue-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-blue-50 hover:text-blue-800"
            )}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
              activeTab === 'ADMIN' ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
            )}>
              {tabCounts.admin}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ACTIVE')}
            className={cn(
              "px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5",
              activeTab === 'ACTIVE'
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-emerald-50 hover:text-emerald-800"
            )}
          >
            Faol
            <span className={cn(
              "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
              activeTab === 'ACTIVE' ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
            )}>
              {tabCounts.active}
            </span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-warm-100 bg-warm-50/40">
          <div className="flex flex-1 items-center gap-2.5">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ism, email yoki telefon..."
                className="w-full h-9 pl-9 pr-8 text-xs border border-warm-300 rounded-[10px] bg-white shadow-2xs placeholder:text-charcoal-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-charcoal-400 hover:text-charcoal-600 hover:bg-warm-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-9 px-2.5 text-xs text-charcoal-500 hover:text-charcoal-800"
              >
                Filtrni tozalash
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 text-xs text-charcoal-500">
            <span>
              Ko'rsatilmoqda: <strong className="text-charcoal-900 font-semibold">{filtered.length}</strong> / {admins.length}
            </span>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={r => r.id}
          onRowClick={(admin) => setSelectedAdmin(admin)}
          tableClassName="min-w-[850px]"
          emptyTitle="Adminlar topilmadi"
          emptyDescription="Qidiruv shartlarini o‘zgartiring yoki filtrni tozalang."
          emptyIcon={<ShieldCheck className="w-5 h-5" />}
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
            onChange={e => setNewAdmin({ ...newAdmin, fullName: e.target.value })}
          />

          <Input
            label="Email"
            required
            type="email"
            placeholder="admin@massaj.uz"
            value={newAdmin.email}
            onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
          />

          <Input
            label="Telefon raqam"
            required
            type="tel"
            placeholder="+998901234567"
            value={newAdmin.phone}
            onChange={e => setNewAdmin({ ...newAdmin, phone: e.target.value })}
          />

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
