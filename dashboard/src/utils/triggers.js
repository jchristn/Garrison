// Form helpers for triggers (P12.5) and notification endpoints (P12.14): blank records, record-to-form and
// form-to-body conversion, client-side checks that mirror the server's validation, and the webhook URL.

import { SUBSCRIBABLE_NOTIFICATION_EVENTS, TRIGGER_LIMITS } from './constants';

const NAME = /^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$/;

/** Header names of the Garrison webhook signature scheme, shared by trigger webhooks and notifications. */
export const WEBHOOK_HEADERS = { signature: 'X-Garrison-Signature', delivery: 'X-Garrison-Delivery', event: 'X-Garrison-Event' };

/** The signature header format, shown next to webhook URLs. */
export const SIGNATURE_FORMAT = 't=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<raw body>">';

/** A new trigger: a daily cron schedule in UTC that runs an agent. */
export function blankTrigger() {
  return {
    name: '',
    description: '',
    type: 'Cron',
    targetType: 'Agent',
    agentId: '',
    deploymentId: '',
    pipelineId: '',
    inputTemplateId: '',
    priority: TRIGGER_LIMITS.priority.default,
    cronExpression: '0 9 * * *',
    timeZone: 'UTC',
    active: true
  };
}

/** A trigger record as form data (server-managed fields kept for viewing). */
export function triggerToForm(r) {
  return {
    ...r,
    description: r.description ?? '',
    agentId: r.agentId ?? '',
    deploymentId: r.deploymentId ?? '',
    pipelineId: r.pipelineId ?? '',
    inputTemplateId: r.inputTemplateId ?? '',
    priority: r.priority ?? 0,
    cronExpression: r.cronExpression ?? '',
    timeZone: r.timeZone || 'UTC',
    active: r.active !== false
  };
}

/** The request body for create and update: only the fields the target and type use. */
export function triggerToBody(d) {
  const blank = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());
  const agent = d.targetType !== 'Pipeline';
  const cron = d.type !== 'Webhook';
  return {
    name: (d.name || '').trim(),
    description: blank(d.description),
    type: d.type || 'Cron',
    targetType: agent ? 'Agent' : 'Pipeline',
    agentId: agent ? blank(d.agentId) : null,
    deploymentId: agent ? blank(d.deploymentId) : null,
    pipelineId: agent ? null : blank(d.pipelineId),
    inputTemplateId: blank(d.inputTemplateId),
    priority: Number.isFinite(Number(d.priority)) ? Number(d.priority) : 0,
    cronExpression: cron ? blank(d.cronExpression) : null,
    timeZone: cron ? blank(d.timeZone) || 'UTC' : 'UTC',
    active: d.active !== false
  };
}

/** Copy of a trigger for Duplicate: a new name, no identity, schedule state, or secret. */
export function triggerDuplicate(r) {
  const form = triggerToForm(r);
  for (const k of ['id', 'tenantId', 'createdUtc', 'lastUpdateUtc', 'lastFireUtc', 'lastFireOutcome', 'nextFireUtc', 'fireCount', 'signingSecretLast4', 'signingSecretRotatedUtc', 'runAsType', 'runAsId', 'runAsName']) delete form[k];
  form.name = `${r.name}-copy`.slice(0, 64);
  return form;
}

/** True for a five-field cron expression or a macro such as @daily. The server checks the values. */
export function looksLikeCron(value) {
  const v = String(value || '').trim();
  if (!v) return false;
  if (v.startsWith('@')) return v.length > 1;
  return v.split(/\s+/).length === 5;
}

/** Field errors for a trigger form, keyed like the server's (name, agentId, pipelineId, cronExpression, priority). */
export function triggerErrors(d, t) {
  const errors = {};
  const range = TRIGGER_LIMITS.priority;
  if (!NAME.test(d.name || '')) errors.name = t('resources.triggers.errors.name');
  if ((d.description || '').length > TRIGGER_LIMITS.descriptionMax) errors.description = t('resources.triggers.errors.description', { max: TRIGGER_LIMITS.descriptionMax });
  if (d.targetType === 'Pipeline') {
    if (!d.pipelineId) errors.pipelineId = t('resources.triggers.errors.pipelineRequired');
  } else if (!d.agentId) {
    errors.agentId = t('resources.triggers.errors.agentRequired');
  }
  if (d.type !== 'Webhook' && !looksLikeCron(d.cronExpression)) errors.cronExpression = t('resources.triggers.errors.cron');
  const p = Number(d.priority);
  if (d.priority !== null && d.priority !== '' && (!Number.isInteger(p) || p < range.min || p > range.max)) errors.priority = t('resources.triggers.errors.priority', range);
  return errors;
}

/** The webhook URL of a trigger, from the API base URL (or the page origin) and the tenant. */
export function webhookUrl(baseUrl, tenantId, triggerId) {
  const root = String(baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
  return `${root}/v1.0/api/tenants/${encodeURIComponent(tenantId)}/triggers/${encodeURIComponent(triggerId)}/webhook`;
}

/** A new notification endpoint: run failures and timeouts, active, no result text. */
export function blankEndpoint() {
  return {
    name: '',
    description: '',
    url: 'https://',
    events: ['RunFailed', 'RunTimedOut'],
    agentId: '',
    deploymentId: '',
    includeResultText: false,
    resultTextMaxChars: TRIGGER_LIMITS.resultTextMaxChars.default,
    active: true
  };
}

/** A notification endpoint record as form data. */
export function endpointToForm(r) {
  return {
    ...r,
    description: r.description ?? '',
    events: [...(r.events || [])],
    agentId: r.agentId ?? '',
    deploymentId: r.deploymentId ?? '',
    includeResultText: !!r.includeResultText,
    resultTextMaxChars: r.resultTextMaxChars ?? TRIGGER_LIMITS.resultTextMaxChars.default,
    active: r.active !== false
  };
}

/** The request body for create and update. */
export function endpointToBody(d) {
  const blank = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());
  return {
    name: (d.name || '').trim(),
    description: blank(d.description),
    url: (d.url || '').trim(),
    events: SUBSCRIBABLE_NOTIFICATION_EVENTS.filter((e) => (d.events || []).includes(e)),
    agentId: blank(d.agentId),
    deploymentId: blank(d.deploymentId),
    includeResultText: !!d.includeResultText,
    resultTextMaxChars: Number(d.resultTextMaxChars) || TRIGGER_LIMITS.resultTextMaxChars.default,
    active: d.active !== false
  };
}

/** Copy of an endpoint for Duplicate: a new name, no identity or secret. */
export function endpointDuplicate(r) {
  const form = endpointToForm(r);
  for (const k of ['id', 'tenantId', 'createdUtc', 'lastUpdateUtc', 'signingSecretLast4', 'signingSecretRotatedUtc']) delete form[k];
  form.name = `${r.name}-copy`.slice(0, 64);
  return form;
}

/** True for an absolute http or https URL with a host and no user information. The server also checks addresses. */
export function isHttpUrl(value) {
  try {
    const u = new URL(String(value || '').trim());
    return (u.protocol === 'http:' || u.protocol === 'https:') && !!u.hostname && !u.username && !u.password;
  } catch {
    return false;
  }
}

/** Field errors for a notification endpoint form. */
export function endpointErrors(d, t) {
  const errors = {};
  const range = TRIGGER_LIMITS.resultTextMaxChars;
  if (!NAME.test(d.name || '')) errors.name = t('resources.notifications.errors.name');
  if (!isHttpUrl(d.url)) errors.url = t('resources.notifications.errors.url');
  if (!(d.events || []).some((e) => SUBSCRIBABLE_NOTIFICATION_EVENTS.includes(e))) errors.events = t('resources.notifications.errors.events');
  if (d.includeResultText) {
    const n = Number(d.resultTextMaxChars);
    if (!Number.isInteger(n) || n < range.min || n > range.max) errors.resultTextMaxChars = t('resources.notifications.errors.resultTextMaxChars', range);
  }
  return errors;
}

/** Pretty-printed JSON of a delivery payload (a JSON object; older servers sent JSON text), or the raw text. */
export function prettyPayload(payload) {
  if (!payload) return '';
  if (typeof payload === 'object') return JSON.stringify(payload, null, 2);
  try {
    return JSON.stringify(JSON.parse(payload), null, 2);
  } catch {
    return String(payload);
  }
}
