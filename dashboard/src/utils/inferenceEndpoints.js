// One typed endpoint contract for architects, the wizard, and inference deployments.
export const INFERENCE_AUTH_TYPES = ['None', 'BearerToken', 'ApiKey', 'Headers', 'QueryString', 'Basic'];

export function blankInferenceEndpoint() {
  return { protocol: 'OpenAiCompatible', baseUrl: '', authenticationType: 'BearerToken', credentials: [{ name: '', location: 'Header', secretId: '' }] };
}

export function inferenceCredentials(type) {
  if (type === 'None') return [];
  if (type === 'Basic') return ['username', 'password'].map((name) => ({ name, location: 'Header', secretId: '' }));
  return [{ name: type === 'ApiKey' ? 'X-Api-Key' : '', location: type === 'QueryString' ? 'QueryString' : 'Header', secretId: '' }];
}

export function inferenceEndpointErrors(endpoint, model, t) {
  const errors = {};
  let validUrl = false;
  try {
    const url = new URL(endpoint?.baseUrl || '');
    validUrl = ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
  } catch { /* incomplete URL */ }
  const credentials = endpoint?.credentials || [];
  const type = endpoint?.authenticationType;
  const needsNames = ['ApiKey', 'Headers', 'QueryString'].includes(type);
  if (!validUrl || !['OpenAiCompatible', 'Ollama'].includes(endpoint?.protocol) || !INFERENCE_AUTH_TYPES.includes(type)
      || (type !== 'None' && (!credentials.length || credentials.some((c) => !c.secretId || (needsNames && !c.name?.trim()))))) errors.inferenceEndpoint = t('inference.invalid');
  if (!String(model || '').trim()) errors.model = t('common.errors.required');
  return errors;
}

/** Upgrade legacy provider parameters for editing; all newly saved forms use the typed contract. */
export function deploymentInferenceEndpoint(deployment) {
  if (deployment.inferenceEndpoint) return deployment.inferenceEndpoint;
  const params = Object.fromEntries((deployment.parameters || []).map((p) => [p.name, p.value]));
  const secret = (deployment.resourceBindings || []).find((b) => b.kind === 'Secret' && b.alias === 'credential');
  const anonymous = params.allowAnonymous === 'true';
  return { protocol: params.provider === 'Ollama' ? 'Ollama' : 'OpenAiCompatible', baseUrl: params.baseUrl || '', authenticationType: anonymous ? 'None' : 'BearerToken', credentials: anonymous ? [] : [{ name: '', location: 'Header', secretId: secret?.resourceId || '' }] };
}
