import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import OpenTrailLink from '../components/trail/OpenTrailLink';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Explainer from '../components/Explainer';
import LocalTableFrame from '../components/LocalTableFrame';
import ConfirmModal from '../components/ConfirmModal';
import FreezeModal from '../components/FreezeModal';
import LiftFreezeModal from '../components/LiftFreezeModal';
import KillSwitchControl from '../components/KillSwitchControl';
import OrgChartTree from '../components/OrgChartTree';
import ProposalDiff from '../components/ProposalDiff';
import ProposalEvidence from '../components/ProposalEvidence';
import BoardCeoChat from '../components/BoardCeoChat';
import CascadeCancelModal from '../components/CascadeCancelModal';
import RollbackTicksChoice from '../components/RollbackTicksChoice';
import StudioLink from '../components/studio/StudioLink';
import { OrganizationStatusBadge, SpendBar } from '../components/OrganizationBadges';
import { ReportHealthBadge } from '../components/ReportBadges';
import { EscalationSeverityBadge } from '../components/EscalationBadges';
import { Badge } from '../components/StatusBadge';
import { EmptyNote, EmptyState, ErrorBanner, LoadingState } from '../components/States';
import { RefreshIcon } from '../components/Icons';
import { tip } from '../components/Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import useCallerPermissions from '../hooks/useCallerPermissions';
import useOrganizationChannel from '../hooks/useOrganizationChannel';
import { pathFor } from '../config/navConfig';
import { formatDateTime, formatNumber, formatRelativeTime } from '../i18n/formatters';
import { holds } from '../utils/apps';
import { enumLabel } from '../utils/enums';
import { errorMessage, errorMessageWithDetail, fieldErrorMessages } from '../utils/errors';
import { FREEZES_CHANGED_EVENT, freezeDenied } from '../utils/freezes';
import { chartToUnits, orgDenied } from '../utils/organizations';
import { cascadeDenied } from '../utils/performance';
import { BOARD_LIMITS, attentionCount, capHits, directionBody, directionErrors, groupEscalations, healthMap, organizationFreeze, proposalPending, spendByUnit, unitAttention } from '../utils/board';

/** A panel title (h2) with the tooltip that explains it and an optional count. */
function PanelHead({ id, title, tipText, count, children }) {
  return (
    <div className="board-panel-head">
      <h2 id={id} {...tip(tipText)}>
        {title}
        {count != null && <span className="board-count"> ({count})</span>}
      </h2>
      {children ? <div className="board-panel-tools">{children}</div> : null}
    </div>
  );
}

/** A line saying a list is empty, kept out of the heading outline (EmptyState carries its own heading). */
function Empty({ text, testId }) {
  return (
    <p className="text-muted board-empty" data-testid={testId}>
      {text}
    </p>
  );
}

/**
 * The organization picker for /dashboard/organizations?tab=board: every organization with a link to its board.
 */
function BoardPicker() {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState(null);
  const [error, setError] = useState(null);
  const [picked, setPicked] = useState('');

  useEffect(() => {
    if (!apiClient?.listOrganizations) return undefined;
    let active = true;
    apiClient
      .listOrganizations(tenantId, { pageNumber: 1, pageSize: 1000 })
      .then((r) => active && setOrgs(r?.items || []))
      .catch((e) => {
        if (!active) return;
        setError(e);
        setOrgs([]);
      });
    return () => {
      active = false;
    };
  }, [apiClient, tenantId]);

  return (
    <div data-testid="board-picker">
      <PageHeader title={t('board.title')} subtitle={t('board.subtitle')} />
      <Explainer topic="board" />
      {/* UT-05: a refused list shows only the error, never the empty state and its call to action. */}
      {error && <ErrorBanner message={errorMessage(t, error)} />}
      {error ? null : orgs === null ? (
        <LoadingState />
      ) : orgs.length === 0 ? (
        <EmptyState
          title={t('board.picker.emptyTitle')}
          body={t('board.picker.emptyBody')}
          action={
            <StudioLink to={pathFor('organizations')} className="button button-primary" testId="board-picker-organizations" tipText={t('tips.board.picker.organizations')}>
              {t('board.picker.organizations')}
            </StudioLink>
          }
        />
      ) : (
        <section className="panel" aria-labelledby="board-picker-title">
          <h2 id="board-picker-title" className="form-section-title">
            {t('board.picker.title')}
          </h2>
          <div className="board-picker-row">
            <div className="field">
              <label htmlFor="board-picker-select" {...tip(t('tips.board.picker.select'))}>
                {t('board.picker.select')}
              </label>
              <select id="board-picker-select" value={picked} onChange={(e) => setPicked(e.target.value)} data-testid="board-picker-select" {...tip(t('tips.board.picker.select'))}>
                <option value="">{t('board.picker.choose')}</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" className="button-primary" disabled={!picked} onClick={() => navigate(pathFor('board', picked))} data-testid="board-picker-open" {...tip(t('tips.board.picker.open'))}>
              {t('board.picker.open')}
            </button>
          </div>
          <ul className="plain-list board-picker-list">
            {orgs.map((o) => (
              <li key={o.id}>
                <StudioLink to={pathFor('board', o.id)} testId={`board-picker-link-${o.id}`} tipText={t('tips.board.picker.open')}>
                  {o.name}
                </StudioLink>{' '}
                <OrganizationStatusBadge status={o.status} t={t} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** One proposal on the board: evidence always, the diff on expand, Approve and Deny with an optional reason. */
function BoardProposal({ organizationId, proposal, deniedDecide, onDecided }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const lng = i18n.language;
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const regionId = `board-proposal-${proposal.draftId}`;

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (!next || detail || loading) return;
    setLoading(true);
    try {
      setDetail(await apiClient.getOrgProposal(tenantId, organizationId, proposal.draftId));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  const decide = async (allow) => {
    if (deniedDecide || busy) return;
    setBusy(true);
    setError(null);
    try {
      await apiClient.decideOrgProposal(tenantId, organizationId, proposal.draftId, { allow, reason: reason.trim() || null });
      addToast({ type: 'success', message: t(allow ? 'orgProposals.toasts.approved' : 'orgProposals.toasts.denied', { title: proposal.title || proposal.draftId }) });
      onDecided?.();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  const evidence = detail?.evidence || proposal.evidence;
  return (
    <li className="board-proposal" data-proposal={proposal.draftId}>
      <div className="board-proposal-head">
        <h3 className="board-proposal-title">{proposal.title || proposal.draftId}</h3>
        <span className="text-muted">
          {t('board.proposals.by', { agent: proposal.agentName || proposal.agentId || '-', unit: proposal.unitName || proposal.unitId || '-' })}{' '}
          {proposal.lastUpdateUtc && <span {...tip(formatDateTime(proposal.lastUpdateUtc, lng))}>{formatRelativeTime(proposal.lastUpdateUtc, lng)}</span>}
        </span>
      </div>
      <ProposalEvidence evidence={evidence} t={t} lng={lng} showEmpty />
      <div className="board-proposal-actions">
        <button type="button" className="button-ghost button-sm" aria-expanded={open} aria-controls={regionId} onClick={toggle} data-testid={`board-proposal-toggle-${proposal.draftId}`} {...tip(t('tips.board.proposals.toggle'))}>
          {open ? t('board.proposals.hideChanges') : t('board.proposals.showChanges')}
        </button>
      </div>
      {open && (
        <div id={regionId} className="board-proposal-diff" data-testid="board-proposal-diff">
          {loading && <div className="text-muted">{t('common.generic.loading')}</div>}
          {detail && <ProposalDiff diff={detail.diff} t={t} />}
          {detail && !detail.diff && <EmptyNote>{t('orgProposals.review.noChanges')}</EmptyNote>}
        </div>
      )}
      <div className="board-proposal-decide">
        <div className="field">
          <label htmlFor={`${regionId}-reason`} {...tip(t('tips.orgProposals.review.reason'))}>
            {t('orgProposals.review.reason')}
          </label>
          <input id={`${regionId}-reason`} value={reason} disabled={busy} onChange={(e) => setReason(e.target.value)} placeholder={t('orgProposals.review.reasonPlaceholder')} data-testid="board-proposal-reason" {...tip(t('tips.orgProposals.review.reason'))} />
        </div>
        <div className="board-proposal-buttons">
          <button type="button" className="button-danger button-sm" aria-disabled={deniedDecide || busy ? 'true' : undefined} onClick={() => decide(false)} data-testid="board-proposal-deny" {...tip(deniedDecide || t('tips.orgProposals.review.deny'))}>
            {t('orgProposals.review.deny')}
          </button>
          <button type="button" className="button-primary button-sm" aria-disabled={deniedDecide || busy ? 'true' : undefined} onClick={() => decide(true)} data-testid="board-proposal-approve" {...tip(deniedDecide || t('tips.orgProposals.review.approve'))}>
            {t('orgProposals.review.approve')}
          </button>
        </div>
      </div>
      {error && (
        <div className="error-banner" role="alert" data-testid="board-proposal-error">
          {errorMessageWithDetail(t, error)}
        </div>
      )}
    </li>
  );
}

/** The direction form: publishes a new revision of the CEO's keeper with the board's instruction. */
function DirectionPanel({ organizationId, ceo, denied, onGiven }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [form, setForm] = useState({ direction: '', changeNote: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const blocked = !ceo ? t('board.ceo.missing') : !ceo.mandateId ? t('board.ceo.noMandate') : denied;

  const submit = async (e) => {
    e.preventDefault();
    if (blocked || busy) return;
    const found = directionErrors(form, t);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError(null);
    try {
      const revision = await apiClient.giveBoardDirection(tenantId, organizationId, directionBody(form));
      addToast({ type: 'success', message: t('board.direction.given', { number: revision?.number ?? '', name: ceo.mandateName || ceo.mandateId }) });
      setForm({ direction: '', changeNote: '' });
      onGiven?.(revision);
    } catch (err) {
      if (err?.fields) setErrors(fieldErrorMessages(t, err));
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel board-panel" aria-labelledby="board-direction-title" data-testid="board-direction">
      <PanelHead id="board-direction-title" title={t('board.direction.title')} tipText={t('tips.board.direction.title')} />
      <p className="text-muted">{t('board.direction.note')}</p>
      {blocked && (
        <div className="info-banner" role="status" data-testid="board-direction-blocked">
          {blocked}
        </div>
      )}
      <form onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="board-direction-text" {...tip(t('tips.board.direction.text'))}>
            {t('board.direction.text')}
          </label>
          <textarea
            id="board-direction-text"
            rows={4}
            maxLength={BOARD_LIMITS.directionMax}
            value={form.direction}
            disabled={!!blocked || busy}
            aria-invalid={errors.direction ? 'true' : undefined}
            aria-describedby={errors.direction ? 'board-direction-text-error' : undefined}
            onChange={(e) => setForm({ ...form, direction: e.target.value })}
            placeholder={t('board.direction.placeholder')}
            data-testid="board-direction-text"
            {...tip(t('tips.board.direction.text'))}
          />
          {errors.direction ? (
            <div className="field-error" id="board-direction-text-error" role="alert">
              {errors.direction}
            </div>
          ) : (
            <div className="field-hint">{t('board.direction.count', { count: form.direction.length, max: BOARD_LIMITS.directionMax })}</div>
          )}
        </div>
        <div className="field">
          <label htmlFor="board-direction-note" {...tip(t('tips.board.direction.changeNote'))}>
            {t('board.direction.changeNote')}
          </label>
          <input
            id="board-direction-note"
            maxLength={BOARD_LIMITS.changeNoteMax}
            value={form.changeNote}
            disabled={!!blocked || busy}
            aria-invalid={errors.changeNote ? 'true' : undefined}
            onChange={(e) => setForm({ ...form, changeNote: e.target.value })}
            placeholder={t('board.direction.changeNotePlaceholder')}
            data-testid="board-direction-note"
            {...tip(t('tips.board.direction.changeNote'))}
          />
          {errors.changeNote && (
            <div className="field-error" role="alert">
              {errors.changeNote}
            </div>
          )}
        </div>
        {error?.code === 'RevisionUnchanged' ? (
          <div className="info-banner" role="status" data-testid="board-direction-unchanged">
            {t('board.direction.unchanged', { name: ceo?.mandateName || ceo?.mandateId || '-' })}
          </div>
        ) : (
          error && <ErrorBanner message={errorMessageWithDetail(t, error)} />
        )}
        <button type="submit" className="button-primary" disabled={!!blocked || busy} data-testid="board-direction-submit" {...tip(t('tips.board.direction.submit'))}>
          {t('board.direction.submit')}
        </button>
      </form>
    </section>
  );
}

/** The board of one organization (`/dashboard/board/<id>`). */
function Board({ organizationId }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const lng = i18n.language;
  const permissions = useCallerPermissions();
  const [board, setBoard] = useState(null);
  const [error, setError] = useState(null);
  const [freezing, setFreezing] = useState(null);
  const [lifting, setLifting] = useState(null);
  const [rollingBack, setRollingBack] = useState(false);
  const [rollbackError, setRollbackError] = useState(null);
  const [unitToFreeze, setUnitToFreeze] = useState('');
  const [rollbackTicks, setRollbackTicks] = useState('Finish');
  const [cascade, setCascade] = useState(null);
  const unmounted = useRef(false);

  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
    };
  }, []);

  const load = useCallback(() => {
    if (!apiClient?.getBoard) return Promise.resolve();
    return apiClient
      .getBoard(tenantId, organizationId)
      .then((b) => {
        if (unmounted.current) return;
        setBoard(b);
        setError(null);
      })
      .catch((e) => !unmounted.current && setError(e));
  }, [apiClient, tenantId, organizationId]);

  useEffect(() => {
    load();
    window.addEventListener(FREEZES_CHANGED_EVENT, load);
    return () => window.removeEventListener(FREEZES_CHANGED_EVENT, load);
  }, [load]);

  const live = useOrganizationChannel(apiClient, board?.organizationId, load);

  if (error && !board) {
    return (
      <div data-testid="board">
        <PageHeader title={t('board.title')} />
        <ErrorBanner message={errorMessage(t, error)} onRetry={load} />
        <EmptyState title={t('board.notFoundTitle')} body={t('board.notFoundBody')} />
      </div>
    );
  }
  if (!board) return <LoadingState />;

  const orgId = board.organizationId || organizationId;
  const units = chartToUnits(board.chart);
  const unitHealth = board.unitHealth || [];
  const escalations = board.escalations || [];
  const unhealthy = board.unhealthyReports || [];
  // One report per author (newest); the author's earlier unhealthy reports in the window are only counted.
  const earlier = board.unhealthyEarlierCounts || {};
  const caps = capHits(board);
  const proposals = (board.proposals || []).filter(proposalPending);
  const spendGroups = spendByUnit(board.spend);
  const freezes = (board.freezes || []).filter((f) => f.active !== false);
  const orgFreeze = organizationFreeze(board);
  const ceo = board.ceo || null;
  const brief = board.latestBrief || null;
  const when = (v) => (v ? <span {...tip(formatDateTime(v, lng))}>{formatRelativeTime(v, lng)}</span> : '-');
  const deniedDecide = holds(permissions, 'Approval', 'Update') ? '' : t('tips.orgProposals.deniedDecide');
  const freezeCreateDenied = freezeDenied(t, permissions, 'Create');
  const updateDenied = orgDenied(t, permissions, 'Update');
  const revisionNumber = board.chart?.revisionNumber || 0;
  const rollbackBlocked = updateDenied || (revisionNumber < 2 ? t('tips.board.brakes.rollbackNone') : '');
  const attention = attentionCount(board);
  const cancelAllDenied = cascadeDenied(t, permissions);
  const pickedUnit = units.find((u) => u.id === unitToFreeze) || null;

  const rollback = async () => {
    setRollbackError(null);
    try {
      const revision = await apiClient.rollbackOrganization(tenantId, orgId, { note: t('board.brakes.rollbackNote'), activeTicks: rollbackTicks });
      addToast({ type: 'success', message: t('board.brakes.rolledBack', { number: revision?.number ?? '' }) });
      setRollingBack(false);
      load();
    } catch (e) {
      setRollbackError(errorMessage(t, e));
    }
  };

  return (
    <div className="board" data-testid="board">
      <PageHeader
        title={t('board.heading', { name: board.name })}
        subtitle={
          <span className="inline-meta">
            <OrganizationStatusBadge status={board.status} t={t} />
            <span className="text-muted" data-testid="board-generated">
              {t('board.generated')} {when(board.generatedUtc)}
            </span>
            {live && <Badge tone="info" tip={t('tips.views.organizationDetail.live')}>{t('views.organizationDetail.live')}</Badge>}
          </span>
        }
        actions={
          <>
            <StudioLink to={pathFor('organizations', orgId)} className="button button-secondary" testId="board-open-organization" tipText={t('tips.board.openOrganization')}>
              {t('board.openOrganization')}
            </StudioLink>
            <button type="button" className="button-secondary" onClick={load} data-testid="board-refresh" {...tip(t('tips.board.refresh'))}>
              <RefreshIcon /> {t('board.refresh')}
            </button>
          </>
        }
      />
      {board.mission && <p className="board-mission" data-testid="board-mission">{board.mission}</p>}
      {board.killSwitch?.enabled && (
        <div className="warning-banner" role="status" data-testid="board-kill-switch-on">
          {t('board.killSwitchOn')}
        </div>
      )}
      <Explainer topic="board" />

      <div className="board-grid">
        <section className="panel board-panel board-wide" aria-labelledby="board-chart-title" data-testid="board-chart" data-tour="board-chart">
          <PanelHead id="board-chart-title" title={t('board.chart.title')} tipText={t('tips.board.chart.title')} />
          {units.length === 0 ? (
            <Empty text={t('board.chart.empty')} testId="board-chart-empty" />
          ) : (
            <>
              <OrgChartTree units={units} t={t} lng={lng} spend={board.spend || []} health={healthMap(board)} onCancelAll={(unit) => setCascade(unit)} cancelAllDenied={cancelAllDenied} />
              <LocalTableFrame
                tableId="board-unit-health"
                testId="board-unit-health"
                compact
                items={unitHealth}
                rowId={(h) => h.unitId}
                rowProps={(h) => ({ 'data-unit-health': h.unitId })}
                columns={[
                  { key: 'unit', label: t('board.chart.columns.unit'), tip: t('tips.board.chart.columns.unit'), pinned: true, render: (h) => h.unitName },
                  {
                    key: 'health',
                    label: t('board.chart.columns.health'),
                    tip: t('tips.board.chart.columns.health'),
                    cellClass: 'inline-meta',
                    // UXP1-S013: report health alone leaves out a unit that files no report but waits on a person.
                    render: (h) => {
                      const known = h.health && h.health !== 'Unknown';
                      const needs = unitAttention(h).needs;
                      return (
                        <>
                          {known || !needs ? <ReportHealthBadge health={h.health || 'Unknown'} t={t} /> : <span className="text-muted">{t('board.chart.noReport')}</span>}
                          {needs && (
                            <span data-testid={`board-needs-person-${h.unitId}`}>
                              <Badge tone="warning" tip={t('tips.board.chart.needsPerson')}>
                                {t('board.chart.needsPerson')}
                              </Badge>
                            </span>
                          )}
                        </>
                      );
                    }
                  },
                  { key: 'escalations', label: t('board.chart.columns.escalations'), tip: t('tips.board.chart.columns.escalations'), render: (h) => formatNumber(h.openEscalations || 0, {}, lng) },
                  {
                    key: 'brakes',
                    label: t('board.chart.columns.brakes'),
                    tip: t('tips.board.chart.columns.brakes'),
                    cellClass: 'inline-meta',
                    render: (h) => (
                      <>
                        {h.frozen && (
                          <Badge tone="info" tip={t('tips.board.chart.frozen')}>
                            {t('board.chart.frozen')}
                          </Badge>
                        )}
                        {h.overBudget && (
                          <Badge tone="danger" tip={t('tips.board.chart.overBudget')}>
                            {t('board.chart.overBudget')}
                          </Badge>
                        )}
                        {!h.frozen && !h.overBudget && '-'}
                      </>
                    )
                  },
                  {
                    key: 'lastReport',
                    label: t('board.chart.columns.lastReport'),
                    tip: t('tips.board.chart.columns.lastReport'),
                    render: (h) =>
                      h.lastReportId ? (
                        <StudioLink to={pathFor('reports', h.lastReportId)} tipText={t('tips.board.openReport')}>
                          {when(h.lastReportUtc)}
                        </StudioLink>
                      ) : (
                        '-'
                      )
                  }
                ]}
              />
            </>
          )}
        </section>

        <section className="panel board-panel" aria-labelledby="board-attention-title" data-testid="board-attention" data-tour="board-attention">
          <PanelHead id="board-attention-title" title={t('board.attention.title')} tipText={t('tips.board.attention.title')} count={attention} />
          {attention === 0 ? (
            <Empty text={t('board.attention.empty')} testId="board-attention-empty" />
          ) : (
            <>
              <h3 className="board-subhead">{t('board.attention.escalations', { count: escalations.length })}</h3>
              {escalations.length === 0 ? (
                <Empty text={t('board.attention.none')} />
              ) : (
                <ul className="plain-list board-list" data-testid="board-escalations">
                  {/* UXP1-S013: the same question from the same agent shows once, with how many times it was asked. */}
                  {groupEscalations(escalations).map(({ key, latest: e, count }) => (
                    <li key={key} data-escalation={e.id} data-escalation-count={count}>
                      <EscalationSeverityBadge severity={e.severity} t={t} />{' '}
                      <StudioLink to={pathFor('escalations', e.id)} tipText={t('tips.board.openEscalation')}>
                        {e.question}
                      </StudioLink>
                      {count > 1 && (
                        <>
                          {' '}
                          <Badge tone="neutral" tip={t('tips.board.attention.repeated', { count })}>
                            {t('board.attention.repeated', { count })}
                          </Badge>
                        </>
                      )}
                      <div className="text-muted">
                        {t('board.attention.raisedBy', { name: e.agentName || e.agentId || '-' })} {when(e.createdUtc)} <OpenTrailLink runId={e.raisingRunId} step={e.id} testId={`board-escalation-trail-${e.id}`} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <h3 className="board-subhead">{t('board.attention.reports', { count: unhealthy.length })}</h3>
              {unhealthy.length === 0 ? (
                <Empty text={t('board.attention.none')} />
              ) : (
                <ul className="plain-list board-list" data-testid="board-unhealthy-reports">
                  {unhealthy.map((r) => (
                    <li key={r.id} data-report={r.id}>
                      <ReportHealthBadge health={r.health} t={t} />{' '}
                      <StudioLink to={pathFor('reports', r.id)} tipText={t('tips.board.openReport')}>
                        {r.title}
                      </StudioLink>
                      <div className="text-muted">
                        {t('board.attention.filedBy', { name: r.authorAgentName || r.filedByName || '-' })} {when(r.createdUtc)} <OpenTrailLink runId={r.runId} step={r.id} testId={`board-report-trail-${r.id}`} />
                        {earlier[r.id] > 0 && (
                          <>
                            {' '}
                            {r.authorAgentId ? (
                              <StudioLink to={pathFor('reports', null, { author: r.authorAgentId })} tipText={t('tips.board.attention.earlier', { count: earlier[r.id] })} testId={`board-unhealthy-earlier-${r.id}`}>
                                {t('board.attention.earlier', { count: earlier[r.id] })}
                              </StudioLink>
                            ) : (
                              <span data-testid={`board-unhealthy-earlier-${r.id}`} {...tip(t('tips.board.attention.earlier', { count: earlier[r.id] }))}>
                                {t('board.attention.earlier', { count: earlier[r.id] })}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <h3 className="board-subhead">{t('board.attention.caps', { count: caps.length })}</h3>
              {caps.length === 0 ? (
                <Empty text={t('board.attention.none')} />
              ) : (
                <ul className="plain-list board-list" data-testid="board-cap-hits">
                  {caps.map((c) => (
                    <li key={c.unitId} data-cap-unit={c.unitId}>
                      <strong>{c.unitName}</strong>
                      {c.rows.map((row) => (
                        <SpendBar key={`${row.unitId}-${row.period}`} row={{ ...row, exhausted: true }} t={t} lng={lng} />
                      ))}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        <section className="panel board-panel" aria-labelledby="board-brief-title" data-testid="board-brief">
          <PanelHead id="board-brief-title" title={t('board.brief.title')} tipText={t('tips.board.brief.title')} />
          {ceo ? (
            <p className="text-muted" data-testid="board-ceo">
              {t('board.brief.ceo', { name: ceo.agentName || ceo.agentId, unit: ceo.unitName || ceo.unitId })}{' '}
              {ceo.mandateId && (
                <StudioLink to={pathFor('keepers', ceo.mandateId)} tipText={t('tips.board.openKeeper')}>
                  {ceo.mandateName || ceo.mandateId}
                </StudioLink>
              )}{' '}
              {ceo.briefIntervalHours ? t('board.brief.cadence', { count: ceo.briefIntervalHours }) : t('board.brief.noCadence')}
            </p>
          ) : (
            <p className="text-muted" data-testid="board-no-ceo">
              {t('board.ceo.missing')}
            </p>
          )}
          {brief ? (
            <article className="board-brief-body" data-testid="board-latest-brief">
              <h3 className="board-subhead">
                <StudioLink to={pathFor('reports', brief.id)} tipText={t('tips.board.openReport')}>
                  {brief.title}
                </StudioLink>
              </h3>
              <div className="text-muted">
                <ReportHealthBadge health={brief.health} t={t} /> {t('board.attention.filedBy', { name: brief.authorAgentName || brief.filedByName || '-' })} {when(brief.createdUtc)} <OpenTrailLink runId={brief.runId} step={brief.id} testId="board-brief-trail" />
              </div>
              <p className="org-text">{brief.body}</p>
            </article>
          ) : (
            <Empty text={t('board.brief.empty')} testId="board-brief-empty" />
          )}
        </section>

        <section className="panel board-panel board-wide" aria-labelledby="board-proposals-title" data-testid="board-proposals">
          <PanelHead id="board-proposals-title" title={t('board.proposals.title')} tipText={t('tips.board.proposals.title')} count={proposals.length}>
            <StudioLink to={pathFor('changeRules', null, { organization: orgId })} className="button-secondary button-sm" tipText={t('tips.orgProposals.rulesLink')}>
              {t('orgProposals.rulesLink')}
            </StudioLink>
          </PanelHead>
          {proposals.length === 0 ? (
            <Empty text={t('board.proposals.empty')} testId="board-proposals-empty" />
          ) : (
            <ul className="plain-list board-proposal-list">
              {proposals.map((p) => (
                <BoardProposal key={p.draftId} organizationId={orgId} proposal={p} deniedDecide={deniedDecide} onDecided={load} />
              ))}
            </ul>
          )}
        </section>

        <section className="panel board-panel" aria-labelledby="board-spend-title" data-testid="board-spend">
          <PanelHead id="board-spend-title" title={t('board.spend.title')} tipText={t('tips.board.spend.title')} />
          {spendGroups.length === 0 ? (
            <Empty text={t('board.spend.empty')} testId="board-spend-empty" />
          ) : (
            <ul className="plain-list board-spend-chart" aria-label={t('board.spend.title')}>
              {spendGroups.map((g) => (
                <li key={g.unitId} data-spend-unit={g.unitId}>
                  <div className="board-spend-unit">{g.unitName}</div>
                  {g.rows.map((row) => (
                    <SpendBar key={`${row.unitId}-${row.period}`} row={row} t={t} lng={lng} testId="board-spend-bar" />
                  ))}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel board-panel" aria-labelledby="board-brakes-title" data-testid="board-brakes">
          <PanelHead id="board-brakes-title" title={t('board.brakes.title')} tipText={t('tips.board.brakes.title')} />
          <h3 className="board-subhead">{t('board.brakes.active', { count: freezes.length })}</h3>
          {freezes.length === 0 ? (
            <Empty text={t('board.brakes.none')} testId="board-freezes-empty" />
          ) : (
            <ul className="plain-list board-list" data-testid="board-freezes">
              {freezes.map((f) => (
                <li key={f.id} data-freeze={f.id}>
                  <strong>{`${enumLabel(t, 'freezeTargetKind', f.targetKind)} ${f.targetName || f.targetId}`}</strong>
                  {f.reason && <div className="org-text">{f.reason}</div>}
                  <div className="text-muted">
                    {t('board.brakes.frozenBy', { name: f.createdByName || '-' })} {when(f.createdUtc)}{' '}
                    <button type="button" className="button-ghost button-sm" aria-disabled={freezeDenied(t, permissions, 'Update') ? 'true' : undefined} onClick={() => !freezeDenied(t, permissions, 'Update') && setLifting(f)} data-testid={`board-lift-${f.id}`} {...tip(freezeDenied(t, permissions, 'Update') || t('tips.board.brakes.lift'))}>
                      {t('board.brakes.lift')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="board-brakes-actions">
            <button
              type="button"
              className="button-danger"
              aria-disabled={freezeCreateDenied || orgFreeze ? 'true' : undefined}
              onClick={() => !freezeCreateDenied && !orgFreeze && setFreezing({ targetKind: 'Organization', targetId: orgId, targetName: board.name })}
              data-testid="board-freeze-org"
              {...tip(freezeCreateDenied || (orgFreeze ? t('tips.board.brakes.orgFrozen') : t('tips.board.brakes.freezeOrg')))}
            >
              {t('board.brakes.freezeOrg')}
            </button>
            <div className="board-brakes-unit">
              <label htmlFor="board-freeze-unit" {...tip(t('tips.board.brakes.unit'))}>
                {t('board.brakes.unit')}
              </label>
              <select id="board-freeze-unit" value={unitToFreeze} onChange={(e) => setUnitToFreeze(e.target.value)} data-testid="board-freeze-unit" {...tip(t('tips.board.brakes.unit'))}>
                <option value="">{t('board.brakes.pickUnit')}</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="button-secondary"
                aria-disabled={freezeCreateDenied || !unitToFreeze ? 'true' : undefined}
                onClick={() => !freezeCreateDenied && unitToFreeze && setFreezing({ targetKind: 'OrgUnit', targetId: unitToFreeze, targetName: units.find((u) => u.id === unitToFreeze)?.name || unitToFreeze })}
                data-testid="board-freeze-unit-submit"
                {...tip(freezeCreateDenied || t('tips.board.brakes.freezeUnit'))}
              >
                {t('board.brakes.freezeUnit')}
              </button>
              <button
                type="button"
                className="button-danger"
                aria-disabled={cancelAllDenied || !pickedUnit ? 'true' : undefined}
                onClick={() => !cancelAllDenied && pickedUnit && setCascade(pickedUnit)}
                data-testid="board-cancel-all"
                {...tip(cancelAllDenied || (pickedUnit ? t('tips.cascadeCancel.action') : t('tips.board.brakes.pickUnitFirst')))}
              >
                {t('cascadeCancel.action')}
              </button>
            </div>
            <button
              type="button"
              className="button-secondary"
              aria-disabled={rollbackBlocked ? 'true' : undefined}
              onClick={() => {
                if (rollbackBlocked) return;
                setRollbackError(null);
                setRollbackTicks('Finish');
                setRollingBack(true);
              }}
              data-testid="board-rollback"
              {...tip(rollbackBlocked || t('tips.board.brakes.rollback'))}
            >
              {t('board.brakes.rollback')}
            </button>
          </div>
          <KillSwitchControl compact />
        </section>

        <DirectionPanel organizationId={orgId} ceo={ceo} denied={updateDenied} />
        <BoardCeoChat organizationId={orgId} ceo={ceo} denied={updateDenied} />
      </div>

      {freezing && (
        <FreezeModal
          targetKind={freezing.targetKind}
          targetId={freezing.targetId}
          targetName={freezing.targetName}
          onClose={() => setFreezing(null)}
          onDone={() => {
            setFreezing(null);
            setUnitToFreeze('');
            load();
          }}
        />
      )}
      {lifting && (
        <LiftFreezeModal
          freeze={lifting}
          onClose={() => setLifting(null)}
          onDone={() => {
            setLifting(null);
            load();
          }}
        />
      )}
      {cascade && (
        <CascadeCancelModal
          organizationId={orgId}
          unit={cascade}
          onClose={() => setCascade(null)}
          onDone={() => load()}
          onFreeze={(unit) => {
            setCascade(null);
            setFreezing({ targetKind: 'OrgUnit', targetId: unit.id, targetName: unit.name });
          }}
        />
      )}
      <ConfirmModal
        open={rollingBack}
        danger
        title={t('board.brakes.rollbackTitle')}
        message={t('board.brakes.rollbackMessage', { number: revisionNumber })}
        confirmLabel={t('board.brakes.rollback')}
        confirmTip={t('tips.board.brakes.rollback')}
        details={<RollbackTicksChoice value={rollbackTicks} onChange={setRollbackTicks} t={t} />}
        error={rollbackError}
        onCancel={() => setRollingBack(false)}
        onConfirm={rollback}
      />
    </div>
  );
}

/**
 * The board (AA10.7): one page per organization for the people who oversee it. The chart with each unit's health,
 * what needs attention (open escalations, unhealthy reports, units at a budget cap), proposals waiting for a decision
 * with their evidence and diff (AA10.4), spend against budget, the CEO's latest brief, the brakes (freeze a unit or the
 * whole organization, roll back the chart, the kill switch), direction for the CEO, and a conversation with the CEO
 * (AA10.6). Everything comes from one GET /organizations/{id}/board call and refreshes over the organization channel.
 * Without a record ID (the Board tab) it lists the organizations to pick from.
 */
export default function BoardView({ recordId }) {
  if (!recordId) return <BoardPicker />;
  return <Board organizationId={recordId} />;
}
