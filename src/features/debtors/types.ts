// ═══════════════════════════════════════════════════════
//  Debtors Types & Constants
// ═══════════════════════════════════════════════════════

export type DebtLevel = 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type SortField = 'rank' | 'childName' | 'daysOverdue' | 'debt';
export type SortOrder = 'asc' | 'desc';

export interface DebtorItem {
  childId: string;
  childName: string;
  parentId: string;
  parentName: string;
  parentPhone?: string;
  debt: number;
  balance: number;
  daysOverdue: number;
}

export const formatMoney = (val: number): string => {
  return `${new Intl.NumberFormat('uz-UZ').format(val)} so'm`;
};
