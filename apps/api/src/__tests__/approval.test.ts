import { describe, it, expect } from 'vitest';
import { canBulkApproveLine } from '../lib/approval';

describe('canBulkApproveLine', () => {
  const thresholds = { maxVariancePercent: 5, maxVarianceQty: 2, excludeRestricted: true };

  it('approves matched low-variance grocery lines', () => {
    expect(
      canBulkApproveLine(
        { id: '1', varianceQty: 0, variancePercent: 0, requiresApproval: false, approved: false },
        thresholds,
      ),
    ).toBe(true);
  });

  it('approves small overage within threshold', () => {
    expect(
      canBulkApproveLine(
        { id: '1', varianceQty: 1, variancePercent: 3, requiresApproval: false, approved: false },
        thresholds,
      ),
    ).toBe(true);
  });

  it('skips already approved lines', () => {
    expect(
      canBulkApproveLine(
        { id: '1', varianceQty: 0, variancePercent: 0, requiresApproval: false, approved: true },
        thresholds,
      ),
    ).toBe(false);
  });

  it('skips restricted lines requiring approval when excludeRestricted is true', () => {
    expect(
      canBulkApproveLine(
        {
          id: '1',
          varianceQty: -5,
          variancePercent: -10,
          requiresApproval: true,
          approved: false,
          restrictedCategory: true,
        },
        thresholds,
      ),
    ).toBe(false);
  });

  it('skips high variance lines', () => {
    expect(
      canBulkApproveLine(
        { id: '1', varianceQty: -10, variancePercent: -50, requiresApproval: false, approved: false },
        thresholds,
      ),
    ).toBe(false);
  });

  it('skips uncounted lines', () => {
    expect(
      canBulkApproveLine(
        { id: '1', varianceQty: null, variancePercent: null, requiresApproval: false, approved: false },
        thresholds,
      ),
    ).toBe(false);
  });
});
