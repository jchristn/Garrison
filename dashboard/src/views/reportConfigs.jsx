// ResourceView configuration for reports (AA5.10, Autonomy > Reports): what runs and people filed upward, with health,
// kind, author, and period. Re-exported by resourceConfigs.jsx so the configuration-wide tests (tooltips, i18n keys,
// enum labels) cover it.

import CopyableId from '../components/CopyableId';
import { agentSelectLabel } from '../utils/agentLabel';
import FileReportModal from '../components/FileReportModal';
import { ReportHealthBadge, ReportIssueSeverityBadge } from '../components/ReportBadges';
import { tip } from '../components/Tooltip';
import { ENUMS } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { formatDateTime, formatNumber, formatRelativeTime, truncate } from '../i18n/formatters';
import { copyToClipboard } from '../utils/clipboard';
import { loadCallerPermissions } from '../utils/apps';
import { resourceTip } from '../utils/tips';
import { enumLabel } from '../utils/enums';
import { REPORTS_CHANGED_EVENT, authorText, filedByText, issueCounts, periodText, reportDenied } from '../utils/reports';
import { PlusIcon } from '../components/Icons';

const ID = 'reports';

function col(t, key, render, extra = {}) {
  return { key, label: t(`resources.${ID}.columns.${key}`), tip: resourceTip(t, ID, key), render, ...extra };
}

const safeList = (promise) => promise.then((r) => r.items || []).catch(() => []);
const when = (value, lng) => (value ? <span {...tip(formatDateTime(value, lng))}>{formatRelativeTime(value, lng)}</span> : '-');

/** Open the File report dialog from the list header; the list reloads once it is filed. */
export function openFile(ctx) {
  const close = () => ctx.setExtraModal(null);
  ctx.setExtraModal(
    <FileReportModal
      onClose={close}
      onDone={() => {
        close();
        ctx.reload?.();
      }}
    />
  );
}

/** Copy a report's ID and say whether the browser allowed it. */
async function copyId(ctx, id) {
  const ok = await copyToClipboard(id);
  ctx.addToast?.({ type: ok ? 'success' : 'error', message: ctx.t(ok ? 'reports.toasts.copied' : 'tips.copy.failed') });
}

/**
 * Reports (AA5.10): newest first (the server orders them). Author, kind, health, app, and the filing time window are
 * server filters, as is search over title and body. Rows open the report's page. Reports are immutable, so there is no
 * edit or delete; File report in the header needs Create on Report and stays visible but disabled with the reason
 * without it. Titles are data an agent wrote and render as plain text.
 */
export const reportsConfig = {
  id: ID,
  explainer: 'reports',
  autoRefresh: 30,
  search: true,
  urlFilters: ['author', 'kind', 'health', 'app', 'from', 'to', 'runId', 'unit'],
  lookupsEvents: [REPORTS_CHANGED_EVENT],
  api: {
    list: (c, tenant, p) => c.listReports(tenant, p),
    create: null,
    update: null,
    remove: null
  },
  detailPath: (r) => pathFor('reports', r.id),
  filters: [
    {
      name: 'author',
      label: (t) => t('reports.filters.author'),
      tip: (t) => t('tips.filters.author'),
      options: (lookups, filters) => [...new Set([...Object.keys(lookups?.agents || {}), ...(filters?.author ? [filters.author] : [])])],
      optionLabel: (o, _t, lookups) => lookups?.agents?.[o] || o
    },
    { name: 'kind', label: (t) => t(`resources.${ID}.columns.kind`), tip: (t) => t('tips.reports.filters.kind'), options: ENUMS.reportKind, enumGroup: 'reportKind' },
    { name: 'health', label: (t) => t(`resources.${ID}.columns.health`), tip: (t) => t('tips.filters.health'), options: ENUMS.reportHealth, enumGroup: 'reportHealth' },
    {
      name: 'app',
      label: (t) => t('reports.filters.app'),
      tip: (t) => t('tips.filters.app'),
      options: (lookups, filters) => [...new Set([...Object.keys(lookups?.apps || {}), ...(filters?.app ? [filters.app] : [])])],
      optionLabel: (o, _t, lookups) => lookups?.apps?.[o] || o
    },
    { name: 'from', type: 'datetime', label: (t) => t('reports.filters.from'), tip: (t) => t('tips.filters.from') },
    { name: 'to', type: 'datetime', label: (t) => t('reports.filters.to'), tip: (t) => t('tips.filters.to') }
  ],
  // Agent and app names for the filters and columns, and the caller's permissions for File report.
  loadLookups: async ({ apiClient, tenantId, principal }) => {
    const [agents, apps, permissions] = await Promise.all([
      safeList(apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 1000 })),
      apiClient.listApps ? safeList(apiClient.listApps(tenantId, { pageNumber: 1, pageSize: 1000 })) : Promise.resolve([]),
      loadCallerPermissions(apiClient, tenantId, principal)
    ]);
    return {
      agents: Object.fromEntries(agents.map((a) => [a.id, agentSelectLabel(a)])),
      apps: Object.fromEntries(apps.map((a) => [a.id, a.displayName || a.name])),
      permissions
    };
  },
  canDuplicate: false,
  bulkDelete: false,
  isEditable: () => false,
  canDelete: () => false,
  columns: ({ t, i18n, lookups }) => {
    const lng = i18n.language;
    const agents = lookups?.agents || {};
    const apps = lookups?.apps || {};
    const app = (r) => r.appName || (r.appId && apps[r.appId]) || r.appId || '';
    return [
      col(t, 'createdUtc', (r) => when(r.createdUtc, lng), { sortable: true, pinned: true, cellClass: 'nowrap', csv: (r) => r.createdUtc || '' }),
      col(t, 'title', (r) => <span className="report-title-cell" {...tip(r.title)}>{truncate(r.title || '', 90)}</span>, { csv: (r) => r.title || '' }),
      col(t, 'author', (r) => (authorText(r, agents) ? <strong>{authorText(r, agents)}</strong> : '-'), { csv: (r) => authorText(r, agents) }),
      col(t, 'kind', (r) => enumLabel(t, 'reportKind', r.kind), { csv: (r) => r.kind || '' }),
      col(t, 'health', (r) => <ReportHealthBadge health={r.health} t={t} />, { csv: (r) => r.health || '' }),
      col(t, 'app', (r) => app(r) || '-', { csv: (r) => app(r) }),
      col(t, 'period', (r) => periodText(t, r, lng, { dateStyle: 'short', timeStyle: 'short' }) || '-', { cellClass: 'nowrap', csv: (r) => [r.periodStartUtc || '', r.periodEndUtc || ''].join(' ').trim() }),
      col(
        t,
        'issues',
        (r) => {
          const counts = issueCounts(r);
          if (!counts.length) return '-';
          return (
            <span className="inline-meta">
              {counts.map((c) => (
                <span key={c.severity} className="inline-meta">
                  <ReportIssueSeverityBadge severity={c.severity} t={t} /> {formatNumber(c.count, {}, lng)}
                </span>
              ))}
            </span>
          );
        },
        { defaultHidden: true, csv: (r) => String((r.issues || []).length) }
      ),
      col(t, 'audience', (r) => enumLabel(t, 'reportAudience', r.audience), { defaultHidden: true, csv: (r) => r.audience || '' }),
      col(t, 'filedBy', (r) => filedByText(t, r) || '-', { defaultHidden: true, csv: (r) => filedByText(t, r) }),
      col(t, 'runId', (r) => (r.runId ? <CopyableId value={r.runId} /> : '-'), { cellClass: 'cell-id', defaultHidden: true }),
      col(t, 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true })
    ];
  },
  fields: () => [],
  headerActions: (ctx) => {
    const denied = reportDenied(ctx.t, ctx.lookups?.permissions, 'Create');
    return (
      <button type="button" className="button-primary" aria-disabled={denied ? 'true' : undefined} onClick={() => !denied && openFile(ctx)} data-testid="reports-file" {...tip(denied || ctx.t('tips.reports.actions.file'))}>
        <PlusIcon /> {ctx.t('reports.actions.file')}
      </button>
    );
  },
  rowActions: (r, ctx) => [
    { label: ctx.t('reports.actions.copyId'), tip: ctx.t('tips.reports.actions.copyId'), onClick: () => copyId(ctx, r.id) },
    { label: ctx.t('reports.actions.openRun'), tip: ctx.t('tips.reports.actions.openRun'), hidden: !r.runId, onClick: () => ctx.navigate(pathFor('runs', r.runId)) },
    { label: ctx.t('reports.actions.openKeeper'), tip: ctx.t('tips.reports.actions.openKeeper'), hidden: !r.mandateId, onClick: () => ctx.navigate(pathFor('keepers', r.mandateId)) },
    { label: ctx.t('reports.actions.openAuthor'), tip: ctx.t('tips.reports.actions.openAuthor'), hidden: !r.authorAgentId, onClick: () => ctx.navigate(pathFor('agents', r.authorAgentId)) }
  ]
};
