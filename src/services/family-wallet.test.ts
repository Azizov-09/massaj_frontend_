import { it, expect } from "vitest";
import { calculateParentBalance } from "./finance.service";
import type { Transaction } from "@/types";
const txn = (
  id: string,
  amount: number,
  direction: "IN" | "OUT",
  extra: Partial<Transaction> = {},
): Transaction => ({
  id,
  amount,
  direction,
  type: direction === "IN" ? "PAYMENT" : "SESSION_CHARGE",
  parentId: "family",
  date: "2026-01-01",
  createdAt: "2026-01-01",
  createdBy: "owner",
  description: "",
  ...extra,
});
it("shares a deposit between siblings and pays debt before leaving a deposit", () => {
  const rows = [
    txn("deposit", 100000, "IN", { childId: "a" }),
    txn("charge", 150000, "OUT", { childId: "b" }),
  ];
  expect(calculateParentBalance("family", ["a", "b"], rows)).toEqual({
    balance: 0,
    debt: 50000,
  });
  expect(
    calculateParentBalance(
      "family",
      ["a", "b"],
      [...rows, txn("payment", 70000, "IN")],
    ),
  ).toEqual({ balance: 20000, debt: 0 });
});
it("counts a transaction once and applies a reversal without touching another family", () => {
  const charge = txn("charge", 100000, "OUT", { childId: "a" });
  const rows = [
    charge,
    charge,
    txn("reversal", 100000, "IN", { type: "REFUND" }),
    txn("foreign", 500000, "IN", { parentId: "foreign", childId: "a" }),
    txn("expense", 500000, "OUT", { type: "EXPENSE" }),
  ];
  expect(calculateParentBalance("family", ["a"], rows)).toEqual({
    balance: 0,
    debt: 0,
  });
});
