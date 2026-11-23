import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDateTime } from "@/utils";
import type { Transaction } from "@/types";
export function ParentTransactionsPage() {
  const user = useStore((s) => s.currentUser);
  return <ParentLedger key={user?.id} />;
}
function ParentLedger() {
  const user = useStore((s) => s.currentUser);
  const [rows, setRows] = useState<Transaction[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(api.workflow.parentLedgerEnabled);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    if (!api.workflow.parentLedgerEnabled || user?.role !== "PARENT") return;
    api.workflow
      .getMyTransactions(user.id)
      .then((value) => {
        if (alive) setRows(value);
      })
      .catch((e) => {
        if (alive) setError(e.message || "Pul harakatlari yuklanmadi");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [user?.id, user?.role, retry]);
  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold">Oila pul harakatlari</h1>
      <p>
        Balansga kirimlar, bajarilgan xizmatlar uchun sarflar va qaytarishlar.
      </p>
      {!api.workflow.parentLedgerEnabled && (
        <p role="status" className="rounded-xl p-4 bg-amber-50 text-amber-900">
          Pul harakatlari tarixi serverga hali ulanmagan. To‘lovlaringiz va
          joriy balans alohida bo‘limlarda mavjud.
        </p>
      )}
      {loading && <p role="status">Pul harakatlari yuklanmoqda…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <Button
            variant="secondary"
            onClick={() => {
              setLoading(true);
              setError("");
              setRows([]);
              setRetry((value) => value + 1);
            }}
          >
            Qayta urinish
          </Button>
        </div>
      )}
      {rows.map((row) => (
        <article
          key={row.id}
          className="rounded-xl p-4 bg-white border space-y-2"
        >
          <p className="font-bold">
            {row.direction === "IN" ? "+" : "−"}
            {formatCurrency(row.amount)}
          </p>
          <p>{row.description}</p>
          <p className="text-sm text-charcoal-600">
            {formatDateTime(row.date)}
          </p>
        </article>
      ))}
      {api.workflow.parentLedgerEnabled &&
        !loading &&
        !error &&
        !rows.length && <p>Pul harakati yo‘q.</p>}
    </div>
  );
}
