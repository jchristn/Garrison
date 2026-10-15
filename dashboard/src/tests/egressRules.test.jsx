import { describe, it, expect } from 'vitest';
import { deploymentsConfig, resolvedExecutor, egressRuleText } from '../views/resourceConfigs';
import { cidrProblem, egressErrors, egressRulesToBody, egressRulesToForm, MAX_EGRESS_RULES } from '../utils/egressRules';
import { blockedReasonTextKey } from '../components/BlockedRun';
const t = (key, params) => (params?.message ? `${key}: ${params.message}` : key);

describe('Deployment egress allowlists (P11.15)', () => {
  it('accepts network addresses in CIDR notation and names what is wrong otherwise', () => {
    for (const ok of ['203.0.113.0/24', '198.51.100.7/32', '0.0.0.0/0', '10.0.0.0/8', '2001:db8::/32', '::/0', 'fd00::/8', '64:ff9b::/96', '2001:db8::1/128']) expect(cidrProblem(ok), ok).toBeNull();
    expect(cidrProblem('')).toBe('cidrRequired');
    expect(cidrProblem('203.0.113.0')).toBe('cidrFormat');
    expect(cidrProblem('api.example.com/32')).toBe('cidrAddress');
    expect(cidrProblem('010.0.0.0/8')).toBe('cidrAddress');
    expect(cidrProblem('256.0.0.0/8')).toBe('cidrAddress');
    expect(cidrProblem('10.0.0.0/33')).toBe('cidrPrefix');
    expect(cidrProblem('2001:db8::/129')).toBe('cidrPrefix');
    expect(cidrProblem('::ffff:10.0.0.0/104')).toBe('cidrMapped');
    expect(cidrProblem('10.0.0.1/8')).toBe('cidrHostBits');
    expect(cidrProblem('2001:db8::1/32')).toBe('cidrHostBits');
  });

  it('round-trips rules between the API and the form, sending an empty port as null', () => {
    const rules = [{ cidr: '203.0.113.0/24', port: 443, protocol: 'TCP' }, { cidr: '2001:db8::/32', port: null, protocol: 'UDP' }];
    const form = egressRulesToForm(rules);
    expect(form[1].port).toBe('');
    expect(egressRulesToBody(form)).toEqual(rules);
    expect(egressRulesToBody([{ cidr: ' 10.0.0.0/8 ', port: '8443' }])).toEqual([{ cidr: '10.0.0.0/8', port: 8443, protocol: 'TCP' }]);
    expect(deploymentsConfig.blank().egressRules).toEqual([]);
    const body = deploymentsConfig.toBody({ ...deploymentsConfig.blank(), egressRules: form });
    expect(body.egressRules).toEqual(rules);
    expect(deploymentsConfig.toForm({ egressRules: rules }).egressRules[0]).toEqual({ cidr: '203.0.113.0/24', port: 443, protocol: 'TCP' });
    expect(egressRuleText(rules[0])).toBe('203.0.113.0/24:443/TCP');
  });

  it('mirrors the server field codes', () => {
    const errors = egressErrors({ egressRules: [{ cidr: 'nope', port: 70000, protocol: 'SCTP' }], executor: 'Process', capColdStartClass: 'Warm' }, t);
    expect(errors.egressRules).toContain('common.fieldCodes.InvalidCidr');
    expect(errors.egressRules).toContain('common.fieldCodes.PortOutOfRange');
    expect(errors.egressRules).toContain('common.fieldCodes.InvalidProtocol');
    expect(errors.executor).toBe('common.fieldCodes.EgressRulesNeedKubernetesJob');
    expect(errors.capColdStartClass).toBe('common.fieldCodes.EgressRulesNeedColdStart');
    const many = Array.from({ length: MAX_EGRESS_RULES + 1 }, () => ({ cidr: '10.0.0.0/8', port: '', protocol: 'TCP' }));
    expect(egressErrors({ egressRules: many }, t).egressRules).toContain('common.fieldCodes.TooManyEgressRules');
    expect(egressErrors({ egressRules: [{ cidr: '10.0.0.0/8', port: '', protocol: 'TCP' }], executor: 'KubernetesJob' }, t)).toEqual({});
    expect(egressErrors({ egressRules: [], executor: 'Process', capColdStartClass: 'Warm' }, t)).toEqual({});
    const validated = deploymentsConfig.validate({ name: 'a', agentId: 'b', harnessProfileId: 'c', executor: 'Process', egressRules: [{ cidr: '10.0.0.0/8', port: '', protocol: 'TCP' }] }, t);
    expect(validated.executor).toBe('common.fieldCodes.EgressRulesNeedKubernetesJob');
  });

  it('resolves an unset executor to KubernetesJob and explains where allowlisted runs go', () => {
    const rules = [{ cidr: '10.0.0.0/8', port: '', protocol: 'TCP' }];
    expect(resolvedExecutor({ egressRules: rules }, [])).toBe('KubernetesJob');
    expect(resolvedExecutor({ egressRules: [] }, [])).toBe('Process');
    expect(deploymentsConfig.formNotice({ egressRules: rules }, { t, options: {} }).props['data-testid']).toBe('egress-note');
    expect(deploymentsConfig.formNotice({ egressRules: rules, executor: 'Process' }, { t, options: {} }).props['data-testid']).toBe('egress-process');
  });

  it('explains a NoIsolatingWorker run that needs egress control', () => {
    expect(blockedReasonTextKey({ requiredCapabilities: { egressControl: true } }, 'NoIsolatingWorker')).toBe('components.blocked.reasons.NoIsolatingWorkerEgress');
    expect(blockedReasonTextKey({ trustLevel: 'Untrusted', requiredCapabilities: { egressControl: false } }, 'NoIsolatingWorker')).toBe('components.blocked.reasons.NoIsolatingWorker');
    expect(blockedReasonTextKey({}, 'NoReadyWorker')).toBe('components.blocked.reasons.NoReadyWorker');
  });
});
