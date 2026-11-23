import { useStore } from "@/store";
import { formatCurrency } from "@/utils";
export function BalancePage() {
  const user = useStore((s) => s.currentUser);
  const account = useStore((s) =>
    user ? s.parentAccounts[user.id] : undefined,
  );
  const error = useStore((s) => s.accountsError);
  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold">Oila balansi</h1>
      <p>Barcha farzandlaringiz uchun umumiy hisob.</p>
      {account ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-white border">
            <p>Depozit</p>
            <strong className="text-2xl text-emerald-700">
              {formatCurrency(account.balance)}
            </strong>
          </div>
          <div className="p-5 rounded-xl bg-white border">
            <p>Qarz</p>
            <strong className="text-2xl text-danger-main">
              {formatCurrency(account.debt)}
            </strong>
          </div>
        </div>
      ) : (
        <p role="status" className="p-4 rounded-xl bg-amber-50">
          {error || "Balans hali serverdan tasdiqlanmagan. Qayta yuklang."}
        </p>
      )}
    </div>
  );
}
