// Reports (AA5.10): helpers shared by the Reports page, the report page, its metric chart, and the File report dialog.
// Report text is data an agent or a person wrote; these helpers never turn it into markup.

import { pathFor } from '../config/navConfig';
import { REPORT_LIMITS } from './constants';
import { enumLabel } from './enums';
import { formatDateTime } from '../i18n/formatters';
import { holds } from './apps';

/** Window event sent after a report is filed from the dashboard, so the Reports page reloads. */
export const REPORTS_CHANGED_EVENT = 'garrison:reports-changed';

/** Tell the Reports page that a report was filed. */
export function notifyReportsChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(REPORTS_CHANGED_EVENT));
}

/** Who wrote the report: the author agent's name, else its ID, else the name of whoever filed it. */
export function authorText(report, agents = {}) {
  if (!report) return '';
  return report.authorAgentName || (report.authorAgentId && agents[report.authorAgentId]) || report.authorAgentId || report.filedByName || '';
}

/** Who filed the report: "echo-agent (Run)", "admin@garrison (User)", or '' when unknown. */
export function filedByText(t, report) {
  if (!report) return '';
  const who = report.filedByName || report.filedByPrincipalId || '';
  if (!who) return '';
  return report.filedByPrincipalType ? `${who} (${enumLabel(t, 'principalType', report.filedByPrincipalType)})` : who;
}

/** The period a report covers, "from to to" with the ends it has, or '' when it names none. */
export function periodText(t, report, lng, opts = { dateStyle: 'medium', timeStyle: 'short' }) {
  const from = report?.periodStartUtc ? formatDateTime(report.periodStartUtc, lng, opts) : '';
  const to = report?.periodEndUtc ? formatDateTime(report.periodEndUtc, lng, opts) : '';
  if (from && to) return t('reports.period', { from, to });
  if (from) return t('reports.periodFrom', { from });
  if (to) return t('reports.periodTo', { to });
  return '';
}

/** Distinct metric names of a report, in the order the author listed them. */
export function metricNames(report) {
  return [...new Set((report?.metrics || []).map((m) => m.name).filter(Boolean))];
}

/** A metric value with its unit, formatted for the locale: "42 ms", "0.97". */
export function metricText(value, unit, format) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  const shown = format ? format(Number(value)) : String(value);
  return unit ? `${shown} ${unit}` : shown;
}

/**
 * A metric series for TimeSeriesChart: the times and values of the points, oldest first (the server orders them), and
 * the unit the first point carries. Points without a time are dropped.
 */
export function metricSeries(points) {
  const kept = (points || []).filter((p) => p && p.timestampUtc && Number.isFinite(Number(p.value)));
  return {
    times: kept.map((p) => p.timestampUtc),
    values: kept.map((p) => Number(p.value)),
    reportIds: kept.map((p) => p.reportId),
    unit: kept.find((p) => p.unit)?.unit || null
  };
}

/** Counts of a report's issues by severity, High first, leaving out severities with none: [{ severity, count }]. */
export function issueCounts(report) {
  const counts = {};
  for (const issue of report?.issues || []) counts[issue.severity || 'Medium'] = (counts[issue.severity || 'Medium'] || 0) + 1;
  return ['High', 'Medium', 'Low'].filter((s) => counts[s]).map((s) => ({ severity: s, count: counts[s] }));
}

/** The page of a report's app (the Apps list searched for it), or null. */
export function appPath(report) {
  return report?.appId ? pathFor('apps', null, { search: report.appName || report.appId }) : null;
}

/** UTF-8 byte length of a string. */
export function utf8Bytes(text) {
  return new TextEncoder().encode(text || '').length;
}

/** A blank File report form: Status, Unknown health, for the filer's manager, in the filer's own name. */
export function blankReport() {
  return { title: '', kind: 'Status', health: 'Unknown', audience: 'Manager', agent: '', body: '' };
}

/** Field errors for a File report form, matching the server: a title of 1 to 256 characters, a body within the limit. */
export function reportErrors(form, t) {
  const errors = {};
  const title = (form?.title || '').trim();
  if (title.length < 1 || title.length > REPORT_LIMITS.titleMax) errors.title = t('reports.file.errors.title', { max: REPORT_LIMITS.titleMax });
  if (utf8Bytes(form?.body) > REPORT_LIMITS.bodyMaxBytes) errors.body = t('reports.file.errors.body', { max: REPORT_LIMITS.bodyMaxBytes });
  return errors;
}

/** The request body for POST /reports: trimmed title, the enums, the agent when one is chosen, the body when set. */
export function reportToBody(form) {
  const body = { title: (form?.title || '').trim(), kind: form?.kind || 'Status', health: form?.health || 'Unknown', audience: form?.audience || 'Manager' };
  if (form?.agent) body.agent = form.agent;
  if ((form?.body || '').trim()) body.body = form.body;
  return body;
}

/**
 * The tooltip explaining a missing Report permission, or '' when the caller holds it (or it cannot be known: the server
 * then decides). Reading needs Read; filing needs Create.
 */
export function reportDenied(t, permissions, operation) {
  if (holds(permissions, 'Report', operation)) return '';
  return t('tips.reports.denied', { operation: enumLabel(t, 'operationType', operation) });
}
