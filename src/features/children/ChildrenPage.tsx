import { lazy, Suspense, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/primitives";
import { formatAge, formatCurrency, normalizeUzbekSearch } from "@/utils";
import { CreateChildForm } from "./CreateChildForm";
import { EditChildModal } from "./EditChildModal";
import { ChildServices } from "./ChildServices";
import type { Child } from "@/types";
const Assessments = lazy(() =>
  import("@/features/assessments/AssessmentsPage").then((m) => ({
    default: m.AssessmentsPage,
  })),
);
const Progress = lazy(() =>
  import("@/features/progress/ProgressPage").then((m) => ({
    default: m.ProgressPage,
  })),
);
export function ChildrenPage() {
  const user = useStore((s) => s.currentUser);
  const allChildren = useStore((s) => s.children);
  const parents = useStore((s) => s.parents);
  const accounts = useStore((s) => s.parentAccounts);
  const attendance = useStore((s) => s.attendance);
  const appointments = useStore((s) => s.appointments);
  const services = useStore((s) => s.services);
  const archive = useStore((s) => s.archiveChild);
  const update = useStore((s) => s.updateChild);
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") || "");
  const [status, setStatus] = useState("ACTIVE");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Child | null>(null);
  const [archiving, setArchiving] = useState<Child | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const canManage = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
  const children = allChildren.filter(
    (c) => user?.role !== "PARENT" || c.parentId === user.id,
  );
  const child = children.find((c) => c.id === params.get("childId"));
  const section = params.get("section") || "services";
  const choose = (id?: string, nextSection = section) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (id) next.set("childId", id);
      else next.delete("childId");
      next.set("section", nextSection);
      return next;
    });
  const filtered = children.filter(
    (c) =>
      (!status || c.status === status) &&
      normalizeUzbekSearch(c.fullName).includes(normalizeUzbekSearch(search)),
  );
  const account = child ? accounts[child.parentId] : undefined;
  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            {user?.role === "PARENT" ? "Farzandlarim" : "Bolalar"}
          </h1>
          <p className="text-charcoal-600">
            Bola kartasida xizmatlar, seanslar va rivojlanish tarixi.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setShowCreate(true)}>Bola qo‘shish</Button>
        )}
      </div>
      {["assessments", "progress"].includes(section) && !child && (
        <p role="status" className="p-3 rounded-xl bg-warm-100">
          {section === "assessments" ? "Baholashlarni" : "Rivojlanish tarixini"}{" "}
          ko‘rish uchun bolani tanlang.
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Input
          label="Bola ismi bo‘yicha qidirish"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="text-sm font-semibold">
          Holati
          <select
            className="block min-h-11 border border-warm-200 rounded-lg p-2 mt-1"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Barchasi</option>
            <option value="ACTIVE">Faol</option>
            <option value="INACTIVE">Nofaol</option>
            <option value="ARCHIVED">Arxiv</option>
          </select>
        </label>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <article
            key={c.id}
            className="p-4 rounded-xl border border-warm-200 bg-white space-y-3"
          >
            <h2 className="font-bold text-lg">{c.fullName}</h2>
            <p className="text-sm text-charcoal-600">
              {formatAge(c.dateOfBirth)} ·{" "}
              {parents.find((p) => p.id === c.parentId)?.fullName ||
                (user?.role === "PARENT"
                  ? user.fullName
                  : "Ota-ona belgilanmagan")}
            </p>
            <p className="text-sm">
              {c.status === "ARCHIVED"
                ? "Arxivlangan"
                : c.status === "ACTIVE"
                  ? "Faol"
                  : "Nofaol"}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => choose(c.id)}>
                Kartani ochish
              </Button>
              {canManage && (
                <Button variant="ghost" onClick={() => setEditing(c)}>
                  Tahrirlash
                </Button>
              )}
              {canManage && c.status !== "ARCHIVED" && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setArchiving(c);
                    setError("");
                  }}
                >
                  Arxivlash
                </Button>
              )}
              {canManage && c.status === "ARCHIVED" && (
                <Button
                  variant="ghost"
                  onClick={() =>
                    void update(c.id, { status: "ACTIVE" }).catch(() => {})
                  }
                >
                  Tiklash
                </Button>
              )}
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <p className="rounded-xl bg-white border border-warm-200 p-6">
          Bola topilmadi.
          {canManage
            ? " Bola qo‘shish tugmasi orqali ro‘yxatdan o‘tkazing."
            : ""}
        </p>
      )}
      <Modal
        isOpen={Boolean(child)}
        onClose={() => choose()}
        title={child?.fullName}
        size="xl"
      >
        {child && (
          <div className="space-y-5">
            <div className="rounded-xl bg-warm-50 p-4 space-y-2">
              <p>
                {child.dateOfBirth} ·{" "}
                {child.gender === "MALE" ? "O‘g‘il" : "Qiz"}
              </p>
              {child.diagnosis && <p>Tashxis: {child.diagnosis}</p>}
              {child.allergies && <p>Allergiyalar: {child.allergies}</p>}
              {child.notes && <p>{child.notes}</p>}
              <p>
                Oila depoziti:{" "}
                {account ? formatCurrency(account.balance) : "Tasdiqlanmagan"} ·
                Qarz:{" "}
                {account ? formatCurrency(account.debt) : "Tasdiqlanmagan"}
              </p>
            </div>
            <div
              className="flex flex-wrap gap-2"
              aria-label="Bola kartasi bo‘limlari"
            >
              {[
                ["services", "Xizmatlar va seanslar"],
                ["schedule", "Qabul va davomat"],
                ["assessments", "Baholashlar"],
                ["progress", "Rivojlanish"],
              ].map(([id, label]) => (
                <Button
                  key={id}
                  variant={section === id ? "primary" : "secondary"}
                  onClick={() => choose(child.id, id)}
                  aria-pressed={section === id}
                >
                  {label}
                </Button>
              ))}
            </div>
            {section === "services" && (
              <ChildServices
                key={child.id}
                child={child}
                canManage={canManage}
              />
            )}
            {section === "schedule" && (
              <div className="space-y-3">
                <h3 className="font-bold">Qabullar va davomat tarixi</h3>
                {appointments
                  .filter((a) => a.childId === child.id)
                  .map((a) => (
                    <p key={a.id} className="rounded-lg border p-3">
                      {a.date} · {a.startTime || "Vaqt belgilanmagan"} ·{" "}
                      {a.serviceName ||
                        services.find((s) => s.id === a.serviceId)?.name}{" "}
                      ·{" "}
                      {a.attendanceStatus === "PRESENT"
                        ? "Keldi"
                        : a.attendanceStatus === "ABSENT"
                          ? "Kelmadi"
                          : "Rejalashtirilgan"}
                    </p>
                  ))}
                {attendance
                  .filter((a) => a.childId === child.id)
                  .map((a) => (
                    <p key={a.id} className="rounded-lg border p-3">
                      {a.date} ·{" "}
                      {["PRESENT", "LATE"].includes(a.status)
                        ? "Keldi"
                        : "Kelmadi"}
                      {a.note ? ` · ${a.note}` : ""}
                    </p>
                  ))}
                {!attendance.some((a) => a.childId === child.id) &&
                  !appointments.some((a) => a.childId === child.id) && (
                    <p>Hozircha qabul yoki davomat yozuvi yo‘q.</p>
                  )}
              </div>
            )}
            <Suspense fallback={<p role="status">Tarix yuklanmoqda…</p>}>
              {section === "assessments" && <Assessments childId={child.id} />}
              {section === "progress" && <Progress childId={child.id} />}
            </Suspense>
          </div>
        )}
      </Modal>
      {canManage && (
        <Modal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          title="Bola qo‘shish"
          size="lg"
        >
          <CreateChildForm
            onCancel={() => setShowCreate(false)}
            onSuccess={(created) => {
              setShowCreate(false);
              choose(created.id, "services");
            }}
          />
        </Modal>
      )}
      {canManage && editing && (
        <EditChildModal
          child={editing}
          isOpen
          onClose={() => setEditing(null)}
          onSuccess={() => setEditing(null)}
        />
      )}
      <Modal
        isOpen={Boolean(archiving)}
        onClose={() => {
          if (!busy) setArchiving(null);
        }}
        title="Bolani arxivlash"
      >
        <p>
          Profil ro‘yxat arxiviga o‘tadi. Xizmatlar va moliyaviy tarix
          saqlanadi.
        </p>
        {error && <p role="alert">{error}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => setArchiving(null)}
          >
            Bekor qilish
          </Button>
          <Button
            disabled={busy}
            onClick={async () => {
              if (!archiving || busy) return;
              setBusy(true);
              try {
                await archive(archiving.id);
                setArchiving(null);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Arxivlanmadi");
              } finally {
                setBusy(false);
              }
            }}
          >
            Arxivlash
          </Button>
        </div>
      </Modal>
    </div>
  );
}
