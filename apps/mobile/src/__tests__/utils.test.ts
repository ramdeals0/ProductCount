import { describe, it, expect } from 'vitest';
import { calculateVariance } from '../lib/utils';
import { RestrictedType } from '@shopcount/types';

describe('mobile calculateVariance', () => {
  it('matches expected variance for shortage', () => {
    const result = calculateVariance(10, 8);
    expect(result.varianceQty).toBe(-2);
  });

  it('flags restricted alcohol for negative variance', () => {
    const result = calculateVariance(10, 7, RestrictedType.ALCOHOL);
    expect(result.requiresApproval).toBe(true);
  });
});
