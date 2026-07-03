import {
  RESTRICTED_VARIANCE_THRESHOLD_PERCENT,
  RESTRICTED_VARIANCE_THRESHOLD_QTY,
} from '@shopcount/types';

export interface BulkApproveThresholds {
  maxVariancePercent: number;
  maxVarianceQty: number;
  excludeRestricted: boolean;
}

export interface LineForApproval {
  id: string;
  varianceQty: number | null;
  variancePercent: number | null;
  requiresApproval: boolean;
  approved: boolean;
  restrictedCategory?: boolean;
}

/** Whether a line qualifies for bulk low-variance auto-approval */
export function canBulkApproveLine(
  line: LineForApproval,
  thresholds: BulkApproveThresholds,
): boolean {
  if (line.approved) return false;
  if (line.varianceQty === null) return false;
  if (thresholds.excludeRestricted && line.requiresApproval) return false;
  if (line.restrictedCategory && thresholds.excludeRestricted) return false;

  const absQty = Math.abs(line.varianceQty);
  const absPct = Math.abs(line.variancePercent ?? 0);

  return absQty <= thresholds.maxVarianceQty && absPct <= thresholds.maxVariancePercent;
}

export function getDefaultBulkApproveThresholds(settings?: {
  varianceAutoApprovePercent?: number;
  varianceAutoApprovePercentRestricted?: number;
  varianceAutoApproveQtyRestricted?: number;
}): BulkApproveThresholds {
  return {
    maxVariancePercent: settings?.varianceAutoApprovePercent ?? 10,
    maxVarianceQty: settings?.varianceAutoApproveQtyRestricted ?? RESTRICTED_VARIANCE_THRESHOLD_QTY,
    excludeRestricted: true,
  };
}

export { RESTRICTED_VARIANCE_THRESHOLD_PERCENT, RESTRICTED_VARIANCE_THRESHOLD_QTY };
