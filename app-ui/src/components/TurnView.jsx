import { useTranslation } from 'react-i18next';
import Markdown from './Markdown.jsx';
import { turnPhase, visibleAnswer } from '../utils/turns.js';
import { activitySteps, currentActivity, toolTimeMs } from '../utils/activity.js';
import ActivityLog, { actionLabel } from './ActivityLog.jsx';
import CopyButton from './CopyButton.jsx';
import TurnTelemetry from './TurnTelemetry.jsx';

// One exchange: the user's message and the agent's answer, which grows as text streams in. Shows what the agent is
// doing while it works (waiting for a worker, thinking, asking another agent, using a tool, or just working between
// steps, so the turn never looks idle while it runs), the approval notice while
// an operator must approve a step, a reconnecting note while the stream is down, and the error when the turn failed.
// When the app shows operator detail, the activity log lists every step as it happens and the (i) beside the answer
// shows how the turn ran. Every message has a copy button in its top right corner, and the agent's carries the app's
// avatar beside the author name when it has one (decorative: the name next to it says who wrote it).
export default function TurnView({ turn, agentName, avatarUrl = null, showDetail, filePaths, onFile }) {
  const { t } = useTranslation();
  const phase = turnPhase(turn);
  const answer = visibleAnswer(turn);
  const statusText = t(`statuses.${turn.status}`, { defaultValue: turn.status });
  const steps = showDetail ? activitySteps(turn.details) : [];
  const live = phase === 'waiting' || phase === 'streaming' || phase === 'approval';
  const now = live ? currentActivity(steps) : null;
  const queued = turn.status === 'Pending' || turn.status === 'Queued' || turn.status === 'Leased';
  const doing = now ? (now.kind === 'thinking' ? t('activity.thinkingNow') : actionLabel(t, now.action)) : queued ? statusText : t('chat.waiting');
  return (
    <li className="turn" data-testid="turn" data-run-id={turn.runId} data-phase={phase}>
      <div className="message message-user">
        <div className="message-header">
          <span className="message-author">{t('chat.you')}</span>
          <CopyButton text={turn.message} label={t('copy.message')} tipText={t('copy.messageTip')} testId="copy-message" />
        </div>
        <div className="message-text" dir="auto">{turn.message}</div>
      </div>
      <div className={`message message-agent phase-${phase}`} aria-busy={phase === 'waiting' || phase === 'streaming' ? 'true' : 'false'}>
        <div className="message-header">
          <span className="message-author" dir="auto">
            {avatarUrl ? <img className="agent-avatar" src={avatarUrl} alt="" aria-hidden="true" data-testid="agent-avatar" /> : null}
            {agentName}
          </span>
          <span className="message-tools">
            {!live && turn.telemetry ? <TurnTelemetry telemetry={turn.telemetry} toolMs={toolTimeMs(steps)} /> : null}
            {answer ? <CopyButton text={answer} label={t('copy.answer')} tipText={t('copy.answerTip')} testId="copy-answer" /> : null}
          </span>
        </div>
        {answer ? (
          <div className="message-answer" data-testid="answer">
            <Markdown text={answer} filePaths={filePaths} onFile={onFile} />
          </div>
        ) : null}
        {phase === 'waiting' || phase === 'streaming' ? (
          <p className="turn-state" role="status" data-testid="turn-state">
            <span className="dots" aria-hidden="true" />
            {doing}
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
        <ActivityLog steps={steps} live={live} />
      </div>
    </li>
  );
}
