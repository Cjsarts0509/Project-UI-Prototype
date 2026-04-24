// 점포별 공용알바 공제액 계산 로직
// 반올림 규칙: 소수점 첫째자리 반올림 후 1원 단위 (Math.round)

import type { DeductionSupplier } from '../data/mockStorePartDeduction';

export interface CalculatedRow extends DeductionSupplier {
  finalSales: number;   // 최종매출금액 = 매출 - 매출제외
  ratePct: number;      // 점유율(%)
  deduction: number;    // 공제액(원)
}

export function roundWon(v: number): number {
  return Math.round(v);
}

export function calcDeduction(
  totalCost: number,
  rows: DeductionSupplier[]
): CalculatedRow[] {
  const enriched = rows.map(r => ({
    ...r,
    finalSales: Math.max(0, (r.sales || 0) - (r.excludeSales || 0)),
    ratePct: 0,
    deduction: 0,
  }));

  // 1) 고정공제(A), 고정점유율(R) 먼저 산정
  let fixedSum = 0;
  let ratedSum = 0;
  enriched.forEach(r => {
    if (r.type === 'A') {
      r.deduction = roundWon(r.fixedAmount || 0);
      fixedSum += r.deduction;
    } else if (r.type === 'R') {
      r.deduction = roundWon(totalCost * (r.fixedRate || 0));
      r.ratePct = (r.fixedRate || 0) * 100;
      ratedSum += r.deduction;
    }
  });

  // 2) 일반형(N) 분배 — 제외(E)는 0
  const normals = enriched.filter(r => r.type === 'N');
  const normalShare = totalCost - fixedSum - ratedSum;
  const normalTotalSales = normals.reduce((a, r) => a + r.finalSales, 0);

  if (normalTotalSales > 0) {
    normals.forEach(r => {
      r.ratePct = (r.finalSales / normalTotalSales) * 100;
      r.deduction = roundWon((normalShare * r.finalSales) / normalTotalSales);
    });
  }
  return enriched;
}

export const TYPE_LABEL: Record<string, string> = {
  N: '일반',
  R: '고정점유율',
  A: '고정공제',
  E: '제외',
};
