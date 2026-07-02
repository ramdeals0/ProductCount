import { describe, it, expect } from 'vitest';
import { calculateVariance } from '../lib/variance';
import { RestrictedType } from '@shopcount/types';

describe('calculateVariance', () => {
  it('calculates zero variance for matched count', () => {
    const result = calculateVariance(10, 10);
    expect(result.varianceQty).toBe(0);
    expect(result.variancePercent).toBe(0);
    expect(result.requiresApproval).toBe(false);
  });

  it('calculates shortage variance', () => {
    const result = calculateVariance(10, 7);
    expect(result.varianceQty).toBe(-3);
    expect(result.variancePercent).toBe(-30);
    expect(result.requiresApproval).toBe(false);
  });

  it('calculates overage variance', () => {
    const result = calculateVariance(10, 12);
    expect(result.varianceQty).toBe(2);
    expect(result.variancePercent).toBe(20);
    expect(result.requiresApproval).toBe(false);
  });

  it('requires approval for alcohol shortage above threshold', () => {
    const result = calculateVariance(20, 15, RestrictedType.ALCOHOL);
    expect(result.varianceQty).toBe(-5);
    expect(result.requiresApproval).toBe(true);
  });

  it('requires approval for tobacco variance above percent threshold', () => {
    const result = calculateVariance(100, 94, RestrictedType.TOBACCO);
    expect(result.varianceQty).toBe(-6);
    expect(result.requiresApproval).toBe(true);
  });

  it('does not require approval for grocery items with large variance', () => {
    const result = calculateVariance(20, 10, RestrictedType.NONE);
    expect(result.requiresApproval).toBe(false);
  });

  it('handles zero expected quantity', () => {
    const result = calculateVariance(0, 5);
    expect(result.varianceQty).toBe(5);
    expect(result.variancePercent).toBe(100);
  });
});
