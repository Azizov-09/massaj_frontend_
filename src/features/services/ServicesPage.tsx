import { useState } from "react";
import { useStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/utils";
import type { Service } from "@/types";
export function ServicesPage() {
  const services = useStore((s) => s.services);
  const create = useStore((s) => s.createService);
  const update = useStore((s) => s.updateService);
  const archive = useStore((s) => s.archiveService);
  const restore = useStore((s) => s.restoreService);
  const [showArchive, setShowArchive] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const begin = (service?: Service) => {
    setEditing(service || null);
    setName(service?.name || "");
    setDuration(service?.durationMinutes || 30);
    setPrice(service?.price || 0);
    setError("");
    setOpen(true);
  };
  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Xizmatlar</h1>
          <p className="text-charcoal-600">
            Xizmat nomi, davomiyligi va bir seans narxi. Seanslar soni bola
            kartasida belgilanadi.
          </p>
        </div>
        <Button onClick={() => begin()}>Xizmat qo‘shish</Button>
      </div>
      <label className="flex items-center gap-2 min-h-11">
        <input
          type="checkbox"
          checked={showArchive}
          onChange={(e) => setShowArchive(e.target.checked)}
        />
        Arxivdagi xizmatlar
      </label>
      {error && !open && (
        <p role="alert" className="text-danger-main">
          {error}
        </p>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {services
          .filter((s) =>
            showArchive ? s.status === "ARCHIVED" : s.status !== "ARCHIVED",
          )
          .map((service) => (
            <article
              className="rounded-xl bg-white border border-warm-200 p-5 space-y-3"
              key={service.id}
            >
              <h2 className="text-lg font-bold">{service.name}</h2>
              <p>{service.durationMinutes} daqiqa</p>
              <p className="text-brand-600 font-bold">
                {formatCurrency(service.price)} / seans
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => begin(service)}>
                  Tahrirlash
                </Button>
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      if (service.status === "ARCHIVED")
                        await restore(service.id);
                      else await archive(service.id);
                    } catch (e) {
                      setError(
                        e instanceof Error ? e.message : "Amal bajarilmadi",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {service.status === "ARCHIVED" ? "Tiklash" : "Arxivlash"}
                </Button>
              </div>
            </article>
          ))}
      </div>
      {!services.some((s) =>
        showArchive ? s.status === "ARCHIVED" : s.status !== "ARCHIVED",
      ) && (
        <p className="p-6 bg-white rounded-xl border">
          Xizmat yo‘q.{!showArchive && " Birinchi xizmatni qo‘shing."}
        </p>
      )}
      <Modal
        isOpen={open}
        onClose={() => {
          if (!busy) setOpen(false);
        }}
        title={editing ? "Xizmatni tahrirlash" : "Xizmat qo‘shish"}
      >
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy) return;
            if (
              !name.trim() ||
              !Number.isInteger(duration) ||
              duration < 1 ||
              !Number.isSafeInteger(price) ||
              price < 0
            ) {
              setError("Nomi, davomiyligi va narxini tekshiring.");
              return;
            }
            setBusy(true);
            setError("");
            try {
              const data = {
                name: name.trim(),
                durationMinutes: duration,
                price,
              };
              if (editing) await update(editing.id, data);
              else
                await create({
                  ...data,
                  description: "",
                  status: "ACTIVE",
                });
              setOpen(false);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Saqlanmadi");
            } finally {
              setBusy(false);
            }
          }}
        >
          <Input
            label="Xizmat nomi"
            required
            maxLength={150}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Davomiyligi (daqiqa)"
            required
            type="number"
            min={1}
            step={1}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          />
          <Input
            label="Bir seans narxi (so‘m)"
            required
            type="number"
            min={0}
            step={1}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
          {editing && (
            <p className="text-sm text-charcoal-600">
              Yangi narx keyingi biriktirishlarda qo‘llanadi. Avvalgi xizmatlar
              tarixi o‘zgarmaydi.
            </p>
          )}
          {error && (
            <p role="alert" className="text-danger-main">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? "Saqlanmoqda…" : "Saqlash"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
