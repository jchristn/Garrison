import { describe, expect, it } from 'vitest';
import { blankInferenceEndpoint, inferenceCredentials, inferenceEndpointErrors, deploymentInferenceEndpoint } from '../utils/inferenceEndpoints';
import { architectBody, architectFormErrors, needsCredential } from '../utils/architect';
const t = (key) => key;

describe('explicit inference endpoint configuration', () => {
  it('accepts local native Ollama without any secret and still requires a model', () => {
    const endpoint = { protocol: 'Ollama', baseUrl: 'http://ollama:11434', authenticationType: 'None', credentials: [] };
    expect(inferenceEndpointErrors(endpoint, 'local-model', t)).toEqual({});
    expect(inferenceEndpointErrors(endpoint, '', t).model).toBeTruthy();
    expect(needsCredential('ProviderApi')).toBe(false);
    const form = { name: 'local', harnessProfileId: 'provider', isProviderApi: true, model: 'local-model', inferenceEndpoint: endpoint, credentialSecretId: 'legacy-key' };
    expect(architectFormErrors(form, t)).toEqual({});
    expect(architectBody(form)).toEqual({ name: 'local', harnessProfileId: 'provider', model: 'local-model', inferenceEndpoint: endpoint });
  });
  it('keeps credentials out of URLs and requires selected secret references', () => {
    const endpoint = blankInferenceEndpoint();
    for (const baseUrl of ['ftp://example.com', 'https://user:password@example.com', 'https://example.com?token=value', 'https://example.com#fragment']) expect(inferenceEndpointErrors({ ...endpoint, baseUrl }, 'model', t).inferenceEndpoint).toBeTruthy();
    expect(inferenceEndpointErrors({ ...endpoint, baseUrl: 'https://ollama.com' }, 'model', t).inferenceEndpoint).toBeTruthy();
    expect(inferenceEndpointErrors({ ...endpoint, baseUrl: 'https://ollama.com', credentials: [{ name: '', location: 'Header', secretId: 'sec_token' }] }, 'model', t)).toEqual({});
  });
  it('prepares independent named values for Basic and upgrades legacy anonymous endpoints', () => {
    expect(inferenceCredentials('Basic').map((c) => c.name)).toEqual(['username', 'password']);
    expect(inferenceCredentials('None')).toEqual([]);
    expect(deploymentInferenceEndpoint({ parameters: [{ name: 'baseUrl', value: 'http://local:11434' }, { name: 'allowAnonymous', value: 'true' }] }).authenticationType).toBe('None');
  });
});
