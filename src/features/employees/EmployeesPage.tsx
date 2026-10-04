// ═══════════════════════════════════════════════════════
//  Employees Page — Senior Medical/Wellness CRM Table standard
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  Users, Plus, Search,
  Briefcase, CheckCircle2, UserCheck, Phone, Mail,
  Calendar, Eye, X
} from 'lucide-react';
import { useStore, useAuth } from '@/store';
import { formatDate, getEntityStatusColor, getEntityStatusLabel, cn } from '@/utils';
import { Card, Badge, Avatar, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader, KpiCard } from '@/components/ui/KpiCard';
import { DataTable, Column, getAvatarGradient } from '@/components/tables/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/primitives';
import type { Employee } from '@/types';

type StatusTab = 'ALL' | 'ACTIVE' | 'INACTIVE';

export function EmployeesPage() {
  const employees = useStore(s => s.employees);
  const createEmployee = useStore(s => s.createEmployee);
  const { currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<StatusTab>('ALL');
  const [positionFilter, setPositionFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // New employee state
  const [newEmp, setNewEmp] = useState({
    fullName: '',
    position: 'Katta hamshira',
    phone: '',
    email: '',
    salary: '',
    notes: '',
  });

  const positions = useMemo(() => {
    return Array.from(new Set(employees.map(e => e.position)));
  }, [employees]);

  const activeCount = useMemo(() => employees.filter(e => e.status === 'ACTIVE').length, [employees]);
  const inactiveCount = employees.length - activeCount;

  const filtered = useMemo(() => {
    return employees.filter(e => {
      if (activeTab === 'ACTIVE' && e.status !== 'ACTIVE') return false;
      if (activeTab === 'INACTIVE' && e.status !== 'INACTIVE') return false;
      if (positionFilter && e.position !== positionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.fullName?.toLowerCase().includes(q) ||
          e.position?.toLowerCase().includes(q) ||
          (e.phone || '').includes(q)
        );
      }
      return true;
    });
  }, [employees, activeTab, positionFilter, search]);

  const hasActiveFilters = search !== '' || activeTab !== 'ALL' || positionFilter !== '';

  const resetFilters = () => {
    setSearch('');
    setActiveTab('ALL');
    setPositionFilter('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.fullName || !newEmp.phone) return;

    createEmployee({
      fullName: newEmp.fullName.trim(),
      position: newEmp.position.trim(),
      phone: newEmp.phone.trim(),
      email: newEmp.email.trim() || undefined,
      salary: newEmp.salary ? Number(newEmp.salary) : undefined,
      notes: newEmp.notes.trim() || undefined,
      status: 'ACTIVE',
    });

    setShowCreateModal(false);
    setNewEmp({ fullName: '', position: 'Katta hamshira', phone: '', email: '', salary: '', notes: '' });
  };

  const columns: Column<Employee>[] = [
    {
      key: 'fullName',
      header: 'Xodim',
      sortable: true,
      cell: (e) => (
        <div className="flex items-center gap-3">
          <Avatar name={e.fullName} size="sm" className="font-semibold" />
          <div className="min-w-0">
            <h5 className="font-semibold text-charcoal-900 text-sm tracking-tight truncate hover:text-brand-700 transition-colors">
              {e.fullName}
            </h5>
            {e.email ? (
              <p className="text-xs text-charcoal-400 mt-0.5 flex items-center gap-1">
                <Mail className="w-3 h-3" />
                <span>{e.email}</span>
              </p>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: 'position',
      header: 'Lavozim',
      sortable: true,
      cell: (e) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-800 px-2.5 py-1 rounded-[6px] bg-warm-100 border border-warm-200/80">
          <Briefcase className="w-3.5 h-3.5 text-brand-600" />
          {e.position}
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Telefon',
      cell: (e) => (
        <a
          href={`tel:${e.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-xs text-charcoal-600 hover:text-brand-600 transition-colors font-medium"
        >
          <Phone className="w-3.5 h-3.5 text-charcoal-400" />
          <span>{e.phone}</span>
        </a>
      ),
    },
    {
      key: 'joinedAt',
      header: 'Ishga kirgan sana',
      sortable: true,
      cell: (e) => (
        <span className="inline-flex items-center gap-1 text-xs text-charcoal-600 font-medium">
          <Calendar className="w-3.5 h-3.5 text-brand-600" />
          {formatDate(e.joinedAt)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Holati',
      sortable: true,
      cell: (e) => (
        <Badge className={getEntityStatusColor(e.status)} dot>
          {getEntityStatusLabel(e.status)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Amallar',
      cell: (e) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={(ev) => {
              ev.stopPropagation();
              setSelectedEmployee(e);
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
        icon={<Users className="w-5 h-5 text-white" />}
        title="Xodimlar"
        description={`Jami ${employees.length} ta xodim, ${activeCount} ta faol shtat`}
        actions={
          (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateModal(true)}>
              Xodim qo‘shish
            </Button>
          )
        }
      />

      {/* KPI Cards — Visible on tablet/desktop, cleanly hidden on mobile to give immediate list access matching educorecrm */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <KpiCard
          label="Jami xodimlar"
          value={employees.length}
          description="Barcha xodimlar"
          icon={<Users className="w-5 h-5 text-brand-600" />}
          accentColor="brand"
          index={0}
        />
        <KpiCard
          label="Faol xodimlar"
          value={activeCount}
          description="Hozirda ishlayotganlar"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          accentColor="sage"
          index={1}
        />
        <KpiCard
          label="Lavozimlar soni"
          value={positions.length}
          description="Mavjud mutaxassisliklar"
          icon={<Briefcase className="w-5 h-5 text-amber-500" />}
          accentColor="gold"
          index={2}
        />
        <KpiCard
          label="Tarkib to‘liqligi"
          value={employees.length > 0 ? "100%" : "0%"}
          description={employees.length > 0 ? "Shtat to'liq shakllangan" : "Xodimlar mavjud emas"}
          icon={<UserCheck className="w-5 h-5 text-blue-500" />}
          accentColor="blue"
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
              {employees.length}
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
            Faol xodimlar
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === 'ACTIVE' ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
            )}>
              {activeCount}
            </span>
          </button>

          <button
            onClick={(e) => {
              setActiveTab('INACTIVE');
              e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer select-none",
              activeTab === 'INACTIVE'
                ? "bg-charcoal-700 text-white shadow-xs"
                : "text-charcoal-600 hover:bg-warm-100 hover:text-charcoal-900"
            )}
          >
            Nofaol
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === 'INACTIVE' ? "bg-white/20 text-white" : "bg-warm-200 text-charcoal-600"
            )}>
              {inactiveCount}
            </span>
          </button>
        </div>

        {/* Filter bar: Search and status dropdown */}
        <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-warm-100 bg-white">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Ism, lavozim yoki telefon..."
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

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-48">
              <Select
                size="sm"
                value={positionFilter}
                onChange={e => setPositionFilter(e.target.value)}
                triggerClassName="h-10 rounded-xl text-xs sm:text-sm font-medium border-warm-200 shadow-2xs w-full"
                options={[
                  { value: '', label: 'Barcha lavozimlar' },
                  ...positions.map(pos => ({ value: pos, label: pos })),
                ]}
                aria-label="Lavozim bo'yicha filter"
              />
            </div>
            <div className="w-full sm:w-52">
              <Select
                size="sm"
                value={activeTab}
                onChange={e => setActiveTab(e.target.value as any)}
                triggerClassName="h-10 rounded-xl text-xs sm:text-sm font-medium border-warm-200 shadow-2xs w-full"
                options={[
                  { value: 'ALL', label: `Barcha holatlar (${employees.length})` },
                  { value: 'ACTIVE', label: `Faol xodimlar (${activeCount})` },
                  { value: 'INACTIVE', label: `Nofaol xodimlar (${inactiveCount})` },
                ]}
                aria-label="Holat bo'yicha filter"
              />
            </div>
          </div>
        </div>

        {/* Data Table with EducoreCRM Expandable Accordion Architecture */}
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={r => r.id}
          onRowClick={(emp) => setSelectedEmployee(emp)}
          tableClassName="min-w-[850px]"
          emptyTitle="Xodimlar topilmadi"
          emptyDescription="Qidiruv shartlarini o‘zgartiring yoki filtrni tozalang."
          emptyIcon={<Users className="w-5 h-5" />}
          mobileCardConfig={(emp, index) => {
            const initials = emp.fullName
              ? emp.fullName.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
              : 'X';

            return {
              avatarText: initials,
              avatarGradient: getAvatarGradient(index, emp.fullName),
              title: emp.fullName,
              subtitle: emp.position,
              status: (
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                  emp.status === 'ACTIVE'
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                    : "bg-warm-100 text-charcoal-600 border-warm-200"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", emp.status === 'ACTIVE' ? "bg-emerald-500" : "bg-charcoal-400")} />
                  {emp.status === 'ACTIVE' ? 'Faol' : 'Nofaol'}
                </span>
              ),
              details: [
                { label: 'Lavozim', value: emp.position },
                {
                  label: 'Telefon',
                  value: (
                    <a href={`tel:${emp.phone}`} onClick={e => e.stopPropagation()} className="text-brand-600 font-medium hover:underline">
                      {emp.phone}
                    </a>
                  ),
                },
                { label: 'Ishga qabul', value: formatDate(emp.joinedAt) },
                { label: 'Maosh', value: emp.salary ? `${emp.salary.toLocaleString()} so'm` : 'Belgilanmagan' },
              ],
              actions: (
                <div className="flex flex-wrap items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => setSelectedEmployee(emp)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-warm-200 bg-white text-charcoal-700 text-xs font-medium hover:bg-warm-50 active:bg-warm-100 shadow-2xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-charcoal-500" />
                    Profilni ko'rish
                  </button>
                  <a
                    href={`tel:${emp.phone}`}
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-warm-200 bg-white text-charcoal-700 text-xs font-medium hover:bg-warm-50 active:bg-warm-100 shadow-2xs cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 text-brand-600" />
                    Qo'ng'iroq
                  </a>
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
              Jami xodimlar: <strong className="text-charcoal-800 font-semibold">{employees.length} nafar</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Faol shtat: <strong className="text-emerald-700 font-semibold">{activeCount}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Lavozimlar: <strong className="text-charcoal-800 font-semibold">{positions.length} xil</strong>
            </span>
          </div>
          <span className="text-[11px] text-charcoal-400">
            Qator ustiga bosib xodimning batafsil ma'lumotlarini ko'rishingiz mumkin
          </span>
        </div>
      </Card>

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <Modal
          isOpen={!!selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          title="Xodim profili"
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-warm-50 border border-warm-200/70">
              <Avatar name={selectedEmployee.fullName} size="lg" className="font-bold" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-charcoal-900 truncate">
                    {selectedEmployee.fullName}
                  </h3>
                  <Badge className={getEntityStatusColor(selectedEmployee.status)} dot>
                    {getEntityStatusLabel(selectedEmployee.status)}
                  </Badge>
                </div>
                <p className="text-xs font-semibold text-brand-700 mt-0.5 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {selectedEmployee.position}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-charcoal-600">
                  <a
                    href={`tel:${selectedEmployee.phone}`}
                    className="inline-flex items-center gap-1 hover:text-brand-600 font-medium text-charcoal-800"
                  >
                    <Phone className="w-3.5 h-3.5 text-charcoal-400" />
                    {selectedEmployee.phone}
                  </a>
                  {selectedEmployee.email && (
                    <span className="inline-flex items-center gap-1 text-charcoal-500">
                      <Mail className="w-3.5 h-3.5 text-charcoal-400" />
                      {selectedEmployee.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-warm-200/80 bg-white space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-warm-100">
                <span className="text-charcoal-500">Ishga kirgan sana:</span>
                <span className="font-semibold text-charcoal-800">{formatDate(selectedEmployee.joinedAt)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-warm-100">
                <span className="text-charcoal-500">Lavozimi:</span>
                <span className="font-semibold text-charcoal-800">{selectedEmployee.position}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-charcoal-500">Holat:</span>
                <span className="font-semibold text-charcoal-800">
                  {selectedEmployee.status === 'ACTIVE' ? 'Faol faoliyatda' : 'Nofaol / Ta\'tilda'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-warm-100">
              <Button variant="secondary" onClick={() => setSelectedEmployee(null)}>
                Yopish
              </Button>
            </div>
          </div>
        </Modal>
      )}

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

          <Input
            label="Oylik maosh (so'mda, ixtiyoriy)"
            type="number"
            placeholder="Masalan: 3500000"
            value={newEmp.salary}
            onChange={e => setNewEmp({ ...newEmp, salary: e.target.value })}
          />

          <Textarea
            label="Izoh / Qo'shimcha ma'lumot"
            rows={2}
            placeholder="Xodim malakasi, vazifalari yoki qo'shimcha eslatmalar..."
            value={newEmp.notes}
            onChange={e => setNewEmp({ ...newEmp, notes: e.target.value })}
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
