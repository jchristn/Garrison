import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDuration } from '../i18n/formatters';
import { enumLabel } from '../utils/enums';
import { tip } from './Tooltip';
import { turnActivity } from '../utils/turnActivity';

/** A tool's name without the MCP prefix the harness adds (mcp__garrison__garrison_send_message). */
function toolLabel(name) {
  return String(name || '?').replace(/^mcp__[^_]+(?:_[^_]+)*?__/, '');
}

/**
 * The line under a running turn's output that says what it is doing now: waiting for a worker or an approval,
 * running a tool, or working on its next step after a tool call finished. It hides while text is streaming (the text
 * shows the work) and, after a long silence, says how long it has been quiet instead of claiming the run is busy.
 * `status` is the run status, `segments` the preview segments, `lastEventAt` and `startedAt` epoch milliseconds.
 */
export default function TurnActivity({ status, segments, lastEventAt, startedAt, testId = 'turn-activity' }) {
  const { t, i18n } = useTranslation();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(clock);
  }, []);
  const activity = turnActivity({ status, segments, lastEventAt, startedAt, now });
  if (activity.state === 'writing') return null;
  const lng = i18n.language;
  const quietFor = formatDuration(Math.floor(activity.quietMs / 1000) * 1000, lng);
  const text =
    activity.state === 'tool'
      ? t('components.turnActivity.tool', { tool: toolLabel(activity.tool) })
      : activity.state === 'quiet'
        ? t('components.turnActivity.quiet', { time: quietFor, status: enumLabel(t, 'runStatus', status) })
        : t(`components.turnActivity.${activity.state}`);
  const showElapsed = activity.state !== 'quiet' && activity.state !== 'worker' && activity.quietMs >= 3000;
  return (
    <div className={`turn-activity turn-activity-${activity.state}`} role="status" aria-live="polite" data-testid={testId} data-state={activity.state}>
      {activity.state !== 'quiet' && (
        <span className="chat-typing" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      )}
      <span className="turn-activity-text" {...tip(t(`tips.turnActivity.${activity.state}`))}>
        {text}
      </span>
      {showElapsed && (
        <span className="turn-activity-elapsed" {...tip(t('tips.turnActivity.elapsed'))}>
          {quietFor}
        </span>
      )}
    </div>
  );
}
