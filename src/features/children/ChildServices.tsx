import {
  pendingOperation,
  finishOperation,
} from "@/services/pending-operation";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store";
import { api } from "@/services/api";
import { WORKFLOW_UNAVAILABLE } from "@/services/api/workflow";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/primitives";
import { formatCurrency } from "@/utils";
import type { Child, ServiceAssignment } from "@/types";

const weekdays = ["Yak", "Du", "Se", "Chor", "Pay", "Ju", "Shan"];
export function ChildServices({
  child,
  canManage,
}: {
  child: Child;
  canManage: boolean;
}) {
  const rows = useStore((s) => s.serviceAssignments).filter(
    (a) => a.childId === child.id,
  );
  const services = useStore((s) => s.services).filter(
    (s) => s.status === "ACTIVE",
  );
  const load = useStore((s) => s.fetchServiceAssignments);
  const loading = useStore((s) => s.assignmentsLoading);
  const loadError = useStore((s) => s.assignmentsError);
  const create = useStore((s) => s.createServiceAssignment);
  const extend = useStore((s) => s.extendServiceAssignment);
  const [open, setOpen] = useState(false);
  const [extending, setExtending] = useState<ServiceAssignment | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [count, setCount] = useState(10);
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [days, setDays] = useState([1, 2, 3, 4, 5, 6]);
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef({ signature: "", key: "" });
  useEffect(() => {
    void load(child.id);
  }, [child.id, load]);
  const service = services.find((s) => s.id === serviceId);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (
      !Number.isInteger(count) ||
      count < 1 ||
      (!extending && (!service || !date || !days.length))
    ) {
      setError("Xizmat, seanslar soni va kunlarni tekshiring.");
      return;
    }
    const input = {
      childId: child.id,
      serviceId,
      totalSessions: count,
      startDate: date,
      workingDays: days,
      startTime: time || null,
    };
    const signature = JSON.stringify(
      extending ? { id: extending.id, count } : input,
    );
    if (request.current.signature !== signature)
      request.current = {
        signature,
        key: pendingOperation(
          "assignment:" + (useStore.getState().currentUser?.id || ""),
          signature,
        ),
      };
    setBusy(true);
    setError("");
    try {
      if (extending) await extend(extending.id, count, request.current.key);
      else await create(input, request.current.key);
      finishOperation(
        "assignment:" + (useStore.getState().currentUser?.id || ""),
        signature,
      );
      setOpen(false);
      setExtending(null);
      request.current = { signature: "", key: "" };
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Saqlanmadi. Qayta urinib ko‘ring.",
      );
    } finally {
      setBusy(false);
    }
  };
  const close = () => {
    if (!busy) {
      setOpen(false);
      setExtending(null);
      setError("");
    }
  };
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold">Xizmatlar va seanslar</h3>
        {canManage && (
          <Button
            onClick={() => {
              setOpen(true);
              setCount(10);
              setError("");
            }}
          >
            Xizmat biriktirish
          </Button>
        )}
      </div>
      {!api.workflow.enabled && (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          {WORKFLOW_UNAVAILABLE}
        </p>
      )}
      {loading && <p role="status">Xizmatlar yuklanmoqda…</p>}
      {loadError && api.workflow.enabled && (
        <div role="alert">
          <p>{loadError}</p>
          <Button variant="secondary" onClick={() => void load(child.id)}>
            Qayta urinish
          </Button>
        </div>
      )}
      {!loading && !loadError && rows.length === 0 && (
        <p className="p-5 rounded-xl bg-warm-50 text-charcoal-600">
          Hali xizmat biriktirilmagan.
          {canManage
            ? " Biriktirishda seanslar soni va kelish kunlarini belgilang."
            : ""}
        </p>
      )}
      {rows.map((a) => (
        <article
          key={a.id}
          className="rounded-xl border border-warm-200 bg-white p-4 space-y-3"
        >
          <div className="flex flex-wrap justify-between gap-2">
            <h4 className="font-bold">
              {a.serviceName ||
                services.find((s) => s.id === a.serviceId)?.name ||
                "Xizmat"}
            </h4>
            <span>
              {a.durationMinutes} daqiqa · {formatCurrency(a.price)} / seans
            </span>
          </div>
          <p>
            Bajarilgan:{" "}
            <strong>
              {a.completedSessions}/{a.totalSessions}
            </strong>{" "}
            · Qolgan: <strong>{a.totalSessions - a.completedSessions}</strong>
          </p>
          <progress
            className="w-full accent-brand-500"
            value={a.completedSessions}
            max={a.totalSessions}
            aria-label="Bajarilgan seanslar"
          />
          <p className="text-sm text-charcoal-600">
            Boshlanish: {a.startDate} ·{" "}
            {a.workingDays.map((d) => weekdays[d]).join(", ")} ·{" "}
            {a.startTime || "Vaqt belgilanmagan"}
          </p>
          <p className="text-sm">
            {a.status === "COMPLETED"
              ? "Tugallangan"
              : a.status === "ARCHIVED"
                ? "Arxivlangan"
                : "Faol"}
          </p>
          {canManage && a.status !== "ARCHIVED" && (
            <Button
              variant="secondary"
              onClick={() => {
                setExtending(a);
                setCount(1);
                setError("");
              }}
            >
              Seans qo‘shish
            </Button>
          )}
        </article>
      ))}
      <Modal
        isOpen={open || Boolean(extending)}
        onClose={close}
        title={extending ? "Qo‘shimcha seanslar" : "Xizmat biriktirish"}
      >
        <form onSubmit={submit} className="space-y-4">
          {!extending && (
            <>
              <label className="block text-sm font-semibold">
                Xizmat
                <select
                  required
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="mt-1 min-h-11 w-full border border-warm-200 rounded-lg p-2"
                >
                  <option value="">Xizmatni tanlang</option>
                  {services.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              {service && (
                <p className="rounded-lg bg-warm-50 p-3">
                  {service.durationMinutes} daqiqa ·{" "}
                  {formatCurrency(service.price)} / seans
                </p>
              )}
            </>
          )}
          <Input
            label={extending ? "Qo‘shiladigan seanslar soni" : "Seanslar soni"}
            type="number"
            min={1}
            step={1}
            required
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
          {!extending && (
            <>
              <Input
                label="Boshlanish sanasi"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <fieldset>
                <legend className="text-sm font-semibold">
                  Kelish kunlari
                </legend>
                <div className="flex flex-wrap gap-2 mt-2">
                  {weekdays.map((label, day) => (
                    <label
                      key={day}
                      className="flex gap-2 items-center border border-warm-200 rounded-lg min-h-11 px-3"
                    >
                      <input
                        type="checkbox"
                        checked={days.includes(day)}
                        onChange={(e) =>
                          setDays((previous) =>
                            e.target.checked
                              ? [...previous, day].sort()
                              : previous.filter((d) => d !== day),
                          )
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
              <Input
                label="Qabul vaqti (ixtiyoriy)"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
              <p className="text-sm text-charcoal-600">
                Vaqtni bo‘sh qoldirish mumkin. Seanslar soni kalendar kunlari
                sonidan mustaqil.
              </p>
            </>
          )}
          {(!api.workflow.enabled || error) && (
            <p role="alert" className="text-sm text-danger-main">
              {error || WORKFLOW_UNAVAILABLE}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              type="button"
              disabled={busy}
              onClick={close}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={busy || !api.workflow.enabled}>
              {busy ? "Saqlanmoqda…" : "Saqlash"}
            </Button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
