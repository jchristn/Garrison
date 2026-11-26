import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import CopyableId from '../components/CopyableId';
import ConfirmModal from '../components/ConfirmModal';
import JsonViewerModal from '../components/JsonViewerModal';
import Explainer from '../components/Explainer';
import Modal from '../components/Modal';
import Tabs from '../components/Tabs';
import FormFields from '../components/FormFields';
import OrgChartTree from '../components/OrgChartTree';
import OrgUnitModal from '../components/OrgUnitModal';
import OrgRevisionDiff from '../components/OrgRevisionDiff';
import OrgProposalsPanel from '../components/OrgProposalsPanel';
import { OrganizationStatusBadge, OrgRevisionStateBadge, SpendBar } from '../components/OrganizationBadges';
import { Badge } from '../components/StatusBadge';
import { LoadingState, ErrorBanner, EmptyState } from '../components/States';
import { CodeIcon, PlusIcon, TrashIcon } from '../components/Icons';
import { tip } from '../components/Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import useCallerPermissions from '../hooks/useCallerPermissions';
import { ORGANIZATION_LIMITS } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { formatCurrency, formatDateTime, formatNumber, formatRelativeTime } from '../i18n/formatters';
import { upsertProposal } from '../utils/changeRules';
import { budgetOf, chartToUnits, diffIsEmpty, diffOrgUnits, orgDenied, orgErrorMessage, organizationFormErrors, organizationFormToBody, organizationToForm, spendOf, statusBody, treeOrder } from '../utils/organizations';

const safeItems = (promise) => promise.then((r) => (Array.isArray(r) ? r : r?.items || [])).catch(() => []);
const asList = (r) => (Array.isArray(r) ? r : r?.items || r?.objects || []);

function Detail({ label, tipText, children, testId }) {
  return (
    <div className="detail-item" data-testid={testId}>
      <div className="detail-item-label" {...tip(tipText)}>
        {label}
      </div>
      <div className="detail-item-value">{children ?? '-'}</div>
    </div>
  );
}

/**
 * Live updates for one organization over the WebSocket channel organization:{id} (AA7.12): org.changed when the
 * organization or its tree changes (deleted: true when it is gone), report.filed for reports its members file, and
 * spend.updated with the unit spend rows, and proposal.changed when an executive's proposal changes (AA8.10). Returns
 * whether the channel is subscribed.
 */
function useOrganizationChannel(apiClient, organizationId, onEvent) {
  const [live, setLive] = useState(false);
  const handler = useRef(onEvent);
  useEffect(() => {
    handler.current = onEvent;
  }, [onEvent]);
  useEffect(() => {
    if (!apiClient || !organizationId || typeof WebSocket === 'undefined' || typeof apiClient.webSocketUrl !== 'function') return undefined;
    const channel = `organization:${organizationId}`;
    let ws;
    try {
      ws = new WebSocket(apiClient.webSocketUrl());
      ws.onopen = () => {
        try {
          ws.send(JSON.stringify({ type: 'subscribe', channel }));
        } catch {
          /* ignore */
        }
      };
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message?.type === 'subscribed' && message.channel === channel) setLive(true);
          else if (message?.type === 'error' && message.channel === channel) setLive(false);
          else if (message?.type === 'org.changed' || message?.type === 'report.filed' || message?.type === 'spend.updated' || message?.type === 'proposal.changed') handler.current?.(message);
        } catch {
          /* not JSON */
        }
      };
      ws.onclose = () => setLive(false);
      ws.onerror = () => setLive(false);
    } catch {
      setLive(false);
    }
    return () => ws?.close();
  }, [apiClient, organizationId]);
  return live;
}

/**
 * One organization (AA7.14): its summary, the chart of units (the working tree people edit, or the live revision) with
 * leads, members, titles, peer lines, health from each unit's latest report, and spend bars; the unit editor (add,
 * edit, remove); budgets with spend against them; and revisions with a diff against the live one, publish, and
 * rollback. Proposals its executives made (AA8.12), with the rules that applied them or Approve and Deny for those that
 * wait. Retire, reactivate, and delete. Updates over the organization channel.
 */
export default function OrganizationDetailView({ recordId }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const lng = i18n.language;
  const permissions = useCallerPermissions();
  const [org, setOrg] = useState(null);
  const [error, setError] = useState(null);
  const [chart, setChart] = useState(null);
  const [liveUnits, setLiveUnits] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [spend, setSpend] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [health, setHealth] = useState({});
  const [options, setOptions] = useState({ agents: [], mandates: [], apps: [] });
  const [tab, setTab] = useState('chart');
  const [view, setView] = useState('working');
  const [unitEditor, setUnitEditor] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [confirmError, setConfirmError] = useState(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishNote, setPublishNote] = useState('');
  const [publishError, setPublishError] = useState('');
  const [diff, setDiff] = useState(null);
  const [details, setDetails] = useState(null);
  const [detailsErrors, setDetailsErrors] = useState({});
  const [detailsError, setDetailsError] = useState('');
  const [jsonOpen, setJsonOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const unmounted = useRef(false);

  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
    };
  }, []);

  const loadOrg = useCallback(() => {
    if (!apiClient || !recordId) return Promise.resolve();
    return apiClient
      .getOrganization(tenantId, recordId)
      .then((o) => {
        if (unmounted.current) return;
        setOrg(o);
        setError(null);
      })
      .catch((e) => !unmounted.current && setError(e));
  }, [apiClient, tenantId, recordId]);

  const loadChart = useCallback(() => {
    if (!apiClient || !recordId) return Promise.resolve();
    return apiClient
      .getOrgChart(tenantId, recordId)
      .then((c) => !unmounted.current && setChart(c))
      .catch(() => !unmounted.current && setChart(null));
  }, [apiClient, tenantId, recordId]);

  const loadRevisions = useCallback(() => {
    if (!apiClient || !recordId) return Promise.resolve();
    return apiClient
      .listOrgRevisions(tenantId, recordId)
      .then((r) => !unmounted.current && setRevisions(asList(r)))
      .catch(() => !unmounted.current && setRevisions([]));
  }, [apiClient, tenantId, recordId]);

  const loadSpend = useCallback(() => {
    if (!apiClient || !recordId) return Promise.resolve();
    return apiClient
      .getOrgSpend(tenantId, recordId)
      .then((s) => !unmounted.current && setSpend(asList(s)))
      .catch(() => !unmounted.current && setSpend([]));
  }, [apiClient, tenantId, recordId]);

  const loadProposals = useCallback(() => {
    if (!apiClient?.listOrgProposals || !recordId) return Promise.resolve();
    return apiClient
      .listOrgProposals(tenantId, recordId, { pageNumber: 1, pageSize: 200 })
      .then((r) => !unmounted.current && setProposals(asList(r)))
      .catch(() => !unmounted.current && setProposals([]));
  }, [apiClient, tenantId, recordId]);

  const reloadAll = useCallback(() => Promise.all([loadOrg(), loadChart(), loadRevisions(), loadSpend(), loadProposals()]), [loadOrg, loadChart, loadRevisions, loadSpend, loadProposals]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  // Agents, keepers (mandates), and apps for the unit editor and for naming what the chart shows.
  useEffect(() => {
    if (!apiClient) return undefined;
    let active = true;
    const page = { pageNumber: 1, pageSize: 1000 };
    Promise.all([
      apiClient.listAgents ? safeItems(apiClient.listAgents(tenantId, page)) : Promise.resolve([]),
      apiClient.listMandates ? safeItems(apiClient.listMandates(tenantId, page)) : Promise.resolve([]),
      apiClient.listApps ? safeItems(apiClient.listApps(tenantId, page)) : Promise.resolve([])
    ]).then(([agents, mandates, apps]) => active && setOptions({ agents, mandates, apps }));
    return () => {
      active = false;
    };
  }, [apiClient, tenantId]);

  const names = useMemo(
    () => ({
      agents: Object.fromEntries(options.agents.map((a) => [a.id, a.displayName || a.name])),
      mandates: Object.fromEntries(options.mandates.map((m) => [m.id, m.name])),
      apps: Object.fromEntries(options.apps.map((a) => [a.id, a.displayName || a.name]))
    }),
    [options]
  );

  // The live revision's snapshot, for the unpublished-changes banner and the revision diffs.
  const currentRevisionId = org?.currentRevisionId || null;
  useEffect(() => {
    if (!apiClient || !recordId) return undefined;
    if (!currentRevisionId) {
      setLiveUnits([]);
      return undefined;
    }
    let active = true;
    apiClient
      .getOrgRevision(tenantId, recordId, currentRevisionId)
      .then((r) => active && setLiveUnits(r?.units || []))
      .catch(() => active && setLiveUnits(null));
    return () => {
      active = false;
    };
  }, [apiClient, tenantId, recordId, currentRevisionId]);

  // Health: the latest report filed in each unit.
  const unitIds = (org?.units || []).map((u) => u.id).join(',');
  useEffect(() => {
    if (!apiClient?.listReports || !unitIds) return undefined;
    let active = true;
    const ids = unitIds.split(',');
    Promise.all(ids.map((id) => apiClient.listReports(tenantId, { unit: id, pageNumber: 1, pageSize: 1 }).then((p) => [id, (p.items || [])[0] || null]).catch(() => [id, null]))).then((pairs) => {
      if (active) setHealth(Object.fromEntries(pairs.filter(([, r]) => r)));
    });
    return () => {
      active = false;
    };
  }, [apiClient, tenantId, unitIds]);

  const onEvent = useCallback(
    (message) => {
      if (unmounted.current) return;
      if (message.type === 'org.changed') {
        if (message.deleted) {
          navigate(pathFor('organizations'));
          return;
        }
        loadOrg();
        loadChart();
        loadRevisions();
      } else if (message.type === 'report.filed') {
        const report = message.report;
        if (report?.orgUnitId) setHealth((prev) => ({ ...prev, [report.orgUnitId]: report }));
      } else if (message.type === 'spend.updated' && Array.isArray(message.spend)) {
        setSpend(message.spend);
      } else if (message.type === 'proposal.changed' && message.proposal) {
        setProposals((prev) => upsertProposal(prev, message.proposal));
        // An applied proposal is a new live revision.
        if (message.proposal.status === 'Applied') {
          loadOrg();
          loadChart();
          loadRevisions();
        }
      }
    },
    [loadOrg, loadChart, loadRevisions, navigate]
  );
  const live = useOrganizationChannel(apiClient, org?.id, onEvent);

  if (error && !org) {
    return (
      <div>
        <PageHeader title={t('views.organizationDetail.title')} />
        <ErrorBanner message={orgErrorMessage(t, error)} onRetry={loadOrg} />
        <EmptyState title={t('views.organizationDetail.notFoundTitle')} body={t('views.organizationDetail.notFoundBody')} />
      </div>
    );
  }
  if (!org) return <LoadingState />;

  const units = org.units || [];
  const retired = org.status === 'Retired';
  const updateDenied = orgDenied(t, permissions, 'Update');
  const deleteDenied = orgDenied(t, permissions, 'Delete');
  const editBlocked = updateDenied || (retired ? t('tips.organizations.retiredLocked') : '');
  const editable = !editBlocked;
  const published = !!org.currentRevisionId;
  const pending = liveUnits ? diffOrgUnits(liveUnits, units, names) : null;
  const hasPending = units.length > 0 && (!published || (pending && !diffIsEmpty(pending)));
  const liveChartUnits = chart && chart.source === 'Live' ? chartToUnits(chart) : null;
  const shownUnits = view === 'live' && liveChartUnits ? liveChartUnits : units;
  const when = (v) => (v ? <span {...tip(formatDateTime(v, lng))}>{formatRelativeTime(v, lng)}</span> : '-');
  const usd = (v) => (v == null ? '-' : formatCurrency(v, lng, 'USD'));

  const run = async (work, success) => {
    setBusy(true);
    try {
      await work();
      if (success) addToast({ type: 'success', message: success });
      await reloadAll();
      return true;
    } catch (e) {
      addToast({ type: 'error', message: orgErrorMessage(t, e) });
      return false;
    } finally {
      if (!unmounted.current) setBusy(false);
    }
  };

  const setStatus = (status) =>
    run(() => apiClient.updateOrganization(tenantId, org.id, statusBody(org, status)), t(status === 'Retired' ? 'organizations.toasts.retired' : 'organizations.toasts.reactivated', { name: org.name }));

  const confirmAction = async () => {
    setConfirmError(null);
    try {
      if (confirm.kind === 'removeUnit') {
        await apiClient.deleteOrgUnit(tenantId, org.id, confirm.unit.id);
        addToast({ type: 'success', message: t('organizations.toasts.unitRemoved', { name: confirm.unit.name }) });
      } else if (confirm.kind === 'rollback') {
        const result = await apiClient.rollbackOrganization(tenantId, org.id, { revisionId: confirm.revision.id, note: t('organizations.rollback.note', { number: confirm.revision.number }) });
        addToast({ type: 'success', message: t('organizations.toasts.rolledBack', { number: confirm.revision.number, live: result?.number ?? '' }) });
      } else if (confirm.kind === 'retire') {
        await apiClient.updateOrganization(tenantId, org.id, statusBody(org, 'Retired'));
        addToast({ type: 'success', message: t('organizations.toasts.retired', { name: org.name }) });
      } else if (confirm.kind === 'delete') {
        await apiClient.deleteOrganization(tenantId, org.id);
        addToast({ type: 'success', message: t('common.toasts.deleted') });
        setConfirm(null);
        navigate(pathFor('organizations'));
        return;
      }
      setConfirm(null);
      reloadAll();
    } catch (e) {
      setConfirmError(orgErrorMessage(t, e));
    }
  };

  // Snapshot the working tree as a Draft revision, and publish it unless only a draft was asked for.
  const submitPublish = async (publishNow) => {
    setBusy(true);
    setPublishError('');
    try {
      const revision = await apiClient.createOrgRevision(tenantId, org.id, publishNote.trim() || null);
      if (publishNow) {
        await apiClient.publishOrgRevision(tenantId, org.id, revision.id);
        addToast({ type: 'success', message: t('organizations.toasts.published', { number: revision.number }) });
      } else {
        addToast({ type: 'success', message: t('organizations.toasts.drafted', { number: revision.number }) });
      }
      setPublishOpen(false);
      setPublishNote('');
      reloadAll();
    } catch (e) {
      setPublishError(orgErrorMessage(t, e));
      loadRevisions();
    } finally {
      if (!unmounted.current) setBusy(false);
    }
  };

  const publishDraft = (revision) => run(() => apiClient.publishOrgRevision(tenantId, org.id, revision.id), t('organizations.toasts.published', { number: revision.number }));

  const compare = async (revision) => {
    try {
      const full = await apiClient.getOrgRevision(tenantId, org.id, revision.id);
      const liveLabel = published ? t('organizations.revisions.label', { number: org.currentRevisionNumber }) : t('organizations.diff.nothingLive');
      setDiff({
        title: t('organizations.diff.title', { number: revision.number }),
        note: revision.note || full?.note || '',
        before: liveLabel,
        after: t('organizations.revisions.label', { number: revision.number }),
        diff: diffOrgUnits(liveUnits || [], full?.units || [], names)
      });
    } catch (e) {
      addToast({ type: 'error', message: orgErrorMessage(t, e) });
    }
  };

  const reviewPending = () =>
    setDiff({
      title: t('organizations.diff.pendingTitle'),
      note: '',
      before: published ? t('organizations.revisions.label', { number: org.currentRevisionNumber }) : t('organizations.diff.nothingLive'),
      after: t('organizations.diff.working'),
      diff: diffOrgUnits(liveUnits || [], units, names)
    });

  const saveDetails = async () => {
    const found = organizationFormErrors(details, t);
    setDetailsErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setDetailsError('');
    try {
      await apiClient.updateOrganization(tenantId, org.id, organizationFormToBody(details));
      addToast({ type: 'success', message: t('common.toasts.saved') });
      setDetails(null);
      loadOrg();
    } catch (e) {
      setDetailsError(orgErrorMessage(t, e));
    } finally {
      if (!unmounted.current) setBusy(false);
    }
  };

  const actionButton = (key, labelText, tipText, onClick, { className = 'button-secondary', denied = '', icon = null } = {}) => (
    <button type="button" className={className} aria-disabled={denied || busy ? 'true' : undefined} onClick={() => !denied && !busy && onClick()} data-testid={`org-${key}`} {...tip(denied || tipText)}>
      {icon}
      {icon ? ' ' : ''}
      {labelText}
    </button>
  );

  const ordered = treeOrder(units);
  const budgetRows = ordered.filter(({ unit }) => (unit.budgets || []).length > 0 || spendOf(spend, unit.id).length > 0);
  const detailFields = [
    { name: 'name', type: 'text', required: true, label: t('resources.organizations.fields.name'), tip: t('tips.resources.organizations.name') },
    { name: 'description', type: 'textarea', rows: 2, label: t('resources.organizations.fields.description'), tip: t('tips.resources.organizations.description') },
    { name: 'mission', type: 'textarea', rows: 4, label: t('resources.organizations.fields.mission'), tip: t('tips.resources.organizations.mission') }
  ];

  return (
    <div data-testid="organization-detail">
      <PageHeader
        title={t('views.organizationDetail.heading', { name: org.name })}
        subtitle={
          <span className="inline-meta">
            <CopyableId value={org.id} max={40} /> <OrganizationStatusBadge status={org.status} t={t} />
            {published ? (
              <Badge tone="info" tip={t('tips.views.organizationDetail.revision')}>
                {t('organizations.revisions.label', { number: org.currentRevisionNumber })}
              </Badge>
            ) : (
              <Badge tone="neutral" tip={t('tips.views.organizationDetail.notPublished')}>
                {t('organizations.notPublished')}
              </Badge>
            )}
            {live && <Badge tone="info" tip={t('tips.views.organizationDetail.live')}>{t('views.organizationDetail.live')}</Badge>}
          </span>
        }
        actions={
          <>
            <button type="button" className="button-secondary" onClick={() => setJsonOpen(true)} {...tip(t('tips.views.organizationDetail.viewJson'))}>
              <CodeIcon /> {t('common.actions.viewJson')}
            </button>
            {actionButton('edit-details', t('views.organizationDetail.editDetails'), t('tips.views.organizationDetail.editDetails'), () => {
              setDetails(organizationToForm(org));
              setDetailsErrors({});
              setDetailsError('');
            }, { denied: updateDenied })}
            {retired
              ? actionButton('reactivate', t('views.organizationDetail.reactivate'), t('tips.views.organizationDetail.reactivate'), () => setStatus('Active'), { denied: updateDenied })
              : actionButton('retire', t('views.organizationDetail.retire'), t('tips.views.organizationDetail.retire'), () => setConfirm({ kind: 'retire' }), {
                  denied: updateDenied || (org.status === 'Frozen' ? t('tips.views.organizationDetail.frozenRetire') : '')
                })}
            {actionButton('publish', t('views.organizationDetail.publish'), t('tips.views.organizationDetail.publish'), () => {
              setPublishError('');
              setPublishOpen(true);
            }, { className: 'button-primary', denied: editBlocked || (units.length === 0 ? t('tips.views.organizationDetail.publishEmpty') : '') })}
            {actionButton('delete', t('common.actions.delete'), t('tips.views.organizationDetail.delete'), () => setConfirm({ kind: 'delete' }), { className: 'button-danger', denied: deleteDenied, icon: <TrashIcon size={14} /> })}
          </>
        }
      />

      {retired && (
        <div className="warning-banner" role="status" data-testid="org-retired-banner">
          {t('views.organizationDetail.retiredBanner')}
        </div>
      )}
      {hasPending && !retired && (
        <div className="info-banner org-pending" role="status" data-testid="org-pending">
          <span>
            {published
              ? t('views.organizationDetail.pending', { added: pending?.added.length || 0, changed: pending?.changed.length || 0, removed: pending?.removed.length || 0 })
              : t('views.organizationDetail.neverPublished')}
          </span>
          <button type="button" className="button-secondary button-sm" onClick={reviewPending} data-testid="org-review-pending" {...tip(t('tips.views.organizationDetail.reviewPending'))}>
            {t('views.organizationDetail.reviewPending')}
          </button>
        </div>
      )}

      <Explainer topic="organizations" />

      <div className="panel detail-grid" data-testid="org-summary">
        <Detail label={t('resources.organizations.columns.status')} tipText={t('tips.resources.organizations.status')}>
          <OrganizationStatusBadge status={org.status} t={t} />
        </Detail>
        <Detail label={t('resources.organizations.columns.currentRevisionNumber')} tipText={t('tips.resources.organizations.currentRevisionNumber')}>
          {published ? formatNumber(org.currentRevisionNumber, {}, lng) : t('organizations.notPublished')}
        </Detail>
        <Detail label={t('views.organizationDetail.units')} tipText={t('tips.views.organizationDetail.units')}>
          {formatNumber(units.length, {}, lng)}
        </Detail>
        <Detail label={t('resources.organizations.columns.createdUtc')} tipText={t('tips.resources.organizations.createdUtc')}>
          {when(org.createdUtc)}
        </Detail>
        <Detail label={t('views.organizationDetail.lastUpdate')} tipText={t('tips.views.organizationDetail.lastUpdate')}>
          {when(org.lastUpdateUtc)}
        </Detail>
        {org.description && (
          <Detail label={t('resources.organizations.columns.description')} tipText={t('tips.resources.organizations.description')}>
            <span className="org-text">{org.description}</span>
          </Detail>
        )}
        {org.mission && (
          <Detail label={t('resources.organizations.columns.mission')} tipText={t('tips.resources.organizations.mission')} testId="org-mission">
            <span className="org-text">{org.mission}</span>
          </Detail>
        )}
      </div>

      <Tabs
        label={org.name}
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'chart', label: t('views.organizationDetail.tabs.chart'), tip: t('tips.views.organizationDetail.tabs.chart') },
          { id: 'budgets', label: t('views.organizationDetail.tabs.budgets'), tip: t('tips.views.organizationDetail.tabs.budgets') },
          { id: 'revisions', label: t('views.organizationDetail.tabs.revisions', { count: revisions.length }), tip: t('tips.views.organizationDetail.tabs.revisions') },
          { id: 'proposals', label: t('views.organizationDetail.tabs.proposals', { count: proposals.length }), tip: t('tips.views.organizationDetail.tabs.proposals') }
        ]}
      />

      {tab === 'chart' && (
        <section className="panel" aria-label={t('views.organizationDetail.tabs.chart')} data-testid="org-chart-panel">
          <div className="org-chart-bar">
            <div className="range-group segmented" role="group" aria-label={t('views.organizationDetail.chartView')}>
              <button type="button" aria-pressed={view === 'working'} className={`range-btn ${view === 'working' ? 'active' : ''}`} onClick={() => setView('working')} data-testid="org-view-working" {...tip(t('tips.views.organizationDetail.viewWorking'))}>
                {t('views.organizationDetail.viewWorking')}
              </button>
              <button
                type="button"
                aria-pressed={view === 'live'}
                aria-disabled={liveChartUnits ? undefined : 'true'}
                className={`range-btn ${view === 'live' ? 'active' : ''}`}
                onClick={() => liveChartUnits && setView('live')}
                data-testid="org-view-live"
                {...tip(liveChartUnits ? t('tips.views.organizationDetail.viewLive') : t('tips.views.organizationDetail.noLive'))}
              >
                {t('views.organizationDetail.viewLive')}
              </button>
            </div>
            {view === 'working' &&
              actionButton('add-unit', units.length ? t('views.organizationDetail.addUnit') : t('views.organizationDetail.addRoot'), t('tips.views.organizationDetail.addUnit'), () => setUnitEditor({ unit: null, parentUnitId: units.find((u) => !u.parentUnitId)?.id || null }), {
                denied: editBlocked,
                icon: <PlusIcon size={14} />
              })}
          </div>
          <p className="text-muted org-chart-note">{view === 'live' ? t('views.organizationDetail.liveNote') : t('views.organizationDetail.workingNote')}</p>
          {shownUnits.length === 0 ? (
            <EmptyState title={t('views.organizationDetail.noUnitsTitle')} body={t('views.organizationDetail.noUnitsBody')} />
          ) : (
            <OrgChartTree
              units={shownUnits}
              t={t}
              lng={lng}
              names={names}
              spend={spend}
              health={health}
              editable={view === 'working' && editable}
              onEdit={(unit) => setUnitEditor({ unit, parentUnitId: null })}
              onAdd={(unit) => setUnitEditor({ unit: null, parentUnitId: unit.id })}
              onRemove={(unit) => {
                setConfirmError(null);
                setConfirm({ kind: 'removeUnit', unit });
              }}
            />
          )}
        </section>
      )}

      {tab === 'budgets' && (
        <section className="panel" aria-label={t('views.organizationDetail.tabs.budgets')} data-testid="org-budgets">
          <p className="text-muted">{t('views.organizationDetail.budgetsNote')}</p>
          {budgetRows.length === 0 ? (
            <EmptyState title={t('views.organizationDetail.noBudgetsTitle')} body={t('views.organizationDetail.noBudgetsBody')} />
          ) : (
            <div className="table-scroll">
              <table className="data-table compact" data-testid="org-budgets-table">
                <thead>
                  <tr>
                    <th scope="col" {...tip(t('tips.views.organizationDetail.columns.unit'))}>{t('views.organizationDetail.columns.unit')}</th>
                    <th scope="col" className="right" {...tip(t('tips.views.organizationDetail.columns.day'))}>{t('views.organizationDetail.columns.day')}</th>
                    <th scope="col" className="right" {...tip(t('tips.views.organizationDetail.columns.month'))}>{t('views.organizationDetail.columns.month')}</th>
                    <th scope="col" {...tip(t('tips.views.organizationDetail.columns.spend'))}>{t('views.organizationDetail.columns.spend')}</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetRows.map(({ unit, depth }) => (
                    <tr key={unit.id} data-unit={unit.name}>
                      <td>
                        <span className="org-budget-unit" style={{ paddingInlineStart: `${Math.min(depth, 6) * 12}px` }}>
                          {unit.name}
                        </span>
                      </td>
                      <td className="right nowrap">{usd(budgetOf(unit, 'Day'))}</td>
                      <td className="right nowrap">{usd(budgetOf(unit, 'Month'))}</td>
                      <td className="org-budget-spend">
                        {spendOf(spend, unit.id).length ? spendOf(spend, unit.id).map((r) => <SpendBar key={r.period} row={r} t={t} lng={lng} testId="org-budget-spend" />) : <span className="text-muted">{t('views.organizationDetail.noSpend')}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'revisions' && (
        <section className="panel" aria-label={t('views.organizationDetail.tabs.revisions', { count: revisions.length })} data-testid="org-revisions">
          {revisions.length === 0 ? (
            <EmptyState title={t('views.organizationDetail.noRevisionsTitle')} body={t('views.organizationDetail.noRevisionsBody')} />
          ) : (
            <div className="table-scroll">
              <table className="data-table compact" data-testid="org-revisions-table">
                <thead>
                  <tr>
                    <th scope="col" className="right" {...tip(t('tips.views.organizationDetail.columns.number'))}>{t('views.organizationDetail.columns.number')}</th>
                    <th scope="col" {...tip(t('tips.views.organizationDetail.columns.state'))}>{t('views.organizationDetail.columns.state')}</th>
                    <th scope="col" {...tip(t('tips.views.organizationDetail.columns.note'))}>{t('views.organizationDetail.columns.note')}</th>
                    <th scope="col" {...tip(t('tips.views.organizationDetail.columns.author'))}>{t('views.organizationDetail.columns.author')}</th>
                    <th scope="col" {...tip(t('tips.views.organizationDetail.columns.created'))}>{t('views.organizationDetail.columns.created')}</th>
                    <th scope="col" {...tip(t('tips.views.organizationDetail.columns.published'))}>{t('views.organizationDetail.columns.published')}</th>
                    <th scope="col" className="right" {...tip(t('tips.table.actionsColumn'))}>{t('common.generic.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {revisions.map((r) => {
                    const current = r.id === org.currentRevisionId;
                    const canRollBack = !current && !!r.publishedUtc && r.state !== 'Draft';
                    return (
                      <tr key={r.id} data-revision={r.number}>
                        <td className="right nowrap">
                          {formatNumber(r.number, {}, lng)}
                          {current && (
                            <>
                              {' '}
                              <Badge tone="success" tip={t('tips.views.organizationDetail.current')}>{t('views.organizationDetail.current')}</Badge>
                            </>
                          )}
                        </td>
                        <td>
                          <OrgRevisionStateBadge state={r.state} t={t} />
                          {r.rollbackOfRevisionId ? <span className="text-muted">{` ${t('organizations.revisions.rollbackOf', { number: revisions.find((x) => x.id === r.rollbackOfRevisionId)?.number ?? '?' })}`}</span> : null}
                          {r.draftId ? (
                            <>
                              {' '}
                              <Badge tone="info" tip={t('tips.views.organizationDetail.appliedProposal')}>{t('views.organizationDetail.appliedProposal')}</Badge>
                            </>
                          ) : null}
                        </td>
                        <td className="org-text">{r.note || '-'}</td>
                        <td>{r.authorName || r.authorId || '-'}</td>
                        <td className="nowrap">{when(r.createdUtc)}</td>
                        <td className="nowrap">{when(r.publishedUtc)}</td>
                        <td className="right nowrap">
                          <button type="button" className="button-ghost button-sm" onClick={() => compare(r)} data-testid={`org-revision-diff-${r.number}`} {...tip(t('tips.views.organizationDetail.compare'))}>
                            {t('views.organizationDetail.compare')}
                          </button>
                          {r.state === 'Draft' && (
                            <button type="button" className="button-secondary button-sm" aria-disabled={editBlocked || busy ? 'true' : undefined} onClick={() => !editBlocked && !busy && publishDraft(r)} data-testid={`org-revision-publish-${r.number}`} {...tip(editBlocked || t('tips.views.organizationDetail.publishRevision'))}>
                              {t('views.organizationDetail.publishRevision')}
                            </button>
                          )}
                          {canRollBack && (
                            <button
                              type="button"
                              className="button-secondary button-sm"
                              aria-disabled={editBlocked || busy ? 'true' : undefined}
                              onClick={() => {
                                if (editBlocked || busy) return;
                                setConfirmError(null);
                                setConfirm({ kind: 'rollback', revision: r });
                              }}
                              data-testid={`org-revision-rollback-${r.number}`}
                              {...tip(editBlocked || t('tips.views.organizationDetail.rollback'))}
                            >
                              {t('views.organizationDetail.rollback')}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === 'proposals' && (
        <OrgProposalsPanel
          organization={org}
          proposals={proposals}
          revisions={revisions}
          permissions={permissions}
          onChanged={() => {
            loadProposals();
            loadOrg();
            loadChart();
            loadRevisions();
          }}
        />
      )}

      {unitEditor && (
        <OrgUnitModal
          organization={org}
          units={units}
          unit={unitEditor.unit}
          parentUnitId={unitEditor.parentUnitId}
          options={options}
          onClose={() => setUnitEditor(null)}
          onSaved={() => {
            setUnitEditor(null);
            reloadAll();
          }}
        />
      )}

      {publishOpen && (
        <Modal
          open
          size="medium"
          onClose={() => !busy && setPublishOpen(false)}
          title={t('views.organizationDetail.publishTitle')}
          footer={
            <>
              <button type="button" className="button-secondary" onClick={() => setPublishOpen(false)} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
                {t('common.actions.cancel')}
              </button>
              <button type="button" className="button-secondary" onClick={() => submitPublish(false)} disabled={busy} data-testid="org-publish-draft" {...tip(t('tips.views.organizationDetail.saveDraft'))}>
                {t('views.organizationDetail.saveDraft')}
              </button>
              <button type="button" className="button-primary" onClick={() => submitPublish(true)} disabled={busy} data-testid="org-publish-submit" {...tip(t('tips.views.organizationDetail.publishNow'))}>
                {t('views.organizationDetail.publishNow')}
              </button>
            </>
          }
        >
          <div className="flex-col gap-md" data-testid="org-publish">
            <p className="text-muted">{t('views.organizationDetail.publishIntro')}</p>
            {pending && published && <OrgRevisionDiff diff={pending} t={t} beforeLabel={t('organizations.revisions.label', { number: org.currentRevisionNumber })} afterLabel={t('organizations.diff.working')} />}
            <div className="field">
              <label htmlFor="org-publish-note" {...tip(t('tips.views.organizationDetail.note'))}>
                {t('views.organizationDetail.note')}
              </label>
              <textarea id="org-publish-note" rows={3} maxLength={ORGANIZATION_LIMITS.noteMax} value={publishNote} disabled={busy} onChange={(e) => setPublishNote(e.target.value)} data-testid="org-publish-note" {...tip(t('tips.views.organizationDetail.note'))} />
            </div>
            {publishError && (
              <div className="error-banner" role="alert" data-testid="org-publish-error">
                {publishError}
              </div>
            )}
          </div>
        </Modal>
      )}

      {diff && (
        <Modal open size="large" onClose={() => setDiff(null)} title={diff.title}>
          {diff.note ? <p className="org-text" data-testid="org-diff-note">{t('views.organizationDetail.diffNote', { note: diff.note })}</p> : null}
          <OrgRevisionDiff diff={diff.diff} t={t} beforeLabel={diff.before} afterLabel={diff.after} />
        </Modal>
      )}

      {details && (
        <Modal
          open
          size="large"
          onClose={() => !busy && setDetails(null)}
          title={t('views.organizationDetail.editDetails')}
          footer={
            <>
              <button type="button" className="button-secondary" onClick={() => setDetails(null)} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
                {t('common.actions.cancel')}
              </button>
              <button type="button" className="button-primary" onClick={saveDetails} disabled={busy} data-testid="org-details-save" {...tip(t('tips.modal.saveEdit'))}>
                {t('common.actions.save')}
              </button>
            </>
          }
        >
          <FormFields idPrefix="org-details" fields={detailFields} data={details} onChange={setDetails} errors={detailsErrors} disabled={busy} />
          {detailsError && (
            <div className="error-banner" role="alert">
              {detailsError}
            </div>
          )}
        </Modal>
      )}

      <ConfirmModal
        open={confirm?.kind === 'removeUnit'}
        danger
        title={t('views.organizationDetail.removeUnitTitle')}
        message={confirm?.kind === 'removeUnit' ? t('views.organizationDetail.confirmRemoveUnit', { name: confirm.unit.name }) : ''}
        confirmLabel={t('common.actions.remove')}
        confirmTip={t('tips.views.organizationDetail.removeUnit')}
        error={confirmError}
        onConfirm={confirmAction}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm?.kind === 'rollback'}
        danger
        title={t('views.organizationDetail.rollbackTitle')}
        message={confirm?.kind === 'rollback' ? t('views.organizationDetail.confirmRollback', { number: confirm.revision.number, live: org.currentRevisionNumber || '-' }) : ''}
        confirmLabel={t('views.organizationDetail.rollback')}
        confirmTip={t('tips.views.organizationDetail.rollback')}
        error={confirmError}
        onConfirm={confirmAction}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm?.kind === 'retire'}
        danger
        title={t('views.organizationDetail.retireTitle')}
        message={t('views.organizationDetail.confirmRetire', { name: org.name })}
        confirmLabel={t('views.organizationDetail.retire')}
        confirmTip={t('tips.views.organizationDetail.retire')}
        error={confirmError}
        onConfirm={confirmAction}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm?.kind === 'delete'}
        danger
        title={t('resources.organizations.deleteTitle')}
        message={t('views.organizationDetail.confirmDelete', { name: org.name, units: units.length, revisions: revisions.length })}
        confirmLabel={t('common.actions.delete')}
        confirmTip={t('tips.views.organizationDetail.delete')}
        confirmWord="delete"
        error={confirmError}
        onConfirm={confirmAction}
        onCancel={() => setConfirm(null)}
      />
      <JsonViewerModal open={jsonOpen} value={org} onClose={() => setJsonOpen(false)} />
    </div>
  );
}
