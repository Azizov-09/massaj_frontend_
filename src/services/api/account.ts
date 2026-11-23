import { ApiError } from "./client";
export function normalizeAccount(value: any): {
  balance: number;
  debt: number;
} {
  const account = value?.data || value;
  if (
    !account ||
    !Number.isFinite(account.balance) ||
    !Number.isFinite(account.debt) ||
    account.balance < 0 ||
    account.debt < 0 ||
    (account.balance > 0 && account.debt > 0)
  )
    throw new ApiError(
      "Oila balansi serverdan tasdiqlanmadi. Qayta yuklang.",
      502,
    );
  return { balance: account.balance, debt: account.debt };
}
