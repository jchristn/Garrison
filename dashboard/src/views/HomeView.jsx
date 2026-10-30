import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';
import ActivityChart from '../components/ActivityChart';
import KpiCard from '../components/KpiCard';
import ExternalServicesCard from '../components/ExternalServicesCard';
import GrafanaLink from '../components/GrafanaLink';
import { useGrafana } from '../hooks/useServerInfo';
import { dashboardUrl } from '../utils/grafana';
import { Badge } from '../components/StatusBadge';
import { EmptyState } from '../components/States';
import { SendIcon, BotIcon, FileCodeIcon, PlayIcon, ListIcon, CpuIcon, ChartIcon } from '../components/Icons';
import { RunStatus } from './runConfigs';
import { ControlNodeStatus, LeaderBadge, HeartbeatAge } from '../components/ControlNodeBadges';
import { isHeartbeatStale } from '../utils/controlNodes';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { ARCHITECT_AGENT_NAME, requestRangeToParams, nodeStatusTone } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { formatNumber, formatRelativeTime, formatTime } from '../i18n/formatters';
import { overviewKpis } from '../utils/overview';
import { tip } from '../components/Tooltip';
import { BlockedRunsBanner } from '../components/BlockedRun';
import { enumTip } from '../utils/tips';

/** Build the overview from list endpoints when /overview is unavailable. */
async function fallbackOverview(apiClient, tenantId) {
  const settle = (p) => p.then((v) => v).catch(() => null);
  const [agents, deployments, runs, failures, nodes, controlNodes] = await Promise.all([
    settle(apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 1 })),
    settle(apiClient.listDeployments(tenantId, { pageNumber: 1, pageSize: 1 })),
    settle(apiClient.listRuns(tenantId, { pageNumber: 1, pageSize: 250 })),
    settle(apiClient.listRuns(tenantId, { pageNumber: 1, pageSize: 5, status: 'Failed' })),
    settle(apiClient.listNodes({ pageNumber: 1, pageSize: 250 })),
    settle(apiClient.listControlNodes({ pageNumber: 1, pageSize: 100 }))
  ]);
  const runsByStatus = {};
  for (const r of runs?.items || []) runsByStatus[r.status] = (runsByStatus[r.status] || 0) + 1;
  const nodesByStatus = {};
  for (const n of nodes?.items || []) nodesByStatus[n.status] = (nodesByStatus[n.status] || 0) + 1;
  const controlNodesByStatus = {};
  for (const n of controlNodes?.items || []) controlNodesByStatus[n.status] = (controlNodesByStatus[n.status] || 0) + 1;
  return {
    agents: agents?.totalCount ?? null,
    deployments: deployments?.totalCount ?? null,
    runsByStatus: runs ? runsByStatus : null,
    nodesByStatus: nodes ? nodesByStatus : null,
    nodes: nodes?.items || [],
    controlNodesByStatus: controlNodes ? controlNodesByStatus : null,
    leaderNodeId: (controlNodes?.items || []).find((n) => n.isLeader)?.id || null,
    recentFailures: failures?.items || [],
    partial: [agents, deployments, runs, nodes].some((x) => x === null)
  };
}

/** Command center: KPIs, activity, control-plane and worker node health, recent failures, common workflows, external tools. */
export default function HomeView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { apiClient } = useAuth();
  const { tenantId, setWizardOpen } = useApp();
  const [overview, setOverview] = useState(null);
  const [reqRange, setReqRange] = useState('day');
  const [reqSummary, setReqSummary] = useState(null);
  const [reqLoading, setReqLoading] = useState(false);
  const [loadedAt, setLoadedAt] = useState(null);
  const grafana = useGrafana();

  const loadOverview = useCallback(async () => {
    if (!apiClient) return;
    let data;
    // Control-plane replicas for the Nodes panel (P10.19). null when the server does not list them or the caller
    // may not read nodes; the panel then says so instead of showing an empty list.
    const controlNodes = apiClient.listControlNodes({ pageNumber: 1, pageSize: 100 }).then((r) => r.items || [], () => null);
    try {
      data = await apiClient.getOverview(tenantId);
      if (!data?.nodes) {
        const nodes = await apiClient.listNodes({ pageNumber: 1, pageSize: 250 }).catch(() => null);
        data = { ...data, nodes: nodes?.items || [] };
      }
    } catch {
      data = await fallbackOverview(apiClient, tenantId);
    }
    data = { ...data, controlNodes: await controlNodes };
    setOverview(data);
    setLoadedAt(new Date().toISOString());
  }, [apiClient, tenantId]);

  const loadRequests = useCallback(() => {
    if (!apiClient) return;
    setReqLoading(true);
    apiClient
      .getRequestHistorySummary(requestRangeToParams(reqRange))
      .then(setReqSummary)
      .catch(() => setReqSummary(null))
      .finally(() => setReqLoading(false));
  }, [apiClient, reqRange]);

  useEffect(() => {
    loadOverview();
    const id = setInterval(loadOverview, 30000);
    return () => clearInterval(id);
  }, [loadOverview]);
  useEffect(loadRequests, [loadRequests]);

  const kpis = overviewKpis(overview);
  const val = (v) => (v === null || v === undefined ? '-' : formatNumber(v));
  // The seeded agent architect (AD7.6) does not make a tenant non-empty: with one agent, check whether it is that one.
  const [onlyArchitect, setOnlyArchitect] = useState(false);
  const agentCount = overview ? overview.agents : null;
  useEffect(() => {
    if (!apiClient || agentCount !== 1) {
      setOnlyArchitect(false);
      return undefined;
    }
    let active = true;
    apiClient
      .listAgents(tenantId, { pageNumber: 1, pageSize: 2 })
      .then((r) => active && setOnlyArchitect((r.items || []).every((a) => a?.name === ARCHITECT_AGENT_NAME)))
      .catch(() => active && setOnlyArchitect(false));
    return () => {
      active = false;
    };
  }, [apiClient, tenantId, agentCount]);
  const noAgents = overview && (overview.agents === 0 || onlyArchitect);

  return (
    <div>
      <PageHeader
        title={t('views.home.title')}
        subtitle={t('views.home.subtitle')}
        actions={loadedAt && <span className="text-muted">{t('views.home.lastLoaded', { time: formatTime(loadedAt, i18n.language, { timeStyle: 'medium' }) })}</span>}
      />

      {overview?.partial && <div className="warning-banner">{t('views.home.partial')}</div>}
      <BlockedRunsBanner count={Number(overview?.blockedRuns) || 0} />
      {noAgents && (
        <div className="callout" data-testid="setup-callout">
          <div>
            <strong>{t('views.home.getStartedTitle')}</strong>
            <p className="text-muted">{t('views.home.getStartedBody')}</p>
          </div>
          <div className="flex gap-sm">
            <button type="button" className="button-secondary" onClick={() => navigate(pathFor('agentWizard', 'new'))} data-testid="setup-callout-studio" {...tip(t('tips.views.home.openStudio'))}>
              {t('views.home.openStudio')}
            </button>
            <button type="button" className="button-primary" onClick={() => setWizardOpen(true)} {...tip(t('tips.nav.setup'))}>
              {t('views.home.runSetup')}
            </button>
          </div>
        </div>
      )}

      <div className="kpi-grid" data-tour="kpis">
        <KpiCard label={t('views.home.kpis.agents')} tip={t('tips.views.home.kpis.agents')} value={val(kpis.agents)} onClick={() => navigate(pathFor('agents'))} testId="kpi-agents" />
        <KpiCard label={t('views.home.kpis.deployments')} tip={t('tips.views.home.kpis.deployments')} value={val(kpis.deployments)} onClick={() => navigate(pathFor('deployments'))} testId="kpi-deployments" />
        <KpiCard label={t('views.home.kpis.activeRuns')} tip={t('tips.views.home.kpis.activeRuns')} value={val(kpis.active)} onClick={() => navigate(pathFor('runs', null, { status: 'Running' }))} tone="info" testId="kpi-active" />
        <KpiCard label={t('views.home.kpis.queued')} tip={t('tips.views.home.kpis.queued')} value={val(kpis.queued)} onClick={() => navigate(pathFor('queue'))} testId="kpi-queued" />
        <KpiCard label={t('views.home.kpis.succeeded')} tip={t('tips.views.home.kpis.succeeded')} value={val(kpis.succeeded)} note={t('views.home.kpis.last24h')} onClick={() => navigate(pathFor('runs', null, { status: 'Succeeded' }))} tone="success" testId="kpi-succeeded" />
        <KpiCard label={t('views.home.kpis.failed')} tip={t('tips.views.home.kpis.failed')} value={val(kpis.failed)} note={t('views.home.kpis.last24h')} onClick={() => navigate(pathFor('runs', null, { status: 'Failed' }))} tone={kpis.failed ? 'danger' : undefined} testId="kpi-failed" />
        <KpiCard
          label={t('views.home.kpis.nodes')}
          tip={t('tips.views.home.kpis.nodes')}
          value={kpis.nodesTotal === null ? '-' : `${formatNumber(kpis.nodesReady)} / ${formatNumber(kpis.nodesTotal)}`}
          note={t('views.home.kpis.nodesNote')}
          onClick={() => navigate(pathFor('nodes'))}
          tone={kpis.nodesLost ? 'warning' : undefined}
          testId="kpi-nodes"
        />
        <KpiCard
          label={t('views.home.kpis.controlNodes')}
          tip={kpis.leaderNodeId ? t('tips.views.home.kpis.controlNodes', { leader: kpis.leaderNodeId }) : t('tips.views.home.kpis.controlNodesNoLeader')}
          value={kpis.controlTotal === null ? '-' : `${formatNumber(kpis.controlReady)} / ${formatNumber(kpis.controlTotal)}`}
          note={t('views.home.kpis.nodesNote')}
          onClick={() => navigate(pathFor('controlNodes'))}
          tone={kpis.controlTotal ? (kpis.controlReady === 0 ? 'danger' : kpis.leaderNodeId ? undefined : 'warning') : undefined}
          testId="kpi-control-nodes"
        />
      </div>
      {grafana && (
        <div className="grafana-links">
          <GrafanaLink href={dashboardUrl(grafana, 'overview')} label={t('views.home.kpisGrafana')} tipText={t('tips.views.home.kpisGrafana')} testId="kpis-grafana" />
        </div>
      )}

      <div className="home-chart">
        <ActivityChart
          summary={reqSummary}
          rangeId={reqRange}
          onRangeChange={setReqRange}
          onRefresh={loadRequests}
          loading={reqLoading}
          title={t('views.home.requestActivity')}
          onBucketClick={(b) => navigate(pathFor('requests', null, { fromUtc: b.bucketStartUtc, toUtc: b.bucketEndUtc }))}
        />
      </div>

      <div className="home-grid">
        <section className="panel" aria-labelledby="nodes-title" data-testid="home-nodes">
          <h2 id="nodes-title" className="section-title">
            {t('views.home.nodesTitle')}
          </h2>
          <div className="node-section" data-testid="home-control-nodes">
            <div className="node-section-head">
              <h3 className="node-section-title">{t('views.home.controlPlaneSection')}</h3>
              <a href={pathFor('controlNodes')} className="button-ghost button-sm" {...tip(t('tips.views.home.openControlPlane'))} onClick={(e) => { e.preventDefault(); navigate(pathFor('controlNodes')); }}>
                {t('views.home.openControlPlane')}
              </a>
            </div>
            {!overview ? null : overview.controlNodes === null ? (
              <p className="text-muted">{t('views.home.controlNodesUnavailable')}</p>
            ) : (overview?.controlNodes || []).length === 0 ? (
              <p className="text-muted">{t('views.home.noControlNodes')}</p>
            ) : (
              <ul className="node-list">
                {[...overview.controlNodes].sort((x, y) => Number(!!y.isLeader) - Number(!!x.isLeader) || String(x.name).localeCompare(String(y.name))).slice(0, 8).map((n) => (
                  <li key={n.id}>
                    <span className={`health-dot ${n.status === 'Ready' && !isHeartbeatStale(n) ? 'healthy' : n.status === 'Offline' ? 'unhealthy' : 'unknown'}`} aria-hidden="true" />
                    <strong>{n.name}</strong>
                    <ControlNodeStatus status={n.status} t={t} />
                    <LeaderBadge node={n} t={t} />
                    <span className="text-muted node-meta">
                      <HeartbeatAge node={n} t={t} lng={i18n.language} />
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="node-section" data-testid="home-worker-nodes">
            <div className="node-section-head">
              <h3 className="node-section-title">{t('views.home.workersSection')}</h3>
              <a href={pathFor('nodes')} className="button-ghost button-sm" {...tip(t('tips.views.home.openWorkers'))} onClick={(e) => { e.preventDefault(); navigate(pathFor('nodes')); }}>
                {t('views.home.openWorkers')}
              </a>
            </div>
            {(overview?.nodes || []).length === 0 ? (
              <EmptyState title={t('views.home.noNodesTitle')} body={t('views.home.noNodesBody')} />
            ) : (
              <ul className="node-list">
                {(overview?.nodes || []).slice(0, 8).map((n) => (
                  <li key={n.id}>
                    <span className={`health-dot ${n.status === 'Ready' ? 'healthy' : n.status === 'Lost' || n.status === 'Offline' ? 'unhealthy' : 'unknown'}`} aria-hidden="true" />
                    <strong>{n.name}</strong>
                    <Badge tone={nodeStatusTone(n.status)} tip={enumTip(t, 'nodeStatus', n.status)}>{t(`enums.nodeStatus.${n.status}`, { defaultValue: n.status })}</Badge>
                    <span className="text-muted node-meta">
                      {t('views.home.nodeLoad', { active: n.activeRuns ?? 0, max: n.maxConcurrentRuns ?? 0 })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="panel" aria-labelledby="failures-title">
          <h2 id="failures-title" className="section-title">
            {t('views.home.recentFailures')}
          </h2>
          {(overview?.recentFailures || []).length === 0 ? (
            <p className="text-muted">{t('views.home.noFailures')}</p>
          ) : (
            <ul className="plain-list">
              {overview.recentFailures.map((r) => (
                <li key={r.id}>
                  <a href={pathFor('runs', r.id)} {...tip(t('tips.views.home.openFailure'))} onClick={(e) => { e.preventDefault(); navigate(pathFor('runs', r.id)); }}>
                    <strong>{r.agentName}</strong>
                  </a>{' '}
                  <RunStatus status={r.status} t={t} /> <span className="text-muted">{r.outcome && t(`enums.runOutcome.${r.outcome}`, { defaultValue: r.outcome })}</span>{' '}
                  <span className="text-muted">{formatRelativeTime(r.createdUtc, i18n.language)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="panel" aria-labelledby="cta-title">
        <h2 id="cta-title" className="section-title">
          {t('views.home.cta.title')}
        </h2>
        <div className="cta-grid">
          <button type="button" className="cta-card" onClick={() => navigate(pathFor('invoke'))} {...tip(t('tips.views.home.cta.invoke'))}>
            <SendIcon /> <span>{t('views.home.cta.invoke')}</span>
          </button>
          <button type="button" className="cta-card" onClick={() => navigate(pathFor('agents'))} {...tip(t('tips.views.home.cta.addAgent'))}>
            <BotIcon /> <span>{t('views.home.cta.addAgent')}</span>
          </button>
          <button type="button" className="cta-card" onClick={() => navigate(pathFor('manifests'))} {...tip(t('tips.views.home.cta.applyManifest'))}>
            <FileCodeIcon /> <span>{t('views.home.cta.applyManifest')}</span>
          </button>
          <button type="button" className="cta-card" onClick={() => navigate(pathFor('runs'))} {...tip(t('tips.views.home.cta.inspectRuns'))}>
            <ListIcon /> <span>{t('views.home.cta.inspectRuns')}</span>
          </button>
          <button type="button" className="cta-card" onClick={() => navigate(pathFor('nodes'))} {...tip(t('tips.views.home.cta.nodes'))}>
            <CpuIcon /> <span>{t('views.home.cta.nodes')}</span>
          </button>
          <button type="button" className="cta-card" onClick={() => navigate(pathFor('explorer'))} {...tip(t('tips.views.home.cta.apiExplorer'))}>
            <PlayIcon /> <span>{t('views.home.cta.apiExplorer')}</span>
          </button>
          <button type="button" className="cta-card" onClick={() => navigate(pathFor('analytics'))} {...tip(t('tips.views.home.cta.analytics'))}>
            <ChartIcon /> <span>{t('views.home.cta.analytics')}</span>
          </button>
        </div>
      </section>

      <ExternalServicesCard />
    </div>
  );
}
