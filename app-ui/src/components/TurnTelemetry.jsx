import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InfoIcon } from './Icons.jsx';

function formatMs(ms, lng) {
  if (ms === null || ms === undefined) return null;
  if (ms < 1000) return `${new Intl.NumberFormat(lng).format(Math.round(ms))} ms`;
  return `${new Intl.NumberFormat(lng, { maximumFractionDigits: 1 }).format(ms / 1000)} s`;
}

/**
 * The (i) beside an answer: hovering or focusing it (or tapping, on touch screens) shows how the turn ran. That covers
 * the model, the time to first token, streaming, tool, and total times, waits, the input, output, cached, and
 * reasoning tokens, the output rate, the tool calls, and the cost. Rows without a value are left out.
 */
export default function TurnTelemetry({ telemetry, toolMs }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  if (!telemetry) return null;
  const lng = i18n.language;
  const n = (v) => (v === null || v === undefined ? null : new Intl.NumberFormat(lng).format(v));
  const rows = [
    ['model', telemetry.servedModel || null],
    ['ttft', formatMs(telemetry.timeToFirstTokenMs, lng)],
    ['streaming', formatMs(telemetry.streamingMs, lng)],
    ['tools', formatMs(toolMs, lng)],
    ['delegation', telemetry.delegationWaitMs ? formatMs(telemetry.delegationWaitMs, lng) : null],
    ['approval', telemetry.approvalWaitMs ? formatMs(telemetry.approvalWaitMs, lng) : null],
    ['queue', formatMs(telemetry.queueMs, lng)],
    ['execution', formatMs(telemetry.executionMs, lng)],
    ['total', formatMs(telemetry.totalMs, lng)],
    ['inputTokens', n(telemetry.inputTokens)],
    ['outputTokens', n(telemetry.outputTokens)],
    ['cachedTokens', n(telemetry.cachedTokens)],
    ['reasoningTokens', n(telemetry.reasoningTokens)],
    ['rate', telemetry.outputTokensPerSecond ? t('telemetry.rateValue', { value: new Intl.NumberFormat(lng, { maximumFractionDigits: 1 }).format(telemetry.outputTokensPerSecond) }) : null],
    ['toolCalls', n(telemetry.toolCallCount)],
    ['cost', telemetry.costUsd === null || telemetry.costUsd === undefined ? null : new Intl.NumberFormat(lng, { style: 'currency', currency: 'USD', maximumFractionDigits: 4 }).format(telemetry.costUsd)]
  ].filter(([, v]) => v !== null && v !== '');
  return (
    <span className="telemetry" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" className="icon-button telemetry-button" aria-label={t('telemetry.title')} aria-expanded={open ? 'true' : 'false'} onClick={() => setOpen((o) => !o)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} data-testid="turn-telemetry">
        <InfoIcon />
      </button>
      {open ? (
        <span className="telemetry-popover" role="tooltip" data-testid="turn-telemetry-popover">
          <span className="telemetry-title">{t('telemetry.title')}</span>
          <dl>
            {rows.map(([key, value]) => (
              <span key={key} className="telemetry-row">
                <dt>{t(`telemetry.${key}`)}</dt>
                <dd>{value}</dd>
              </span>
            ))}
          </dl>
        </span>
      ) : null}
    </span>
  );
}
