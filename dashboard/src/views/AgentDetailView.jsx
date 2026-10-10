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
import { formatRelativeTime } from '../i18n/formatters';

/** One agent end to end: identity, exposure, delegation, deployments with weights, A2A card, and recent runs. */
export default function AgentDetailView({ recordId }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [runs, setRuns] = useState([]);
  const [card, setCard] = useState(null);
  const [cardError, setCardError] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('deployments');
  const [jsonOpen, setJsonOpen] = useState(false);

  const load = useCallback(() => {
    if (!apiClient) return;
    apiClient.getAgent(tenantId, recordId).then(setAgent).catch(setError);
    apiClient
      .listDeployments(tenantId, { pageNumber: 1, pageSize: 1000 })
      .then((r) => setDeployments((r.items || []).filter((d) => d.agentId === recordId)))
      .catch(() => setDeployments([]));
    apiClient
      .listRuns(tenantId, { pageNumber: 1, pageSize: 25, agentId: recordId })
      .then((r) => setRuns(r.items || []))
      .catch(() => setRuns([]));
    apiClient.getAgentCard(tenantId, recordId).then(setCard).catch(setCardError);
  }, [apiClient, tenantId, recordId]);

  useEffect(load, [load]);

  if (error && !agent) return <ErrorBanner message={errorMessage(t, error)} onRetry={load} />;
  if (!agent) return <LoadingState />;

  const totalWeight = deployments.filter((d) => d.active).reduce((s, d) => s + (d.weight || 0), 0);

  return (
    <div>
      <PageHeader
        title={agent.displayName || agent.name}
        subtitle={
          <span className="inline-meta">
            <code>{agent.name}</code> <Badge tone={agent.kind === 'Remote' ? 'warning' : 'info'}>{t(`enums.agentKind.${agent.kind}`, { defaultValue: agent.kind })}</Badge>
            <ActiveBadge active={agent.active} activeLabel={t('common.generic.active')} inactiveLabel={t('common.generic.inactive')} />
          </span>
        }
        actions={
          <>
            <button type="button" className="button-secondary" onClick={() => setJsonOpen(true)}>
              {t('common.actions.viewJson')}
            </button>
            <button type="button" className="button-primary" onClick={() => navigate(pathFor('invoke', null, { agentId: agent.id }))}>
              <SendIcon size={14} /> {t('views.agentDetail.invoke')}
            </button>
          </>
        }
      />
      <div className="panel detail-grid">
        <div className="detail-item detail-item-span">
          <div className="detail-item-label">{t('resources.agents.fields.description')}</div>
          <div className="detail-item-value">{agent.description || '-'}</div>
        </div>
        <div className="detail-item">
          <div className="detail-item-label">{t('resources.agents.columns.id')}</div>
          <div className="detail-item-value">
            <CopyableId value={agent.id} />
          </div>
        </div>
        <div className="detail-item">
          <div className="detail-item-label">{t('resources.agents.columns.exposure')}</div>
          <div className="detail-item-value">{[agent.exposeA2A ? 'A2A' : null, agent.exposeMcpTool ? `MCP (${agent.mcpToolName || agent.name})` : null].filter(Boolean).join(', ') || '-'}</div>
        </div>
        <div className="detail-item">
          <div className="detail-item-label">{t('resources.agents.fields.delegationMode')}</div>
          <div className="detail-item-value">
            {t(`enums.delegationMode.${agent.delegationMode}`, { defaultValue: agent.delegationMode })}
            {agent.delegationMode === 'AllowList' && ` (${(agent.delegationAllowList || []).join(', ') || '-'})`}
          </div>
        </div>
        <div className="detail-item">
          <div className="detail-item-label">{t('resources.agents.fields.inputMode')}</div>
          <div className="detail-item-value">{agent.inputMode}</div>
        </div>
      </div>
      {deployments.filter((d) => d.active).length === 0 && <div className="warning-banner">{t('views.agentDetail.noActiveDeployment')}</div>}
      <Tabs
        label={agent.name}
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'deployments', label: t('views.agentDetail.deployments', { count: deployments.length }) },
          { id: 'runs', label: t('views.agentDetail.recentRuns') },
          { id: 'card', label: t('views.agentDetail.card') }
        ]}
      />
      <div className="panel">
        {tab === 'deployments' &&
          (deployments.length === 0 ? (
            <EmptyState
              title={t('views.agentDetail.noDeploymentsTitle')}
              body={t('views.agentDetail.noDeploymentsBody')}
              action={
                <button type="button" className="button-primary" onClick={() => navigate(pathFor('deployments'))}>
                  {t('resources.deployments.add')}
                </button>
              }
            />
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">{t('resources.deployments.columns.name')}</th>
                    <th scope="col">{t('resources.deployments.columns.harnessProfileId')}</th>
                    <th scope="col">{t('resources.deployments.columns.model')}</th>
                    <th scope="col" className="right">
                      {t('views.agentDetail.traffic')}
                    </th>
                    <th scope="col">{t('resources.deployments.columns.active')}</th>
                  </tr>
                </thead>
                <tbody>
                  {deployments.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <strong>{d.name}</strong>
                      </td>
                      <td>
                        <CopyableId value={d.harnessProfileId} />
                      </td>
                      <td>{d.model || '-'}</td>
                      <td className="right">{d.active && totalWeight > 0 ? `${Math.round(((d.weight || 0) / totalWeight) * 100)}%` : '0%'}</td>
                      <td>
                        <ActiveBadge active={d.active} activeLabel={t('common.generic.active')} inactiveLabel={t('common.generic.inactive')} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        {tab === 'runs' &&
          (runs.length === 0 ? (
            <div className="text-muted">{t('views.agentDetail.noRuns')}</div>
          ) : (
            <ul className="plain-list">
              {runs.map((r) => (
                <li key={r.id}>
                  <a href={pathFor('runs', r.id)} onClick={(e) => { e.preventDefault(); navigate(pathFor('runs', r.id)); }}>
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
