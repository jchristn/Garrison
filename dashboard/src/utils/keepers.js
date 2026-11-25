// Form helpers for keepers (AA1.16): a keeper is a mandate, the standing job an agent keeps on a wake schedule. These
// build blank records, convert records to form data and form data to request bodies, mirror the server's validation,
// format intervals, and turn revisions into text for the revision diff.

import { MANDATE_LIMITS } from './constants';
import { enumLabel } from './enums';

const NAME = /^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$/;

/** Revision fields the form edits, in the order the diff lists them. */
export const REVISION_FIELDS = [
  'objective',
  'healthyDefinition',
  'autonomy',
  'escalationPolicy',
  'direction',
  'wakeMode',
  'minIntervalSeconds',
  'maxIntervalSeconds',
  'backoffFactor',
  'jitterPercent',
  'budgetPerTickUsd',
  'budgetPerDayUsd',
  'maxTokensPerTick'
];

/** Mandate statuses in which a keeper can be paused (the server refuses the others with MandateNotActive). */
export const PAUSABLE_STATUSES = ['Active', 'CapReached'];

const blankText = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());
const numberOrNull = (v) => (v === undefined || v === null || String(v).trim() === '' || !Number.isFinite(Number(v)) ? null : Number(v));

/** Revision form fields with the server defaults: Backoff from 15 minutes to a day, factor 2, cluster jitter. */
export function blankRevision() {
  return {
    objective: '',
    healthyDefinition: '',
    autonomy: '',
    escalationPolicy: '',
    direction: '',
    signals: [],
    wakeMode: 'Backoff',
    minIntervalSeconds: MANDATE_LIMITS.minIntervalDefault,
    maxIntervalSeconds: MANDATE_LIMITS.maxIntervalDefault,
    backoffFactor: MANDATE_LIMITS.backoffFactor.default,
    jitterPercent: '',
    budgetPerTickUsd: '',
    budgetPerDayUsd: '',
    maxTokensPerTick: '',
    changeNote: ''
  };
}

/** A new keeper: no agent yet, and a first revision that is published when the keeper is created. */
export function blankKeeper() {
  return { name: '', description: '', agentId: '', deploymentId: '', ...blankRevision() };
}

/** A stored revision as form fields (nulls become empty strings, signals are copied). */
export function revisionToForm(r) {
  const rev = r || {};
  return {
    objective: rev.objective ?? '',
    healthyDefinition: rev.healthyDefinition ?? '',
    autonomy: rev.autonomy ?? '',
    escalationPolicy: rev.escalationPolicy ?? '',
    direction: rev.direction ?? '',
    signals: (rev.signals || []).map((s) => ({ name: s.name ?? '', description: s.description ?? '' })),
    wakeMode: rev.wakeMode || 'Backoff',
    minIntervalSeconds: rev.minIntervalSeconds ?? MANDATE_LIMITS.minIntervalDefault,
    maxIntervalSeconds: rev.maxIntervalSeconds ?? MANDATE_LIMITS.maxIntervalDefault,
    backoffFactor: rev.backoffFactor ?? MANDATE_LIMITS.backoffFactor.default,
    jitterPercent: rev.jitterPercent ?? '',
    budgetPerTickUsd: rev.budgetPerTickUsd ?? '',
    budgetPerDayUsd: rev.budgetPerDayUsd ?? '',
    maxTokensPerTick: rev.maxTokensPerTick ?? '',
    changeNote: ''
  };
}

/** A mandate record as form data. The list does not carry the current revision, so its fields stay blank there. */
export function keeperToForm(r) {
  return {
    ...revisionToForm(r?.currentRevision),
    ...r,
    description: r?.description ?? '',
    agentId: r?.agentId ?? '',
    deploymentId: r?.deploymentId ?? ''
  };
}

/** The revision request body: trimmed text, numbers or null, signals in list order. */
export function revisionToBody(d) {
  return {
    objective: (d.objective || '').trim(),
    healthyDefinition: blankText(d.healthyDefinition),
    autonomy: blankText(d.autonomy),
    escalationPolicy: blankText(d.escalationPolicy),
    direction: blankText(d.direction),
    signals: (d.signals || [])
      .filter((s) => blankText(s?.name) || blankText(s?.description))
      .map((s, i) => ({ name: (s.name || '').trim(), description: blankText(s.description), order: i })),
    wakeMode: d.wakeMode === 'Fixed' ? 'Fixed' : 'Backoff',
    minIntervalSeconds: numberOrNull(d.minIntervalSeconds) ?? MANDATE_LIMITS.minIntervalDefault,
    maxIntervalSeconds: numberOrNull(d.maxIntervalSeconds) ?? MANDATE_LIMITS.maxIntervalDefault,
    backoffFactor: numberOrNull(d.backoffFactor) ?? MANDATE_LIMITS.backoffFactor.default,
    jitterPercent: numberOrNull(d.jitterPercent),
    budgetPerTickUsd: numberOrNull(d.budgetPerTickUsd),
    budgetPerDayUsd: numberOrNull(d.budgetPerDayUsd),
    maxTokensPerTick: numberOrNull(d.maxTokensPerTick),
    changeNote: blankText(d.changeNote)
  };
}

/**
 * The request body for create and update. Create sends the first revision inline as currentRevision, which the server
 * publishes as revision 1. Update changes only the name, description, and deployment; the revision changes through
 * New revision on the keeper's page.
 */
export function keeperToBody(d, mode) {
  const body = {
    name: (d.name || '').trim(),
    description: blankText(d.description),
    agentId: blankText(d.agentId),
    deploymentId: blankText(d.deploymentId)
  };
  if (mode !== 'edit') body.currentRevision = revisionToBody(d);
  return body;
}

/** Copy of a keeper for Duplicate: a new name, the same agent, deployment, and revision fields, no schedule state. */
export function keeperDuplicate(r) {
  const form = keeperToForm(r);
  for (const k of ['id', 'tenantId', 'status', 'currentRevisionId', 'currentRevisionNumber', 'currentRevision', 'nextWakeUtc', 'pendingWakeSource', 'currentIntervalSeconds', 'consecutiveQuietTicks', 'lastTickUtc', 'lastTickOutcome', 'activeRunId', 'activeTickId', 'tickCount', 'runAsType', 'runAsId', 'runAsName', 'createdBy', 'createdUtc', 'lastUpdateUtc', 'warnings']) delete form[k];
  form.name = `${r.name}-copy`.slice(0, 64);
  return form;
}

function rangeError(errors, key, value, range, message) {
  if (value === undefined || value === null || String(value).trim() === '') return;
  const n = Number(value);
  if (!Number.isFinite(n) || n < range.min || n > range.max) errors[key] = message;
}

/** Field errors for revision fields, keyed like the server's (objective, signals[2].name, minIntervalSeconds). */
export function revisionErrors(d, t) {
  const errors = {};
  const L = MANDATE_LIMITS;
  const objective = (d.objective || '').trim();
  if (!objective) errors.objective = t('resources.keepers.errors.objective');
  else if (objective.length > L.textMax) errors.objective = t('resources.keepers.errors.text', { max: L.textMax });
  for (const key of ['healthyDefinition', 'autonomy', 'escalationPolicy', 'direction']) {
    if ((d[key] || '').length > L.textMax) errors[key] = t('resources.keepers.errors.text', { max: L.textMax });
  }
  if ((d.changeNote || '').length > L.changeNoteMax) errors.changeNote = t('resources.keepers.errors.text', { max: L.changeNoteMax });
  const signals = (d.signals || []).filter((s) => (s?.name || '').trim() || (s?.description || '').trim());
  if (signals.length > L.signalsMax) errors.signals = t('resources.keepers.errors.signalsMax', { max: L.signalsMax });
  const seen = new Set();
  signals.forEach((s, i) => {
    const name = (s.name || '').trim();
    if (!name || name.length > L.signalNameMax) errors[`signals[${i}].name`] = t('resources.keepers.errors.signalName', { max: L.signalNameMax });
    else if (seen.has(name.toLowerCase())) errors[`signals[${i}].name`] = t('resources.keepers.errors.signalUnique');
    seen.add(name.toLowerCase());
    if ((s.description || '').length > L.signalDescriptionMax) errors[`signals[${i}].description`] = t('resources.keepers.errors.text', { max: L.signalDescriptionMax });
  });
  if (Object.keys(errors).some((k) => k.startsWith('signals[')) && !errors.signals) errors.signals = t('resources.keepers.errors.signalsInvalid');
  const interval = t('resources.keepers.errors.interval', L.interval);
  rangeError(errors, 'minIntervalSeconds', d.minIntervalSeconds, L.interval, interval);
  rangeError(errors, 'maxIntervalSeconds', d.maxIntervalSeconds, L.interval, interval);
  if (!errors.minIntervalSeconds && !errors.maxIntervalSeconds && Number(d.maxIntervalSeconds) < Number(d.minIntervalSeconds)) errors.maxIntervalSeconds = t('resources.keepers.errors.maxBelowMin');
  rangeError(errors, 'backoffFactor', d.backoffFactor, L.backoffFactor, t('resources.keepers.errors.backoffFactor', L.backoffFactor));
  rangeError(errors, 'jitterPercent', d.jitterPercent, L.jitterPercent, t('resources.keepers.errors.jitterPercent', L.jitterPercent));
  rangeError(errors, 'budgetPerTickUsd', d.budgetPerTickUsd, L.budgetUsd, t('resources.keepers.errors.budget', L.budgetUsd));
  rangeError(errors, 'budgetPerDayUsd', d.budgetPerDayUsd, L.budgetUsd, t('resources.keepers.errors.budget', L.budgetUsd));
  rangeError(errors, 'maxTokensPerTick', d.maxTokensPerTick, L.maxTokensPerTick, t('resources.keepers.errors.maxTokens', L.maxTokensPerTick));
  if (d.maxTokensPerTick !== '' && d.maxTokensPerTick !== null && d.maxTokensPerTick !== undefined && !errors.maxTokensPerTick && !Number.isInteger(Number(d.maxTokensPerTick))) errors.maxTokensPerTick = t('resources.keepers.errors.maxTokens', L.maxTokensPerTick);
  return errors;
}

/** Field errors for the keeper form: name, description, agent, deployment, and (on create) the revision fields. */
export function keeperErrors(d, t, mode) {
  const errors = mode === 'edit' ? {} : revisionErrors(d, t);
  if (!NAME.test(d.name || '')) errors.name = t('resources.keepers.errors.name');
  if ((d.description || '').length > MANDATE_LIMITS.descriptionMax) errors.description = t('resources.keepers.errors.text', { max: MANDATE_LIMITS.descriptionMax });
  if (!d.agentId) errors.agentId = t('resources.keepers.errors.agentRequired');
  if (!d.deploymentId) errors.deploymentId = t('resources.keepers.errors.deploymentRequired');
  return errors;
}

/**
 * An interval in seconds as the largest whole units that fit, for example 90 as { value: 1.5, unit: 'minutes' } and
 * 86400 as { value: 1, unit: 'days' }. Callers translate the unit.
 */
export function intervalParts(seconds) {
  const s = Number(seconds);
  if (!Number.isFinite(s) || s <= 0) return null;
  if (s % 86400 === 0 || s >= 172800) return { value: Math.round((s / 86400) * 10) / 10, unit: 'days' };
  if (s % 3600 === 0 || s >= 7200) return { value: Math.round((s / 3600) * 10) / 10, unit: 'hours' };
  if (s % 60 === 0 || s >= 120) return { value: Math.round((s / 60) * 10) / 10, unit: 'minutes' };
  return { value: s, unit: 'seconds' };
}

/** An interval as translated text, such as "15 min" or "1 day"; a dash for none. */
export function formatInterval(t, seconds) {
  const parts = intervalParts(seconds);
  if (!parts) return '-';
  return t(`resources.keepers.units.${parts.unit}`, { count: parts.value });
}

/** True when Pause applies to the keeper (it is not already paused or retired). */
export function canPause(mandate) {
  return !!mandate && PAUSABLE_STATUSES.includes(mandate.status);
}

/** True when Resume applies to the keeper. */
export function canResume(mandate) {
  return mandate?.status === 'Paused';
}

/** True when Wake now applies to the keeper: it is Active. A running tick finishes first. */
export function canWake(mandate) {
  return mandate?.status === 'Active';
}

/** Revision fields as labelled text lines, for the line diff between two revisions. */
export function revisionText(rev, t) {
  if (!rev) return '';
  const lines = [];
  for (const key of REVISION_FIELDS) {
    const value = rev[key];
    if (value === undefined || value === null || value === '') continue;
    const label = t(`resources.keepers.fields.${key}`);
    const text = key === 'wakeMode' ? enumLabel(t, 'wakeMode', value) : String(value);
    if (text.includes('\n')) {
      lines.push(`${label}:`);
      for (const line of text.split('\n')) lines.push(`  ${line}`);
    } else {
      lines.push(`${label}: ${text}`);
    }
  }
  const signals = rev.signals || [];
  if (signals.length) {
    lines.push(`${t('resources.keepers.fields.signals')}:`);
    for (const s of signals) lines.push(`  - ${s.name}${s.description ? `: ${s.description}` : ''}`);
  }
  return lines.join('\n');
}

/** The previous revision of one in a newest-first list, or null for the first. */
export function previousRevision(revisions, revision) {
  if (!revision) return null;
  return (revisions || []).filter((r) => r.number < revision.number).sort((a, b) => b.number - a.number)[0] || null;
}

/** Ticks oldest first with the applied interval in minutes, for the ticks chart (ticks without one are gaps). */
export function tickSeries(ticks) {
  const ordered = [...(ticks || [])].filter((x) => x.startedUtc).sort((a, b) => String(a.startedUtc).localeCompare(String(b.startedUtc)));
  return {
    times: ordered.map((x) => x.startedUtc),
    intervals: ordered.map((x) => (Number.isFinite(x.appliedIntervalSeconds) ? Math.round((x.appliedIntervalSeconds / 60) * 10) / 10 : null)),
    outcomes: ordered.map((x) => x.outcome || null)
  };
}

/** Tick counts by outcome, in enum order, leaving out outcomes with none. */
export function outcomeCounts(ticks, outcomes) {
  const counts = {};
  for (const x of ticks || []) if (x.outcome) counts[x.outcome] = (counts[x.outcome] || 0) + 1;
  return outcomes.filter((o) => counts[o]).map((o) => ({ outcome: o, count: counts[o] }));
}

/** Keepers that need a person: the last tick asked for attention, escalated, failed, or never reported. */
export function needsAttention(mandate) {
  return ['Attention', 'Escalated', 'Failed', 'Unreported'].includes(mandate?.lastTickOutcome) || ['Frozen', 'CapReached'].includes(mandate?.status);
}

/** Counts for the Home Autonomy card from a page of keepers. */
export function autonomySummary(items, totalCount) {
  const list = items || [];
  const nextWake = list
    .filter((m) => m.status === 'Active' && m.nextWakeUtc)
    .map((m) => m.nextWakeUtc)
    .sort()[0] || null;
  return {
    total: totalCount ?? list.length,
    active: list.filter((m) => m.status === 'Active').length,
    paused: list.filter((m) => m.status === 'Paused').length,
    running: list.filter((m) => !!m.activeRunId).length,
    attention: list.filter(needsAttention),
    nextWakeUtc: nextWake
  };
}
