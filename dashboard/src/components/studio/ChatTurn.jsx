import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CodeBlock from '../CodeBlock';
import CopyButton from '../CopyButton';
import { ChevronDownIcon, ChevronRightIcon, InfoIcon } from '../Icons';
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
import { findRecordRefs, linkifyRecords } from '../../utils/recordLinks';
import { prettyJson } from '../../utils/streamPreview';

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
 * The run's telemetry behind an (i) icon in the answer's header: time to first token, streaming time, total time,
 * tokens by type (input, output, cached, reasoning), output tokens per second, tool calls, cost, and the model that
 * answered. The table shows on hover or keyboard focus, and a click pins it open (Escape or a click elsewhere closes
 * it). A value the server did not measure is left out rather than shown as a dash.
 */
export function ChatMetrics({ run }) {
  const { t, i18n } = useTranslation();
  const [pinned, setPinned] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!pinned) return undefined;
    const close = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !ref.current?.contains(e.target)) setPinned(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [pinned]);
  const lng = i18n.language;
  const tel = runTelemetry(run);
  const count = (v) => formatNumber(v, { maximumFractionDigits: 0 }, lng);
  const items = [
    ['model', run?.servedModel || null, (v) => v],
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
  ].filter(([, v]) => v !== null && v !== undefined && v !== '');
  if (!items.length) return null;
  return (
    <span ref={ref} className={`chat-info${pinned ? ' is-open' : ''}`} data-testid="studio-chat-metrics">
      <button type="button" className="chat-info-button" aria-expanded={pinned} aria-label={t('components.studio.chat.metrics.title')} onClick={() => setPinned((p) => !p)} data-testid="studio-chat-metrics-button">
        <InfoIcon size={14} />
      </button>
      <span className="chat-info-popover" role="tooltip">
        <span className="chat-info-title">{t('components.studio.chat.metrics.title')}</span>
        <table className="chat-info-table">
          <tbody>
            {items.map(([key, value, format]) => (
              <tr key={key} data-metric={key} title={key === 'model' ? t('tips.studio.chat.metrics.model') : t(`tips.telemetry.${key}`)}>
                <th scope="row">{t(`components.studio.chat.metrics.${key}`)}</th>
                <td>{format(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </span>
    </span>
  );
}

/** Pretty-print JSON when the text is JSON; otherwise return it as is. */
/** A tool's name without the MCP prefix the harness adds (mcp__garrison__garrison_studio_put_item). */
function toolLabel(name) {
  return String(name || '?').replace(/^mcp__[^_]+(?:_[^_]+)*?__/, '');
}

/**
 * One tool call the architect made while answering (usually an MCP call), as a card where it happened in the text:
 * its status, name, and duration, and when expanded, the arguments it was called with and the result it returned.
 */
function ToolCard({ segment }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const started = segment.startedUtc ? new Date(segment.startedUtc).getTime() : null;
  const ended = segment.endedUtc ? new Date(segment.endedUtc).getTime() : null;
  const took = started && ended && ended >= started ? ended - started : null;
  const input = prettyJson(segment.input);
  const output = prettyJson(segment.output);
  return (
    <div className={`chat-tool chat-tool-${segment.status}${open ? ' is-open' : ''}`} data-testid="studio-chat-tool" data-status={segment.status}>
      <button type="button" className="chat-tool-head" aria-expanded={open} onClick={() => setOpen((o) => !o)} {...tip(t(`tips.studio.chat.tool.${segment.status}`, { name: toolLabel(segment.name) }))}>
        {open ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
        <span className="chat-tool-dot" aria-hidden="true" />
        <code className="chat-tool-name">{toolLabel(segment.name)}</code>
        <span className="chat-tool-state">{t(`components.studio.chat.tool.${segment.status}`)}</span>
        {took !== null && <span className="chat-tool-took">{formatDuration(took, i18n.language)}</span>}
      </button>
      {open && (
        <div className="chat-tool-body" data-testid="studio-chat-tool-body">
          <div className="chat-tool-label">{t('components.studio.chat.tool.input')}</div>
          {input ? <CodeBlock value={input} /> : <div className="text-muted">{t('components.studio.chat.tool.none')}</div>}
          <div className="chat-tool-label">{t('components.studio.chat.tool.output')}</div>
          {output ? <CodeBlock value={output} /> : <div className="text-muted">{t(segment.status === 'running' ? 'components.studio.chat.tool.waiting' : 'components.studio.chat.tool.none')}</div>}
        </div>
      )}
    </div>
  );
}

/**
 * Markdown whose Garrison record identifiers (approval apr_..., run run_..., and so on) become links to their pages.
 * Links navigate inside the dashboard; Ctrl or Cmd+click still opens a new tab.
 */
function LinkedMarkdown({ text, className = '' }) {
  const ref = useRef(null);
  const navigate = useNavigate();
  // After every render: the Markdown below can be re-rendered from its HTML, which drops links made earlier. Linking
  // skips text that is already a link, so running it again is cheap and safe.
  useLayoutEffect(() => {
    linkifyRecords(ref.current);
  });
  const onClick = (e) => {
    const a = e.target.closest?.('a.record-link');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(a.getAttribute('href'));
  };
  return (
    <div ref={ref} onClick={onClick} className="chat-linked">
      <MarkdownView text={text} className={className} />
    </div>
  );
}

/**
 * One exchange in the studio chat: the person's message on the right and the architect's answer on the left. The
 * answer streams in (text with a blinking caret, tool calls as expandable cards) while the turn runs, shows the wait
 * state before the first output, links the records it mentions (an approval, a run) to their pages, and keeps the run's
 * telemetry behind an (i) icon in its header. Both sides have a copy button and the time they were sent.
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
  const finalText = run.resultText || '';
  // While the turn runs, the stream; afterwards the text and tool calls it recorded, with the final result added
  // when the events carried no text (or none were loaded).
  const showStream = !done && segments.length > 0;
  const showSegments = segments.length > 0 && (showStream || segments.some((s) => s.kind === 'tool'));
  // The final result follows the recorded text when that text does not already contain it (no text events, or a stream
  // that ended before the last of the text arrived).
  const tail = done && finalText && !(showSegments && streamedText.includes(finalText.trim())) ? finalText : '';
  const errorText = failed && run.errorMessage && !finalText.includes(run.errorMessage) ? run.errorMessage : '';
  const answerText = [showSegments ? streamedText : '', tail || (!showSegments ? finalText : '')].filter(Boolean).join('\n\n') || streamedText;
  const waiting = !done && !showStream;
  // Copy gives the final answer once the turn has ended, and the text so far while it streams.
  const copyText = done ? finalText || answerText : answerText;
  const answerRef = useRef(copyText);
  answerRef.current = copyText;
  const refs = useMemo(() => (done ? findRecordRefs(`${answerText}\n${errorText}`) : []), [done, answerText, errorText]);

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
            <span className="chat-bubble-tools">
              {done && <ChatMetrics run={run} />}
              {answerText && <CopyButton value={() => answerRef.current} className="chat-copy" testId="studio-chat-copy-answer" tipText={t('tips.studio.chat.copyAnswer')} />}
            </span>
          </div>
          {preview?.thinking && (
            <details className="chat-thinking" open={showStream && !streamedText}>
              <summary {...tip(t('tips.studio.chat.thinkingSummary'))}>{t('components.studio.chat.thinkingSummary')}</summary>
              <div className="chat-thinking-text">{preview.thinking}</div>
            </details>
          )}
          {waiting && <ChatWait status={run.status} since={run.createdUtc || run.queuedUtc} />}
          {!waiting && (
            <div className="chat-answer" data-testid="studio-chat-answer">
              {showSegments &&
                segments.map((seg, i) =>
                  seg.kind === 'tool' ? (
                    <ToolCard key={seg.key + i} segment={seg} />
                  ) : seg.text ? (
                    <LinkedMarkdown key={`text-${i}`} text={seg.text} className={showStream && i === segments.length - 1 ? 'chat-stream-last' : ''} />
                  ) : null
                )}
              {(tail || (!showSegments && finalText)) && <LinkedMarkdown text={tail || finalText} />}
              {errorText && <LinkedMarkdown text={errorText} />}
              {!showSegments && !finalText && !errorText && <div className="text-muted">-</div>}
            </div>
          )}
        </div>
        {refs.length > 0 && (
          <div className="chat-refs" data-testid="studio-chat-refs">
            {refs.map((r) => (
              <StudioLink key={r.id} to={r.href} className="button button-secondary button-sm" testId={`studio-chat-ref-${r.id}`} tipText={t(`tips.studio.chat.refs.${r.kind}`, { id: r.id })}>
                {t(`components.studio.chat.refs.${r.kind}`)} <code>{r.id}</code>
              </StudioLink>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
