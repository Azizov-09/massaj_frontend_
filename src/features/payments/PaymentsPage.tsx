import {
  pendingOperation,
  finishOperation,
} from "@/services/pending-operation";
import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "@/store";
import { api } from "@/services/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDateTime, getPaymentMethodLabel } from "@/utils";
import type { Payment, PaymentMethod } from "@/types";
export function PaymentsPage() {
  const user = useStore((s) => s.currentUser);
  const parents = useStore((s) => s.parents);
  const payments = useStore((s) => s.payments);
  const accounts = useStore((s) => s.parentAccounts);
  const record = useStore((s) => s.recordPayment);
  const [params] = useSearchParams();
  const canManage = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
  const [parentId, setParentId] = useState(params.get("parentId") || "");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [receipt, setReceipt] = useState<Payment | null>(null);
  const request = useRef({ signature: "", key: "" });
  const rows = payments
    .filter(
      (p) =>
        (user?.role !== "PARENT" || p.parentId === user.id) &&
        (!methodFilter || p.method === methodFilter) &&
        (!from || p.date.slice(0, 10) >= from) &&
        (!to || p.date.slice(0, 10) <= to) &&
        `${parents.find((a) => a.id === p.parentId)?.fullName || p.parentName || ""} ${p.notes || ""} ${p.id}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const account = accounts[parentId];
  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold">
        {canManage ? "Kassa — balans to‘ldirish" : "To‘lovlarim"}
      </h1>
      {canManage && (
        <form
          className="rounded-xl bg-white border border-warm-200 p-5 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            const value = Number(amount);
            if (
              !parentId ||
              !Number.isSafeInteger(value) ||
              value <= 0 ||
              value > 2_000_000_000
            ) {
              setError("Ota-onani va to‘lov summasini tekshiring.");
              return;
            }
            const signature = JSON.stringify({
              parentId,
              amount: value,
              method,
              note,
            });
            if (signature !== request.current.signature)
              request.current = {
                signature,
                key: pendingOperation(
                  "payment:" + (useStore.getState().currentUser?.id || ""),
                  signature,
                ),
              };
            setBusy(true);
            setError("");
            setSuccess("");
            try {
              const payment = await record({
                parentId,
                amount: value,
                method,
                notes: note,
                date: new Date().toISOString(),
                createdBy: user!.id,
                idempotencyKey: request.current.key,
              });
              finishOperation("payment:" + (user?.id || ""), signature);
              setReceipt(payment);
              setSuccess("To‘lov serverda saqlandi.");
              setAmount("");
              setNote("");
              request.current = { signature: "", key: "" };
            } catch (e) {
              setError(e instanceof Error ? e.message : "To‘lov tasdiqlanmadi");
            } finally {
              setBusy(false);
            }
          }}
        >
          <p>
            Pul ota-onaning umumiy hisobiga tushadi. Avval qarz yopiladi,
            ortgani depozit bo‘ladi.
          </p>
          <label className="block text-sm font-semibold">
            Ota-ona
            <select
              required
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="block w-full min-h-11 border border-warm-200 rounded-lg p-2 mt-1"
            >
              <option value="">Ota-onani tanlang</option>
              {parents
                .filter((p) => p.status !== "ARCHIVED")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} · {p.phone}
                  </option>
                ))}
            </select>
          </label>
          {parentId && (
            <p>
              Depozit:{" "}
              {account ? formatCurrency(account.balance) : "Tasdiqlanmagan"} ·
              Qarz: {account ? formatCurrency(account.debt) : "Tasdiqlanmagan"}
            </p>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Summa (so‘m)"
              type="number"
              required
              min={1}
              max={2000000000}
              step={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <label className="block text-sm font-semibold">
              To‘lov usuli
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="block w-full min-h-11 border border-warm-200 rounded-lg p-2 mt-1"
              >
                {["CASH", "CARD", "TRANSFER"].map((m) => (
                  <option value={m} key={m}>
                    {getPaymentMethodLabel(m as PaymentMethod)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Input
            label="Izoh (ixtiyoriy)"
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {!api.workflow.familyTopUpEnabled && (
            <p
              role="status"
              className="rounded-lg bg-amber-50 p-3 text-amber-900"
            >
              Oila balansini to‘ldirish serverga hali ulanmagan. Yangi to‘lovni
              saqlash hozircha mavjud emas; avvalgi to‘lovlar quyida ko‘rinadi.
            </p>
          )}
          {error && (
            <p role="alert" className="text-danger-main">
              {error}
            </p>
          )}
          {success && (
            <p role="status" className="text-emerald-700">
              {success}
            </p>
          )}
          <Button
            type="submit"
            disabled={busy || !api.workflow.familyTopUpEnabled}
          >
            {busy ? "Saqlanmoqda…" : "To‘lovni saqlash"}
          </Button>
        </form>
      )}
      <h2 className="text-xl font-bold">To‘lovlar tarixi</h2>
      <div className="flex flex-wrap gap-3">
        <Input
          label="Qidirish"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Input
          label="Boshlanish sanasi"
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Input
          label="Tugash sanasi"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(e) => setTo(e.target.value)}
        />
        <label className="text-sm font-semibold">
          Usul
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="block min-h-11 mt-1 rounded-lg border p-2"
          >
            <option value="">Barchasi</option>
            {["CASH", "CARD", "TRANSFER"].map((m) => (
              <option value={m} key={m}>
                {getPaymentMethodLabel(m as PaymentMethod)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p>
        {rows.length} ta to‘lov ·{" "}
        {formatCurrency(rows.reduce((sum, p) => sum + p.amount, 0))}
      </p>
      <div className="space-y-3">
        {rows.map((p) => (
          <article
            className="flex flex-wrap gap-4 justify-between rounded-xl bg-white border border-warm-200 p-4"
            key={p.id}
          >
            <div>
              <h3 className="font-bold">
                {parents.find((a) => a.id === p.parentId)?.fullName ||
                  p.parentName ||
                  (user?.role === "PARENT" ? user.fullName : "Ota-ona")}
              </h3>
              <p className="text-sm">
                {formatDateTime(p.date)} · {getPaymentMethodLabel(p.method)}
              </p>
              {p.notes && <p>{p.notes}</p>}
            </div>
            <div>
              <p className="font-bold">{formatCurrency(p.amount)}</p>
              <Button variant="ghost" onClick={() => setReceipt(p)}>
                Kvitansiya
              </Button>
            </div>
          </article>
        ))}
      </div>
      {!rows.length && (
        <p className="p-5 bg-white border rounded-xl">To‘lov topilmadi.</p>
      )}
      <Modal
        isOpen={Boolean(receipt)}
        onClose={() => setReceipt(null)}
        title="To‘lov kvitansiyasi"
      >
        {receipt && (
          <div className="space-y-3">
            <p>Raqam: {receipt.id}</p>
            <p>{formatDateTime(receipt.date)}</p>
            <p>
              {parents.find((p) => p.id === receipt.parentId)?.fullName ||
                receipt.parentName ||
                user?.fullName}
            </p>
            <p className="text-xl font-bold">
              {formatCurrency(receipt.amount)}
            </p>
            <p>{getPaymentMethodLabel(receipt.method)}</p>
            {receipt.notes && <p>{receipt.notes}</p>}
            <Button variant="secondary" onClick={() => window.print()}>
              Chop etish
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
