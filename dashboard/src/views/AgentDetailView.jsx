import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import CodeBlock from '../components/CodeBlock';
import CopyableId from '../components/CopyableId';
import JsonViewerModal from '../components/JsonViewerModal';
import Tabs from '../components/Tabs';
import { LoadingState, ErrorBanner, EmptyState } from '../components/States';
import { Badge, ActiveBadge } from '../components/StatusBadge';
import { SendIcon } from '../components/Icons';
import { RunStatus } from './runConfigs';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { pathFor } from '../config/navConfig';
import { errorMessage } from '../utils/errors';
import { formatRelativeTime, formatNumber, formatPercent } from '../i18n/formatters';
import Explainer from '../components/Explainer';
import { tip } from '../components/Tooltip';
import { enumTip } from '../utils/tips';
import { enumLabel } from '../utils/enums';
import { trafficShares } from '../utils/deployments';
import GrafanaLink from '../components/GrafanaLink';
import { useGrafana } from '../hooks/useServerInfo';
import { agentDashboardUrl } from '../utils/grafana';
import AgentRevisionsPanel from '../components/AgentRevisionsPanel';
import { EnvironmentBadge, RevisionPinBadge } from '../components/RevisionBadges';
import { revisionNumbers } from '../utils/revisions';

/**
 * One agent end to end: identity, exposure, delegation, deployments with weights, environments, and revision pins,
 * revisions (list, diff, publish), A2A card, and recent runs.
 */
export default function AgentDetailView({ recordId }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const navigate = useNavigate();
  const grafana = useGrafana();
  const [agent, setAgent] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [runs, setRuns] = useState([]);
  const [card, setCard] = useState(null);
  const [cardError, setCardError] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('deployments');
  const [jsonOpen, setJsonOpen] = useState(false);
  const [numbers, setNumbers] = useState({});

  const load = useCallback(() => {
    if (!apiClient) return;
    apiClient.getAgent(tenantId, recordId).then(setAgent).catch(setError);
    apiClient
      .listDeployments(tenantId, { pageNumber: 1, pageSize: 1000 })
      .then((r) => setDeployments((r.items || []).filter((d) => d.agentId === recordId)))
      .catch(() => setDeployments([]));
    apiClient
      .listHarnessProfiles(tenantId, { pageNumber: 1, pageSize: 1000, includeBuiltIn: true })
      .then((r) => setProfiles(Object.fromEntries((r.items || []).map((p) => [p.id, p]))))
      .catch(() => setProfiles({}));
    apiClient
      .listRuns(tenantId, { pageNumber: 1, pageSize: 25, agentId: recordId })
      .then((r) => setRuns(r.items || []))
      .catch(() => setRuns([]));
    apiClient.getAgentCard(tenantId, recordId).then(setCard).catch(setCardError);
    apiClient
      .listAgentRevisions(tenantId, recordId)
      .then((r) => setNumbers(revisionNumbers(r.items || [])))
      .catch(() => setNumbers({}));
  }, [apiClient, tenantId, recordId]);

  // After a publish or discard only the agent (latest and draft revision IDs) and the revision numbers change.
  const reloadAgent = useCallback(() => {
    if (!apiClient) return;
    apiClient.getAgent(tenantId, recordId).then(setAgent).catch(() => {});
    apiClient
      .listAgentRevisions(tenantId, recordId)
      .then((r) => setNumbers(revisionNumbers(r.items || [])))
      .catch(() => {});
  }, [apiClient, tenantId, recordId]);

  useEffect(load, [load]);

  if (error && !agent) return <ErrorBanner message={errorMessage(t, error)} onRetry={load} />;
  if (!agent) return <LoadingState />;

  const shares = trafficShares(deployments);
  const na = t('common.generic.notAvailable');

  return (
    <div>
      <PageHeader
        title={agent.displayName || agent.name}
        subtitle={
          <span className="inline-meta">
            <code {...tip(t('tips.views.agentDetail.name'))}>{agent.name}</code>{' '}
            <Badge tone={agent.kind === 'Remote' ? 'warning' : 'info'} tip={enumTip(t, 'agentKind', agent.kind)}>
              {t(`enums.agentKind.${agent.kind}`, { defaultValue: agent.kind })}
            </Badge>
            <ActiveBadge active={agent.active} activeLabel={t('common.generic.active')} inactiveLabel={t('common.generic.inactive')} tip={t(agent.active ? 'tips.badges.active' : 'tips.badges.inactive')} />
          </span>
        }
        actions={
          <>
            <GrafanaLink size="md" href={agentDashboardUrl(grafana, agent.name, tenantId)} label={t('views.agentDetail.grafana')} tipText={t('tips.views.agentDetail.grafana')} testId="agent-grafana" />
            <button type="button" className="button-secondary" onClick={() => setJsonOpen(true)} {...tip(t('tips.views.agentDetail.viewJson'))}>
              {t('common.actions.viewJson')}
            </button>
            <button type="button" className="button-secondary" onClick={() => navigate(pathFor('conversations', null, { agentId: agent.id }))} data-testid="agent-conversations" {...tip(t('tips.views.agentDetail.conversations'))}>
              {t('views.agentDetail.conversations')}
            </button>
            <button type="button" className="button-primary" onClick={() => navigate(pathFor('invoke', null, { agentId: agent.id }))} {...tip(t('tips.views.agentDetail.invoke'))}>
              <SendIcon size={14} /> {t('views.agentDetail.invoke')}
            </button>
          </>
        }
      />
      <div className="panel detail-grid">
        <div className="detail-item detail-item-span">
          <div className="detail-item-label" {...tip(t('tips.resources.agents.description'))}>{t('resources.agents.fields.description')}</div>
          <div className="detail-item-value">{agent.description || '-'}</div>
        </div>
        <div className="detail-item">
          <div className="detail-item-label" {...tip(t('tips.views.agentDetail.id'))}>{t('resources.agents.columns.id')}</div>
          <div className="detail-item-value">
            <CopyableId value={agent.id} />
          </div>
        </div>
        <div className="detail-item">
          <div className="detail-item-label" {...tip(t('tips.resources.agents.exposure'))}>{t('resources.agents.columns.exposure')}</div>
          <div className="detail-item-value">{[agent.exposeA2A ? 'A2A' : null, agent.exposeMcpTool ? `MCP (${agent.mcpToolName || agent.name})` : null].filter(Boolean).join(', ') || '-'}</div>
        </div>
        <div className="detail-item">
          <div className="detail-item-label" {...tip(t('tips.resources.agents.delegationMode'))}>{t('resources.agents.fields.delegationMode')}</div>
          <div className="detail-item-value">
            {t(`enums.delegationMode.${agent.delegationMode}`, { defaultValue: agent.delegationMode })}
            {agent.delegationMode === 'AllowList' && ` (${(agent.delegationAllowList || []).join(', ') || '-'})`}
          </div>
        </div>
        <div className="detail-item">
          <div className="detail-item-label" {...tip(t('tips.resources.agents.inputMode'))}>{t('resources.agents.fields.inputMode')}</div>
          <div className="detail-item-value">{enumLabel(t, 'agentInputMode', agent.inputMode)}</div>
        </div>
      </div>
      {deployments.filter((d) => d.active).length === 0 && <div className="warning-banner">{t('views.agentDetail.noActiveDeployment')}</div>}
      {agent.draftRevisionId && (
        <div className="info-banner" data-testid="agent-draft-notice">
          <span>{t('views.agentDetail.draftNotice')}</span>
          <button type="button" className="button-secondary button-sm" onClick={() => setTab('revisions')} data-testid="agent-review-draft" {...tip(t('tips.views.agentDetail.reviewDraft'))}>
            {t('views.agentDetail.reviewDraft')}
          </button>
        </div>
      )}
      <Explainer topic="agentDetail" />
      <Tabs
        label={agent.name}
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'deployments', label: t('views.agentDetail.deployments', { count: deployments.length }), tip: t('tips.views.agentDetail.tabs.deployments') },
          { id: 'revisions', label: t('views.agentDetail.revisions'), tip: t('tips.views.agentDetail.tabs.revisions') },
          { id: 'runs', label: t('views.agentDetail.recentRuns'), tip: t('tips.views.agentDetail.tabs.runs') },
          { id: 'card', label: t('views.agentDetail.card'), tip: t('tips.views.agentDetail.tabs.card') }
        ]}
      />
      <div className="panel">
        {tab === 'deployments' &&
          (deployments.length === 0 ? (
            <EmptyState
              title={t('views.agentDetail.noDeploymentsTitle')}
              body={t('views.agentDetail.noDeploymentsBody')}
              action={
                <button type="button" className="button-primary" onClick={() => navigate(pathFor('deployments'))} {...tip(t('tips.views.agentDetail.addDeployment'))}>
                  {t('resources.deployments.add')}
                </button>
              }
            />
          ) : (
            <>
              <p className="text-muted agent-deployments-note">{t('views.agentDetail.selectionNote')}</p>
              <div className="table-scroll">
                <table className="data-table" data-testid="agent-deployments">
                  <thead>
                    <tr>
                      <th scope="col" {...tip(t('tips.views.agentDetail.columns.name'))}>{t('resources.deployments.columns.name')}</th>
                      <th scope="col" {...tip(t('tips.views.agentDetail.columns.environment'))}>{t('resources.deployments.columns.environment')}</th>
                      <th scope="col" {...tip(t('tips.views.agentDetail.columns.revision'))}>{t('resources.deployments.columns.agentRevisionId')}</th>
                      <th scope="col" {...tip(t('tips.views.agentDetail.columns.harness'))}>{t('resources.deployments.columns.harnessProfileId')}</th>
                      <th scope="col" {...tip(t('tips.views.agentDetail.columns.model'))}>{t('resources.deployments.columns.model')}</th>
                      <th scope="col" className="right" {...tip(t('tips.views.agentDetail.columns.weight'))}>
                        {t('resources.deployments.columns.weight')}
                      </th>
                      <th scope="col" {...tip(t('tips.views.agentDetail.columns.traffic'))}>{t('views.agentDetail.traffic')}</th>
                      <th scope="col" {...tip(t('tips.views.agentDetail.columns.active'))}>{t('resources.deployments.columns.active')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deployments.map((d) => {
                      const share = shares[d.id] || 0;
                      const profile = profiles[d.harnessProfileId];
                      return (
                        <tr key={d.id} data-deployment={d.name}>
                          <td>
                            <strong>{d.name}</strong>
                            {d.description && <div className="text-muted">{d.description}</div>}
                          </td>
                          <td>
                            <EnvironmentBadge deployment={d} t={t} />
                          </td>
                          <td data-cell="revision">
                            <RevisionPinBadge deployment={d} numbers={numbers} t={t} />
                          </td>
                          <td>{profile ? <span {...tip(d.harnessProfileId)}>{profile.name}</span> : <CopyableId value={d.harnessProfileId} />}</td>
                          <td>{d.model || na}</td>
                          <td className="right" data-cell="weight">{formatNumber(d.weight ?? 0)}</td>
                          <td data-cell="share">
                            <span className="weight-bar" aria-hidden="true">
                              <span style={{ width: `${Math.round(share * 100)}%` }} />
                            </span>
                            {formatPercent(share, i18n.language, { digits: 0 })}
                          </td>
                          <td>
                            <ActiveBadge active={d.active} activeLabel={t('common.generic.active')} inactiveLabel={t('common.generic.inactive')} tip={t(d.active ? 'tips.badges.deploymentActive' : 'tips.badges.deploymentInactive')} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-sm" style={{ marginTop: 'var(--spacing-sm)' }}>
                <button type="button" className="button-secondary button-sm" onClick={() => navigate(pathFor('deployments'))} {...tip(t('tips.views.agentDetail.manageDeployments'))}>
                  {t('views.agentDetail.manageDeployments')}
                </button>
              </div>
            </>
          ))}
        {tab === 'revisions' && <AgentRevisionsPanel agent={agent} onChanged={reloadAgent} />}
        {tab === 'runs' &&
          (runs.length === 0 ? (
            <div className="text-muted">{t('views.agentDetail.noRuns')}</div>
          ) : (
            <ul className="plain-list">
              {runs.map((r) => (
                <li key={r.id}>
                  <a href={pathFor('runs', r.id)} {...tip(t('tips.views.agentDetail.openRun'))} onClick={(e) => { e.preventDefault(); navigate(pathFor('runs', r.id)); }}>
                    <code>{r.id}</code>
                  </a>{' '}
                  <RunStatus status={r.status} t={t} /> <span className="text-muted">{formatRelativeTime(r.createdUtc, i18n.language)}</span>
                </li>
              ))}
            </ul>
          ))}
        {tab === 'card' && (cardError ? <div className="text-muted">{errorMessage(t, cardError)}</div> : <CodeBlock value={card} prettyJson />)}
      </div>
      <JsonViewerModal open={jsonOpen} value={agent} onClose={() => setJsonOpen(false)} />
    </div>
  );
}
