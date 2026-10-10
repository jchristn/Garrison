import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import { ErrorBanner, EmptyState, LoadingState } from '../components/States';
import AutoRefreshSelect from '../components/AutoRefreshSelect';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { pathFor } from '../utils/routes';
import { errorMessage } from '../utils/errors';
import { formatNumber } from '../i18n/formatters';

/** Derive queue counts from a page of active runs when the summary endpoint is unavailable. */
function summarizeRuns(runs) {
  const groups = {};
  const totals = { queued: 0, leased: 0, running: 0 };
  for (const r of runs) {
    const key = `${r.agentName}|${r.harnessType}`;
    groups[key] = groups[key] || { agentName: r.agentName, harnessType: r.harnessType, queued: 0, leased: 0, running: 0 };
    const k = r.status === 'Queued' ? 'queued' : r.status === 'Leased' ? 'leased' : r.status === 'Running' ? 'running' : null;
    if (k) {
      groups[key][k] += 1;
      totals[k] += 1;
    }
  }
  return { ...totals, groups: Object.values(groups) };
}

/** Scheduling pressure: queued, leased, and running work grouped by agent and harness. */
export default function QueueView() {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(5);

  const load = useCallback(async () => {
    if (!apiClient) return;
    try {
      const s = await apiClient.getQueueSummary(tenantId);
      setSummary({ queued: s.queued ?? 0, leased: s.leased ?? 0, running: s.running ?? 0, groups: s.groups || s.byAgent || [] });
      setError(null);
    } catch (e) {
      try {
        const r = await apiClient.listRuns(tenantId, { pageNumber: 1, pageSize: 1000, activeOnly: true });
        setSummary(summarizeRuns((r.items || []).filter((x) => ['Queued', 'Leased', 'Running'].includes(x.status))));
        setError(null);
      } catch {
        setError(e);
      }
    }
  }, [apiClient, tenantId]);

  useEffect(() => {
    load();
  }, [load]);
  useAutoRefresh(load, refresh);

  return (
    <div>
      <PageHeader title={t('views.queue.title')} subtitle={t('views.queue.subtitle')} actions={<AutoRefreshSelect value={refresh} onChange={setRefresh} />} />
      {error && <ErrorBanner message={errorMessage(t, error)} onRetry={load} />}
      {!summary && !error && <LoadingState />}
      {summary && (
        <>
          <div className="kpi-grid">
            <KpiCard label={t('views.queue.queued')} value={formatNumber(summary.queued)} onClick={() => navigate(`${pathFor('runs')}?status=Queued`)} />
            <KpiCard label={t('views.queue.leased')} value={formatNumber(summary.leased)} onClick={() => navigate(`${pathFor('runs')}?status=Leased`)} />
            <KpiCard label={t('views.queue.running')} value={formatNumber(summary.running)} onClick={() => navigate(`${pathFor('runs')}?status=Running`)} />
          </div>
          {summary.groups.length === 0 ? (
            <div className="table-frame">
              <EmptyState title={t('views.queue.emptyTitle')} body={t('views.queue.emptyBody')} />
            </div>
          ) : (
            <div className="table-frame">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">{t('resources.runs.columns.agentName')}</th>
                      <th scope="col">{t('resources.runs.columns.harnessType')}</th>
                      <th scope="col" className="right">
                        {t('views.queue.queued')}
                      </th>
                      <th scope="col" className="right">
                        {t('views.queue.leased')}
                      </th>
                      <th scope="col" className="right">
                        {t('views.queue.running')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.groups.map((g) => (
                      <tr key={`${g.agentName}-${g.harnessType}`}>
                        <td>
                          <strong>{g.agentName}</strong>
                        </td>
                        <td>{g.harnessType}</td>
                        <td className="right">{formatNumber(g.queued)}</td>
                        <td className="right">{formatNumber(g.leased)}</td>
                        <td className="right">{formatNumber(g.running)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
