import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import CopyableId from '../components/CopyableId';
import ConfirmModal from '../components/ConfirmModal';
import JsonViewerModal from '../components/JsonViewerModal';
import Explainer from '../components/Explainer';
import Modal from '../components/Modal';
import LocalTableFrame from '../components/LocalTableFrame';
import Tabs from '../components/Tabs';
import FormFields from '../components/FormFields';
import OrgChartTree from '../components/OrgChartTree';
import OrgUnitModal from '../components/OrgUnitModal';
import OrgRevisionDiff from '../components/OrgRevisionDiff';
import OrgProposalsPanel from '../components/OrgProposalsPanel';
import useMediaQuery from '../hooks/useMediaQuery';
import { readStored, writeStored } from '../utils/studio';
import { agentsConfig, changeRulesConfig, keepersConfig } from './resourceConfigs';
import CascadeCancelModal from '../components/CascadeCancelModal';
import FreezeModal from '../components/FreezeModal';
import RollbackTicksChoice from '../components/RollbackTicksChoice';
import { OrganizationStatusBadge, OrgRevisionStateBadge, SpendBar } from '../components/OrganizationBadges';
import { Badge } from '../components/StatusBadge';
import { LoadingState, ErrorBanner, EmptyState } from '../components/States';
import { CodeIcon, PlusIcon, TrashIcon } from '../components/Icons';
import { tip } from '../components/Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import useCallerPermissions from '../hooks/useCallerPermissions';
import useOrganizationChannel from '../hooks/useOrganizationChannel';
import StudioLink from '../components/studio/StudioLink';
import { ORGANIZATION_LIMITS } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { formatCurrency, formatDateTime, formatNumber, formatRelativeTime } from '../i18n/formatters';
import { upsertProposal } from '../utils/changeRules';
import { cascadeDenied } from '../utils/performance';
import { isMissingEndpoint } from '../utils/errors';
import { normalizeProblems, problemText, publishable, workingTreeProblems } from '../utils/orgCanvasSource';
import { budgetOf, chartToUnits, diffIsEmpty, diffOrgUnits, orgDenied, orgErrorMessage, organizationFormErrors, organizationFormToBody, organizationToForm, spendOf, statusBody, treeOrder } from '../utils/organizations';
import RowActions from '../components/RowActions';

// The designer and the Chart canvas carry React Flow, so they load when first shown (the studio canvas does the same).
const OrgDesigner = lazy(() => import('../components/orgDesigner/OrgDesigner'));
const OrgChartCanvas = lazy(() => import('../components/orgDesigner/OrgChartCanvas'));
const OrgTemplateModal = lazy(() => import('../components/orgDesigner/OrgTemplateModal'));

/** Tabs a link may open with ?tab= (LP3.2: the templates open a new organization on Design). */
const DETAIL_TABS = ['chart', 'design', 'budgets', 'revisions', 'proposals'];
/** The canvas and the chart tree switch at this width (LP-006). */
const WIDE = '(min-width: 768px)';
const CHART_LAYOUT_KEY = 'garrison.organizations.chartLayout';
/** The existing forms the designer opens (LP3.3, LP3.4, LP3.6). */
const DESIGNER_FORMS = { agents: agentsConfig, keepers: keepersConfig, changeRules: changeRulesConfig };

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
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(() => (DETAIL_TABS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'chart'));
  const wide = useMediaQuery(WIDE);
  const [chartLayout, setChartLayout] = useState(() => (readStored(CHART_LAYOUT_KEY) === 'canvas' ? 'canvas' : 'tree'));
  const [templatesOpen, setTemplatesOpen] = useState(false);
  // A link to another organization with ?tab= (a template opening its result on Design) keeps this view mounted.
  const requestedTab = searchParams.get('tab');
  useEffect(() => {
    if (DETAIL_TABS.includes(requestedTab)) setTab(requestedTab);
  }, [requestedTab, recordId]);
  // UXP1-S015: an organization with no units yet (a new one) opens on Design, where units are added, unless a link
  // asked for a tab.
  const emptyChecked = useRef('');
  useEffect(() => {
    if (!org || emptyChecked.current === org.id) return;
    emptyChecked.current = org.id;
    if (!DETAIL_TABS.includes(searchParams.get('tab')) && (org.units || []).length === 0) setTab('design');
  }, [org, searchParams]);
  const [view, setView] = useState('working');
  const [unitEditor, setUnitEditor] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [confirmError, setConfirmError] = useState(null);
  const [rollbackTicks, setRollbackTicks] = useState('Finish');
  const [cascade, setCascade] = useState(null);
  const [freezing, setFreezing] = useState(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishNote, setPublishNote] = useState('');
  const [publishError, setPublishError] = useState('');
  // UXP1-S025: the publish checks, run when the publish dialog opens ({ checking, result }).
  const [publishCheck, setPublishCheck] = useState(null);
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
        {/* UXP1-V007: "not found" only when the server said 404, not under any error. */}
        {error.status === 404 && <EmptyState title={t('views.organizationDetail.notFoundTitle')} body={t('views.organizationDetail.notFoundBody')} />}
      </div>
    );
  }
  // UXP1-V029: the header stays in place while the organization loads, so the layout does not jump.
  if (!org) {
    return (
      <div>
        <PageHeader title={t('views.organizationDetail.title')} />
        <LoadingState />
      </div>
    );
  }

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
        const result = await apiClient.rollbackOrganization(tenantId, org.id, { revisionId: confirm.revision.id, note: t('organizations.rollback.note', { number: confirm.revision.number }), activeTicks: rollbackTicks });
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

  const openPublish = async () => {
    setPublishError('');
    setPublishOpen(true);
    setPublishCheck({ checking: true, result: null });
    let result;
    try {
      result = apiClient.validateOrganization ? normalizeProblems(await apiClient.validateOrganization(tenantId, org.id), units, options.agents, options.mandates) : workingTreeProblems(units, { agents: options.agents, mandates: options.mandates });
    } catch (e) {
      result = isMissingEndpoint(e) ? workingTreeProblems(units, { agents: options.agents, mandates: options.mandates }) : { valid: null, problems: [], error: e };
    }
    if (!unmounted.current) setPublishCheck({ checking: false, result });
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
    <button type="button" className={className} aria-disabled={denied || busy ? 'true' : undefined} onClick={() => !denied && !busy && onClick()} data-testid={`org-${key}`} data-tour={key === 'publish' ? 'org-publish' : key === 'design-add-unit' ? 'org-design-add-unit' : undefined} {...tip(denied || tipText)}>
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
    { name: 'mission', type: 'textarea', rows: 4, label: t('resources.organizations.fields.mission'), tip: t('tips.resources.organizations.mission') },
    {
      name: 'budgetFreezeMarginPercent',
      type: 'number',
      min: ORGANIZATION_LIMITS.budgetFreezeMargin.min,
      max: ORGANIZATION_LIMITS.budgetFreezeMargin.max,
      label: t('resources.organizations.fields.budgetFreezeMarginPercent'),
      hint: t('resources.organizations.hints.budgetFreezeMarginPercent', ORGANIZATION_LIMITS.budgetFreezeMargin),
      tip: t('tips.resources.organizations.budgetFreezeMarginPercent')
    }
  ];
  const cancelAllDenied = cascadeDenied(t, permissions);

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
            <StudioLink to={pathFor('board', org.id)} className="button button-secondary" testId="org-open-board" tipText={t('tips.views.organizationDetail.openBoard')}>
              {t('views.organizationDetail.openBoard')}
            </StudioLink>
            <StudioLink to={pathFor('performance', org.id)} className="button button-secondary" testId="org-open-performance" tipText={t('tips.views.organizationDetail.openPerformance')}>
              {t('views.organizationDetail.openPerformance')}
            </StudioLink>
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
            {actionButton('publish', t('views.organizationDetail.publish'), t('tips.views.organizationDetail.publish'), openPublish, { className: 'button-primary', denied: editBlocked || (units.length === 0 ? t('tips.views.organizationDetail.publishEmpty') : '') })}
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
        <Detail label={t('resources.organizations.fields.budgetFreezeMarginPercent')} tipText={t('tips.resources.organizations.budgetFreezeMarginPercent')} testId="org-freeze-margin">
          {t('views.organizationDetail.freezeMargin', { percent: org.budgetFreezeMarginPercent ?? ORGANIZATION_LIMITS.budgetFreezeMargin.default })}
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
          { id: 'design', label: t('components.orgDesigner.tabs.design'), tip: t('tips.orgDesigner.tabs.design') },
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
            {wide && (
              <div className="range-group segmented" role="group" aria-label={t('components.orgDesigner.chartLayout.label')}>
                {['tree', 'canvas'].map((layout) => (
                  <button
                    key={layout}
                    type="button"
                    aria-pressed={chartLayout === layout}
                    className={`range-btn ${chartLayout === layout ? 'active' : ''}`}
                    onClick={() => {
                      setChartLayout(layout);
                      writeStored(CHART_LAYOUT_KEY, layout);
                    }}
                    data-testid={`org-chart-layout-${layout}`}
                    {...tip(t(`tips.orgDesigner.chartLayout.${layout}`))}
                  >
                    {t(`components.orgDesigner.chartLayout.${layout}`)}
                  </button>
                ))}
              </div>
            )}
            {/* UXP1-S015: the Chart tab only shows the tree; units are edited on Design. */}
            <button type="button" className="button-secondary" onClick={() => setTab('design')} data-testid="org-chart-open-design" data-tour="org-chart-open-design" {...tip(t('tips.views.organizationDetail.editOnDesign'))}>
              {t('views.organizationDetail.editOnDesign')}
            </button>
          </div>
          <p className="text-muted org-chart-note">{view === 'live' ? t('views.organizationDetail.liveNote') : t('views.organizationDetail.chartReadOnlyNote')}</p>
          {shownUnits.length === 0 ? (
            <EmptyState title={t('views.organizationDetail.noUnitsTitle')} body={t('views.organizationDetail.noUnitsBodyDesign')} />
          ) : wide && chartLayout === 'canvas' ? (
            <Suspense fallback={<LoadingState />}>
              <OrgChartCanvas organization={org} units={shownUnits} agents={options.agents} spend={spend} health={health} />
            </Suspense>
          ) : (
            <OrgChartTree
              units={shownUnits}
              t={t}
              lng={lng}
              names={names}
              spend={spend}
              health={health}
              onCancelAll={published ? (unit) => setCascade(unit) : undefined}
              cancelAllDenied={cancelAllDenied}
            />
          )}
        </section>
      )}

      {tab === 'design' && (
        <section className="panel" aria-label={t('components.orgDesigner.tabs.design')} data-testid="org-design-panel-section">
          <p className="text-muted org-chart-note">{t('components.orgDesigner.note')}</p>
          {units.length === 0 && (
            <div className="info-banner org-design-empty" role="status" data-testid="org-design-empty">
              <span>{t('components.orgDesigner.empty')}</span>
              <button type="button" className="button-secondary button-sm" onClick={() => setTemplatesOpen(true)} data-testid="org-design-templates" {...tip(t('tips.orgDesigner.templates.open'))}>
                {t('components.orgDesigner.templates.open')}
              </button>
            </div>
          )}
          {wide ? (
            <Suspense fallback={<LoadingState />}>
              {/* UXP1-S015: the full unit form (description, app, titles, budgets) opens from Design, the one place to edit units. */}
              <div className="org-design-actions">
                {actionButton('add-unit', units.length ? t('views.organizationDetail.addUnitFull') : t('views.organizationDetail.addRoot'), t('tips.views.organizationDetail.addUnit'), () => setUnitEditor({ unit: null, parentUnitId: units.find((u) => !u.parentUnitId)?.id || null }), {
                  denied: editBlocked,
                  icon: <PlusIcon size={14} />
                })}
              </div>
              <OrgDesigner organization={org} options={options} spend={spend} permissions={permissions} blocked={editBlocked} forms={DESIGNER_FORMS} onReload={reloadAll} initialUnit={searchParams.get('unit') || ''} initialPanel={searchParams.get('panel') || ''} onEditUnit={(unitId) => {
                const unit = units.find((u) => u.id === unitId);
                if (unit) setUnitEditor({ unit, parentUnitId: null });
              }} />
            </Suspense>
          ) : (
            <div className="org-design-narrow" data-tour="org-design-list">
              <p className="text-muted">{t('components.orgDesigner.narrow')}</p>
              {actionButton('design-add-unit', units.length ? t('views.organizationDetail.addUnit') : t('views.organizationDetail.addRoot'), t('tips.views.organizationDetail.addUnit'), () => setUnitEditor({ unit: null, parentUnitId: units.find((u) => !u.parentUnitId)?.id || null }), {
                denied: editBlocked,
                icon: <PlusIcon size={14} />
              })}
              {units.length > 0 && (
                <OrgChartTree
                  units={units}
                  t={t}
                  lng={lng}
                  names={names}
                  spend={spend}
                  health={health}
                  editable={editable}
                  onEdit={(unit) => setUnitEditor({ unit, parentUnitId: null })}
                  onAdd={(unit) => setUnitEditor({ unit: null, parentUnitId: unit.id })}
                  onRemove={(unit) => {
                    setConfirmError(null);
                    setConfirm({ kind: 'removeUnit', unit });
                  }}
                />
              )}
            </div>
          )}
        </section>
      )}

      {templatesOpen && (
        <Suspense fallback={null}>
          <OrgTemplateModal onClose={() => setTemplatesOpen(false)} />
        </Suspense>
      )}

      {tab === 'budgets' && (
        <section className="panel" aria-label={t('views.organizationDetail.tabs.budgets')} data-testid="org-budgets">
          <p className="text-muted">{t('views.organizationDetail.budgetsNote')}</p>
          {budgetRows.length === 0 ? (
            <EmptyState title={t('views.organizationDetail.noBudgetsTitle')} body={t('views.organizationDetail.noBudgetsBody')} />
          ) : (
            <LocalTableFrame
              tableId="org-budgets"
              testId="org-budgets-table"
              compact
              items={budgetRows}
              rowId={(b) => b.unit.id}
              rowProps={(b) => ({ 'data-unit': b.unit.name })}
              columns={[
                {
                  key: 'unit',
                  label: t('views.organizationDetail.columns.unit'),
                  tip: t('tips.views.organizationDetail.columns.unit'),
                  pinned: true,
                  render: ({ unit, depth }) => (
                    <span className="org-budget-unit" style={{ paddingInlineStart: `${Math.min(depth, 6) * 12}px` }}>
                      {unit.name}
                    </span>
                  )
                },
                { key: 'day', label: t('views.organizationDetail.columns.day'), tip: t('tips.views.organizationDetail.columns.day'), headerClass: 'right', cellClass: 'right nowrap', render: ({ unit }) => usd(budgetOf(unit, 'Day')) },
                { key: 'month', label: t('views.organizationDetail.columns.month'), tip: t('tips.views.organizationDetail.columns.month'), headerClass: 'right', cellClass: 'right nowrap', render: ({ unit }) => usd(budgetOf(unit, 'Month')) },
                {
                  key: 'spend',
                  label: t('views.organizationDetail.columns.spend'),
                  tip: t('tips.views.organizationDetail.columns.spend'),
                  cellClass: 'org-budget-spend',
                  render: ({ unit }) => (spendOf(spend, unit.id).length ? spendOf(spend, unit.id).map((r) => <SpendBar key={r.period} row={r} t={t} lng={lng} testId="org-budget-spend" />) : <span className="text-muted">{t('views.organizationDetail.noSpend')}</span>)
                }
              ]}
            />
          )}
        </section>
      )}

      {tab === 'revisions' && (
        <section className="panel" aria-label={t('views.organizationDetail.tabs.revisions', { count: revisions.length })} data-testid="org-revisions">
          {revisions.length === 0 ? (
            <EmptyState title={t('views.organizationDetail.noRevisionsTitle')} body={t('views.organizationDetail.noRevisionsBody')} />
          ) : (
            <LocalTableFrame
              tableId="org-revisions"
              testId="org-revisions-table"
              compact
              items={revisions}
              rowProps={(r) => ({ 'data-revision': r.number })}
              columns={[
                {
                  key: 'number',
                  label: t('views.organizationDetail.columns.number'),
                  tip: t('tips.views.organizationDetail.columns.number'),
                  headerClass: 'right',
                  cellClass: 'right nowrap',
                  render: (r) => (
                    <>
                      {formatNumber(r.number, {}, lng)}
                      {r.id === org.currentRevisionId && (
                        <>
                          {' '}
                          <Badge tone="success" tip={t('tips.views.organizationDetail.current')}>{t('views.organizationDetail.current')}</Badge>
                        </>
                      )}
                    </>
                  )
                },
                {
                  key: 'state',
                  label: t('views.organizationDetail.columns.state'),
                  tip: t('tips.views.organizationDetail.columns.state'),
                  render: (r) => (
                    <>
                      <OrgRevisionStateBadge state={r.state} t={t} />
                      {r.rollbackOfRevisionId ? <span className="text-muted">{` ${t('organizations.revisions.rollbackOf', { number: revisions.find((x) => x.id === r.rollbackOfRevisionId)?.number ?? '?' })}`}</span> : null}
                      {r.draftId ? (
                        <>
                          {' '}
                          <Badge tone="info" tip={t('tips.views.organizationDetail.appliedProposal')}>{t('views.organizationDetail.appliedProposal')}</Badge>
                        </>
                      ) : null}
                    </>
                  )
                },
                { key: 'note', label: t('views.organizationDetail.columns.note'), tip: t('tips.views.organizationDetail.columns.note'), cellClass: 'org-text', render: (r) => r.note || '-' },
                { key: 'author', label: t('views.organizationDetail.columns.author'), tip: t('tips.views.organizationDetail.columns.author'), render: (r) => r.authorName || r.authorId || '-' },
                { key: 'created', label: t('views.organizationDetail.columns.created'), tip: t('tips.views.organizationDetail.columns.created'), cellClass: 'nowrap', defaultHidden: true, render: (r) => when(r.createdUtc) },
                { key: 'published', label: t('views.organizationDetail.columns.published'), tip: t('tips.views.organizationDetail.columns.published'), cellClass: 'nowrap', render: (r) => when(r.publishedUtc) },
                {
                  key: 'actions',
                  label: t('common.generic.actions'),
                  tip: t('tips.table.actionsColumn'),
                  headerClass: 'right',
                  cellClass: 'right nowrap',
                  render: (r) => {
                    const current = r.id === org.currentRevisionId;
                    const canRollBack = !current && !!r.publishedUtc && r.state !== 'Draft';
                    // UXP1-V027: Compare inline, Publish and Roll back in the row menu.
                    const blocked = editBlocked || (busy ? t('common.generic.saving') : '');
                    return (
                      <RowActions
                        label={t('views.organizationDetail.revisionLabel', { number: r.number, defaultValue: String(r.number) })}
                        menuTestId={`org-revision-menu-${r.number}`}
                        primary={{ label: t('views.organizationDetail.compare'), tip: t('tips.views.organizationDetail.compare'), onClick: () => compare(r), testId: `org-revision-diff-${r.number}` }}
                        items={[
                          { label: t('views.organizationDetail.publishRevision'), tip: blocked || t('tips.views.organizationDetail.publishRevision'), hidden: r.state !== 'Draft', disabled: !!blocked, onClick: () => publishDraft(r), testId: `org-revision-publish-${r.number}` },
                          {
                            label: t('views.organizationDetail.rollback'),
                            tip: blocked || t('tips.views.organizationDetail.rollback'),
                            hidden: !canRollBack,
                            disabled: !!blocked,
                            onClick: () => {
                              setConfirmError(null);
                              setRollbackTicks('Finish');
                              setConfirm({ kind: 'rollback', revision: r });
                            },
                            testId: `org-revision-rollback-${r.number}`
                          }
                        ]}
                      />
                    );
                  }
                }
              ]}
            />
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
            {!published && <OrgRevisionDiff diff={diffOrgUnits([], units, names)} t={t} beforeLabel={t('organizations.diff.nothingLive')} afterLabel={t('organizations.diff.working')} />}
            <div className="org-publish-checks" data-testid="org-publish-checks" role="status" aria-live="polite">
              <div className="form-section-title" {...tip(t('tips.orgDesigner.problems.title'))}>
                {t('views.organizationDetail.publishChecks')}
              </div>
              {!publishCheck || publishCheck.checking ? (
                <p className="text-muted">{t('components.orgDesigner.problems.checking')}</p>
              ) : publishCheck.result?.error ? (
                <p className="text-muted">{t('components.orgDesigner.problems.failed', { reason: orgErrorMessage(t, publishCheck.result.error) })}</p>
              ) : (publishCheck.result?.problems || []).length === 0 ? (
                <p className="text-muted" data-testid="org-publish-checks-none">
                  {t('components.orgDesigner.problems.none')}
                </p>
              ) : (
                <>
                  <p className={publishable(publishCheck.result.problems) ? 'text-muted' : 'org-publish-checks-blocked'} data-testid="org-publish-checks-summary">
                    {t('views.organizationDetail.publishChecksSummary', {
                      errors: publishCheck.result.problems.filter((p) => (p.severity || 'Error') === 'Error').length,
                      warnings: publishCheck.result.problems.filter((p) => p.severity === 'Warning').length
                    })}
                  </p>
                  <ul className="org-problem-list">
                    {publishCheck.result.problems.map((p, i) => (
                      <li key={`${p.code}-${p.unitId || p.unit}-${i}`} data-problem={p.code} data-severity={p.severity || 'Error'}>
                        {problemText(t, p)}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
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
        details={<RollbackTicksChoice value={rollbackTicks} onChange={setRollbackTicks} t={t} />}
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
      {cascade && (
        <CascadeCancelModal
          organizationId={org.id}
          unit={cascade}
          onClose={() => setCascade(null)}
          onDone={() => reloadAll()}
          onFreeze={(unit) => {
            setCascade(null);
            setFreezing(unit);
          }}
        />
      )}
      {freezing && <FreezeModal targetKind="OrgUnit" targetId={freezing.id} targetName={freezing.name} onClose={() => setFreezing(null)} onDone={() => setFreezing(null)} />}
      <JsonViewerModal open={jsonOpen} value={org} onClose={() => setJsonOpen(false)} />
    </div>
  );
}
