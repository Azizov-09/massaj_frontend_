import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useStore } from "@/store";
import { api } from "@/services/api";
import { formatCurrency } from "@/utils";
export function SuperAdminDashboard() {
  const children = useStore((s) => s.children);
  const parents = useStore((s) => s.parents);
  const appointments = useStore((s) => s.appointments);
  const payments = useStore((s) => s.payments);
  const accounts = useStore((s) => s.parentAccounts);
  const accountsError = useStore((s) => s.accountsError);
  const today = format(new Date(), "yyyy-MM-dd");
  const schedule = appointments
    .filter((a) => a.date === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const debtors = parents
    .filter((p) => (accounts[p.id]?.debt || 0) > 0)
    .sort((a, b) => accounts[b.id].debt - accounts[a.id].debt);
  const accountsReady = !accountsError && parents.every((p) => accounts[p.id]);
  const stats = [
    [
      "Faol bolalar",
      String(children.filter((c) => c.status === "ACTIVE").length),
    ],
    [
      "Bugungi qabullar",
      api.workflow.enabled ? String(schedule.length) : "Ulanmagan",
    ],
    [
      "Bugungi tushum",
      formatCurrency(
        payments
          .filter((p) => p.date.slice(0, 10) === today)
          .reduce((sum, p) => sum + p.amount, 0),
      ),
    ],
    [
      "Umumiy qarz",
      accountsReady
        ? formatCurrency(
            debtors.reduce((sum, p) => sum + accounts[p.id].debt, 0),
          )
        : "Tasdiqlanmagan",
    ],
  ];
  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-charcoal-600">
            {today} · Qabullar, to‘lovlar va oila hisoblari.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="rounded-xl px-4 min-h-11 flex items-center bg-brand-500 text-white font-semibold"
            to="/dashboard/super-admin/attendance"
          >
            Qabul va davomat
          </Link>
          <Link
            className="rounded-xl px-4 min-h-11 flex items-center bg-white border font-semibold"
            to="/dashboard/super-admin/cash"
          >
            Balans to‘ldirish
          </Link>
        </div>
      </div>
      {!api.workflow.enabled && (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 p-4"
        >
          Qabul, seanslar va avtomatik hisoblash serverga hali ulanmagan. Mavjud
          bolalar, xizmatlar va to‘lovlar tarixi bilan ishlash mumkin.
        </p>
      )}
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(([label, value]) => (
          <article
            key={label}
            className="rounded-xl border border-warm-200 bg-white p-5"
          >
            <p className="text-sm text-charcoal-600">{label}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
          </article>
        ))}
      </div>
      <section className="p-5 rounded-xl bg-white border border-warm-200 space-y-3">
        <h2 className="text-xl font-bold">Bugungi qabullar</h2>
        {schedule.map((a) => (
          <div
            key={a.id}
            className="flex flex-wrap justify-between gap-3 border-b border-warm-100 py-3"
          >
            <div>
              <p className="font-semibold">
                {children.find((c) => c.id === a.childId)?.fullName ||
                  a.childName}
              </p>
              <p>
                {a.serviceName || "Xizmat"} ·{" "}
                {a.startTime || "Vaqt belgilanmagan"}
              </p>
            </div>
            <Link
              className="min-h-11 flex items-center text-brand-600 font-semibold"
              to="/dashboard/super-admin/attendance"
            >
              {a.attendanceStatus === "PRESENT"
                ? "Keldi"
                : a.attendanceStatus === "ABSENT"
                  ? "Kelmadi"
                  : "Davomatni belgilash"}{" "}
              →
            </Link>
          </div>
        ))}
        {!schedule.length && (
          <p>
            {api.workflow.enabled
              ? "Bugunga qabul belgilanmagan."
              : "Qabullar serverga ulangach ko‘rinadi."}
          </p>
        )}
      </section>
      <section className="p-5 rounded-xl bg-white border border-warm-200 space-y-3">
        <div className="flex justify-between gap-3">
          <h2 className="text-xl font-bold">Qarzdor oilalar</h2>
          <Link
            className="text-brand-600 font-semibold min-h-11 flex items-center"
            to="/dashboard/super-admin/debtors"
          >
            Barchasi →
          </Link>
        </div>
        {!accountsReady && (
          <p role="status">Oila hisoblari hali to‘liq tasdiqlanmagan.</p>
        )}
        {debtors.slice(0, 5).map((p) => (
          <div key={p.id} className="flex flex-wrap justify-between gap-3 py-2">
            <p>{p.fullName}</p>
            <p className="font-bold text-danger-main">
              {formatCurrency(accounts[p.id].debt)}
            </p>
          </div>
        ))}
        {accountsReady && !debtors.length && <p>Qarzdorlik yo‘q.</p>}
      </section>
    </div>
  );
}
