// Unit tests for the pod-per-run executor fields of the deployment form (Phase 11).
import { describe, it, expect } from 'vitest';
import i18n from '../i18n/index.js';
import { isQuantity, podField, podResourcesToForm, podResourcesFromForm, podResourceErrors, deploymentToForm, deploymentToBody, POD_RESOURCE_KEYS } from '../utils/podResources';
import { ENUMS } from '../utils/constants';
import { enumLabel } from '../utils/enums';

const en = i18n.getFixedT('en');

describe('quantities', () => {
  it('accepts Kubernetes quantities like the server', () => {
    for (const v of ['500m', '2', '1.5', '512Mi', '4Gi', '100M', '1e3', '.5', ' 2Gi ']) expect(isQuantity(v)).toBe(true);
  });
  it('rejects anything else', () => {
    for (const v of ['', 'lots', '512MB', '-1', '1 Gi', 'Gi', null, undefined, 3]) expect(isQuantity(v)).toBe(false);
  });
});

describe('form conversion', () => {
  it('flattens podResources into one field per value', () => {
    expect(podField('ephemeralStorageLimit')).toBe('podEphemeralStorageLimit');
    const form = podResourcesToForm({ cpuRequest: '250m', memoryLimit: '1Gi' });
    expect(form).toEqual({ podCpuRequest: '250m', podCpuLimit: '', podMemoryRequest: '', podMemoryLimit: '1Gi', podEphemeralStorageRequest: '', podEphemeralStorageLimit: '' });
    expect(Object.keys(podResourcesToForm(null))).toHaveLength(POD_RESOURCE_KEYS.length);
  });
  it('rebuilds podResources with blanks omitted, or null when nothing is set', () => {
    expect(podResourcesFromForm({ podCpuRequest: ' 250m ', podMemoryLimit: '1Gi', podCpuLimit: '' })).toEqual({ cpuRequest: '250m', memoryLimit: '1Gi' });
    expect(podResourcesFromForm({ podCpuRequest: '', podMemoryLimit: null })).toBeNull();
  });
  it('round-trips a deployment and sends executor null when inherited', () => {
    const record = { id: 'dep_1', name: 'd', executor: 'KubernetesJob', podResources: { cpuLimit: '2', ephemeralStorageLimit: '10Gi' } };
    const form = deploymentToForm(record);
    expect(form.podResources).toBeUndefined();
    expect(form.podCpuLimit).toBe('2');
    const body = deploymentToBody(form);
    expect(body.executor).toBe('KubernetesJob');
    expect(body.podResources).toEqual({ cpuLimit: '2', ephemeralStorageLimit: '10Gi' });
    expect(Object.keys(body).some((k) => k.startsWith('pod') && k !== 'podResources')).toBe(false);
    expect(deploymentToBody({ ...form, executor: '' }).executor).toBeNull();
    expect(deploymentToForm({ name: 'x' }).executor).toBeNull();
  });
  it('reports invalid quantities by form field', () => {
    expect(podResourceErrors({ podCpuRequest: 'lots', podMemoryLimit: '1Gi', podCpuLimit: '' }, 'bad')).toEqual({ podCpuRequest: 'bad' });
  });
});

describe('labels', () => {
  it('names the executors, the PersistentVolume workspace kind, and the PodFailed outcome in every locale', () => {
    expect(ENUMS.runExecutor).toEqual(['Process', 'KubernetesJob', 'RemoteA2A', 'RemoteMcp']);
    expect(ENUMS.workspaceKind).toContain('PersistentVolume');
    expect(ENUMS.runOutcome).toContain('PodFailed');
    expect(enumLabel(en, 'runExecutor', 'KubernetesJob')).toBe('Kubernetes Job');
    expect(enumLabel(en, 'runOutcome', 'PodFailed')).toBe('Run pod failed');
    for (const lng of ['de', 'es', 'fr', 'it', 'ja', 'yue-Hant', 'zh-Hans', 'zh-Hant']) {
      const t = i18n.getFixedT(lng);
      expect(t('resources.deployments.fields.podMemoryLimit')).not.toBe('resources.deployments.fields.podMemoryLimit');
      expect(t('tips.enums.runOutcome.PodFailed')).not.toBe(en('tips.enums.runOutcome.PodFailed'));
      expect(t('tips.resources.deployments.executor')).not.toBe(en('tips.resources.deployments.executor'));
    }
  });
});


describe('executor capability requirements', () => {
  it('defaults legacy records to Process without extra requirements', () => {
    const body = deploymentToBody(deploymentToForm({ name: 'legacy' }));
    expect(body.requiredCapabilities).toEqual({ isolation: 'Process', coldStartClass: null, egressControl: false, filesystemSnapshot: false, sessionContinuation: false, crossNodeRestore: false });
  });
  it('preserves every configured requirement and removes flattened form fields', () => {
    const requiredCapabilities = { isolation: 'Container', coldStartClass: 'Cold', egressControl: true, filesystemSnapshot: true, sessionContinuation: true, crossNodeRestore: true };
    const body = deploymentToBody(deploymentToForm({ executor: 'KubernetesJob', requiredCapabilities }));
    expect(body.requiredCapabilities).toEqual(requiredCapabilities);
    expect(Object.keys(body).some((key) => /^cap[A-Z]/.test(key))).toBe(false);
  });
});
