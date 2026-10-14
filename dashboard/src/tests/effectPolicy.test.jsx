import { describe, it, expect } from 'vitest';
import { deploymentsConfig, effectPolicyOf } from '../views/resourceConfigs';
import { ENUMS } from '../utils/constants';

describe('Deployment effect policy (P12.29)', () => {
  it('defaults new deployments to AtMostOnce and lists the three policies', () => {
    expect(deploymentsConfig.blank().effectPolicy).toBe('AtMostOnce');
    expect(deploymentsConfig.blank().retryOnNodeLoss).toBeUndefined();
    expect(ENUMS.effectPolicy).toEqual(['AtMostOnce', 'AtLeastOnce', 'Journaled']);
  });
  it('sends effectPolicy and never the deprecated retryOnNodeLoss', () => {
    const form = deploymentsConfig.toForm({ name: 'd', effectPolicy: 'AtLeastOnce', retryOnNodeLoss: true });
    expect(form.effectPolicy).toBe('AtLeastOnce');
    const body = deploymentsConfig.toBody({ ...form, effectPolicy: 'Journaled', retryOnNodeLoss: true });
    expect(body.effectPolicy).toBe('Journaled');
    expect('retryOnNodeLoss' in body).toBe(false);
  });
  it('derives the policy of records without effectPolicy from retryOnNodeLoss', () => {
    expect(effectPolicyOf({ retryOnNodeLoss: true })).toBe('AtLeastOnce');
    expect(effectPolicyOf({ retryOnNodeLoss: false })).toBe('AtMostOnce');
    expect(effectPolicyOf({})).toBe('AtMostOnce');
    expect(effectPolicyOf({ effectPolicy: 'Journaled', retryOnNodeLoss: false })).toBe('Journaled');
    expect(deploymentsConfig.toForm({ name: 'legacy', retryOnNodeLoss: true }).effectPolicy).toBe('AtLeastOnce');
  });
});
