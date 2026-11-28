import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import KpiCard from '../components/KpiCard';
import LocalTableFrame from '../components/LocalTableFrame';
import { ErrorBanner, EmptyState, LoadingState } from '../components/States';
import AutoRefreshSelect from '../components/AutoRefreshSelect';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { pathFor } from '../config/navConfig';
import { errorMessage } from '../utils/errors';
import { formatNumber } from '../i18n/formatters';
import Explainer from '../components/Explainer';
import { BlockedBadge, BlockedRunsBanner, blockedReasonOf } from '../components/BlockedRun';
import { enumLabel } from '../utils/enums';

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

/**
 * The server returns GET /queue/summary as an array of rows ({ agentName, harnessType, queued, leased,
 * running }), one per agent and harness. Totals are summed from the rows. An object shape with totals
 * and `groups` is accepted too.
 */
function normalizeSummary(s) {
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const rows = Array.isArray(s) ? s : s?.groups || s?.byAgent || [];
  const groups = rows.map((r) => ({ ...r, queued: num(r.queued), leased: num(r.leased), running: num(r.running) }));
  const total = (k) => groups.reduce((acc, r) => acc + r[k], 0);
  if (Array.isArray(s)) return { queued: total('queued'), leased: total('leased'), running: total('running'), groups };
  return { queued: num(s?.queued ?? total('queued')), leased: num(s?.leased ?? total('leased')), running: num(s?.running ?? total('running')), groups };
}

/**
 * Blocked queued runs (G-15) grouped like the summary rows: { 'agent|harness': { count, reasons: { reason: n } } }.
 */
export function summarizeBlocked(runs) {
  const out = {};
  for (const r of runs || []) {
    const reason = blockedReasonOf(r);
    if (!reason) continue;
    const key = `${r.agentName}|${r.harnessType}`;
    out[key] = out[key] || { count: 0, reasons: {} };
    out[key].count += 1;
    out[key].reasons[reason] = (out[key].reasons[reason] || 0) + 1;
  }
  return out;
}

/** Scheduling pressure: queued, leased, and running work grouped by agent and harness. */
export default function QueueView() {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [blocked, setBlocked] = useState({});
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(5);

  const load = useCallback(async () => {
    if (!apiClient) return;
    apiClient
      .listRuns(tenantId, { pageNumber: 1, pageSize: 1000, status: 'Queued' })
      .then((r) => setBlocked(summarizeBlocked(r.items)))
      .catch(() => setBlocked({}));
    try {
      const s = await apiClient.getQueueSummary(tenantId);
      setSummary(normalizeSummary(s));
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
      <Explainer topic="queue" />
      {error && <ErrorBanner message={errorMessage(t, error)} onRetry={load} />}
      {!summary && !error && <LoadingState />}
      <BlockedRunsBanner count={Object.values(blocked).reduce((n, b) => n + b.count, 0)} />
      {summary && (
        <>
          <div className="kpi-grid">
            <KpiCard label={t('views.queue.queued')} tip={t('tips.views.queue.queued')} value={formatNumber(summary.queued)} onClick={() => navigate(pathFor('runs', null, { status: 'Queued' }))} />
            <KpiCard label={t('views.queue.leased')} tip={t('tips.views.queue.leased')} value={formatNumber(summary.leased)} onClick={() => navigate(pathFor('runs', null, { status: 'Leased' }))} />
            <KpiCard label={t('views.queue.running')} tip={t('tips.views.queue.running')} value={formatNumber(summary.running)} onClick={() => navigate(pathFor('runs', null, { status: 'Running' }))} />
          </div>
          {summary.groups.length === 0 ? (
            <div className="table-frame">
              <EmptyState title={t('views.queue.emptyTitle')} body={t('views.queue.emptyBody')} />
            </div>
          ) : (
            <LocalTableFrame
              tableId="queue-summary"
              testId="queue-summary"
              items={summary.groups}
              rowId={(g) => `${g.agentName}-${g.harnessType}`}
              onRefresh={load}
              columns={[
                { key: 'agentName', label: t('resources.runs.columns.agentName'), tip: t('tips.views.queue.agent'), pinned: true, sortable: true, render: (g) => <strong>{g.agentName}</strong> },
                { key: 'harnessType', label: t('resources.runs.columns.harnessType'), tip: t('tips.views.queue.harness'), sortable: true, csv: (g) => g.harnessType, render: (g) => enumLabel(t, 'harnessType', g.harnessType) },
                { key: 'queued', label: t('views.queue.queued'), tip: t('tips.views.queue.queued'), headerClass: 'right', cellClass: 'right', sortable: true, render: (g) => formatNumber(g.queued) },
                {
                  key: 'blocked',
                  label: t('components.blocked.queueColumn'),
                  tip: t('tips.blocked.queueColumn'),
                  csv: (g) => blocked[`${g.agentName}|${g.harnessType}`]?.count ?? 0,
                  render: (g) => (
                    <span data-cell="blocked">
                      {Object.entries(blocked[`${g.agentName}|${g.harnessType}`]?.reasons || {}).map(([reason, n]) => (
                        <span key={reason} className="inline-meta">
                          <BlockedBadge reason={reason} t={t} /> <span className="text-muted">{t('components.blocked.queueCount', { count: n })}</span>
                        </span>
                      ))}
                      {!blocked[`${g.agentName}|${g.harnessType}`] && '-'}
                    </span>
                  )
                },
                { key: 'leased', label: t('views.queue.leased'), tip: t('tips.views.queue.leased'), headerClass: 'right', cellClass: 'right', sortable: true, render: (g) => formatNumber(g.leased) },
                { key: 'running', label: t('views.queue.running'), tip: t('tips.views.queue.running'), headerClass: 'right', cellClass: 'right', sortable: true, render: (g) => formatNumber(g.running) }
              ]}
            />
          )}
        </>
      )}
    </div>
  );
}
