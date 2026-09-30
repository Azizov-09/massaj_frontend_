// ═══════════════════════════════════════════════════════
//  Employees Page — Staff & Clinic Personnel Directory
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  Users, Plus, Search, Phone, Mail,
  Briefcase, Calendar, CheckCircle2, UserCheck
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { formatDate } from '@/utils';
import { Card, Badge, Avatar, Select, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { DataTable, Column } from '@/components/tables/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/primitives';
import type { Employee } from '@/types';

export function EmployeesPage() {
  const employees = useStore(s => s.employees);
  const createEmployee = useStore(s => s.createEmployee);
  const { currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New employee state
  const [newEmp, setNewEmp] = useState({
    fullName: '',
    position: 'Katta hamshira',
    phone: '',
    email: '',
  });

  const positions = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.position)));
  }, [employees]);

  const filtered = useMemo(() => {
    return employees.filter(e => {
      if (positionFilter && e.position !== positionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.fullName.toLowerCase().includes(q) ||
          e.position.toLowerCase().includes(q) ||
          e.phone.includes(q)
        );
      }
      return true;
    });
  }, [employees, positionFilter, search]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.fullName || !newEmp.phone) return;

    createEmployee({
      fullName: newEmp.fullName,
      position: newEmp.position,
      phone: newEmp.phone,
      email: newEmp.email || undefined,
      status: 'ACTIVE',
    });

    setShowCreateModal(false);
    setNewEmp({ fullName: '', position: 'Katta hamshira', phone: '', email: '' });
  };

  const columns: Column<Employee>[] = [
    {
      key: 'fullName',
      title: 'Xodim',
      render: (e) => (
        <div className="flex items-center gap-3">
          <Avatar name={e.fullName} size="sm" />
          <div>
            <h5 className="font-semibold text-charcoal-900 text-xs sm:text-sm">{e.fullName}</h5>
            <p className="text-[11px] text-charcoal-400">{e.email || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'position',
      title: 'Lavozim',
      render: (e) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-800 px-2.5 py-1 rounded-lg bg-warm-100">
          <Briefcase className="w-3.5 h-3.5 text-charcoal-500" />
          {e.position}
        </span>
      ),
    },
    {
      key: 'phone',
      title: 'Telefon',
      render: (e) => <span className="text-xs text-charcoal-700 font-medium">{e.phone}</span>,
    },
    {
      key: 'joinedAt',
      title: 'Ishga kirgan sana',
      render: (e) => <span className="text-xs text-charcoal-400">{formatDate(e.joinedAt)}</span>,
    },
    {
      key: 'status',
      title: 'Holati',
      render: (e) => (
        <Badge variant={e.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {e.status === 'ACTIVE' ? 'Faol' : 'Nofaol'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      <PageHeader
        title="Xodimlar tarkibi"
        description="Markaz ma’muriyati, parvarish va texnik personal hisobi"
        actions={
          <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
            Xodim qo‘shish
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Jami xodimlar"
          value={employees.length}
          icon={<Users className="w-5 h-5 text-brand-500" />}
        />
        <KpiCard
          label="Faol xodimlar"
          value={employees.filter(e => e.status === 'ACTIVE').length}
          icon={<CheckCircle2 className="w-5 h-5 text-sage-600" />}
        />
        <KpiCard
          label="Lavozimlar soni"
          value={positions.length}
          icon={<Briefcase className="w-5 h-5 text-gold-500" />}
        />
        <KpiCard
          label="Tarkib to‘liqligi"
          value="100%"
          icon={<UserCheck className="w-5 h-5 text-blue-500" />}
        />
      </div>

      {/* Filter strip */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input
                type="text"
                placeholder="Ism yoki telefon..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-warm-300 rounded-xl bg-white outline-none focus:border-brand-500"
              />
            </div>

            <div className="w-52">
              <Select
                value={positionFilter}
                onChange={e => setPositionFilter(e.target.value)}
                className="py-1.5 text-xs"
              >
                <option value="">Barcha lavozimlar</option>
                {positions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </Select>
            </div>
          </div>

          <span className="text-xs text-charcoal-400">
            {filtered.length} ta xodim
          </span>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={r => r.id}
          emptyTitle="Xodimlar topilmadi"
          emptyIcon={<Users className="w-5 h-5" />}
        />
      </Card>

      {/* ─── Create Employee Modal ─── */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Yangi xodim qo‘shish"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="To‘liq ism"
            required
            placeholder="Masalan: Ra’no Toirova"
            value={newEmp.fullName}
            onChange={e => setNewEmp({ ...newEmp, fullName: e.target.value })}
          />

          <Input
            label="Lavozim"
            required
            placeholder="Masalan: Hamshira / Qabulxona ma’muri"
            value={newEmp.position}
            onChange={e => setNewEmp({ ...newEmp, position: e.target.value })}
          />

          <Input
            label="Telefon raqam"
            required
            type="tel"
            placeholder="+998901234567"
            value={newEmp.phone}
            onChange={e => setNewEmp({ ...newEmp, phone: e.target.value })}
          />

          <Input
            label="Email (ixtiyoriy)"
            type="email"
            placeholder="xodim@massaj.uz"
            value={newEmp.email}
            onChange={e => setNewEmp({ ...newEmp, email: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-warm-100">
            <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
              Bekor qilish
            </Button>
            <Button type="submit">
              Xodimni saqlash
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
