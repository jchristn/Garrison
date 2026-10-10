// Run telemetry helpers (plan section 10.6). The server measures and reports these fields; the dashboard only
// derives values when a field is missing entirely (an older server), never when the server reported null.

import { formatCurrency, formatDuration, formatNumber } from '../i18n/formatters';

function toMs(value) {
  if (!value) return null;
  const n = new Date(value).getTime();
  return Number.isNaN(n) ? null : n;
}

function between(start, end) {
  const s = toMs(start);
  const e = toMs(end);
  if (s === null || e === null) return null;
  return Math.max(0, e - s);
}

function finiteOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** True when the server sent the field at all (null counts as sent: it means "not measurable"). */
function reported(run, key) {
  return run && Object.prototype.hasOwnProperty.call(run, key);
}

/**
 * Normalized telemetry for one run. Every value is a finite number or null.
 * Fallbacks for servers that predate section 10.6: execution from startedUtc to completedUtc, queue from
 * queuedUtc to leasedUtc, total from queuedUtc (or createdUtc) to completedUtc, and output tokens per second
 * from outputTokens and streamingMs with the same 100 ms floor the server uses.
 */
export function runTelemetry(run) {
  const r = run || {};
  const streamingMs = finiteOrNull(r.streamingMs);
  const outputTokens = finiteOrNull(r.outputTokens);
  let tps = finiteOrNull(r.outputTokensPerSecond);
  if (!reported(r, 'outputTokensPerSecond') && streamingMs !== null && streamingMs >= 100 && outputTokens !== null) tps = outputTokens / (streamingMs / 1000);
  return {
    firstTokenUtc: r.firstTokenUtc || null,
    lastTokenUtc: r.lastTokenUtc || null,
    timeToFirstTokenMs: finiteOrNull(r.timeToFirstTokenMs),
    streamingMs,
    executionMs: reported(r, 'executionMs') ? finiteOrNull(r.executionMs) : r.completedUtc ? between(r.startedUtc, r.completedUtc) : null,
    queueMs: reported(r, 'queueMs') ? finiteOrNull(r.queueMs) : between(r.queuedUtc, r.leasedUtc),
    totalMs: reported(r, 'totalMs') ? finiteOrNull(r.totalMs) : r.completedUtc ? between(r.queuedUtc || r.createdUtc, r.completedUtc) : null,
    outputTokensPerSecond: tps,
    inputTokens: finiteOrNull(r.inputTokens),
    outputTokens,
    cachedTokens: finiteOrNull(r.cachedTokens),
    reasoningTokens: finiteOrNull(r.reasoningTokens),
    toolCallCount: finiteOrNull(r.toolCallCount),
    costUsd: finiteOrNull(r.costUsd)
  };
}

/** A duration in milliseconds, or the placeholder when null. */
export function formatMs(ms, locale, placeholder) {
  return ms === null || ms === undefined || Number.isNaN(ms) ? placeholder : formatDuration(ms, locale);
}

/** An integer count, or the placeholder when null. */
export function formatCount(value, locale, placeholder) {
  return value === null || value === undefined || Number.isNaN(value) ? placeholder : formatNumber(value, { maximumFractionDigits: 0 }, locale);
}

/** A rate with one decimal and a unit label, or the placeholder when null. */
export function formatRate(value, locale, placeholder, unit) {
  if (value === null || value === undefined || Number.isNaN(value)) return placeholder;
  return `${formatNumber(value, { maximumFractionDigits: 1 }, locale)} ${unit}`;
}

/** A USD amount, or the placeholder when null. */
export function formatUsd(value, locale, placeholder) {
  return value === null || value === undefined || Number.isNaN(value) ? placeholder : formatCurrency(value, locale);
}

/**
 * Proportional phases for a run's time bar: queue, startup (process start to first token), streaming, and the
 * remainder of execution after the last token. Returns [] when there is nothing to draw.
 */
export function runPhases(tel) {
  const queue = tel.queueMs ?? 0;
  const exec = tel.executionMs ?? 0;
  const startup = tel.timeToFirstTokenMs !== null ? Math.min(tel.timeToFirstTokenMs, exec || tel.timeToFirstTokenMs) : 0;
  const streaming = tel.streamingMs ?? 0;
  const tail = Math.max(0, exec - startup - streaming);
  const parts = [
    { key: 'queue', ms: queue },
    { key: 'startup', ms: startup },
    { key: 'streaming', ms: streaming },
    { key: 'tail', ms: tail }
  ];
  const total = parts.reduce((s, p) => s + p.ms, 0);
  if (total <= 0) return [];
  return parts.filter((p) => p.ms > 0).map((p) => ({ ...p, share: p.ms / total }));
}
