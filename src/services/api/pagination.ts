import { ApiError, type ApiClient } from "./client";

/** Never treat the first page of a financial ledger as its complete history. */
export async function getAllPages<T extends { id: string }>(
  client: ApiClient,
  path: string,
  params: Record<string, unknown> | undefined,
  normalize: (raw: any) => T,
): Promise<T[]> {
  const limit = Number(params?.limit) || 100;
  const rows = new Map<string, T>();
  for (let page = 1; page <= 1000; page++) {
    const result = await client.get<any>(path, { ...params, limit, page });
    const data = Array.isArray(result)
      ? result
      : Array.isArray(result?.data)
        ? result.data
        : (result?.items ?? result?.data?.items);
    if (!Array.isArray(data))
      throw new ApiError("Server ro'yxatni to'liq qaytarmadi", 502);
    const before = rows.size;
    for (const raw of data) {
      const row = normalize(raw);
      if (!row?.id || row.id === "undefined")
        throw new ApiError("Server yozuv identifikatorini qaytarmadi", 502);
      rows.set(row.id, row);
    }
    const meta =
      result?.meta ?? result?.pagination ?? result?.data?.meta ?? result;
    const total = Number(meta?.total ?? meta?.totalItems);
    const pages = Number(meta?.totalPages);
    if (Number.isFinite(total) && rows.size >= total) return [...rows.values()];
    if (Number.isFinite(pages) && page >= pages) return [...rows.values()];
    if (data.length < limit) {
      if (Number.isFinite(total) && rows.size < total)
        throw new ApiError("Server ro'yxati to'liq emas", 502);
      return [...rows.values()];
    }
    if (rows.size === before)
      throw new ApiError(
        "Server sahifalashni qo'llamayapti. Ro'yxat to'liq emas",
        502,
      );
  }
  throw new ApiError("Ro'yxatni to'liq yuklab bo'lmadi", 502);
}
