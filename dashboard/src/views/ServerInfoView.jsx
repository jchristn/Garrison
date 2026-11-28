import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import CopyButton from '../components/CopyButton';
import CodeBlock from '../components/CodeBlock';
import { ErrorBanner, LoadingState } from '../components/States';
import { Badge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { APP_VERSION, DOCS_URL, GITHUB_URL, STUDIO_DOCS_URL, WEBSITE_URL } from '../utils/constants';
import { roleKey } from '../utils/principal';
import { errorMessage } from '../utils/errors';
import { formatDateTime } from '../i18n/formatters';
import { enumLabel } from '../utils/enums';
import { tip } from '../components/Tooltip';
import { pathFor } from '../config/navConfig';

function Row({ label, value, copy, tip: tipText, stacked = false }) {
  return (
    <div className={stacked ? 'info-row info-row-stacked' : 'info-row'}>
      <div className="info-label" {...tip(tipText)}>
        {label}
      </div>
      <div className="info-value">
        {value ?? '-'}
        {copy && value && <CopyButton value={String(copy === true ? value : copy)} tipText={tipText} />}
      </div>
    </div>
  );
}

/** One endpoint URL: on one line, cut with an ellipsis when narrow, the whole value in its tooltip (UXP1-V021). */
function Url({ value, testId }) {
  return (
    <code className="info-url" data-testid={testId} {...tip(value)}>
      {value}
    </code>
  );
}

/** Feature flags as the server reports them: a list of names, or names mapped to on and off. */
function flagEntries(flags) {
  if (Array.isArray(flags)) return flags.every((f) => typeof f === 'string') ? flags.map((name) => ({ name, on: true })) : null;
  if (flags && typeof flags === 'object') {
    const entries = Object.entries(flags);
    return entries.every(([, v]) => typeof v === 'boolean') ? entries.map(([name, on]) => ({ name, on })) : null;
  }
  return null;
}

/**
 * System > About (AD12.12): the product (Garrison Agent Studio, its positioning, the server and dashboard versions, and
 * links to the documentation and the website), then the endpoints, server details, feature flags, and the signed-in
 * principal.
 */
export default function ServerInfoView() {
  const { t, i18n } = useTranslation();
  const { apiClient, serverUrl, principal } = useAuth();
  const navigate = useNavigate();
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
  const flagList = flagEntries(flags);
  const openApiUrl = info?.openApiUrl || `${serverUrl}/openapi.json`;

  return (
    <div className="page-flow">
      <PageHeader title={t('views.serverInfo.title')} subtitle={t('views.serverInfo.subtitle')} />
      {error && <ErrorBanner message={errorMessage(t, error)} onRetry={load} />}
      {!info && !error && <LoadingState />}
      <section className="panel about-panel" data-testid="about">
        <img src="/assets/logo.png" alt="" />
        <div>
          <h2 className="section-title" data-testid="about-product" {...tip(t('tips.views.serverInfo.product'))}>
            {t('common.productName')}
          </h2>
          <p className="about-positioning" data-testid="about-positioning">
            {t('views.serverInfo.positioning')}
          </p>
          <p className="text-muted" data-testid="about-versions">
            {t('views.serverInfo.versions', { server: info?.version || health?.version || '-', dashboard: APP_VERSION })}
          </p>
          <div className="about-links">
            <a href={DOCS_URL} target="_blank" rel="noopener noreferrer" className="button-secondary button-sm" data-testid="about-docs" {...tip(t('tips.views.serverInfo.docs'))}>
              {t('views.serverInfo.docs')}
            </a>
            <a href={STUDIO_DOCS_URL} target="_blank" rel="noopener noreferrer" className="button-secondary button-sm" data-testid="about-studio-docs" {...tip(t('tips.views.serverInfo.studioDocs'))}>
              {t('views.serverInfo.studioDocs')}
            </a>
            <a href={WEBSITE_URL} target="_blank" rel="noopener noreferrer" className="button-secondary button-sm" data-testid="about-website" {...tip(t('tips.views.serverInfo.website'))}>
              {t('views.serverInfo.website')}
            </a>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="button-secondary button-sm" data-testid="about-source" {...tip(t('tips.views.serverInfo.source'))}>
              {t('views.serverInfo.source')}
            </a>
          </div>
        </div>
      </section>
      <div className="info-grid">
        <section className="panel info-grid-wide" data-testid="server-info-endpoints">
          <h2 className="section-title">{t('views.serverInfo.endpoints')}</h2>
          <Row stacked label={t('views.serverInfo.serverInUse')} tip={t('tips.views.serverInfo.serverInUse')} value={serverUrl ? <Url value={serverUrl} testId="about-server-in-use" /> : null} copy={serverUrl} />
          <Row stacked label={t('views.serverInfo.rest')} tip={t('tips.views.serverInfo.rest')} value={restUrl ? <Url value={restUrl} /> : null} copy={restUrl} />
          <Row stacked label={t('views.serverInfo.mcp')} tip={t('tips.views.serverInfo.mcp')} value={mcpUrl ? <Url value={mcpUrl} /> : null} copy={mcpUrl} />
          <Row stacked label={t('views.serverInfo.a2a')} tip={t('tips.views.serverInfo.a2a')} value={a2aUrl ? <Url value={a2aUrl} /> : null} copy={a2aUrl} />
          <Row stacked label={t('views.serverInfo.openapi')} tip={t('tips.views.serverInfo.openapi')} value={<Url value={openApiUrl} />} copy={openApiUrl} />
        </section>
        <section className="panel">
          <h2 className="section-title">{t('views.serverInfo.server')}</h2>
          <Row label={t('views.serverInfo.version')} tip={t('tips.views.serverInfo.version')} value={info?.version || health?.version} />
          <Row label={t('views.serverInfo.dashboardVersion')} tip={t('tips.views.serverInfo.dashboardVersion')} value={APP_VERSION} />
          <Row
            label={t('views.serverInfo.node')}
            tip={t('tips.views.serverInfo.node')}
            value={
              info?.nodeId || health?.node ? (
                <a href={pathFor('controlNodes')} data-testid="server-info-node" {...tip(t('tips.views.serverInfo.nodeLink'))} onClick={(e) => { e.preventDefault(); navigate(pathFor('controlNodes')); }}>
                  {info?.nodeId || health?.node}
                </a>
              ) : null
            }
          />
          <Row label={t('views.serverInfo.database')} tip={t('tips.views.serverInfo.database')} value={info?.databaseType} />
          <Row label={t('views.serverInfo.health')} tip={t('tips.views.serverInfo.health')} value={health ? <Badge tone={health.status === 'healthy' ? 'success' : 'warning'} tip={t(health.status === 'healthy' ? 'tips.topbar.health.healthy' : 'tips.topbar.health.unhealthy')}>{t(health.status === 'healthy' ? 'topbar.health.healthy' : 'topbar.health.unhealthy')}</Badge> : <Badge tone="danger">{t('topbar.health.unhealthy')}</Badge>} />
          <Row label={t('views.serverInfo.replicas')} tip={t('tips.views.serverInfo.replicas')} value={info?.expectedReplicas ?? info?.replicas} />
          <Row label={t('views.serverInfo.routes')} tip={t('tips.views.serverInfo.routes')} value={info?.operationScopeCount ?? info?.routeCount} />
          <Row label={t('views.serverInfo.serverTime')} tip={t('tips.views.serverInfo.serverTime')} value={health?.utc ? formatDateTime(health.utc, i18n.language, { dateStyle: 'medium', timeStyle: 'medium' }) : null} />
        </section>
        <section className="panel">
          <h2 className="section-title">{t('views.serverInfo.principal')}</h2>
          <Row label={t('views.serverInfo.principalName')} tip={t('tips.views.serverInfo.principalName')} value={principal?.principalName} />
          <Row label={t('views.serverInfo.principalType')} tip={t('tips.views.serverInfo.principalType')} value={principal?.principalType ? enumLabel(t, 'principalType', principal.principalType) : null} />
          <Row label={t('views.serverInfo.role')} tip={t('tips.views.serverInfo.role')} value={t(roleKey(principal))} />
          <Row label={t('views.serverInfo.tenant')} tip={t('tips.views.serverInfo.tenant')} value={principal?.tenantId ? <code>{principal.tenantId}</code> : null} copy={principal?.tenantId} />
          <Row label={t('views.serverInfo.expires')} tip={t('tips.views.serverInfo.expires')} value={principal?.expiresUtc ? formatDateTime(principal.expiresUtc, i18n.language) : null} />
        </section>
        {flags && (
          <section className="panel">
            <h2 className="section-title">{t('views.serverInfo.features')}</h2>
            {flagList ? (
              flagList.length === 0 ? (
                <p className="text-muted" {...tip(t('tips.views.serverInfo.noFeatures'))}>{t('views.serverInfo.noFeatures')}</p>
              ) : (
                <div className="feature-flags" data-testid="server-info-flags">
                  {flagList.map((f) => (
                    <Badge key={f.name} tone={f.on ? 'success' : 'neutral'} tip={t(f.on ? 'tips.views.serverInfo.flagOn' : 'tips.views.serverInfo.flagOff', { name: f.name })}>
                      {f.name}
                    </Badge>
                  ))}
                </div>
              )
            ) : (
              <CodeBlock value={flags} prettyJson />
            )}
          </section>
        )}
      </div>
      {info && (
        <details className="panel details-section">
          <summary {...tip(t('tips.views.serverInfo.rawJson'))}>{t('common.actions.viewJson')}</summary>
          <CodeBlock value={info} prettyJson />
        </details>
      )}
    </div>
  );
}
