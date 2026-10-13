import { describe, it, expect } from 'vitest';
import { deploymentsConfig } from '../views/resourceConfigs';
const t = (key) => key;
const options = { pools: [{ id: 'isolated', defaultExecutor: 'KubernetesJob' }] };

describe('Process trusted-only notice', () => {
  it('warns for explicit Process and the inherited Process default', () => {
    expect(deploymentsConfig.formNotice({ executor: 'Process', nodePoolId: 'isolated' }, { t, options }).props.children).toBe('processSecurity.trustedOnly');
    expect(deploymentsConfig.formNotice({}, { t, options }).props.children).toBe('processSecurity.trustedOnly');
  });
  it('does not show a Process warning for explicit or inherited KubernetesJob', () => {
    expect(deploymentsConfig.formNotice({ executor: 'KubernetesJob' }, { t, options })).toBeNull();
    expect(deploymentsConfig.formNotice({ nodePoolId: 'isolated' }, { t, options })).toBeNull();
  });
});
