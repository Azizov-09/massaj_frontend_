import {
  pendingOperation,
  finishOperation,
} from "@/services/pending-operation";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { addDays, format, startOfWeek } from "date-fns";
import { useStore } from "@/store";
import { api } from "@/services/api";
import { WORKFLOW_UNAVAILABLE } from "@/services/api/workflow";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/primitives";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency, formatDateTime } from "@/utils";
import type { Appointment } from "@/types";
export function AttendancePage() {
  const user = useStore((s) => s.currentUser);
  const appointments = useStore((s) => s.appointments);
  const children = useStore((s) => s.children);
  const services = useStore((s) => s.services);
  const attendance = useStore((s) => s.attendance);
  const assignments = useStore((s) => s.serviceAssignments);
  const loadAssignments = useStore((s) => s.fetchServiceAssignments);
  const save = useStore((s) => s.saveReception);
  const commit = useStore((s) => s.commitReception);
  const refresh = useStore((s) => s.fetchInitialData);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [mode, setMode] = useState("day");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [open, setOpen] = useState(false);
  const [childId, setChildId] = useState("");
  const [assignmentId, setAssignmentId] = useState("");
  const [newDate, setNewDate] = useState(date);
  const [time, setTime] = useState("");
  const [rescheduledFrom, setRescheduledFrom] = useState("");
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [status, setStatus] = useState<"PRESENT" | "ABSENT">("PRESENT");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef({ signature: "", key: "" });
  const canManage = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
  const weekStart = format(
    startOfWeek(new Date(date + "T12:00:00"), { weekStartsOn: 1 }),
    "yyyy-MM-dd",
  );
  const weekEnd = format(
    addDays(new Date(weekStart + "T12:00:00"), 6),
    "yyyy-MM-dd",
  );
  const rows = appointments
    .filter(
      (a) =>
        (mode === "day"
          ? a.date === date
          : a.date >= weekStart && a.date <= weekEnd) &&
        (!filter || a.attendanceStatus === filter) &&
        `${children.find((c) => c.id === a.childId)?.fullName || a.childName || ""} ${a.serviceName || services.find((s) => s.id === a.serviceId)?.name || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
    );
  const run = async (
    input: unknown,
    action: (key: string) => Promise<void>,
  ) => {
    if (busy) return;
    const signature = JSON.stringify(input);
    if (request.current.signature !== signature)
      request.current = {
        signature,
        key: pendingOperation(
          "reception:" + (useStore.getState().currentUser?.id || ""),
          signature,
        ),
      };
    setBusy(true);
    setError("");
    try {
      await action(request.current.key);
      finishOperation("reception:" + (user?.id || ""), signature);
      setSelected(null);
      setOpen(false);
      request.current = { signature: "", key: "" };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Amal tasdiqlanmadi");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Qabul va davomat</h1>
          <p className="text-charcoal-600">
            Har bir qabulda bajarilgan xizmat va davomat alohida saqlanadi.
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              setOpen(true);
              setError("");
              setNewDate(date);
              setRescheduledFrom("");
            }}
          >
            Qabul qo‘shish
          </Button>
        )}
      </div>
      {!api.workflow.enabled && (
        <p
          role="status"
          className="rounded-xl border border-amber-200 p-4 bg-amber-50 text-amber-900"
        >
          {WORKFLOW_UNAVAILABLE} Avvalgi davomat tarixi bola kartasida
          saqlanadi.
        </p>
      )}
      <div className="flex flex-wrap gap-3 items-end">
        <Input
          label="Sana"
          type="date"
          required
          value={date}
          onChange={(e) => {
            if (e.target.value) setDate(e.target.value);
          }}
        />
        <div className="flex gap-2">
          <Button
            variant={mode === "day" ? "primary" : "secondary"}
            onClick={() => setMode("day")}
          >
            Kun
          </Button>
          <Button
            variant={mode === "week" ? "primary" : "secondary"}
            onClick={() => setMode("week")}
          >
            Hafta
          </Button>
        </div>
        <Input
          label="Bola yoki xizmat"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="text-sm font-semibold">
          Davomat
          <select
            className="block mt-1 min-h-11 border rounded-lg p-2"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">Barchasi</option>
            <option value="PRESENT">Keldi</option>
            <option value="ABSENT">Kelmadi</option>
          </select>
        </label>
        <Button variant="secondary" onClick={() => void refresh()}>
          Yangilash
        </Button>
      </div>
      {error && !open && !selected && (
        <p role="alert" className="text-danger-main">
          {error}
        </p>
      )}
      <div className="space-y-3">
        {rows.map((a) => {
          const recorded = attendance.find((r) => r.appointmentId === a.id);
          return (
            <article
              key={a.id}
              className="p-5 rounded-xl bg-white border border-warm-200 space-y-3"
            >
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="font-bold text-lg">
                    {children.find((c) => c.id === a.childId)?.fullName ||
                      a.childName ||
                      "Bola"}
                  </h2>
                  <p>
                    {a.date} · {a.startTime || "Vaqt belgilanmagan"}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">
                    {a.serviceName ||
                      services.find((s) => s.id === a.serviceId)?.name ||
                      "Xizmat"}
                  </p>
                  <p>
                    {a.durationMinutes ?? "—"} daqiqa ·{" "}
                    {a.price === undefined
                      ? "Narx tasdiqlanmagan"
                      : formatCurrency(a.price)}
                  </p>
                </div>
              </div>
              <p>
                {a.attendanceStatus === "PRESENT"
                  ? "Keldi"
                  : a.attendanceStatus === "ABSENT"
                    ? "Kelmadi"
                    : "Belgilanmagan"}
                {a.actualArrivalTime
                  ? ` · Kelgan vaqt: ${formatDateTime(a.actualArrivalTime)}`
                  : ""}
              </p>
              {recorded?.note && <p>Izoh: {recorded.note}</p>}
              {canManage && (
                <div className="flex flex-wrap gap-2">
                  {(["PRESENT", "ABSENT"] as const).map((value) => (
                    <Button
                      key={value}
                      variant={value === "PRESENT" ? "primary" : "secondary"}
                      disabled={
                        !api.workflow.enabled ||
                        busy ||
                        !Number.isInteger(a.version)
                      }
                      onClick={() => {
                        setSelected(a);
                        setStatus(value);
                        setNote(recorded?.note || "");
                        setError("");
                      }}
                    >
                      {value === "PRESENT" ? "Keldi" : "Kelmadi"}
                    </Button>
                  ))}
                  {a.attendanceStatus === "ABSENT" && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setChildId(a.childId);
                        setAssignmentId(a.assignmentId || "");
                        setRescheduledFrom(a.id);
                        setNewDate(date);
                        setTime("");
                        setOpen(true);
                        void loadAssignments(a.childId);
                      }}
                    >
                      Boshqa kunga ko‘chirish
                    </Button>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
      {!rows.length && (
        <div className="p-6 border rounded-xl bg-white space-y-3">
          <p>
            {api.workflow.enabled
              ? "Tanlangan davrda qabul yo‘q."
              : "Qabullar serverga ulangach shu yerda ko‘rinadi."}
          </p>
          <Link
            className="text-brand-600 font-semibold min-h-11 inline-flex items-center"
            to="/dashboard/super-admin/children"
          >
            Bola kartasini ochish →
          </Link>
        </div>
      )}
      <Modal
        isOpen={open}
        onClose={() => {
          if (!busy) setOpen(false);
        }}
        title={
          rescheduledFrom ? "Qabulni boshqa kunga ko‘chirish" : "Qabul qo‘shish"
        }
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const data = {
              childId,
              assignmentId,
              date: newDate,
              startTime: time || null,
              rescheduledFrom: rescheduledFrom || undefined,
            };
            if (!childId || !assignmentId || !newDate) {
              setError("Bola, biriktirilgan xizmat va sanani tanlang.");
              return;
            }
            void run(data, (key) => save(data, key));
          }}
        >
          <label className="block text-sm font-semibold">
            Bola
            <select
              required
              disabled={Boolean(rescheduledFrom)}
              className="block min-h-11 border rounded-lg p-2 w-full mt-1"
              value={childId}
              onChange={(e) => {
                setChildId(e.target.value);
                setAssignmentId("");
                if (e.target.value) void loadAssignments(e.target.value);
              }}
            >
              <option value="">Bolani tanlang</option>
              {children
                .filter((c) => c.status === "ACTIVE")
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Biriktirilgan xizmat
            <select
              required
              disabled={Boolean(rescheduledFrom)}
              className="block min-h-11 border rounded-lg p-2 w-full mt-1"
              value={assignmentId}
              onChange={(e) => setAssignmentId(e.target.value)}
            >
              <option value="">Xizmatni tanlang</option>
              {assignments
                .filter(
                  (a) =>
                    a.childId === childId &&
                    a.status === "ACTIVE" &&
                    a.completedSessions < a.totalSessions,
                )
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.serviceName ||
                      services.find((s) => s.id === a.serviceId)?.name}{" "}
                    · qolgan {a.totalSessions - a.completedSessions} seans
                  </option>
                ))}
            </select>
          </label>
          <Input
            label="Qabul sanasi"
            type="date"
            required
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
          <Input
            label="Qabul vaqti (ixtiyoriy)"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          <p className="text-sm">
            Xizmat biriktirilmagan bo‘lsa, avval bola kartasidan biriktiring.
          </p>
          {(!api.workflow.enabled || error) && (
            <p role="alert" className="text-danger-main">
              {error || WORKFLOW_UNAVAILABLE}
            </p>
          )}
          <Button type="submit" disabled={busy || !api.workflow.enabled}>
            {busy ? "Saqlanmoqda…" : "Qabulni saqlash"}
          </Button>
        </form>
      </Modal>
      <Modal
        isOpen={Boolean(selected)}
        onClose={() => {
          if (!busy) setSelected(null);
        }}
        title={
          status === "PRESENT"
            ? "Xizmat bajarilganini tasdiqlash"
            : "Kelmaganini belgilash"
        }
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (selected)
              void run(
                { id: selected.id, version: selected.version, status, note },
                (key) => commit(selected.id, status, note, key),
              );
          }}
        >
          <p>
            {status === "PRESENT"
              ? "Xizmat bajarildi: bitta seans sarflanadi va xizmat narxi oila hisobidan yechiladi."
              : "Kelmadi: xizmat haqi va seans sarfi hisoblanmaydi."}
          </p>
          {selected?.attendanceStatus === "PRESENT" && status === "ABSENT" && (
            <p className="text-amber-900 bg-amber-50 p-3 rounded-lg">
              Avvalgi xizmat haqi qaytariladi va seans tiklanadi. Tarixda
              qaytarish yozuvi qoladi.
            </p>
          )}
          {selected?.attendanceStatus === status && (
            <p>
              Holat o‘zgarmasa, faqat izoh yangilanadi. Qayta pul yechilmaydi.
            </p>
          )}
          <Input
            label="Izoh (ixtiyoriy)"
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          {error && (
            <p role="alert" className="text-danger-main">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy || !api.workflow.enabled}>
            {busy ? "Tasdiqlanmoqda…" : "Tasdiqlash"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
