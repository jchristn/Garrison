import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';
import CopyButton from '../components/CopyButton';
import CodeBlock from '../components/CodeBlock';
import { ErrorBanner, LoadingState } from '../components/States';
import { Badge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { APP_VERSION } from '../utils/constants';
import { roleKey } from '../utils/principal';
import { errorMessage } from '../utils/errors';
import { formatDateTime } from '../i18n/formatters';

function Row({ label, value, copy }) {
  return (
    <div className="info-row">
      <div className="info-label">{label}</div>
      <div className="info-value">
        {value ?? '-'}
        {copy && value && <CopyButton value={String(copy === true ? value : copy)} />}
      </div>
    </div>
  );
}

/** Endpoints, version, feature flags, and the authenticated principal. */
export default function ServerInfoView() {
  const { t, i18n } = useTranslation();
  const { apiClient, serverUrl, principal } = useAuth();
  const [info, setInfo] = useState(null);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    if (!apiClient) return;
    apiClient.getServerInfo().then(setInfo).catch(setError);
    apiClient.healthCheck().then(setHealth).catch(() => setHealth(null));
  }, [apiClient]);
  useEffect(load, [load]);

  const restUrl = info?.restUrl || info?.publicBaseUrl || serverUrl;
  const mcpUrl = info?.mcpUrl || info?.mcpPublicUrl || null;
  const a2aUrl = info?.a2aUrl || (restUrl ? `${restUrl.replace(/\/$/, '')}/v1.0/a2a/${principal?.tenantId || ''}` : null);
  const flags = info?.featureFlags || info?.features || null;

  return (
    <div>
      <PageHeader title={t('views.serverInfo.title')} subtitle={t('views.serverInfo.subtitle')} />
      {error && <ErrorBanner message={errorMessage(t, error)} onRetry={load} />}
      {!info && !error && <LoadingState />}
      <div className="info-grid">
        <section className="panel">
          <h2 className="section-title">{t('views.serverInfo.endpoints')}</h2>
          <Row label={t('views.serverInfo.rest')} value={<code>{restUrl}</code>} copy={restUrl} />
          <Row label={t('views.serverInfo.mcp')} value={mcpUrl ? <code>{mcpUrl}</code> : null} copy={mcpUrl} />
          <Row label={t('views.serverInfo.a2a')} value={a2aUrl ? <code>{a2aUrl}</code> : null} copy={a2aUrl} />
          <Row label={t('views.serverInfo.openapi')} value={<code>{`${serverUrl}/openapi.json`}</code>} copy={`${serverUrl}/openapi.json`} />
        </section>
        <section className="panel">
          <h2 className="section-title">{t('views.serverInfo.server')}</h2>
          <Row label={t('views.serverInfo.version')} value={info?.version || health?.version} />
          <Row label={t('views.serverInfo.dashboardVersion')} value={APP_VERSION} />
          <Row label={t('views.serverInfo.node')} value={info?.nodeId || health?.node} />
          <Row label={t('views.serverInfo.database')} value={info?.databaseType} />
          <Row label={t('views.serverInfo.health')} value={health ? <Badge tone={health.status === 'healthy' ? 'success' : 'warning'}>{health.status}</Badge> : <Badge tone="danger">{t('topbar.health.unhealthy')}</Badge>} />
          <Row label={t('views.serverInfo.replicas')} value={info?.expectedReplicas ?? info?.replicas} />
          <Row label={t('views.serverInfo.routes')} value={info?.operationScopeCount ?? info?.routeCount} />
          <Row label={t('views.serverInfo.serverTime')} value={health?.utc ? formatDateTime(health.utc, i18n.language, { dateStyle: 'medium', timeStyle: 'medium' }) : null} />
        </section>
        <section className="panel">
          <h2 className="section-title">{t('views.serverInfo.principal')}</h2>
          <Row label={t('views.serverInfo.principalName')} value={principal?.principalName} />
          <Row label={t('views.serverInfo.principalType')} value={principal?.principalType} />
          <Row label={t('views.serverInfo.role')} value={t(roleKey(principal))} />
          <Row label={t('views.serverInfo.tenant')} value={principal?.tenantId ? <code>{principal.tenantId}</code> : null} copy={principal?.tenantId} />
          <Row label={t('views.serverInfo.expires')} value={principal?.expiresUtc ? formatDateTime(principal.expiresUtc, i18n.language) : null} />
        </section>
        {flags && (
          <section className="panel">
            <h2 className="section-title">{t('views.serverInfo.features')}</h2>
            <CodeBlock value={flags} prettyJson />
          </section>
        )}
      </div>
      {info && (
        <details className="panel details-section">
          <summary>{t('common.actions.viewJson')}</summary>
          <CodeBlock value={info} prettyJson />
        </details>
      )}
    </div>
  );
}
