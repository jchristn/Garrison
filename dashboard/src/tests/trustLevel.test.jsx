import { describe, it, expect } from 'vitest';
import { deploymentsConfig, tenantsConfig, resolvedExecutor } from '../views/resourceConfigs';
import { ENUMS } from '../utils/constants';
const t = (key) => key;

describe('Deployment trust level (P11.14)', () => {
  it('defaults new deployments to Trusted and sends the trust level in the body', () => {
    expect(deploymentsConfig.blank().trustLevel).toBe('Trusted');
    expect(deploymentsConfig.toBody({ ...deploymentsConfig.blank(), trustLevel: 'Untrusted' }).trustLevel).toBe('Untrusted');
    expect(ENUMS.trustLevel).toEqual(['Trusted', 'Untrusted']);
    expect(ENUMS.runBlockedReason).toContain('NoIsolatingWorker');
  });
  it('resolves an unset Untrusted executor to KubernetesJob, never Process', () => {
    expect(resolvedExecutor({ trustLevel: 'Untrusted' }, [])).toBe('KubernetesJob');
    expect(resolvedExecutor({ trustLevel: 'Trusted' }, [])).toBe('Process');
    expect(resolvedExecutor({ trustLevel: 'Untrusted', executor: 'Process' }, [])).toBe('Process');
  });
  it('shows no Process warning for Untrusted and flags Untrusted on Process', () => {
    expect(deploymentsConfig.formNotice({ trustLevel: 'Untrusted' }, { t, options: {} })).toBeNull();
    const notice = deploymentsConfig.formNotice({ trustLevel: 'Untrusted', executor: 'Process' }, { t, options: {} });
    expect(notice.props['data-testid']).toBe('untrusted-process');
    expect(deploymentsConfig.validate({ name: 'a', agentId: 'b', harnessProfileId: 'c', trustLevel: 'Untrusted', executor: 'Process' }, t).executor).toBe('common.fieldCodes.UntrustedNeedsIsolation');
  });
  it('warns when the tenant requires Untrusted and the deployment is Trusted', () => {
    const notice = deploymentsConfig.formNotice({ trustLevel: 'Trusted', executor: 'KubernetesJob' }, { t, options: { tenant: { requireUntrustedDeployments: true } } });
    expect(notice.props['data-testid']).toBe('tenant-requires-untrusted');
  });
  it('round-trips the tenant policy', () => {
    expect(tenantsConfig.blank().requireUntrustedDeployments).toBe(false);
    expect(tenantsConfig.toBody({ name: 'x', requireUntrustedDeployments: true }).requireUntrustedDeployments).toBe(true);
  });
});
