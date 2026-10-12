import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formatTime, formatNumber } from '../i18n/formatters';
import { translateServerText } from '../utils/serverText';
import { tip } from './Tooltip';
import { Badge } from './StatusBadge';
import { pathFor } from '../config/navConfig';
import { approvalActionTone } from '../utils/constants';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { parseApprovalNotice } from '../utils/approvals';

/** Event types whose text Garrison or a parser writes (not model output), so it can be translated (M1-24). */
const SERVER_TEXT_TYPES = new Set(['Lifecycle', 'Warning', 'Error']);

/** Machine codes on run events Garrison writes (P9.17); null for harness or model text. */
const EVENT_CODES = new Set(['WorkspacePrepared', 'RepairAttemptStarted', 'McpPreflightPassed', 'McpPreflightWarning', 'HarnessExited', 'EventsDropped', 'RunBlocked', 'StructuredOutputInvalid', 'RunGuardTriggered', 'ConversationFallback', 'ConversationResumed', 'ConversationStateLost', 'ApprovalRequested', 'ApprovalDecided']);

/** Codes that always show their label, even when the text is translated, because the label says what happened. */
const ALWAYS_LABELED = new Set(['RunGuardTriggered', 'ConversationFallback', 'ConversationStateLost', 'ApprovalRequested', 'ApprovalDecided']);

const TONE = {
  AssistantText: 'text',
  Thinking: 'muted',
  ToolCall: 'info',
  ToolResult: 'success',
  Usage: 'muted',
  Progress: 'muted',
  Warning: 'warning',
  Error: 'danger',
  Stdout: 'muted',
  Stderr: 'warning',
  Result: 'success',
  Lifecycle: 'neutral'
};

/** Tone for an event: approval events (P12.3) show waiting as a warning and the verdict as success or danger. */
function toneFor(e, notice) {
  if (e.code === 'ApprovalRequested') return 'warning';
  if (e.code === 'ApprovalDecided' && notice?.decision) return notice.decision === 'Allow' ? 'success' : 'danger';
  return TONE[e.eventType] || 'neutral';
}

/** Event transcript for a run: assistant text, thinking, tool calls and results, usage, warnings, and errors. */
export default function RunTimeline({ events, filter = 'all' }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const visible = events.filter((e) => filter === 'all' || e.eventType === filter);
  if (visible.length === 0) return <div className="text-muted timeline-empty">{t('views.runDetail.noEvents')}</div>;
  return (
    <ol className="timeline" aria-label={t('views.runDetail.transcript')}>
      {visible.map((e) => {
        const notice = parseApprovalNotice(e);
        const tone = toneFor(e, notice);
        // Text Garrison wrote: translate the known message; otherwise label it by its code and keep the server text.
        const serverText = e.text && (EVENT_CODES.has(e.code) || SERVER_TEXT_TYPES.has(e.eventType));
        const shown = serverText ? translateServerText(t, e.text) : e.text;
        const codeLabel = EVENT_CODES.has(e.code) && (shown === e.text || ALWAYS_LABELED.has(e.code)) ? t(`common.eventCodes.${e.code}`) : null;
        return (
          <li key={`${e.sequence}-${e.id || ''}`} className={`timeline-item timeline-${tone}`}>
            <div className="timeline-meta">
              <span className="timeline-seq monospace">#{e.sequence}</span>
              <span className="timeline-type">{t(`enums.runEventType.${e.eventType}`, { defaultValue: e.eventType })}</span>
              <span className="timeline-time text-muted">{formatTime(e.timestampUtc, i18n.language, { timeStyle: 'medium' })}</span>
              {codeLabel && (
                <span className="pill pill-neutral" data-event-code={e.code} {...tip(t(ALWAYS_LABELED.has(e.code) ? `tips.views.runDetail.eventCodes.${e.code}` : 'tips.views.runDetail.eventCode'))}>
                  {codeLabel}
                </span>
              )}
              {e.toolName && <code className="timeline-tool">{e.toolName}</code>}
              {notice?.decision && (
                <Badge tone={approvalActionTone(notice.decision)} tip={enumTip(t, 'approvalDecision', notice.decision)}>
                  {enumLabel(t, 'approvalDecision', notice.decision)}
                </Badge>
              )}
              {notice?.approvalId && (
                <a
                  href={pathFor('approvals', notice.approvalId)}
                  className="timeline-link"
                  data-testid="timeline-approval-link"
                  {...tip(t('tips.views.runDetail.openApproval'))}
                  onClick={(ev) => {
                    ev.preventDefault();
                    navigate(pathFor('approvals', notice.approvalId));
                  }}
                >
                  {t('views.runDetail.openApproval')}
                </a>
              )}
              {e.success === false && <span className="pill pill-danger">{t('views.runDetail.failed')}</span>}
              {(e.inputTokens || e.outputTokens) && (
                <span className="text-muted">
                  {t('views.runDetail.tokens', { input: formatNumber(e.inputTokens || 0), output: formatNumber(e.outputTokens || 0) })}
                </span>
              )}
            </div>
            {e.text && <pre className={`timeline-text ${e.eventType === 'AssistantText' || e.eventType === 'Result' ? '' : 'monospace'}`}>{shown}</pre>}
          </li>
        );
      })}
    </ol>
  );
}
