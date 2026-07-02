import {
  RESTRICTED_VARIANCE_THRESHOLD_PERCENT,
  RESTRICTED_VARIANCE_THRESHOLD_QTY,
  RestrictedType,
} from '@shopcount/types';

export interface VarianceResult {
  varianceQty: number;
  variancePercent: number | null;
  requiresApproval: boolean;
}

export function calculateVariance(
  expectedQty: number,
  countedQty: number,
  restrictedType: string = RestrictedType.NONE,
): VarianceResult {
  const varianceQty = countedQty - expectedQty;
  const variancePercent =
    expectedQty === 0 ? (countedQty === 0 ? 0 : 100) : (varianceQty / expectedQty) * 100;

  const isRestricted = restrictedType !== RestrictedType.NONE;
  const absVariance = Math.abs(varianceQty);
  const absPercent = Math.abs(variancePercent);

  const requiresApproval =
    isRestricted &&
    (absVariance >= RESTRICTED_VARIANCE_THRESHOLD_QTY ||
      absPercent >= RESTRICTED_VARIANCE_THRESHOLD_PERCENT ||
      varianceQty < 0);

  return {
    varianceQty,
    variancePercent: Math.round(variancePercent * 100) / 100,
    requiresApproval,
  };
}

export function matchesVarianceFilter(
  filter: string,
  line: {
    expectedQty: number;
    countedQty: number | null;
    varianceQty: number | null;
    requiresApproval: boolean;
    restrictedCategory?: boolean;
  },
): boolean {
  const counted = line.countedQty ?? null;
  const variance = line.varianceQty ?? 0;

  switch (filter) {
    case 'matched':
      return counted !== null && variance === 0;
    case 'shortage':
      return counted !== null && variance < 0;
    case 'overage':
      return counted !== null && variance > 0;
    case 'restricted':
      return !!line.restrictedCategory;
    case 'uncounted':
      return counted === null;
    case 'needs_approval':
      return line.requiresApproval;
    default:
      return true;
  }
}

export function getCompletionPercent(total: number, counted: number): number {
  if (total === 0) return 0;
  return Math.round((counted / total) * 100);
}
