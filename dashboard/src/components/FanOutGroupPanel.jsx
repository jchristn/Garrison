import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';
import CopyableId from './CopyableId';
import { Badge } from './StatusBadge';
import { StopIcon } from './Icons';
import { tip } from './Tooltip';
import { RunStatus } from '../views/runConfigs';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { pathFor } from '../config/navConfig';
import { errorMessage } from '../utils/errors';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { translateServerText } from '../utils/serverText';
import { formatDateTime, formatNumber, formatRelativeTime } from '../i18n/formatters';
import { formatUsd } from '../utils/telemetry';
import { FAN_OUT_POLL_MS, budgetUse, fanOutChannel, fanOutTone, isFanOutStatus, memberLabel } from '../utils/fanOut';

/**
 * Live updates for one running fan-out group over the WebSocket channel fan-out:{id} (AD5.8). Calls onGroup with each
 * pushed FanOutGroupView and returns whether the channel is subscribed; while it is not, the panel polls. Does nothing
 * when `enabled` is false (the group has ended and will not change).
 */
function useFanOutChannel(apiClient, groupId, enabled, onGroup) {
  const [live, setLive] = useState(false);
  const handler = useRef(onGroup);
  useEffect(() => {
    handler.current = onGroup;
  }, [onGroup]);
  useEffect(() => {
    if (!enabled || !apiClient || !groupId || typeof WebSocket === 'undefined' || typeof apiClient.webSocketUrl !== 'function') return undefined;
    const channel = fanOutChannel(groupId);
    let ws;
    try {
      ws = new WebSocket(apiClient.webSocketUrl());
      ws.onopen = () => {
        try {
          ws.send(JSON.stringify({ type: 'subscribe', channel }));
        } catch {
          /* ignore */
        }
      };
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message?.type === 'subscribed' && message.channel === channel) setLive(true);
          else if (message?.type === 'error' && message.channel === channel) setLive(false);
          else if (isFanOutStatus(message, groupId)) handler.current?.(message.fanOutGroup);
        } catch {
          /* not JSON */
        }
      };
      ws.onclose = () => setLive(false);
      ws.onerror = () => setLive(false);
    } catch {
      setLive(false);
    }
    return () => {
      ws?.close();
      setLive(false);
    };
  }, [apiClient, groupId, enabled]);
  return live;
}

function Detail({ label, tipText, children }) {
  return (
    <div className="detail-item">
      <div className="detail-item-label" {...tip(tipText)}>
        {label}
      </div>
      <div className="detail-item-value">{children ?? '-'}</div>
    </div>
  );
}

/** A run link that navigates in place. */
function RunLink({ runId, navigate, tipText, testId }) {
  const to = pathFor('runs', runId);
  return (
    <a
      href={to}
      data-testid={testId}
      {...tip(tipText)}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
    >
      <code>{runId}</code>
    </a>
  );
}

/** Usage against an optional limit: "used of limit" with a bar when a limit is set, "used, no limit" otherwise. */
function BudgetMeter({ used, limit, format, label, tipText, testId }) {
  const { t } = useTranslation();
  const use = budgetUse(used, limit);
  if (!use) {
    return (
      <span data-testid={testId} {...tip(tipText)}>
        {t('components.fanOut.noLimit', { used: format(used) })}
      </span>
    );
  }
  const percent = Math.round(use.share * 100);
  return (
    <span className="fanout-budget" data-testid={testId} data-over={use.over ? 'true' : 'false'}>
      <span {...tip(tipText)}>{t('components.fanOut.usedOf', { used: format(used), limit: format(limit) })}</span>
      <span
        className={`fanout-budget-bar${use.over ? ' is-over' : ''}`}
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        {...tip(t('tips.fanOut.budgetBar', { percent }))}
      >
        <span className="fanout-budget-fill" style={{ width: `${percent}%` }} />
      </span>
    </span>
  );
}

/**
 * One fan-out group in the run tree of Run detail (AD5.8): status and why it ended, the join policy (with the quorum),
 * finished, succeeded, and total members, cost and tokens against the group's budget, the deadline, and each member
 * with its label, agent, status, usage, and a link to its run. A running group follows the fan-out:{id} channel,
 * polls every FAN_OUT_POLL_MS while the channel is not live, and offers Cancel group after a confirmation.
 *
 * `group` is a FanOutGroupView; `onChange` receives every newer view (pushed, polled, or returned by cancel).
 */
export default function FanOutGroupPanel({ group, onChange, highlighted = false }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const lng = i18n.language;
  const [confirmCancel, setConfirmCancel] = useState(false);
  const ref = useRef(null);
  const id = group.fanOutGroupId;
  const running = group.status === 'Running';

  const live = useFanOutChannel(apiClient, id, running, onChange);

  useEffect(() => {
    if (!running || live || !apiClient) return undefined;
    const timer = setInterval(() => {
      apiClient
        .getFanOutGroup(tenantId, id)
        .then((g) => g && onChange?.(g))
        .catch(() => {
          /* the next poll tries again */
        });
    }, FAN_OUT_POLL_MS);
    return () => clearInterval(timer);
  }, [running, live, apiClient, tenantId, id, onChange]);

  useEffect(() => {
    if (highlighted && ref.current && typeof ref.current.scrollIntoView === 'function') ref.current.scrollIntoView({ block: 'start' });
  }, [highlighted]);

  const cancel = async () => {
    try {
      const updated = await apiClient.cancelFanOutGroup(tenantId, id);
      addToast({ type: 'success', message: t('components.fanOut.cancelledToast', { id }) });
      if (updated) onChange?.(updated);
    } catch (e) {
      addToast({ type: 'error', message: errorMessage(t, e) });
    } finally {
      setConfirmCancel(false);
    }
  };

  const usd = (v) => formatUsd(Number(v) || 0, lng, '-');
  const count = (v) => formatNumber(Number(v) || 0, {}, lng);
  const members = Array.isArray(group.members) ? group.members : [];
  const pending = Array.isArray(group.pending) ? group.pending : [];
  const failed = Array.isArray(group.failed) ? group.failed : [];
  const th = (key, extra = {}) => (
    <th scope="col" {...extra} {...tip(t(`tips.fanOut.columns.${key}`))}>
      {t(`components.fanOut.columns.${key}`)}
    </th>
  );

  return (
    <section ref={ref} id={`fan-out-${id}`} className={`fanout-group${highlighted ? ' is-highlighted' : ''}`} aria-label={t('components.fanOut.groupTitle', { id })} data-testid="fan-out-group" data-group={id} data-status={group.status}>
      <div className="fanout-group-header">
        <h3 className="section-title" {...tip(t('tips.fanOut.group'))}>
          {t('components.fanOut.group')} <CopyableId value={id} max={40} />
        </h3>
        <span className="flex gap-sm items-center">
          <Badge tone={fanOutTone(group.status)} tip={enumTip(t, 'fanOutGroupStatus', group.status)}>
            <span data-testid="fan-out-status">{enumLabel(t, 'fanOutGroupStatus', group.status)}</span>
          </Badge>
          {running && (
            <Badge tone={live ? 'success' : 'neutral'} tip={t(live ? 'tips.fanOut.live' : 'tips.fanOut.polling', { seconds: FAN_OUT_POLL_MS / 1000 })}>
              <span data-testid="fan-out-live" data-live={live ? 'true' : 'false'}>
                {live ? t('components.fanOut.live') : t('components.fanOut.polling')}
              </span>
            </Badge>
          )}
          {running && (
            <button type="button" className="button-danger button-sm" onClick={() => setConfirmCancel(true)} data-testid="fan-out-cancel" {...tip(t('tips.fanOut.cancel'))}>
              <StopIcon size={14} /> {t('components.fanOut.cancel')}
            </button>
          )}
        </span>
      </div>
      {group.statusReason && (
        <p className="field-hint" data-testid="fan-out-reason" {...tip(t('tips.fanOut.reason'))}>
          {translateServerText(t, group.statusReason)}
        </p>
      )}

      <div className="detail-grid fanout-summary">
        <Detail label={t('components.fanOut.policy')} tipText={t('tips.fanOut.policy')}>
          <span data-testid="fan-out-policy" {...tip(enumTip(t, 'fanOutJoinPolicy', group.joinPolicy))}>
            {group.joinPolicy === 'Quorum'
              ? t('components.fanOut.quorumPolicy', { policy: enumLabel(t, 'fanOutJoinPolicy', group.joinPolicy), quorum: count(group.quorum), total: count(group.total) })
              : enumLabel(t, 'fanOutJoinPolicy', group.joinPolicy)}
          </span>
        </Detail>
        <Detail label={t('components.fanOut.progress')} tipText={t('tips.fanOut.progress')}>
          <span data-testid="fan-out-progress">{t('components.fanOut.progressValue', { finished: count(group.finished), succeeded: count(group.succeeded), total: count(group.total) })}</span>
        </Detail>
        <Detail label={t('components.fanOut.cost')} tipText={t('tips.fanOut.cost')}>
          <BudgetMeter used={group.costUsd} limit={group.maxCostUsd} format={usd} label={t('components.fanOut.cost')} tipText={t('tips.fanOut.costValue')} testId="fan-out-cost" />
        </Detail>
        <Detail label={t('components.fanOut.tokens')} tipText={t('tips.fanOut.tokens')}>
          <BudgetMeter used={group.tokens} limit={group.maxTokens} format={count} label={t('components.fanOut.tokens')} tipText={t('tips.fanOut.tokensValue')} testId="fan-out-tokens" />
        </Detail>
        <Detail label={t('components.fanOut.deadline')} tipText={t('tips.fanOut.deadline')}>
          {group.deadlineUtc ? (
            <span data-testid="fan-out-deadline" {...tip(formatDateTime(group.deadlineUtc, lng))}>
              {formatRelativeTime(group.deadlineUtc, lng)}
            </span>
          ) : (
            <span data-testid="fan-out-deadline">{t('components.fanOut.noDeadline')}</span>
          )}
        </Detail>
        <Detail label={t('components.fanOut.started')} tipText={t('tips.fanOut.started')}>
          {group.createdUtc ? formatDateTime(group.createdUtc, lng) : '-'}
        </Detail>
        {group.completedUtc && (
          <Detail label={t('components.fanOut.completed')} tipText={t('tips.fanOut.completed')}>
            {formatDateTime(group.completedUtc, lng)}
          </Detail>
        )}
      </div>

      {(pending.length > 0 || failed.length > 0) && (
        <p className="fanout-labels">
          {pending.length > 0 && (
            <span data-testid="fan-out-pending" {...tip(t('tips.fanOut.pending'))}>
              {t('components.fanOut.pending', { labels: pending.join(', ') })}
            </span>
          )}
          {failed.length > 0 && (
            <span data-testid="fan-out-failed" {...tip(t('tips.fanOut.failed'))}>
              {t('components.fanOut.failed', { labels: failed.join(', ') })}
            </span>
          )}
        </p>
      )}

      <div className="table-scroll">
        <table className="data-table" data-testid="fan-out-members">
          <thead>
            <tr>
              {th('label')}
              {th('agent')}
              {th('status')}
              {th('costUsd', { className: 'right' })}
              {th('tokens', { className: 'right' })}
              {th('run')}
            </tr>
          </thead>
          <tbody>
            {members.map((m, index) => (
              <tr key={m.runId || index} data-member={memberLabel(m, index)}>
                <td>
                  <strong>{memberLabel(m, index)}</strong>
                </td>
                <td>{m.agent || '-'}</td>
                <td>
                  <span className="inline-meta">
                    <RunStatus status={m.status} t={t} />
                    {m.outcome && m.outcome !== 'None' && m.outcome !== m.status && (
                      <span className="text-muted" {...tip(enumTip(t, 'runOutcome', m.outcome))}>
                        {enumLabel(t, 'runOutcome', m.outcome)}
                      </span>
                    )}
                  </span>
                  {m.errorMessage && <div className="field-hint">{translateServerText(t, m.errorMessage)}</div>}
                </td>
                <td className="right">{m.costUsd === null || m.costUsd === undefined ? '-' : usd(m.costUsd)}</td>
                <td className="right">{count(m.tokens)}</td>
                <td>{m.runId ? <RunLink runId={m.runId} navigate={navigate} tipText={t('tips.fanOut.openMember', { label: memberLabel(m, index) })} testId="fan-out-member-link" /> : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={confirmCancel}
        danger
        title={t('components.fanOut.cancelTitle')}
        message={t('components.fanOut.confirmCancel', { id })}
        confirmLabel={t('components.fanOut.cancel')}
        confirmTip={t('tips.fanOut.confirmCancel')}
        onConfirm={cancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </section>
  );
}
