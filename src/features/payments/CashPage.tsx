import { WorkspaceTabs } from "@/components/ui/WorkspaceTabs";
import { PaymentsPage } from "./PaymentsPage";
import { TransactionsPage } from "@/features/transactions/TransactionsPage";
export function CashPage() {
  return (
    <WorkspaceTabs
      tabs={[
        {
          id: "payments",
          label: "Balans to‘ldirish",
          content: <PaymentsPage />,
        },
        {
          id: "transactions",
          label: "Pul harakatlari",
          content: <TransactionsPage />,
        },
      ]}
    />
  );
}
