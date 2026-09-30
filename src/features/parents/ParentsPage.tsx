// Parents Page
import { useState, useMemo } from 'react';
import { Plus, Search, Users, X } from 'lucide-react';
import { useStore } from '@/store';
import { calculateParentBalance } from '@/services/finance.service';
import { formatCurrencyCompact, getEntityStatusColor, getEntityStatusLabel, cn } from '@/utils';
import { DataTable, Column } from '@/components/tables/DataTable';
import { Card, Avatar, Badge } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/KpiCard';
import { Modal } from '@/components/ui/Modal';
import { CreateParentForm } from './CreateParentForm';
import type { Parent } from '@/types';

export function ParentsPage() {
  const parents = useStore(s => s.parents);
  const children = useStore(s => s.children);
  const transactions = useStore(s => s.transactions);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return parents;
    const q = search.toLowerCase();
    return parents.filter(p => p.fullName.toLowerCase().includes(q) || p.phone.includes(q));
  }, [parents, search]);

  const columns: Column<Parent>[] = [
    {
      key: 'fullName', header: 'Ota-ona', sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.fullName} size="sm" />
          <div>
            <p className="font-medium text-charcoal-900 text-sm">{row.fullName}</p>
            <p className="text-xs text-charcoal-400">{row.phone}</p>
          </div>
        </div>
      )
    },
    {
      key: 'childrenIds', header: 'Bolalar',
      cell: (row) => {
        const childList = children.filter(c => row.childrenIds.includes(c.id));
        return <span className="text-sm text-charcoal-700">{childList.length} ta bola</span>;
      }
    },
    {
      key: 'balance', header: 'Balans/Qarz',
      cell: (row) => {
        const bal = calculateParentBalance(row.id, row.childrenIds, transactions);
        return (
          <div>
            {bal.balance > 0 && <p className="text-sm font-semibold text-green-600 tabular-nums">{formatCurrencyCompact(bal.balance)}</p>}
            {bal.debt > 0 && <p className="text-xs text-danger-main tabular-nums">Qarz: {formatCurrencyCompact(bal.debt)}</p>}
            {bal.balance === 0 && bal.debt === 0 && <span className="text-charcoal-400 text-sm">0</span>}
          </div>
        );
      }
    },
    {
      key: 'status', header: 'Holat',
      cell: (row) => <Badge className={getEntityStatusColor(row.status)} dot>{getEntityStatusLabel(row.status)}</Badge>
    },
  ];

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
      <PageHeader
        title="Ota-onalar"
        description={`Jami ${parents.length} ta ota-ona`}
        actions={<Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Ota-ona qo'shish</Button>}
      />
      <Card>
        <div className="px-4 py-3 flex gap-3 border-b border-warm-100">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ism yoki telefon..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-warm-300 rounded-[10px] bg-white outline-none focus:border-brand-500 placeholder:text-charcoal-400 transition-colors" />
          </div>
        </div>
        <DataTable data={filtered} columns={columns}
          keyExtractor={r => r.id} emptyTitle="Ota-onalar topilmadi" emptyIcon={<Users className="w-5 h-5" />} />
      </Card>
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Yangi ota-ona qo'shish" size="md">
        <CreateParentForm onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
      </Modal>
    </div>
  );
}
