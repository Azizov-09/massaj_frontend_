// ═══════════════════════════════════════════════════════
//  Activity Logs Page — Audit Trail & System Event Logs
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { Search, Download, FileText } from 'lucide-react';
import { useStore } from '@/store';
import { formatDate, formatRelativeTime } from '@/utils';
import { Card, Badge, Avatar, Select, EmptyState } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/KpiCard';
import type { ActivityAction } from '@/types';

export function ActivityLogsPage() {
  const activityLogs = useStore(s => s.activityLogs);

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('');

  const filteredLogs = useMemo(() => {
    return activityLogs.filter(log => {
      if (actionFilter && log.action !== actionFilter) return false;
      if (entityFilter && log.entity !== entityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          log.actorName.toLowerCase().includes(q) ||
          log.description.toLowerCase().includes(q) ||
          log.entityId.toLowerCase().includes(q)
        );
      }
      return true;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activityLogs, actionFilter, entityFilter, search]);

  const getActionBadge = (action: ActivityAction) => {
    switch (action) {
      case 'CREATE':
        return <Badge variant="success">Yaratildi</Badge>;
      case 'UPDATE':
        return <Badge variant="info">Yangilandi</Badge>;
      case 'DELETE':
        return <Badge variant="danger">O‘chirildi</Badge>;
      case 'COMPLETE':
        return <Badge variant="success">Yakunlandi</Badge>;
      case 'CANCEL':
        return <Badge variant="danger">Bekor qilindi</Badge>;
      case 'PAYMENT':
        return <Badge variant="warning">To‘lov</Badge>;
      case 'LOGIN':
        return <Badge variant="neutral">Kirish</Badge>;
      default:
        return <Badge variant="neutral">{action}</Badge>;
    }
  };

  const handleExportJSON = () => {
    const jsonString = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 lg:px-6 py-6 max-w-[1600px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Tizim faoliyati jurnali"
          description="Barcha foydalanuvchilarning amalga oshirgan harakatlari va xavfsizlik audit qaydlari"
        />
        <Button
          variant="secondary"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={handleExportJSON}
          className="w-full sm:w-auto justify-center"
        >
          Auditni yuklab olish
        </Button>
      </div>

      {/* Control Strip */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Foydalanuvchi yoki tavsif..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs border border-warm-300 rounded-[10px] bg-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100/80 shadow-2xs placeholder:text-charcoal-400 transition-colors"
              />
            </div>

            {/* Filters on mobile: 2-column grid; on desktop: inline */}
            <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
              <div className="w-full sm:w-44">
                <Select
                  value={actionFilter}
                  onChange={e => setActionFilter(e.target.value)}
                  size="sm"
                  triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 w-full"
                >
                  <option value="">Barcha harakatlar</option>
                  <option value="CREATE">Yaratish</option>
                  <option value="UPDATE">Tahrirlash</option>
                  <option value="COMPLETE">Yakunlash</option>
                  <option value="CANCEL">Bekor qilish</option>
                  <option value="PAYMENT">To‘lov</option>
                  <option value="LOGIN">Kirish</option>
                </Select>
              </div>

              <div className="w-full sm:w-44">
                <Select
                  value={entityFilter}
                  onChange={e => setEntityFilter(e.target.value)}
                  size="sm"
                  triggerClassName="h-9 rounded-[10px] text-xs shadow-2xs border-warm-300 w-full"
                >
                  <option value="">Barcha ob’ektlar</option>
                  <option value="appointment">Uchrashuv</option>
                  <option value="session">Seans</option>
                  <option value="child">Bola</option>
                  <option value="parent">Ota-ona</option>
                  <option value="specialist">Mutaxassis</option>
                </Select>
              </div>
            </div>
          </div>

          <span className="text-xs text-charcoal-400 font-medium">
            {filteredLogs.length} ta yozuv
          </span>
        </div>
      </Card>

      {/* Logs List */}
      <Card className="overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Audit yozuvlari topilmadi"
              description="Tanlangan parametrlar bo'yicha hech qanday tizim faoliyati qaydi mavjud emas"
              icon={<FileText className="w-6 h-6 text-charcoal-400" />}
            />
          </div>
        ) : (
          <div className="divide-y divide-warm-100">
            {filteredLogs.map(log => (
              <div
                key={log.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-warm-50/50 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <Avatar name={log.actorName} size="sm" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-bold text-charcoal-900">{log.actorName}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[6px] bg-warm-100 text-charcoal-600 border border-warm-200/70">
                        {log.actorRole}
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-600 mt-0.5">{log.description}</p>
                    <span className="text-[11px] font-mono text-charcoal-400">
                      Ob’ekt: {log.entity} #{log.entityId}
                    </span>
                  </div>
                </div>

                <div className="flex items-center sm:flex-col sm:items-end gap-2 justify-between">
                  {getActionBadge(log.action)}
                  <span className="text-[11px] text-charcoal-400 font-medium" title={formatDate(log.timestamp)}>
                    {formatRelativeTime(log.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
