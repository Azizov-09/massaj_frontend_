// ═══════════════════════════════════════════════════════
//  Admins Page — Admin User Management & Role Assignment
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  ShieldCheck, Plus, Search, Shield, User,
  CheckCircle2
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { formatDate } from '@/utils';
import { Card, Badge, Avatar, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { DataTable, Column } from '@/components/tables/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/primitives';
import type { AdminUser } from '@/types';

export function AdminsPage() {
  const admins = useStore(s => s.admins);
  const createAdmin = useStore(s => s.createAdmin);
  const { currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New admin form state
  const [newAdmin, setNewAdmin] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'ADMIN' as 'SUPER_ADMIN' | 'ADMIN',
  });

  const filtered = useMemo(() => {
    return admins.filter(a => {
      if (roleFilter && a.role !== roleFilter) return false;
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
  }, [admins, roleFilter, search]);

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
      title: 'Admin foydalanuvchi',
      render: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.fullName} size="sm" />
          <div>
            <h5 className="font-semibold text-charcoal-900 text-xs sm:text-sm">{a.fullName}</h5>
            <p className="text-[11px] text-charcoal-400">{a.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      title: 'Roli',
      render: (a) => (
        <Badge variant={a.role === 'SUPER_ADMIN' ? 'danger' : 'info'}>
          {a.role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Administrator'}
        </Badge>
      ),
    },
    {
      key: 'phone',
      title: 'Telefon',
      render: (a) => <span className="text-xs text-charcoal-700 font-medium">{a.phone}</span>,
    },
    {
      key: 'status',
      title: 'Holati',
      render: (a) => (
        <Badge variant={a.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {a.status === 'ACTIVE' ? 'Faol' : 'Nofaol'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      title: 'Qo‘shilgan sana',
      render: (a) => <span className="text-xs text-charcoal-400">{formatDate(a.createdAt)}</span>,
    },
  ];

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      <PageHeader
        title="Tizim ma’murlari"
        description="Boshqaruv tizimiga kirish huquqiga ega administratorlar va super adminlar"
        actions={
          currentUser?.role === 'SUPER_ADMIN' && (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
              Admin qo‘shish
            </Button>
          )
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
          value={admins.filter(a => a.role === 'SUPER_ADMIN').length}
          description="To'liq huquqli boshqaruv"
          icon={<Shield className="w-5 h-5 text-rose-600" />}
          accentColor="danger"
          index={1}
        />
        <KpiCard
          label="Administratorlar"
          value={admins.filter(a => a.role === 'ADMIN').length}
          description="Filial boshqaruvchilari"
          icon={<User className="w-5 h-5 text-blue-600" />}
          accentColor="blue"
          index={2}
        />
        <KpiCard
          label="Faol akkauntlar"
          value={admins.filter(a => a.status === 'ACTIVE').length}
          description="Faol holatdagi adminlar"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          accentColor="sage"
          index={3}
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Ism, email yoki telefon..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs border border-warm-300 rounded-[10px] bg-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100/80 shadow-2xs placeholder:text-charcoal-400 transition-colors"
              />
            </div>

            <div className="w-48">
              <Select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                size="sm"
                triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300"
              >
                <option value="">Barcha rollar</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
              </Select>
            </div>
          </div>

          <span className="text-xs text-charcoal-400 font-medium">
            {filtered.length} ta admin
          </span>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={r => r.id}
          emptyTitle="Adminlar topilmadi"
          emptyIcon={<ShieldCheck className="w-5 h-5" />}
        />
      </Card>

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
