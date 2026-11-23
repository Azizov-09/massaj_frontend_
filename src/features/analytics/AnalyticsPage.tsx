import { useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStore } from "@/store";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils";
export function AnalyticsPage() {
  const transactions = useStore((s) => s.transactions);
  const accounts = useStore((s) => s.parentAccounts);
  const parents = useStore((s) => s.parents);
  const accountsError = useStore((s) => s.accountsError);
  const [days, setDays] = useState(30);
  const data = useMemo(
    () =>
      Array.from({ length: days }, (_, index) => {
        const date = format(
          subDays(new Date(), days - 1 - index),
          "yyyy-MM-dd",
        );
        const rows = transactions.filter((t) => t.date.slice(0, 10) === date);
        return {
          date,
          Tushum: rows
            .filter((t) => t.type === "PAYMENT" && t.direction === "IN")
            .reduce((sum, t) => sum + t.amount, 0),
          "Xizmat haqi": rows
            .filter((t) => t.type === "SESSION_CHARGE")
            .reduce(
              (sum, t) => sum + (t.direction === "OUT" ? t.amount : -t.amount),
              0,
            ),
        };
      }),
    [transactions, days],
  );
  const complete = !accountsError && parents.every((p) => accounts[p.id]);
  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold">Moliyaviy tahlil</h1>
      <div className="flex flex-wrap gap-2">
        {[7, 30, 90].map((value) => (
          <Button
            key={value}
            variant={days === value ? "primary" : "secondary"}
            onClick={() => setDays(value)}
          >
            {value} kun
          </Button>
        ))}
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          [
            "Tushum",
            formatCurrency(data.reduce((sum, d) => sum + d.Tushum, 0)),
          ],
          [
            "Bajarilgan xizmatlar haqi",
            formatCurrency(data.reduce((sum, d) => sum + d["Xizmat haqi"], 0)),
          ],
          [
            "Joriy oila qarzlari",
            complete
              ? formatCurrency(
                  Object.values(accounts).reduce((sum, a) => sum + a.debt, 0),
                )
              : "Tasdiqlanmagan",
          ],
        ].map(([label, value]) => (
          <article key={label} className="bg-white border rounded-xl p-5">
            <p>{label}</p>
            <p className="text-xl font-bold mt-2">{value}</p>
          </article>
        ))}
      </div>
      <p className="text-sm text-charcoal-600">
        Xizmat haqi oila hisobidagi sarfdir. U markazning tashqi xarajati
        sifatida hisoblanmaydi.
      </p>
      <section
        className="bg-white border rounded-xl p-4 space-y-3"
        aria-label="Tushum va xizmatlar haqi grafigi"
      >
        <h2 className="text-xl font-bold">Kunlar bo‘yicha</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area
                dataKey="Tushum"
                stroke="#4a8063"
                fill="#4a8063"
                fillOpacity={0.15}
              />
              <Area
                dataKey="Xizmat haqi"
                stroke="#f97316"
                fill="#f97316"
                fillOpacity={0.12}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
