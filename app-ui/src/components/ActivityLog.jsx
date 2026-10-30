import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip.jsx';
import { readable } from '../utils/activity.js';

/** The label of a tool step: the agent it asks, the agents of a fan-out, collecting answers, or the tool's name. */
export function actionLabel(t, action) {
  if (!action) return '';
  if (action.kind === 'ask') return t('activity.ask', { agent: action.agent });
  if (action.kind === 'askMany') return action.agents.length ? t('activity.askMany', { agents: action.agents.join(', ') }) : t('activity.askSeveral');
  if (action.kind === 'gather') return t('activity.gather');
  if (action.kind === 'check') return t('activity.check');
  return t('activity.tool', { tool: action.tool });
}

function StepStatus({ status }) {
  const { t } = useTranslation();
  if (status === 'running') return <span className="spinner step-spinner" role="img" aria-label={t('activity.running')} {...tip(t('tips.activityRunning'))} />;
  return (
    <span className={`step-mark step-${status}`} role="img" aria-label={t(status === 'ok' ? 'activity.done' : 'activity.failed')} {...tip(t(status === 'ok' ? 'tips.activityDone' : 'tips.activityFailed'))}>
      {status === 'ok' ? '✓' : '✕'}
    </span>
  );
}

/**
 * What the agent did during a turn, step by step: its thinking, the tools it used and the agents it asked (each opens
 * to show what was sent and what came back), and progress notes. Open while the turn runs; folded once it ends.
 */
export default function ActivityLog({ steps, live }) {
  const { t } = useTranslation();
  if (!steps.length) return null;
  return (
    <details className="activity" open={live} data-testid="activity">
      <summary {...tip(t('tips.details'))}>{t('activity.title', { count: steps.length })}</summary>
      <ol className="activity-steps">
        {steps.map((s) => {
          if (s.kind === 'thinking') {
            return (
              <li key={s.key} className="activity-step activity-thinking" data-testid="activity-thinking">
                <span className="step-kind">{t('activity.thinking')}</span>
                <p className="thinking-text">{s.text}</p>
              </li>
            );
          }
          if (s.kind === 'note') {
            return (
              <li key={s.key} className={`activity-step activity-note note-${s.eventType}`}>
                <span className="step-kind">{t(`detailTypes.${s.eventType}`, { defaultValue: s.eventType })}</span>
                <span className="note-text">{s.text}</span>
              </li>
            );
          }
          return (
            <li key={s.key} className={`activity-step activity-tool tool-${s.status}`} data-testid="activity-tool" data-status={s.status}>
              <details className="tool-step">
                <summary {...tip(t('tips.activityStep'))}>
                  <StepStatus status={s.status} />
                  <span className="tool-label">{actionLabel(t, s.action)}</span>
                </summary>
                <div className="tool-io">
                  <div className="tool-io-label">{t('activity.sent')}</div>
                  <pre>{s.input ? readable(s.input) : t('activity.nothing')}</pre>
                  <div className="tool-io-label">{t('activity.returned')}</div>
                  <pre>{s.output ? readable(s.output) : s.status === 'running' ? t('activity.waiting') : t('activity.nothing')}</pre>
                </div>
              </details>
            </li>
          );
        })}
      </ol>
    </details>
  );
}
