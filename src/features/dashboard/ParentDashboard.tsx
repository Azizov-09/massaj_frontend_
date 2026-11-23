import { Link } from "react-router-dom";
import { useStore } from "@/store";
import { api } from "@/services/api";
import { formatCurrency, formatDateTime } from "@/utils";
export function ParentDashboard() {
  const user = useStore((s) => s.currentUser);
  const allChildren = useStore((s) => s.children);
  const accounts = useStore((s) => s.parentAccounts);
  const appointments = useStore((s) => s.appointments);
  const attendance = useStore((s) => s.attendance);
  const notes = useStore((s) => s.progressNotes);
  const children = allChildren.filter((c) => c.parentId === user?.id);
  const ids = children.map((c) => c.id);
  const account = user ? accounts[user.id] : undefined;
  const upcoming = appointments
    .filter(
      (a) =>
        ids.includes(a.childId) &&
        a.status !== "CANCELLED" &&
        a.status !== "COMPLETED",
    )
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
    );
  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ota-ona paneli</h1>
        <p className="text-charcoal-600">
          {user?.fullName} · Farzandlaringiz xizmatlari va oila hisobi.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <article className="p-5 rounded-xl bg-white border">
          <p>Oila depoziti</p>
          <p className="text-2xl font-bold text-emerald-700">
            {account ? formatCurrency(account.balance) : "Tasdiqlanmagan"}
          </p>
        </article>
        <article className="p-5 rounded-xl bg-white border">
          <p>Oila qarzi</p>
          <p className="text-2xl font-bold text-danger-main">
            {account ? formatCurrency(account.debt) : "Tasdiqlanmagan"}
          </p>
        </article>
      </div>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Farzandlarim</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {children.map((c) => (
            <article
              className="p-5 rounded-xl bg-white border space-y-3"
              key={c.id}
            >
              <h3 className="font-bold text-lg">{c.fullName}</h3>
              <p>{c.dateOfBirth}</p>
              <Link
                className="inline-flex min-h-11 items-center text-brand-600 font-semibold"
                to={`/dashboard/parent/children?childId=${encodeURIComponent(c.id)}`}
              >
                Xizmatlar va seanslarni ko‘rish →
              </Link>
            </article>
          ))}
        </div>
        {!children.length && (
          <p>Hozircha farzand biriktirilmagan. Markaz bilan bog‘laning.</p>
        )}
      </section>
      <section className="p-5 rounded-xl bg-white border space-y-3">
        <h2 className="text-xl font-bold">Keyingi qabullar</h2>
        {!api.workflow.enabled && (
          <p role="status">
            Qabul va seanslar ma’lumotlari serverga hali ulanmagan.
          </p>
        )}
        {upcoming.slice(0, 10).map((a) => (
          <p className="border-b py-3" key={a.id}>
            {children.find((c) => c.id === a.childId)?.fullName} ·{" "}
            {a.serviceName} · {a.date} · {a.startTime || "Vaqt belgilanmagan"}
          </p>
        ))}
        {api.workflow.enabled && !upcoming.length && (
          <p>Keyingi qabul belgilanmagan.</p>
        )}
      </section>
      <section className="p-5 rounded-xl bg-white border space-y-3">
        <h2 className="text-xl font-bold">So‘nggi davomat</h2>
        {attendance
          .filter((a) => ids.includes(a.childId))
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 10)
          .map((a) => (
            <p key={a.id}>
              {children.find((c) => c.id === a.childId)?.fullName} ·{" "}
              {a.date.slice(0, 10)} ·{" "}
              {["PRESENT", "LATE"].includes(a.status) ? "Keldi" : "Kelmadi"}
              {a.note ? ` · ${a.note}` : ""}
            </p>
          ))}
        {!attendance.some((a) => ids.includes(a.childId)) && (
          <p>Davomat yozuvi yo‘q.</p>
        )}
      </section>
      <section className="p-5 rounded-xl bg-white border space-y-3">
        <h2 className="text-xl font-bold">Mutaxassis qaydlari</h2>
        {notes
          .filter((n) => ids.includes(n.childId))
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 5)
          .map((n) => (
            <article key={n.id}>
              <h3 className="font-bold">
                {children.find((c) => c.id === n.childId)?.fullName}
              </h3>
              <p>{n.note}</p>
              <p className="text-sm text-charcoal-600">
                {formatDateTime(n.date)}
              </p>
            </article>
          ))}
        {!notes.some((n) => ids.includes(n.childId)) && (
          <p>Hozircha qayd yo‘q.</p>
        )}
      </section>
    </div>
  );
}
