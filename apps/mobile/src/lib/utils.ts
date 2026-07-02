import {
  RESTRICTED_VARIANCE_THRESHOLD_PERCENT,
  RESTRICTED_VARIANCE_THRESHOLD_QTY,
  RestrictedType,
} from '@shopcount/types';

export function calculateVariance(
  expectedQty: number,
  countedQty: number,
  restrictedType: string = RestrictedType.NONE,
) {
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

export function getVarianceColor(variance: number | null): string {
  if (variance === null) return '#78716C';
  if (variance === 0) return '#16A34A';
  if (variance < 0) return '#DC2626';
  return '#D97706';
}

export function formatSyncStatus(status: string): { label: string; color: string } {
  switch (status) {
    case 'synced':
      return { label: 'Synced', color: '#16A34A' };
    case 'pending':
      return { label: 'Pending', color: '#D97706' };
    case 'failed':
      return { label: 'Failed', color: '#DC2626' };
    default:
      return { label: status, color: '#78716C' };
  }
}

export function formatSessionStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
