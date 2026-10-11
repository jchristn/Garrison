// Run guards and per-run time limits (P3.15): which runs a guard stopped, and the Invoke time limit rules.

/** Outcomes a run guard sets when it stops a run. */
export const GUARD_OUTCOMES = ['RepetitionDetected', 'NoProgress', 'OutputLimitExceeded'];

/**
 * The guard outcome of a run a run guard stopped, or null. OutputLimitExceeded also means the harness wrote more than
 * the profile's maxOutputBytes to stdout; only the maxAssistantChars variant (named in errorMessage) is a guard stop.
 * @param {object|null} run Run record.
 * @returns {string|null}
 */
export function guardOutcome(run) {
  const outcome = run?.outcome;
  if (outcome === 'RepetitionDetected' || outcome === 'NoProgress') return outcome;
  if (outcome === 'OutputLimitExceeded' && /maxAssistantChars/.test(run?.errorMessage || '')) return outcome;
  return null;
}

/** Name of the per-run override that sets the run deadline. */
export const TIMEOUT_OVERRIDE = 'timeoutSeconds';

/** Preset time limits offered on Invoke, in seconds. */
export const TIME_LIMIT_PRESETS = [30, 60, 300, 900];

/**
 * Bounds for a per-run timeoutSeconds override: { min, max, cap } from the deployment's IntegerRange rule
 * ("min,max") and the cluster cap Runtime.MaxRunSeconds. Any bound may be null when unknown.
 * @param {object} rule Allowed run override rule ({ name, validation, pattern }).
 * @param {number|null} cap Runtime.MaxRunSeconds, or null when settings are not readable.
 */
export function timeLimitBounds(rule, cap) {
  let min = null;
  let max = null;
  if (rule?.validation === 'IntegerRange') {
    const parts = String(rule.pattern || '').split(',').map((p) => p.trim());
    if (parts.length === 2 && /^-?\d+$/.test(parts[0]) && /^-?\d+$/.test(parts[1])) {
      min = Number(parts[0]);
      max = Number(parts[1]);
    }
  }
  const capValue = cap === null || cap === undefined || cap === '' || Number.isNaN(Number(cap)) ? null : Number(cap);
  return { min, max, cap: capValue };
}

/**
 * Validate a time limit typed on Invoke. Empty is valid (the deployment default applies).
 * @returns {{ key: string, params: object } | null} Translation key under views.invoke.timeLimitErrors with params.
 */
export function validateTimeLimit(value, bounds) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  if (!/^\d+$/.test(text)) return { key: 'notInteger', params: {} };
  const n = Number(text);
  if (n < 1) return { key: 'notInteger', params: {} };
  const { min, max, cap } = bounds || {};
  if ((min !== null && min !== undefined && n < min) || (max !== null && max !== undefined && n > max)) return { key: 'range', params: { min, max } };
  if (cap !== null && cap !== undefined && n > cap) return { key: 'aboveCap', params: { max: cap } };
  return null;
}

/** True when a preset fits the bounds. */
export function presetAllowed(seconds, bounds) {
  return validateTimeLimit(String(seconds), bounds) === null;
}

/**
 * Seconds as a short duration label: whole hours, whole minutes, or seconds.
 * @param {Function} t i18next translate function.
 * @param {number} seconds Seconds.
 * @param {Function} [formatNumber] Number formatter for the active locale.
 */
export function secondsLabel(t, seconds, formatNumber = (n) => String(n)) {
  const n = Number(seconds);
  if (n >= 3600 && n % 3600 === 0) return t('views.invoke.timeUnits.hours', { value: formatNumber(n / 3600) });
  if (n >= 60 && n % 60 === 0) return t('views.invoke.timeUnits.minutes', { value: formatNumber(n / 60) });
  return t('views.invoke.timeUnits.seconds', { value: formatNumber(n) });
}
