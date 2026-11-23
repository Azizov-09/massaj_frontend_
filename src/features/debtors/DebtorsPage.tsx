import { useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "@/store";
import { formatCurrency } from "@/utils";
import { Input } from "@/components/ui/primitives";
export function DebtorsPage() {
  const user = useStore((s) => s.currentUser);
  const parents = useStore((s) => s.parents);
  const children = useStore((s) => s.children);
  const accounts = useStore((s) => s.parentAccounts);
  const error = useStore((s) => s.accountsError);
  const [search, setSearch] = useState("");
  const isParent = user?.role === "PARENT";
  const entries = isParent && user ? [user] : parents;
  const rows = entries
    .filter(
      (p) =>
        (!isParent || p.id === user?.id) &&
        (accounts[p.id]?.debt || 0) > 0 &&
        `${p.fullName} ${p.phone}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => accounts[b.id].debt - accounts[a.id].debt);
  const missing = entries.some((p) => !accounts[p.id]);
  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold">
        {isParent ? "Oila qarzdorligi" : "Qarzdorlar"}
      </h1>
      <p className="text-charcoal-600">
        Har bir ota-ona uchun bitta oila hisobi. Balansni to‘ldirish avval
        qarzni qoplaydi.
      </p>
      {(error || missing) && (
        <p role="alert" className="rounded-xl p-4 bg-amber-50 text-amber-900">
          {error || "Ayrim oila hisoblari hali serverdan tasdiqlanmagan."}
        </p>
      )}
      <Input
        label="Ism yoki telefon bo‘yicha qidirish"
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="space-y-3">
        {rows.map((p) => (
          <article
            className="p-5 bg-white border border-warm-200 rounded-xl flex flex-wrap justify-between gap-4"
            key={p.id}
          >
            <div>
              <h2 className="font-bold text-lg">{p.fullName}</h2>
              <p>
                {children
                  .filter((c) => c.parentId === p.id)
                  .map((c) => c.fullName)
                  .join(", ") || "Farzand kiritilmagan"}
              </p>
              {p.phone && (
                <a
                  className="text-brand-600 inline-flex min-h-11 items-center"
                  href={`tel:${p.phone}`}
                >
                  {p.phone}
                </a>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-danger-main font-bold text-lg">
                {formatCurrency(accounts[p.id].debt)}
              </p>
              {!isParent && (
                <Link
                  className="inline-flex min-h-11 items-center font-semibold text-brand-600"
                  to={`/dashboard/super-admin/cash?tab=payments&parentId=${encodeURIComponent(p.id)}`}
                >
                  Balans to‘ldirish →
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
      {!rows.length && !error && !missing && (
        <p className="rounded-xl p-6 bg-white border">
          {search ? "Qidiruvga mos qarzdor topilmadi." : "Qarzdorlik yo‘q."}
        </p>
      )}
    </div>
  );
}
