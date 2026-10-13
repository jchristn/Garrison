// Run pod resources and executors for KubernetesJob deployments (plan D-033, Phase 11).
// The deployment form edits the six podResources values as flat fields; these helpers convert both ways.

/** podResources keys, in form order. */
export const EXECUTOR_REQUIREMENT_FLAGS = ['egressControl', 'filesystemSnapshot', 'sessionContinuation', 'crossNodeRestore'];
export const capabilityField = (key) => `cap${key.charAt(0).toUpperCase()}${key.slice(1)}`;

export const requirementsToForm = (value) => ({
  capIsolation: value?.isolation || 'Process', capColdStartClass: value?.coldStartClass || null,
  ...Object.fromEntries(EXECUTOR_REQUIREMENT_FLAGS.map((key) => [capabilityField(key), Boolean(value?.[key])]))
});

export const requirementsFromForm = (form) => ({
  isolation: form?.capIsolation || 'Process', coldStartClass: form?.capColdStartClass || null,
  ...Object.fromEntries(EXECUTOR_REQUIREMENT_FLAGS.map((key) => [key, Boolean(form?.[capabilityField(key)])]))
});

export const POD_RESOURCE_KEYS = ['cpuRequest', 'cpuLimit', 'memoryRequest', 'memoryLimit', 'ephemeralStorageRequest', 'ephemeralStorageLimit'];

/** Flat form field name for a podResources key, for example podCpuRequest. */
export function podField(key) {
  return `pod${key.charAt(0).toUpperCase()}${key.slice(1)}`;
}

/** Example quantity shown as a placeholder for each value. */
export const POD_RESOURCE_EXAMPLES = {
  cpuRequest: '250m',
  cpuLimit: '2',
  memoryRequest: '512Mi',
  memoryLimit: '4Gi',
  ephemeralStorageRequest: '1Gi',
  ephemeralStorageLimit: '10Gi'
};

const QUANTITY = /^[+]?([0-9]+(\.[0-9]*)?|\.[0-9]+)(m|k|M|G|T|P|E|Ki|Mi|Gi|Ti|Pi|Ei|[eE][+-]?[0-9]+)?$/;

/** Whether a value is a Kubernetes quantity such as 500m, 2, 512Mi, or 4Gi (the server's rule). */
export function isQuantity(value) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  return v.length > 0 && v.length <= 64 && QUANTITY.test(v);
}

/** Form values for a deployment's podResources: one flat string field per value, '' when unset. */
export function podResourcesToForm(podResources) {
  const out = {};
  for (const key of POD_RESOURCE_KEYS) out[podField(key)] = podResources?.[key] ?? '';
  return out;
}

/** podResources for the API from flat form values: trimmed, blanks omitted; null when nothing is set. */
export function podResourcesFromForm(form) {
  const out = {};
  for (const key of POD_RESOURCE_KEYS) {
    const raw = form?.[podField(key)];
    const value = typeof raw === 'string' ? raw.trim() : raw === null || raw === undefined ? '' : String(raw).trim();
    if (value) out[key] = value;
  }
  return Object.keys(out).length ? out : null;
}

/** Errors for flat pod resource fields that are not quantities, keyed by form field name. */
export function podResourceErrors(form, message) {
  const errors = {};
  for (const key of POD_RESOURCE_KEYS) {
    const raw = form?.[podField(key)];
    if (typeof raw === 'string' && raw.trim() && !isQuantity(raw)) errors[podField(key)] = message;
  }
  return errors;
}

/** Deployment form values from an API record: flattens podResources and keeps executor (null inherits). */
export function deploymentToForm(record) {
  const { podResources, requiredCapabilities, ...rest } = record || {};
  return { ...rest, executor: rest.executor ?? null, ...podResourcesToForm(podResources), ...requirementsToForm(requiredCapabilities) };
}

/** API body from deployment form values: executor null when inherited, podResources rebuilt, flat fields removed. */
export function deploymentToBody(form) {
  const body = { ...(form || {}) };
  for (const key of POD_RESOURCE_KEYS) delete body[podField(key)];
  for (const key of [...EXECUTOR_REQUIREMENT_FLAGS, 'isolation', 'coldStartClass']) delete body[capabilityField(key)];
  body.requiredCapabilities = requirementsFromForm(form);
  body.executor = form?.executor ? form.executor : null;
  body.podResources = podResourcesFromForm(form);
  return body;
}
