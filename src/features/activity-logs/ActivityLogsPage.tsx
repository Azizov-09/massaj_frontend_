// ═══════════════════════════════════════════════════════
//  Activity Logs Page — Audit Trail & System Event Logs
// ═══════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import {
  History, Search, Filter, Shield, User,
  Clock, CheckCircle2, ArrowRight, Download
} from 'lucide-react';
import { useStore } from '@/store';
import { formatDate, formatRelativeTime, cn } from '@/utils';
import { Card, Badge, Avatar, Select } from '@/components/ui/primitives';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/KpiCard';
import type { ActivityLog, ActivityAction, ActivityEntity } from '@/types';

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
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(filteredLogs, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        >
          Auditni yuklab olish
        </Button>
      </div>

      {/* Control Strip */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
              <input
                type="text"
                placeholder="Foydalanuvchi yoki tavsif..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-warm-300 rounded-xl bg-white outline-none focus:border-brand-500"
              />
            </div>

            <div className="w-44">
              <Select
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                className="py-1.5 text-xs"
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

            <div className="w-44">
              <Select
                value={entityFilter}
                onChange={e => setEntityFilter(e.target.value)}
                className="py-1.5 text-xs"
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

          <span className="text-xs text-charcoal-400">
            {filteredLogs.length} ta yozuv
          </span>
        </div>
      </Card>

      {/* Logs List */}
      <Card className="overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-charcoal-400 text-sm">
            Mos keluvchi audit yozuvlari topilmadi.
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
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warm-100 text-charcoal-600">
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
