import { describe, it, expect } from 'vitest';
import { usageQuotasConfig } from '../views/resourceConfigs';
const t = (key) => key;

describe('daily UTC quotas', () => {
  it('accepts null and explicit zero limits without merging their meanings', () => {
    const form = { ...usageQuotasConfig.blank(), name: 'quota', dailyRunLimit: 0, dailyTokenLimit: '', dailyCostUsdLimit: 0.125 };
    expect(usageQuotasConfig.validate(form, t)).toEqual({});
    const body = usageQuotasConfig.toBody(form);
    expect(body.dailyRunLimit).toBe(0);
    expect(body.dailyTokenLimit).toBeNull();
    expect(body.dailyCostUsdLimit).toBe(0.125);
    expect(body.resourceId).toBe('');
  });
  it.each([-1, 0.1, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1])('rejects invalid count %s', (value) => {
    expect(usageQuotasConfig.validate({ ...usageQuotasConfig.blank(), name: 'quota', dailyRunLimit: value }, t).dailyRunLimit).toBe('resources.usageQuotas.errors.limit');
  });
  it('requires an agent/deployment target and preserves the selected ID', () => {
    const form = { ...usageQuotasConfig.blank(), name: 'quota', scope: 'Agent' };
    expect(usageQuotasConfig.validate(form, t).resourceId).toBe('common.errors.required');
    form.resourceId = 'agt_selected';
    expect(usageQuotasConfig.toBody(form).resourceId).toBe('agt_selected');
  });
  it('lets administrators manage quotas while read roles only inspect usage', () => {
    expect(usageQuotasConfig.canManage({ principal: { isTenantAdmin: true } })).toBe(true);
    expect(usageQuotasConfig.canManage({ principal: { isAdmin: true } })).toBe(true);
    expect(usageQuotasConfig.canManage({ principal: {} })).toBe(false);
  });
});
