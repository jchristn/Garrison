import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useGrafana } from '../hooks/useServerInfo';
import { controlNodeDashboardUrl } from '../utils/grafana';
import { resourceTip } from '../utils/tips';
import { enumLabel } from '../utils/enums';
import { formatBoolean, formatDateTime, formatNumber, formatUptime } from '../i18n/formatters';
import { ControlNodeStatus, LeaderBadge, HeartbeatAge } from './ControlNodeBadges';
import CopyButton from './CopyButton';
import GrafanaLink from './GrafanaLink';
import { tip } from './Tooltip';

function Row({ label, tipText, value, copy }) {
  return (
    <div className="info-row">
      <div className="info-label" {...tip(tipText)}>
        {label}
      </div>
      <div className="info-value">
        {value === null || value === undefined || value === '' ? '-' : value}
        {copy && <CopyButton value={String(copy)} tipText={tipText} />}
      </div>
    </div>
  );
}

/**
 * Read-only detail for one control node (P10.19): every field the server reports, refreshed with a single read
 * (GET /control-nodes/{id}) so "Answered by" names the replica that served this read. Falls back to the list row
 * when the read fails.
 */
export default function ControlNodeDetail({ node }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const grafana = useGrafana();
  const [fresh, setFresh] = useState(null);

  useEffect(() => {
    if (!apiClient || !node?.id) return undefined;
    let cancelled = false;
    apiClient
      .getControlNode(node.id)
      .then((r) => !cancelled && setFresh(r))
      .catch(() => !cancelled && setFresh(null));
    return () => {
      cancelled = true;
    };
  }, [apiClient, node?.id]);

  const n = fresh || node || {};
  const lng = i18n.language;
  const label = (key) => t(`resources.controlNodes.fields.${key}`);
  const tipFor = (key) => resourceTip(t, 'controlNodes', key);
  const num = (v) => (v === null || v === undefined ? null : formatNumber(v, {}, lng));
  const when = (v) => (v ? formatDateTime(v, lng, { dateStyle: 'medium', timeStyle: 'medium' }) : null);

  return (
    <div className="control-node-detail" data-testid="control-node-detail">
      <div className="control-node-detail-head">
        <ControlNodeStatus status={n.status} t={t} /> <LeaderBadge node={n} t={t} />
        <GrafanaLink href={controlNodeDashboardUrl(grafana, n.name)} label={t('resources.controlNodes.actions.grafana')} tipText={t('tips.resources.controlNodes.actions.grafana', { node: n.name })} testId="control-node-grafana" />
      </div>
      <Row label={label('name')} tipText={tipFor('name')} value={n.name} />
      <Row label={label('id')} tipText={tipFor('id')} value={n.id ? <code>{n.id}</code> : null} copy={n.id} />
      <Row label={label('hostname')} tipText={tipFor('hostname')} value={n.hostname} />
      <Row label={label('address')} tipText={tipFor('address')} value={n.address ? <code>{n.address}</code> : null} />
      <Row label={label('isLeader')} tipText={tipFor('isLeader')} value={formatBoolean(!!n.isLeader)} />
      {n.isLeader && <Row label={label('leaderEpoch')} tipText={tipFor('leaderEpoch')} value={num(n.leaderEpoch)} />}
      <Row label={label('version')} tipText={tipFor('version')} value={n.version} />
      <Row label={label('schemaVersion')} tipText={tipFor('schemaVersion')} value={n.schemaVersion} />
      <Row label={label('backplane')} tipText={tipFor('backplane')} value={n.backplane ? enumLabel(t, 'backplane', n.backplane) : null} />
      <Row label={label('startedUtc')} tipText={tipFor('startedUtc')} value={when(n.startedUtc)} />
      <Row label={label('uptime')} tipText={tipFor('uptime')} value={formatUptime(n.startedUtc, lng)} />
      <Row label={label('lastHeartbeatUtc')} tipText={tipFor('lastHeartbeatUtc')} value={<HeartbeatAge node={n} t={t} lng={lng} />} />
      <Row label={label('activeRequests')} tipText={tipFor('activeRequests')} value={num(n.activeRequests)} />
      <Row label={label('openStreams')} tipText={tipFor('openStreams')} value={num(n.openStreams)} />
      <Row label={label('heldLongPolls')} tipText={tipFor('heldLongPolls')} value={num(n.heldLongPolls)} />
      <Row label={label('respondingNodeId')} tipText={tipFor('respondingNodeId')} value={fresh?.respondingNodeId ? <code>{fresh.respondingNodeId}</code> : null} />
    </div>
  );
}
