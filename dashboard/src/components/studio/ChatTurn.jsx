import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CopyButton from '../CopyButton';
import MarkdownView from '../MarkdownView';
import { Badge } from '../StatusBadge';
import { tip } from '../Tooltip';
import StudioLink from './StudioLink';
import { pathFor } from '../../config/navConfig';
import { formatDateTime, formatDuration, formatNumber, formatRelativeTime } from '../../i18n/formatters';
import { TERMINAL_RUN_STATUSES, runStatusTone } from '../../utils/constants';
import { enumLabel } from '../../utils/enums';
import { enumTip } from '../../utils/tips';
import { runTelemetry, formatUsd } from '../../utils/telemetry';
import { WAIT_ROTATE_MS, nextWaitPhrase, waitStage } from '../../utils/chatWait';
import { stripDraftPrefix } from '../../utils/studio';

/** A run status pill. */
export function TurnStatus({ status }) {
  const { t } = useTranslation();
  return (
    <Badge tone={runStatusTone(status)} tip={enumTip(t, 'runStatus', status)}>
      {enumLabel(t, 'runStatus', status)}
    </Badge>
  );
}

/** When a message was sent: relative, with the exact time in the tooltip. */
function SentAt({ utc }) {
  const { i18n } = useTranslation();
  if (!utc) return null;
  return (
    <time className="chat-msg-time" dateTime={utc} {...tip(formatDateTime(utc, i18n.language))}>
      {formatRelativeTime(utc, i18n.language)}
    </time>
  );
}

/**
 * What the person sees between sending a turn and the first output: three bouncing dots, a phrase, and the time
 * waited so far. While the turn waits for a worker the phrase says so; once it runs, phrases rotate every few seconds
 * without repeating a recent one.
 */
function ChatWait({ status, since }) {
  const { t, i18n } = useTranslation();
  const [phrase, setPhrase] = useState(() => nextWaitPhrase());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), 1000);
    const rotate = setInterval(() => setPhrase((p) => nextWaitPhrase(p.recent)), WAIT_ROTATE_MS);
    return () => {
      clearInterval(clock);
      clearInterval(rotate);
    };
  }, []);
  const stage = waitStage(status);
  const text = stage === 'worker' ? t('components.studio.chat.wait.worker') : t(`components.studio.chat.wait.phrases.${phrase.key}`);
  const started = since ? new Date(since).getTime() : null;
  const elapsed = started && !Number.isNaN(started) ? Math.max(0, now - started) : null;
  return (
    <div className="chat-wait" role="status" aria-live="polite" data-testid="studio-chat-wait" data-stage={stage}>
      <span className="chat-typing" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span key={text} className="chat-wait-text" {...tip(t('tips.studio.chat.wait'))}>
        {text}
      </span>
      {elapsed !== null && elapsed >= 1000 && (
        <span className="chat-wait-elapsed" data-testid="studio-chat-wait-elapsed" {...tip(t('tips.studio.chat.waitElapsed'))}>
          {formatDuration(Math.floor(elapsed / 1000) * 1000, i18n.language)}
        </span>
      )}
    </div>
  );
}

/**
 * The run's telemetry under an answer: time to first token, streaming time, total time, tokens by type (input,
 * output, cached, reasoning), output tokens per second, tool calls, cost, and the model that answered. A value the
 * server did not measure is left out rather than shown as a dash.
 */
export function ChatMetrics({ run }) {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const tel = runTelemetry(run);
  const count = (v) => formatNumber(v, { maximumFractionDigits: 0 }, lng);
  const items = [
    ['timeToFirstTokenMs', tel.timeToFirstTokenMs, (v) => formatDuration(v, lng)],
    ['streamingMs', tel.streamingMs, (v) => formatDuration(v, lng)],
    ['totalMs', tel.totalMs, (v) => formatDuration(v, lng)],
    ['inputTokens', tel.inputTokens, count],
    ['outputTokens', tel.outputTokens, count],
    ['cachedTokens', tel.cachedTokens, count],
    ['reasoningTokens', tel.reasoningTokens, count],
    ['outputTokensPerSecond', tel.outputTokensPerSecond, (v) => formatNumber(v, { maximumFractionDigits: 1 }, lng)],
    ['toolCallCount', tel.toolCallCount, count],
    ['costUsd', tel.costUsd, (v) => `${formatUsd(v, lng, '-')}${run?.costEstimated ? '*' : ''}`]
  ].filter(([, v]) => v !== null && v !== undefined);
  if (!items.length && !run?.servedModel) return null;
  return (
    <div className="chat-metrics" data-testid="studio-chat-metrics">
      {run?.servedModel && (
        <span className="chat-metric" data-metric="model" {...tip(t('tips.studio.chat.metrics.model'))}>
          <span className="chat-metric-label">{t('components.studio.chat.metrics.model')}</span>
          <span className="chat-metric-value">{run.servedModel}</span>
        </span>
      )}
      {items.map(([key, value, format]) => (
        <span key={key} className="chat-metric" data-metric={key} {...tip(t(`tips.telemetry.${key}`))}>
          <span className="chat-metric-label">{t(`components.studio.chat.metrics.${key}`)}</span>
          <span className="chat-metric-value">{format(value)}</span>
        </span>
      ))}
    </div>
  );
}

/** One tool call the architect made while answering, as a chip where it happened in the text. */
function ToolChip({ segment }) {
  const { t } = useTranslation();
  return (
    <span className={`chat-tool chat-tool-${segment.status}`} data-testid="studio-chat-tool" {...tip(t(`tips.studio.chat.tool.${segment.status}`, { name: segment.name }))}>
      <span className="chat-tool-dot" aria-hidden="true" />
      <code>{segment.name}</code>
    </span>
  );
}

/**
 * One exchange in the studio chat: the person's message on the right and the architect's answer on the left. The
 * answer streams in (text with a blinking caret, tool calls as chips) while the turn runs, shows the wait state before
 * the first output, and ends with the run's telemetry. Both sides have a copy button and the time they were sent.
 * `live` is { preview, streaming } from the run's event stream while the turn runs, or null.
 */
export default function ChatTurn({ run, live = null, architectName = '' }) {
  const { t } = useTranslation();
  const userText = stripDraftPrefix(run.inputText || '');
  const done = TERMINAL_RUN_STATUSES.includes(run.status);
  const failed = done && run.status !== 'Succeeded';
  const preview = live?.preview || null;
  const segments = useMemo(() => preview?.segments || [], [preview]);
  const streamedText = useMemo(
    () =>
      segments
        .filter((s) => s.kind === 'text')
        .map((s) => s.text)
        .join('\n\n'),
    [segments]
  );
  const finalText = run.resultText || (failed ? run.errorMessage : '') || '';
  // Prefer the final text once the turn has ended; show the stream until then.
  const showStream = !done && segments.length > 0;
  const answerText = showStream ? streamedText : finalText || streamedText;
  const waiting = !done && !showStream;
  const answerRef = useRef(answerText);
  answerRef.current = answerText;

  return (
    <div className="chat-turn" data-turn={run.id}>
      <article className="chat-msg chat-msg-user" data-testid="studio-chat-user">
        <div className="chat-bubble chat-bubble-user">
          <div className="chat-user-text studio-turn-text">{userText}</div>
        </div>
        <div className="chat-msg-meta">
          <span {...tip(t('tips.studio.chat.you'))}>{t('components.studio.chat.you')}</span>
          <SentAt utc={run.createdUtc || run.queuedUtc} />
          <CopyButton value={userText} testId="studio-chat-copy-user" tipText={t('tips.studio.chat.copyMessage')} />
        </div>
      </article>
      <article className={`chat-msg chat-msg-assistant${failed ? ' is-failed' : ''}`} data-testid="studio-chat-assistant">
        <div className={`chat-bubble chat-bubble-assistant${showStream ? ' is-streaming' : ''}${failed ? ' is-error' : ''}`}>
          <div className="chat-bubble-head">
            <span className="chat-role" {...tip(t('tips.studio.chat.architectSays'))}>
              {architectName || t('components.studio.chat.architectSays')}
            </span>
            <TurnStatus status={run.status} />
            <SentAt utc={run.completedUtc || run.startedUtc} />
            <StudioLink to={pathFor('runs', run.id)} tipText={t('tips.studio.chat.openRun')}>
              {t('components.studio.chat.openRun')}
            </StudioLink>
            {answerText && <CopyButton value={() => answerRef.current} className="chat-copy" testId="studio-chat-copy-answer" tipText={t('tips.studio.chat.copyAnswer')} />}
          </div>
          {live?.preview?.thinking && (
            <details className="chat-thinking" open={showStream && !streamedText}>
              <summary {...tip(t('tips.studio.chat.thinkingSummary'))}>{t('components.studio.chat.thinkingSummary')}</summary>
              <div className="chat-thinking-text">{live.preview.thinking}</div>
            </details>
          )}
          {waiting && <ChatWait status={run.status} since={run.createdUtc || run.queuedUtc} />}
          {!waiting && (
            <div className="chat-answer" data-testid="studio-chat-answer">
              {showStream
                ? segments.map((s, i) =>
                    s.kind === 'tool' ? <ToolChip key={s.key + i} segment={s} /> : s.text ? <MarkdownView key={`text-${i}`} text={s.text} className={i === segments.length - 1 ? 'chat-stream-last' : ''} /> : null
                  )
                : answerText
                  ? <MarkdownView text={answerText} />
                  : <div className="text-muted">-</div>}
            </div>
          )}
        </div>
        {done && <ChatMetrics run={run} />}
      </article>
    </div>
  );
}
