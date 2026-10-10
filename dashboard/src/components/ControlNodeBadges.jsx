// Pills and cells for control nodes (control-plane replicas, P10.19), shared by Fleet > Control plane, its detail,
// and Home.

import { Badge } from './StatusBadge';
import { tip } from './Tooltip';
import { controlNodeStatusTone } from '../utils/constants';
import { HEARTBEAT_STALE_MS, isHeartbeatStale } from '../utils/controlNodes';
import { enumTip } from '../utils/tips';
import { formatDateTime, formatRelativeTime } from '../i18n/formatters';

/** Control node (control-plane replica) status pill with a localized label. */
export function ControlNodeStatus({ status, t }) {
  return (
    <Badge tone={controlNodeStatusTone(status)} tip={enumTip(t, 'controlNodeStatus', status)}>
      {t(`enums.controlNodeStatus.${status}`, { defaultValue: status })}
    </Badge>
  );
}

/** "Leader" pill for the replica that holds the maintenance leader lease; nothing for the others. */
export function LeaderBadge({ node, t }) {
  if (!node?.isLeader) return null;
  const epoch = node.leaderEpoch ?? null;
  return (
    <Badge tone="info" tip={epoch === null ? t('tips.resources.controlNodes.badges.leader') : t('tips.resources.controlNodes.badges.leaderEpoch', { epoch })}>
      {t('resources.controlNodes.leader')}
    </Badge>
  );
}

/** Relative heartbeat age; past HEARTBEAT_STALE_MS (and not Offline) it is highlighted and carries a "Stale" pill. */
export function HeartbeatAge({ node, t, lng, now = Date.now() }) {
  if (!node?.lastHeartbeatUtc) return '-';
  const text = formatRelativeTime(node.lastHeartbeatUtc, lng);
  const exact = formatDateTime(node.lastHeartbeatUtc, lng, { dateStyle: 'medium', timeStyle: 'medium' });
  if (!isHeartbeatStale(node, now)) return <span {...tip(exact)}>{text}</span>;
  return (
    <span className="heartbeat-stale" data-testid="heartbeat-stale">
      <span className="text-stale" {...tip(exact)}>{text}</span>{' '}
      <Badge tone="warning" tip={t('tips.resources.controlNodes.badges.stale', { seconds: HEARTBEAT_STALE_MS / 1000 })}>
        {t('resources.controlNodes.stale')}
      </Badge>
    </span>
  );
}
