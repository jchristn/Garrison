import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip.jsx';
import Markdown from './Markdown.jsx';
import { turnPhase, visibleAnswer } from '../utils/turns.js';

// One exchange: the user's message and the agent's answer, which grows as text streams in. Shows a working
// indicator before the first text, the approval notice while an operator must approve a step, a reconnecting
// note while the stream is down, and the error when the turn failed.
export default function TurnView({ turn, agentName, showDetail }) {
  const { t } = useTranslation();
  const phase = turnPhase(turn);
  const answer = visibleAnswer(turn);
  const statusText = t(`statuses.${turn.status}`, { defaultValue: turn.status });
  return (
    <li className="turn" data-testid="turn" data-run-id={turn.runId} data-phase={phase}>
      <div className="message message-user">
        <span className="message-author">{t('chat.you')}</span>
        <div className="message-text">{turn.message}</div>
      </div>
      <div className={`message message-agent phase-${phase}`} aria-busy={phase === 'waiting' || phase === 'streaming' ? 'true' : 'false'}>
        <span className="message-author">{agentName}</span>
        {answer ? (
          <div className="message-answer" data-testid="answer">
            <Markdown text={answer} />
          </div>
        ) : null}
        {phase === 'waiting' ? (
          <p className="turn-state" role="status">
            <span className="dots" aria-hidden="true" />
            {t('chat.waiting')} ({statusText})
          </p>
        ) : null}
        {phase === 'approval' ? (
          <p className="notice notice-warning" role="status" data-testid="approval-notice">
            {t('chat.approval')}
          </p>
        ) : null}
        {turn.reconnecting && phase !== 'done' && phase !== 'failed' ? (
          <p className="notice notice-info" role="status" data-testid="reconnecting">
            {t('chat.reconnecting')}
          </p>
        ) : null}
        {phase === 'failed' ? (
          <p className="notice notice-error" role="alert" data-testid="turn-error">
            {t('chat.failed')} {turn.streamError || ''} ({statusText})
          </p>
        ) : null}
        {showDetail && turn.details && turn.details.length ? (
          <details className="turn-details">
            <summary {...tip(t('tips.details'))}>{t('chat.details')}</summary>
            <ol>
              {turn.details.map((d) => (
                <li key={d.sequence} className={`detail detail-${d.eventType}`}>
                  <span className="detail-type">{t(`detailTypes.${d.eventType}`, { defaultValue: d.eventType })}</span>
                  {d.toolName ? <code className="detail-tool">{d.toolName}</code> : null}
                  {d.text ? <span className="detail-text">{d.text}</span> : null}
                </li>
              ))}
            </ol>
          </details>
        ) : null}
      </div>
    </li>
  );
}
