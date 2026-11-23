import type { Transaction } from "@/types";

export function calculateParentBalance(
  parentId: string,
  childrenIds: string[],
  transactions: Transaction[],
): { balance: number; debt: number } {
  const seen = new Set<string>();
  let net = 0;
  for (const transaction of transactions) {
    if (seen.has(transaction.id) || transaction.type === "EXPENSE") continue;
    const belongs = transaction.parentId
      ? transaction.parentId === parentId
      : Boolean(
          transaction.childId && childrenIds.includes(transaction.childId),
        );
    if (!belongs) continue;
    seen.add(transaction.id);
    net +=
      transaction.direction === "IN" ? transaction.amount : -transaction.amount;
  }
  return { balance: Math.max(net, 0), debt: Math.max(-net, 0) };
}
