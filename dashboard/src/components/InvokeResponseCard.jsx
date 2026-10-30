import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Tabs from './Tabs';
import CodeBlock from './CodeBlock';
import MarkdownView from './MarkdownView';
import RunTelemetryPanel from './RunTelemetryPanel';
import GrafanaLink from './GrafanaLink';
import { tip } from './Tooltip';
import { TERMINAL_RUN_STATUSES } from '../utils/constants';
import { translateServerText } from '../utils/serverText';
import { buildPreview } from '../utils/streamPreview';
import { formatMs, formatRate } from '../utils/telemetry';
import { enumTip } from '../utils/tips';
import { useGrafana } from '../hooks/useServerInfo';
import { traceUrl, logsUrl } from '../utils/grafana';
import RunGuardNotice from './RunGuardNotice';
import { guardOutcome } from '../utils/runGuards';
import { jsonToText } from '../utils/jsonFields';

/** Distance from the bottom (px) within which the preview counts as pinned and keeps following new output. */
const PIN_SLACK = 24;

function Stat({ label, value, tipText, testId }) {
  return (
    <span className="stream-stat" data-testid={testId} {...tip(tipText)}>
      <span className="text-muted">{label}</span> <strong>{value}</strong>
    </span>
  );
}

/** Milliseconds since `from`, refreshed a few times a second while `running`, frozen at `until` once set. */
function useElapsed(from, until, running) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running || !from) return undefined;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [running, from]);
  if (!from) return null;
  return Math.max(0, (until || now) - from);
}

function ToolChip({ seg, t }) {
  const state = seg.status === 'failed' ? 'danger' : seg.status === 'ok' ? 'success' : 'info';
  return (
    <span className={`pill pill-${state} tool-chip`} data-testid="stream-tool-chip" data-status={seg.status} {...tip(t(`tips.views.invoke.stream.tool.${seg.status}`, { name: seg.name }))}>
      <code>{seg.name}</code> {t(`views.invoke.stream.tool.${seg.status}`)}
    </span>
  );
}

/**
 * Preview: the run's assistant output as it streams, rendered as sanitized Markdown, with reasoning, tool chips,
 * live timing, and auto-scroll that stays pinned to the bottom until the user scrolls up.
 */
function StreamPreview({ run, events, clock, onShowResponse }) {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const na = t('common.generic.notAvailable');
  const terminal = !!run && TERMINAL_RUN_STATUSES.includes(run.status);
  const preview = useMemo(() => buildPreview(events), [events]);
  const elapsed = useElapsed(clock.startedAt, clock.finishedAt, !terminal);
  const ttft = clock.firstOutputAt && clock.startedAt ? clock.firstOutputAt - clock.startedAt : null;
  const streamSeconds = clock.firstOutputAt ? ((clock.lastOutputAt || clock.firstOutputAt) - clock.firstOutputAt) / 1000 : 0;
  const liveRate = preview.outputTokens && streamSeconds >= 0.1 ? preview.outputTokens / streamSeconds : null;
  const rate = terminal && run?.outputTokensPerSecond != null ? run.outputTokensPerSecond : liveRate;
  const codex = run?.harnessType === 'Codex';

  const scrollRef = useRef(null);
  const pinned = useRef(true);
  const [unpinned, setUnpinned] = useState(false);
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= PIN_SLACK;
    pinned.current = atBottom;
    setUnpinned(!atBottom);
  };
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && pinned.current) el.scrollTop = el.scrollHeight;
  }, [events, terminal]);
  const jump = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    pinned.current = true;
    setUnpinned(false);
  };

  return (
    <div className="stream-preview" data-testid="invoke-preview">
      <div className="stream-status">
        {terminal ? (
          <span className="pill pill-neutral" data-testid="stream-finished" {...tip(t('tips.views.invoke.stream.finished'))}>
            {t('views.invoke.stream.finished')}
          </span>
        ) : (
          <span className="pill pill-info stream-live" data-testid="stream-live" {...tip(t('tips.views.invoke.stream.live'))}>
            <span className="live-dot" aria-hidden="true" /> {t('views.invoke.stream.live')}
          </span>
        )}
        <Stat label={t('views.invoke.stream.elapsed')} value={formatMs(elapsed === null ? null : Math.round(elapsed / 100) * 100, lng, na)} tipText={t('tips.views.invoke.stream.elapsed')} testId="stream-elapsed" />
        {ttft !== null && <Stat label={t('views.invoke.stream.firstToken')} value={formatMs(ttft, lng, na)} tipText={t('tips.views.invoke.stream.firstToken')} testId="stream-ttft" />}
        {rate !== null && <Stat label={t('views.invoke.stream.tokensPerSecond')} value={formatRate(rate, lng, na, t('common.units.tokPerSec'))} tipText={t('tips.views.invoke.stream.tokensPerSecond')} testId="stream-rate" />}
      </div>
      {codex && (
        <div className="info-banner" role="note" data-testid="stream-codex-note" {...tip(t('tips.views.invoke.stream.codexNote'))}>
          {t('views.invoke.stream.codexNote')}
        </div>
      )}
      {terminal && <RunGuardNotice run={run} testId="stream-guard-notice" />}
      {terminal && (
        <div className="stream-finished-hint" role="status" data-testid="stream-finished-hint">
          <span>{t('views.invoke.stream.finishedHint')}</span>
          <button type="button" className="button-link" onClick={onShowResponse} {...tip(t('tips.views.invoke.stream.showResponse'))}>
            {t('views.invoke.stream.showResponse')}
          </button>
        </div>
      )}
      <div className="stream-scroll" ref={scrollRef} onScroll={onScroll} data-testid="stream-scroll">
        {preview.thinking && (
          <details className="stream-reasoning" data-testid="stream-reasoning">
            <summary {...tip(t('tips.views.invoke.stream.reasoning'))}>{t('views.invoke.stream.reasoning')}</summary>
            <pre className="stream-reasoning-text">{preview.thinking}</pre>
          </details>
        )}
        {preview.segments.map((seg, i) =>
          seg.kind === 'tool' ? (
            <div className="stream-tool" key={`tool-${seg.key}-${i}`}>
              <ToolChip seg={seg} t={t} />
            </div>
          ) : (
            <MarkdownView key={`text-${i}`} text={seg.text} testId="stream-text" className="stream-text" />
          )
        )}
        {!preview.hasText && !terminal && (
          <div className="stream-waiting text-muted" data-testid="stream-waiting">
            <span className="live-dot" aria-hidden="true" /> {codex ? t('views.invoke.stream.waitingCodex') : t('views.invoke.stream.waiting')}
          </div>
        )}
        {!preview.hasText && terminal && (
          <div className="stream-waiting text-muted" data-testid="stream-empty">
            {t('views.invoke.stream.noText')}
          </div>
        )}
      </div>
      {unpinned && (
        <button type="button" className="button-secondary button-sm stream-jump" onClick={jump} data-testid="stream-jump" {...tip(t('tips.views.invoke.stream.jump'))}>
          {t('views.invoke.stream.jump')}
        </button>
      )}
    </div>
  );
}

/** Response: the final run result, rendered Markdown with a raw toggle, structured output, outcome, error, telemetry, and links. */
function RunResponse({ run }) {
  const { t } = useTranslation();
  const grafana = useGrafana();
  const terminal = TERMINAL_RUN_STATUSES.includes(run.status);
  return (
    <div className="flex-col gap-md" data-testid="invoke-response">
      <div className="inline-meta">
        {run.outcome && run.outcome !== 'None' && (
          <span className="stream-stat" data-testid="invoke-outcome" {...tip(enumTip(t, 'runOutcome', run.outcome))}>
            <span className="text-muted">{t('resources.runs.columns.outcome')}</span> <strong>{t(`enums.runOutcome.${run.outcome}`, { defaultValue: run.outcome })}</strong>
          </span>
        )}
        <GrafanaLink href={traceUrl(grafana, run)} label={t('views.runDetail.viewTrace')} tipText={t('tips.views.runDetail.viewTrace')} testId="invoke-view-trace" />
        <GrafanaLink href={logsUrl(grafana, run)} label={t('views.runDetail.viewLogs')} tipText={t('tips.views.runDetail.viewLogs')} testId="invoke-view-logs" />
      </div>
      <RunGuardNotice run={run} testId="response-guard-notice" />
      {run.errorMessage && !guardOutcome(run) && <div className="error-banner">{translateServerText(t, run.errorMessage)}</div>}
      <h3 className="section-title">{t('views.runDetail.result')}</h3>
      <MarkdownView text={run.resultText} rawToggle testId="invoke-result" emptyText={terminal ? t('views.runDetail.noResult') : t('views.runDetail.pending')} />
      {run.structuredOutput !== undefined && run.structuredOutput !== null && (
        <>
          <h3 className="section-title">{t('views.runDetail.structuredOutput')}</h3>
          <CodeBlock value={jsonToText(run.structuredOutput)} prettyJson />
        </>
      )}
      {terminal && <RunTelemetryPanel run={run} />}
    </div>
  );
}

/**
 * The Invoke page response card (P5.52): a Preview tab that streams the run and a Response tab with the final
 * result. `run` is null between Send and the server's reply; the card then shows an empty, waiting Preview.
 */
export default function InvokeResponseCard({ run, events, clock, tab, onTab }) {
  const { t } = useTranslation();
  return (
    <div className="invoke-response-card" data-testid="invoke-card">
      <Tabs
        label={t('views.invoke.stream.tabsLabel')}
        active={tab}
        onChange={onTab}
        tabs={[
          { id: 'preview', label: t('views.invoke.stream.preview'), tip: t('tips.views.invoke.stream.tabs.preview') },
          { id: 'response', label: t('views.invoke.stream.response'), tip: t('tips.views.invoke.stream.tabs.response') }
        ]}
      />
      {tab === 'preview' ? (
        <StreamPreview run={run} events={events} clock={clock} onShowResponse={() => onTab('response')} />
      ) : run ? (
        <RunResponse run={run} />
      ) : (
        <div className="text-muted" data-testid="invoke-response-pending">{t('views.runDetail.pending')}</div>
      )}
    </div>
  );
}
