import { useState } from "react";
import { useStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/primitives";
export function SettingsPage() {
  const saved = useStore((s) => s.clinicSettings);
  const update = useStore((s) => s.updateClinicSettings);
  const [data, setData] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold">Markaz sozlamalari</h1>
      <form
        className="p-5 rounded-xl bg-white border border-warm-200 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          if (data.workStart >= data.workEnd) {
            setError("Ish tugashi boshlanish vaqtidan keyin bo‘lishi kerak.");
            return;
          }
          setBusy(true);
          setError("");
          try {
            await update(data);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Saqlanmadi");
          } finally {
            setBusy(false);
          }
        }}
      >
        <Input
          label="Markaz nomi"
          required
          maxLength={150}
          value={data.clinicName}
          onChange={(e) => setData({ ...data, clinicName: e.target.value })}
        />
        <Input
          label="Telefon"
          type="tel"
          value={data.phone}
          onChange={(e) => setData({ ...data, phone: e.target.value })}
        />
        <Input
          label="Manzil"
          value={data.address}
          onChange={(e) => setData({ ...data, address: e.target.value })}
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input
            label="Ish boshlanishi"
            type="time"
            required
            value={data.workStart}
            onChange={(e) => setData({ ...data, workStart: e.target.value })}
          />
          <Input
            label="Ish tugashi"
            type="time"
            required
            value={data.workEnd}
            onChange={(e) => setData({ ...data, workEnd: e.target.value })}
          />
        </div>
        {error && (
          <p role="alert" className="text-danger-main">
            {error}
          </p>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? "Saqlanmoqda…" : "Saqlash"}
        </Button>
      </form>
    </div>
  );
}
